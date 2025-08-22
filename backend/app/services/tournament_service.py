# === backend/app/services/tournament_service.py ===
# JAVÍTOTT Tournament Service - cancel_tournament metódussal

from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
import math
import random
import uuid

from ..models.tournament import (
    Tournament,
    TournamentParticipant,
    TournamentMatch,
    TournamentType,
    TournamentFormat,
    TournamentStatus,
    ParticipantStatus,
    MatchStatus,
)
from ..models.user import User
from ..models.location import Location, GameDefinition


class TournamentService:
    """Core tournament management service"""

    def __init__(self, db: Session):
        self.db = db

    def get_tournaments(
        self,
        status: Optional[str] = None,
        tournament_type: Optional[str] = None,
        location_id: Optional[int] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Tournament]:
        """Get tournaments with filtering"""

        query = self.db.query(Tournament)

        # Apply filters
        if status:
            query = query.filter(Tournament.status == status)

        if tournament_type:
            query = query.filter(Tournament.tournament_type == tournament_type)

        if location_id:
            query = query.filter(Tournament.location_id == location_id)

        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
                query = query.filter(Tournament.start_time >= from_date)
            except:
                pass  # Skip invalid date

        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
                query = query.filter(Tournament.start_time <= to_date)
            except:
                pass  # Skip invalid date

        return query.order_by(Tournament.start_time).offset(offset).limit(limit).all()

    def get_tournament(self, tournament_id: int) -> Optional[Tournament]:
        """Get single tournament by ID"""
        return self.db.query(Tournament).filter(Tournament.id == tournament_id).first()

    def get_tournament_participants(
        self, tournament_id: int
    ) -> List[TournamentParticipant]:
        """Get all participants for a tournament"""
        return (
            self.db.query(TournamentParticipant)
            .filter(TournamentParticipant.tournament_id == tournament_id)
            .all()
        )

    def create_tournament(self, tournament_data: Dict, organizer_id: int) -> Tournament:
        """Create new tournament with validation"""

        # Generate unique tournament ID
        tournament_id = self._generate_tournament_id()

        # Validate tournament data
        self._validate_tournament_data(tournament_data)

        # Check location availability
        if not self._is_location_available(
            tournament_data["location_id"],
            tournament_data["start_time"],
            tournament_data["end_time"],
        ):
            raise ValueError("Location not available at specified time")

        # Create tournament
        tournament = Tournament(
            tournament_id=tournament_id,
            name=tournament_data["name"],
            description=tournament_data.get("description"),
            tournament_type=tournament_data["tournament_type"],
            game_type=tournament_data["game_type"],
            format=tournament_data["format"],
            location_id=tournament_data["location_id"],
            start_time=tournament_data["start_time"],
            end_time=tournament_data["end_time"],
            registration_deadline=tournament_data["registration_deadline"],
            min_participants=tournament_data.get("min_participants", 4),
            max_participants=tournament_data["max_participants"],
            min_level=tournament_data.get("min_level", 1),
            max_level=tournament_data.get("max_level"),
            entry_fee_credits=tournament_data.get("entry_fee_credits", 0),
            entry_requirements=tournament_data.get("entry_requirements", {}),
            prize_distribution=tournament_data.get("prize_distribution", {"1st": 100}),
            organizer_id=organizer_id,
            settings=tournament_data.get("settings", {}),
            status=TournamentStatus.REGISTRATION,
        )

        # Save tournament
        self.db.add(tournament)
        self.db.commit()
        self.db.refresh(tournament)

        return tournament

    def register_participant(self, tournament_id: int, user_id: int) -> bool:
        """Register user for tournament"""

        tournament = self.get_tournament(tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")

        if not tournament.is_registration_open:
            raise ValueError("Registration is closed")

        if tournament.is_full:
            raise ValueError("Tournament is full")

        # Check if user already registered
        existing = (
            self.db.query(TournamentParticipant)
            .filter(
                and_(
                    TournamentParticipant.tournament_id == tournament_id,
                    TournamentParticipant.user_id == user_id,
                    TournamentParticipant.status != ParticipantStatus.WITHDREW,
                )
            )
            .first()
        )

        if existing:
            raise ValueError("User already registered")

        # Check user credits
        user = self.db.query(User).filter(User.id == user_id).first()
        if user.credits < tournament.entry_fee_credits:
            raise ValueError("Insufficient credits")

        # Deduct credits
        user.credits -= tournament.entry_fee_credits

        # Create participant record
        participant = TournamentParticipant(
            tournament_id=tournament_id,
            user_id=user_id,
            registration_time=datetime.now(),
            status=ParticipantStatus.REGISTERED,
            entry_fee_paid=tournament.entry_fee_credits,
        )

        self.db.add(participant)
        self.db.commit()

        return True

    def withdraw_participant(self, tournament_id: int, user_id: int) -> bool:
        """Withdraw user from tournament"""

        participant = (
            self.db.query(TournamentParticipant)
            .filter(
                and_(
                    TournamentParticipant.tournament_id == tournament_id,
                    TournamentParticipant.user_id == user_id,
                    TournamentParticipant.status == ParticipantStatus.REGISTERED,
                )
            )
            .first()
        )

        if not participant:
            raise ValueError("Participant not found or already withdrawn")

        # Check withdrawal policy
        tournament = self.get_tournament(tournament_id)
        if tournament.status != TournamentStatus.REGISTRATION:
            raise ValueError("Cannot withdraw after registration closes")

        # Refund credits
        user = self.db.query(User).filter(User.id == user_id).first()
        user.credits += participant.entry_fee_paid

        # Update participant status
        participant.status = ParticipantStatus.WITHDREW
        participant.withdrawal_time = datetime.now()

        self.db.commit()

        return True

    def get_user_tournaments(
        self, user_id: int, status: Optional[str] = None
    ) -> List[Tournament]:
        """Get tournaments user is participating in"""
        query = (
            self.db.query(Tournament)
            .join(TournamentParticipant)
            .filter(
                and_(
                    TournamentParticipant.user_id == user_id,
                    TournamentParticipant.status != ParticipantStatus.WITHDREW,
                )
            )
        )

        if status:
            query = query.filter(Tournament.status == status)

        return query.order_by(Tournament.start_time).all()

    # === PRIVATE HELPER METHODS ===

    def _generate_tournament_id(self) -> str:
        """Generate unique tournament ID"""
        date_str = datetime.now().strftime("%Y%m%d")
        random_suffix = str(uuid.uuid4().hex[:6]).upper()
        return f"TOURN_{date_str}_{random_suffix}"

    def _validate_tournament_data(self, data: Dict):
        """Validate tournament creation data"""
        required_fields = [
            "name",
            "tournament_type",
            "game_type",
            "format",
            "location_id",
            "start_time",
            "end_time",
            "registration_deadline",
            "max_participants",
        ]

        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Validate timing
        now = datetime.now()
        if data["start_time"] <= now:
            raise ValueError("Start time must be in the future")

        if data["end_time"] <= data["start_time"]:
            raise ValueError("End time must be after start time")

        if data["registration_deadline"] >= data["start_time"]:
            raise ValueError("Registration deadline must be before start time")

        # Validate participant limits
        if data["max_participants"] < 4:
            raise ValueError("Minimum 4 participants required")

        if data["max_participants"] > 64:
            raise ValueError("Maximum 64 participants allowed")

    def _is_location_available(
        self, location_id: int, start_time: datetime, end_time: datetime
    ) -> bool:
        """Check if location is available for tournament"""
        try:
            location = (
                self.db.query(Location).filter(Location.id == location_id).first()
            )
            if not location or location.status != "active":
                return False

            # Check for conflicting tournaments
            conflicts = (
                self.db.query(Tournament)
                .filter(
                    and_(
                        Tournament.location_id == location_id,
                        Tournament.status.in_(
                            [
                                TournamentStatus.REGISTRATION,
                                TournamentStatus.REGISTRATION_CLOSED,
                                TournamentStatus.IN_PROGRESS,
                            ]
                        ),
                        Tournament.start_time < end_time,
                        Tournament.end_time > start_time,
                    )
                )
                .count()
            )

            return conflicts == 0
        except Exception:
            return True  # Default to available if check fails


# === TOURNAMENT LIFECYCLE MANAGER ===


class TournamentLifecycleManager:
    """Manages tournament lifecycle events"""

    def __init__(self, db: Session):
        self.db = db

    def start_tournament(self, tournament_id: int) -> bool:
        """Start a tournament"""
        tournament = (
            self.db.query(Tournament).filter(Tournament.id == tournament_id).first()
        )

        if not tournament:
            return False

        if not tournament.can_start:
            return False

        tournament.status = TournamentStatus.IN_PROGRESS
        self.db.commit()

        return True

    # 🔧 JAVÍTÁS: HIÁNYZÓ cancel_tournament METÓDUS HOZZÁADÁSA
    def cancel_tournament(self, tournament_id: int, reason: str) -> bool:
        """Cancel a tournament and process refunds"""
        try:
            tournament = (
                self.db.query(Tournament).filter(Tournament.id == tournament_id).first()
            )

            if not tournament:
                return False

            # Check if tournament can be cancelled
            if tournament.status in [
                TournamentStatus.COMPLETED,
                TournamentStatus.CANCELLED,
            ]:
                return False

            # Get all participants for refund processing
            participants = (
                self.db.query(TournamentParticipant)
                .filter(
                    and_(
                        TournamentParticipant.tournament_id == tournament_id,
                        TournamentParticipant.status.in_(
                            [ParticipantStatus.REGISTERED, ParticipantStatus.CONFIRMED]
                        ),
                    )
                )
                .all()
            )

            # Process refunds
            for participant in participants:
                user = (
                    self.db.query(User).filter(User.id == participant.user_id).first()
                )
                if user and hasattr(participant, "entry_fee_paid"):
                    # Refund entry fee
                    user.credits += participant.entry_fee_paid
                    # Update participant status
                    participant.status = ParticipantStatus.WITHDREW
                    participant.withdrawal_time = datetime.now()

            # Cancel the tournament
            tournament.status = TournamentStatus.CANCELLED
            tournament.updated_at = datetime.now()

            # Add cancellation reason to settings
            if not tournament.settings:
                tournament.settings = {}
            tournament.settings["cancellation_reason"] = reason
            tournament.settings["cancelled_at"] = datetime.now().isoformat()

            self.db.commit()
            return True

        except Exception as e:
            self.db.rollback()
            print(f"Error cancelling tournament: {e}")
            return False

    def complete_tournament(
        self, tournament_id: int, winner_id: int, final_standings: List[Dict]
    ) -> bool:
        """Complete a tournament"""
        tournament = (
            self.db.query(Tournament).filter(Tournament.id == tournament_id).first()
        )

        if not tournament:
            return False

        tournament.status = TournamentStatus.COMPLETED
        tournament.winner_id = winner_id
        tournament.final_standings = final_standings

        self.db.commit()

        return True

    # 🔧 JAVÍTÁS: submit_match_result metódus is hiányzik, hozzáadjuk
    def submit_match_result(
        self,
        match_id: int,
        winner_id: int,
        player1_score: int,
        player2_score: int,
        submitter_id: int,
    ) -> bool:
        """Submit match result"""
        try:
            match = (
                self.db.query(TournamentMatch)
                .filter(TournamentMatch.id == match_id)
                .first()
            )

            if not match:
                raise ValueError("Match not found")

            if match.status != MatchStatus.SCHEDULED:
                raise ValueError("Match cannot be updated")

            # Validate winner
            if winner_id not in [match.player1_id, match.player2_id]:
                raise ValueError("Invalid winner")

            # Update match
            match.winner_id = winner_id
            match.player1_score = player1_score
            match.player2_score = player2_score
            match.status = MatchStatus.COMPLETED
            match.completed_at = datetime.now()

            self.db.commit()
            return True

        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Failed to submit result: {e}")


# === TOURNAMENT ANALYTICS SERVICE ===


class TournamentAnalyticsService:
    """Tournament analytics and statistics"""

    def __init__(self, db: Session):
        self.db = db

    def get_tournament_stats(self, tournament_id: int) -> Dict:
        """Get tournament statistics"""
        tournament = (
            self.db.query(Tournament).filter(Tournament.id == tournament_id).first()
        )

        if not tournament:
            return {}

        participants = (
            self.db.query(TournamentParticipant)
            .filter(TournamentParticipant.tournament_id == tournament_id)
            .all()
        )

        return {
            "total_participants": len(participants),
            "active_participants": len(
                [p for p in participants if p.status == ParticipantStatus.REGISTERED]
            ),
            "total_prize_pool": tournament.prize_pool_credits or 0,
            "average_level": (
                sum(p.user.level for p in participants) / len(participants)
                if participants
                else 0
            ),
            "completion_rate": (
                100.0 if tournament.status == TournamentStatus.COMPLETED else 0.0
            ),
        }


# === SINGLE ELIMINATION SERVICE ===


class SingleEliminationService:
    """Single elimination tournament bracket management"""

    def __init__(self, db: Session):
        self.db = db

    def generate_bracket(self, tournament_id: int) -> bool:
        """Generate single elimination bracket"""
        participants = (
            self.db.query(TournamentParticipant)
            .filter(
                and_(
                    TournamentParticipant.tournament_id == tournament_id,
                    TournamentParticipant.status == ParticipantStatus.REGISTERED,
                )
            )
            .all()
        )

        if len(participants) < 2:
            return False

        # Create bracket structure
        bracket_data = self._create_bracket_structure(participants)

        # Create bracket record
        bracket = TournamentBracket(
            tournament_id=tournament_id,
            format=TournamentFormat.SINGLE_ELIMINATION,
            structure=bracket_data,
            current_round=1,
            total_rounds=math.ceil(math.log2(len(participants))),
        )

        self.db.add(bracket)
        self.db.commit()

        return True

    def _create_bracket_structure(
        self, participants: List[TournamentParticipant]
    ) -> Dict:
        """Create bracket structure"""
        # Shuffle participants for random seeding
        shuffled = participants.copy()
        random.shuffle(shuffled)

        bracket = {
            "participants": [
                {"user_id": p.user_id, "seed": i + 1} for i, p in enumerate(shuffled)
            ],
            "rounds": [],
            "matches": [],
        }

        return bracket


# === TOURNAMENT TEMPLATE SERVICE ===


class TournamentTemplateService:
    """Tournament template management service"""

    def __init__(self, db: Session):
        self.db = db

    def create_daily_tournament(self, location_id: int, game_type: str) -> Tournament:
        """Create daily tournament template"""

        # Calculate start time (tomorrow at 18:00)
        start_time = datetime.now().replace(
            hour=18, minute=0, second=0, microsecond=0
        ) + timedelta(days=1)
        end_time = start_time + timedelta(hours=2)
        registration_deadline = start_time - timedelta(hours=2)

        tournament_data = {
            "name": f"Daily Challenge - {start_time.strftime('%Y-%m-%d')}",
            "description": "Daily tournament for competitive players",
            "tournament_type": TournamentType.DAILY_CHALLENGE,
            "game_type": game_type,
            "format": TournamentFormat.SINGLE_ELIMINATION,
            "location_id": location_id,
            "start_time": start_time,
            "end_time": end_time,
            "registration_deadline": registration_deadline,
            "min_participants": 4,
            "max_participants": 16,
            "entry_fee_credits": 50,
            "prize_distribution": {"1st": 60, "2nd": 30, "3rd": 10},
        }

        tournament_service = TournamentService(self.db)
        return tournament_service.create_tournament(
            tournament_data, organizer_id=1
        )  # System organizer

    def create_weekly_cup(self, location_id: int, game_type: str) -> Tournament:
        """Create weekly tournament template"""

        # Calculate start time (next Saturday at 14:00)
        now = datetime.now()
        days_ahead = 5 - now.weekday()  # Saturday is 5
        if days_ahead <= 0:
            days_ahead += 7

        start_time = (now + timedelta(days=days_ahead)).replace(
            hour=14, minute=0, second=0, microsecond=0
        )
        end_time = start_time + timedelta(hours=4)
        registration_deadline = start_time - timedelta(days=2)

        tournament_data = {
            "name": f"Weekly Cup - {start_time.strftime('%Y-%m-%d')}",
            "description": "Weekly championship tournament",
            "tournament_type": TournamentType.WEEKLY_CUP,
            "game_type": game_type,
            "format": TournamentFormat.SINGLE_ELIMINATION,
            "location_id": location_id,
            "start_time": start_time,
            "end_time": end_time,
            "registration_deadline": registration_deadline,
            "min_participants": 8,
            "max_participants": 32,
            "entry_fee_credits": 100,
            "prize_distribution": {"1st": 50, "2nd": 30, "3rd": 15, "4th": 5},
        }

        tournament_service = TournamentService(self.db)
        return tournament_service.create_tournament(
            tournament_data, organizer_id=1
        )  # System organizer
