# === backend/app/services/booking_service.py ===
# Enhanced Booking Service with Weather Integration
from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta

try:
    from ..models.location import GameSession, Location, GameDefinition, SessionStatus
    from ..models.user import User
    from ..models.weather import LocationWeather, WeatherSeverity
    from ..services.weather_service import WeatherService, weather_api_service
except ImportError:
    from models.location import GameSession, Location, GameDefinition, SessionStatus
    from models.user import User
    from models.weather import LocationWeather, WeatherSeverity
    from services.weather_service import WeatherService, weather_api_service

import logging
import uuid

logger = logging.getLogger(__name__)


class EnhancedBookingService:
    """Enhanced booking service with weather integration"""

    def __init__(self, db: Session):
        self.db = db
        self.weather_service = WeatherService(db, weather_api_service)

    async def create_booking_with_weather_check(
        self, booking_data: Dict, user_id: int
    ) -> Tuple[bool, str, Optional[GameSession]]:
        """Create booking with comprehensive weather suitability check"""
        try:
            # Validate and get basic data
            validation_result = self._validate_booking_data(booking_data, user_id)
            if not validation_result[0]:
                return validation_result

            location, game_definition, user = validation_result[1:4]
            start_time = datetime.fromisoformat(booking_data["start_time"])
            game_type = booking_data.get("game_type", "GAME1")

            # Check weather conditions
            weather_check = await self._check_weather_conditions(
                game_type, location.id, start_time
            )
            if not weather_check[0]:
                return False, weather_check[1], None
            weather_warning = weather_check[1]

            # Create booking session
            session = await self._create_booking_session(
                booking_data, user_id, game_definition, location
            )

            # Apply weather notes and finalize booking
            self._apply_weather_notes(session, location.id, weather_warning)
            self._process_payment_and_transaction(
                user, game_definition, session, game_type, location
            )

            self.db.commit()
            return True, "Booking created successfully", session

        except Exception as e:
            logger.error(f"Error creating booking with weather check: {str(e)}")
            self.db.rollback()
            return False, f"Booking creation failed: {str(e)}", None

    def _validate_booking_data(
        self, booking_data: Dict, user_id: int
    ) -> Tuple[bool, ...]:
        """Validate booking data and get required objects"""
        location_id = booking_data["location_id"]
        game_type = booking_data.get("game_type", "GAME1")

        # Get location
        location = (
            self.db.query(Location).filter(Location.id == location_id).first()
        )
        if not location:
            return (False, "Location not found", None, None, None)

        # Get game definition
        game_definition = (
            self.db.query(GameDefinition)
            .filter(GameDefinition.game_id == game_type)
            .first()
        )
        if not game_definition:
            return (False, f"Game type {game_type} not found", None, None, None)

        # Get user and check credits
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return (False, "User not found", None, None, None)

        if user.credits < game_definition.credit_cost:
            return (
                False,
                f"Insufficient credits. Required: {game_definition.credit_cost}, Available: {user.credits}",
                None,
                None,
                None,
            )

        return (True, location, game_definition, user)

    async def _check_weather_conditions(
        self, game_type: str, location_id: int, start_time: datetime
    ) -> Tuple[bool, Optional[str]]:
        """Check current and forecast weather conditions"""
        # Check current weather suitability
        suitable, reason = self.weather_service.is_game_suitable_for_weather(
            game_type, location_id
        )
        if not suitable:
            return False, f"Weather conditions not suitable: {reason}"

        # Check forecast for future bookings
        time_until_game = start_time - datetime.utcnow()
        if time_until_game.total_seconds() <= 3600:
            return True, None

        forecasts = await self.weather_service.get_weather_forecast(
            location_id, 48
        )
        booking_forecast = None

        for forecast in forecasts:
            if abs((forecast.forecast_time - start_time).total_seconds()) < 3600:
                booking_forecast = forecast
                break

        if booking_forecast and booking_forecast.severity == WeatherSeverity.EXTREME:
            return (
                False,
                f"Extreme weather forecast for game time: {booking_forecast.condition.value}",
            )
        elif booking_forecast and booking_forecast.severity == WeatherSeverity.HIGH:
            return (
                True,
                f"High severity weather forecast: {booking_forecast.condition.value}",
            )

        return True, None

    def _apply_weather_notes(
        self, session: GameSession, location_id: int, weather_warning: Optional[str]
    ):
        """Apply weather-related notes to booking session"""
        current_weather = self.weather_service.get_current_weather(location_id)
        if current_weather and current_weather.severity in [
            WeatherSeverity.MODERATE,
            WeatherSeverity.HIGH,
        ]:
            weather_info = f"Weather: {current_weather.description} {current_weather.temperature}°C"
            if weather_warning:
                session.booking_notes = f"{weather_warning}. Current {weather_info}"
            else:
                session.booking_notes = f"Weather notice: {weather_info}"
        elif weather_warning:
            session.booking_notes = weather_warning

    def _process_payment_and_transaction(
        self,
        user: User,
        game_definition: GameDefinition,
        session: GameSession,
        game_type: str,
        location: Location,
    ):
        """Process payment and create transaction record"""
        user.credits -= game_definition.credit_cost

        if not user.transaction_history:
            user.transaction_history = []

        transaction = {
            "transaction_id": f"booking_{session.session_id}_{datetime.utcnow().timestamp()}",
            "type": "game_booking",
            "amount": -game_definition.credit_cost,
            "timestamp": datetime.utcnow().isoformat(),
            "description": f"Booked {game_definition.name} at {location.name}",
            "session_id": session.session_id,
            "game_type": game_type,
        }
        user.transaction_history.append(transaction)

    async def _create_booking_session(
        self,
        booking_data: Dict,
        user_id: int,
        game_definition: GameDefinition,
        location: Location,
    ) -> GameSession:
        """Create the actual booking session"""
        start_time = datetime.fromisoformat(booking_data["start_time"])
        end_time = start_time + timedelta(minutes=game_definition.duration_minutes)

        # Generate unique session ID
        session_id = (
            f"LFA_{datetime.now().strftime('%Y%m%d')}_{str(uuid.uuid4())[:8].upper()}"
        )

        # Initialize players list
        players = [
            {
                "user_id": user_id,
                "role": "player",
                "joined_at": datetime.utcnow().isoformat(),
                "status": "confirmed",
            }
        ]

        # Add additional players if provided
        additional_players = booking_data.get("additional_players", [])
        for player_data in additional_players:
            players.append(
                {
                    "user_id": player_data.get("user_id"),
                    "role": player_data.get("role", "player"),
                    "joined_at": datetime.utcnow().isoformat(),
                    "status": "pending",
                }
            )

        # Reserve equipment if needed
        equipment_set = None
        reserved_equipment = []

        if game_definition.required_equipment:
            # JAVÍTÁS: Helyes metódus név használata
            # Try to reserve equipment
            for set_name in location.equipment_sets.keys():
                if location.reserve_equipment_set(
                    set_name
                ):  # JAVÍTÁS: reserve_equipment_set()
                    equipment_set = set_name
                    reserved_equipment = game_definition.required_equipment
                    break

        # Assign coach if required
        coach_id = None
        if game_definition.requires_coach and location.assigned_coaches:
            # Simple assignment - first available coach
            coach_id = location.assigned_coaches[0]

        session = GameSession(
            session_id=session_id,
            location_id=location.id,
            game_definition_id=game_definition.id,
            start_time=start_time,
            end_time=end_time,
            players=players,
            coach_id=coach_id,
            booked_by=user_id,
            status=SessionStatus.SCHEDULED,
            equipment_set=equipment_set,
            reserved_equipment=reserved_equipment,
            total_cost_credits=game_definition.credit_cost,
            payment_status="paid",
            session_notes=booking_data.get("notes", ""),
            weather_cancelled=False,
        )

        self.db.add(session)
        return session

    async def check_upcoming_bookings_weather(self):
        """Check weather for all upcoming bookings and send warnings"""
        try:
            # Get bookings in next 24 hours
            start_time = datetime.utcnow()
            end_time = start_time + timedelta(hours=24)

            upcoming_sessions = (
                self.db.query(GameSession)
                .filter(
                    GameSession.start_time >= start_time,
                    GameSession.start_time <= end_time,
                    GameSession.status.in_(["scheduled", "confirmed"]),
                )
                .all()
            )

            processed_count = 0
            warned_count = 0
            cancelled_count = 0

            for session in upcoming_sessions:
                # Check weather suitability for the game type
                suitable, reason = self.weather_service.is_game_suitable_for_weather(
                    session.game_definition.game_type, session.location_id
                )

                if not suitable:
                    # Check severity - extreme weather = auto-cancel
                    current_weather = self.weather_service.get_current_weather(
                        session.location_id
                    )

                    if (
                        current_weather
                        and current_weather.severity == WeatherSeverity.EXTREME
                    ):
                        await self._auto_cancel_session(session, reason)
                        cancelled_count += 1
                    else:
                        await self._create_session_weather_alert(session, reason)
                        warned_count += 1

                processed_count += 1

            logger.info(
                f"Weather check completed: {processed_count} sessions processed, {warned_count} warned, {cancelled_count} cancelled"
            )
            return {
                "processed": processed_count,
                "warned": warned_count,
                "cancelled": cancelled_count,
            }

        except Exception as e:
            logger.error(f"Error checking upcoming bookings weather: {str(e)}")
            return {"error": str(e)}

    async def _auto_cancel_session(self, session: GameSession, reason: str):
        """Automatically cancel session due to extreme weather"""
        try:
            # Update session status
            session.status = SessionStatus.CANCELLED
            session.cancellation_reason = f"Extreme weather: {reason}"
            session.cancelled_at = datetime.utcnow()
            session.weather_cancelled = True

            # Full refund for weather cancellations
            refund_amount = session.total_cost_credits

            for player_data in session.players:
                user = (
                    self.db.query(User)
                    .filter(User.id == player_data["user_id"])
                    .first()
                )
                if user:
                    user.credits += refund_amount

                    # Add refund transaction
                    if not user.transaction_history:
                        user.transaction_history = []

                    refund_transaction = {
                        "transaction_id": f"weather_refund_{session.session_id}_{datetime.utcnow().timestamp()}",
                        "type": "weather_refund",
                        "amount": refund_amount,
                        "timestamp": datetime.utcnow().isoformat(),
                        "description": f"Weather cancellation refund for session {session.session_id}",
                        "reason": reason,
                        "session_id": session.session_id,
                    }
                    user.transaction_history.append(refund_transaction)

            # Release reserved equipment
            if session.equipment_set and session.reserved_equipment:
                session.location.release_equipment_set(
                    session.equipment_set
                )  # JAVÍTÁS: release_equipment_set()

            self.db.commit()
            logger.info(
                f"Auto-cancelled session {session.session_id} due to extreme weather: {reason}"
            )

            # TODO: Send notifications to all players
            # notification_service.send_weather_cancellation(session, reason)

        except Exception as e:
            logger.error(
                f"Error auto-cancelling session {session.session_id}: {str(e)}"
            )
            self.db.rollback()

    async def _create_session_weather_alert(self, session: GameSession, reason: str):
        """Create weather alert for specific session"""
        try:
            # Update session with weather warning
            current_notes = session.booking_notes or ""
            weather_alert = f"WEATHER ALERT: {reason}. Game may be affected."

            if "WEATHER ALERT" not in current_notes:
                session.booking_notes = f"{weather_alert} | {current_notes}".strip(
                    " | "
                )

            # TODO: Send push notifications to all players
            for player_data in session.players:
                # notification_service.send_weather_alert(
                #     user_id=player_data["user_id"],
                #     session_id=session.session_id,
                #     message=weather_alert
                # )
                pass

            self.db.commit()
            logger.info(
                f"Weather alert created for session {session.session_id}: {reason}"
            )

        except Exception as e:
            logger.error(
                f"Error creating weather alert for session {session.session_id}: {str(e)}"
            )
            self.db.rollback()

    def cancel_booking_with_weather_refund(
        self, session_id: str, user_id: int, reason: str
    ) -> Tuple[bool, str, float]:
        """Cancel booking with weather-aware refund policy"""
        try:
            # Validate session and permissions
            validation_result = self._validate_cancellation_request(
                session_id, user_id
            )
            if not validation_result[0]:
                return validation_result
            session = validation_result[1]

            # Calculate refund with weather bonus
            refund_result = self._calculate_weather_refund(session, reason)
            if not refund_result[0]:
                return refund_result
            final_refund_percentage, refund_amount = refund_result[1:3]

            # Process the cancellation
            self._process_cancellation(session, reason, user_id, refund_amount)

            self.db.commit()
            return (
                True,
                f"Session cancelled successfully. Refund: {refund_amount} credits ({int(final_refund_percentage*100)}%)",
                final_refund_percentage,
            )

        except Exception as e:
            logger.error(f"Error cancelling booking {session_id}: {str(e)}")
            self.db.rollback()
            return False, f"Cancellation failed: {str(e)}", 0.0

    def _validate_cancellation_request(
        self, session_id: str, user_id: int
    ) -> Tuple[bool, ...]:
        """Validate cancellation request and return session if valid"""
        session = (
            self.db.query(GameSession)
            .filter(GameSession.session_id == session_id)
            .first()
        )
        if not session:
            return (False, "Session not found", 0.0)

        # Check if user can cancel
        if session.booked_by != user_id and not any(
            p.get("user_id") == user_id for p in session.players
        ):
            return (False, "You don't have permission to cancel this session", 0.0)

        if session.status in [SessionStatus.CANCELLED, SessionStatus.COMPLETED]:
            return (False, f"Session is already {session.status.value}", 0.0)

        return (True, session)

    def _calculate_weather_refund(
        self, session: GameSession, reason: str
    ) -> Tuple[bool, ...]:
        """Calculate refund amount including weather bonus"""
        can_cancel, cancel_reason, base_refund_percentage = (
            session.can_be_cancelled()
        )
        if not can_cancel:
            return (False, cancel_reason, 0.0)

        # Weather bonus refund policy
        weather_bonus = 0.0
        if "weather" in reason.lower():
            current_weather = self.weather_service.get_current_weather(
                session.location_id
            )
            if current_weather:
                if current_weather.severity == WeatherSeverity.EXTREME:
                    weather_bonus = 1.0 - base_refund_percentage
                elif current_weather.severity == WeatherSeverity.HIGH:
                    weather_bonus = 0.25

        final_refund_percentage = min(1.0, base_refund_percentage + weather_bonus)
        refund_amount = int(session.total_cost_credits * final_refund_percentage)

        return (True, final_refund_percentage, refund_amount, weather_bonus)

    def _process_cancellation(
        self, session: GameSession, reason: str, user_id: int, refund_amount: int
    ):
        """Process the actual cancellation and refund"""
        session.status = SessionStatus.CANCELLED
        session.cancellation_reason = reason
        session.cancelled_at = datetime.utcnow()

        # Process refund
        user = self.db.query(User).filter(User.id == user_id).first()
        if user and refund_amount > 0:
            user.credits += refund_amount
            self._create_refund_transaction(user, session, refund_amount, reason)

        # Release equipment
        if session.equipment_set and session.reserved_equipment:
            session.location.release_equipment_set(session.equipment_set)

    def _create_refund_transaction(
        self, user: User, session: GameSession, refund_amount: int, reason: str
    ):
        """Create refund transaction record"""
        if not user.transaction_history:
            user.transaction_history = []

        refund_transaction = {
            "transaction_id": f"refund_{session.session_id}_{datetime.utcnow().timestamp()}",
            "type": "cancellation_refund",
            "amount": refund_amount,
            "timestamp": datetime.utcnow().isoformat(),
            "description": f"Cancellation refund for session {session.session_id}",
            "reason": reason,
        }
        user.transaction_history.append(refund_transaction)

    def get_weather_suitable_time_slots(
        self, location_id: int, game_type: str, date: datetime
    ) -> List[Dict]:
        """Get time slots that are suitable based on weather forecast"""
        try:
            # Get base time slots (every hour from 8 AM to 8 PM)
            base_slots = []
            start_of_day = date.replace(hour=8, minute=0, second=0, microsecond=0)

            for hour in range(12):  # 8 AM to 8 PM (12 hours)
                slot_time = start_of_day + timedelta(hours=hour)
                base_slots.append(slot_time)

            # Check weather suitability for each slot
            suitable_slots = []

            for slot_time in base_slots:
                # For current day, check current weather
                if slot_time.date() == datetime.now().date():
                    suitable, reason = (
                        self.weather_service.is_game_suitable_for_weather(
                            game_type, location_id
                        )
                    )
                    current_weather = self.weather_service.get_current_weather(
                        location_id
                    )

                    slot_info = {
                        "time": slot_time.isoformat(),
                        "is_suitable": suitable,
                        "reason": reason,
                        "weather": {
                            "condition": (
                                current_weather.condition.value
                                if current_weather
                                else "unknown"
                            ),
                            "temperature": (
                                current_weather.temperature if current_weather else None
                            ),
                            "severity": (
                                current_weather.severity.value
                                if current_weather
                                else "unknown"
                            ),
                        },
                    }
                else:
                    # For future dates, assume suitable (would need detailed forecast integration)
                    slot_info = {
                        "time": slot_time.isoformat(),
                        "is_suitable": True,
                        "reason": "Future booking - weather check at booking time",
                        "weather": {
                            "condition": "forecast_needed",
                            "temperature": None,
                            "severity": "unknown",
                        },
                    }

                suitable_slots.append(slot_info)

            return suitable_slots

        except Exception as e:
            logger.error(f"Error getting weather suitable time slots: {str(e)}")
            return []

    def get_booking_weather_summary(self, session_id: str) -> Dict:
        """Get comprehensive weather summary for a booking"""
        try:
            session = (
                self.db.query(GameSession)
                .filter(GameSession.session_id == session_id)
                .first()
            )
            if not session:
                return {"error": "Session not found"}

            # Current weather
            current_weather = self.weather_service.get_current_weather(
                session.location_id
            )

            # Weather suitability for this game type
            suitable, reason = self.weather_service.is_game_suitable_for_weather(
                session.game_definition.game_type, session.location_id
            )

            # Active weather alerts
            location = session.location
            active_alerts = (
                location.get_active_weather_alerts()
                if hasattr(location, "get_active_weather_alerts")
                else []
            )

            return {
                "session_id": session_id,
                "game_time": session.start_time.isoformat(),
                "location": session.location.name,
                "current_weather": (
                    current_weather.to_dict() if current_weather else None
                ),
                "is_suitable": suitable,
                "suitability_reason": reason,
                "weather_cancelled": session.weather_cancelled,
                "booking_notes": session.booking_notes,
                "active_alerts": [alert.to_dict() for alert in active_alerts],
                "weather_dependent": session.game_definition.weather_dependent,
            }

        except Exception as e:
            logger.error(f"Error getting booking weather summary: {str(e)}")
            return {"error": str(e)}
