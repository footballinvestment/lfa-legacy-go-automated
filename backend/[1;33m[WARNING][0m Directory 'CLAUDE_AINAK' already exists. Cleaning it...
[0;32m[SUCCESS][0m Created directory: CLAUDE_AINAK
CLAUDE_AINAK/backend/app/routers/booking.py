# === backend/app/routers/booking.py ===
# TELJES JAVÍTOTT BOOKING ROUTER - List import hozzáadva

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional  # ✅ List import hozzáadva
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field
import uuid
import logging

from ..database import get_db
from ..models.user import User
from ..models.location import Location, GameDefinition, GameSession, GameSessionStatus
from ..routers.auth import get_current_user

# Configure logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(tags=["Real-Time Booking"])

# === PYDANTIC SCHEMAS ===


class BookingRequest(BaseModel):
    location_id: int
    game_type: str = Field(default="GAME1", pattern="^GAME[1-5]$")
    start_time: Optional[str] = Field(None, description="ISO format datetime")
    scheduled_time: Optional[str] = Field(None, description="Alternative field name")
    duration_minutes: int = Field(default=60, ge=15, le=240)
    additional_players: Optional[List[Dict]] = Field(default=[])
    notes: Optional[str] = Field(None, max_length=500)


class BookingResponse(BaseModel):
    success: bool
    message: str
    id: Optional[str] = None
    session_id: Optional[str] = None
    booking_reference: Optional[str] = None
    credits_charged: Optional[int] = None
    weather_warning: Optional[str] = None
    refund_policy: Optional[str] = None


class AvailabilitySlot(BaseModel):
    time: str
    available: bool
    cost_credits: int
    weather_warning: Optional[str] = None


class BookingUpdate(BaseModel):
    notes: Optional[str] = Field(None, max_length=500)
    additional_players: Optional[List[Dict]] = None


class SessionDetails(BaseModel):
    id: int
    session_id: str
    location_id: int
    location_name: str
    game_type: str
    game_name: str
    scheduled_start: datetime
    scheduled_end: datetime
    duration_minutes: int
    status: GameSessionStatus
    cost_credits: int
    participants: List[Dict]
    notes: Optional[str] = None
    weather_conditions: Optional[Dict] = None
    created_at: datetime


# === HELPER FUNCTIONS ===


def generate_session_id() -> str:
    """Generate unique session ID"""
    timestamp = int(datetime.utcnow().timestamp())
    random_part = str(uuid.uuid4())[:8]
    return f"session_{timestamp}_{random_part}"


def calculate_booking_cost(
    game_type: str, duration_minutes: int, location: Location
) -> int:
    """Calculate booking cost in credits"""
    # Base cost from game definition
    base_cost = 5  # Default base cost

    # Duration multiplier
    duration_multiplier = duration_minutes / 60

    # Location cost factor
    location_factor = (
        location.base_cost_per_hour or 15
    ) / 15  # Normalize to base 15 HUF/hour

    # Calculate total cost
    total_cost = int(base_cost * duration_multiplier * location_factor)

    return max(1, total_cost)  # Minimum 1 credit


def parse_booking_time(booking_request: BookingRequest) -> datetime:
    """Parse booking time from request"""
    time_str = booking_request.start_time or booking_request.scheduled_time

    if not time_str:
        # Default to next available hour
        now = datetime.utcnow()
        next_hour = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
        return next_hour

    try:
        # Try to parse ISO format
        if "T" in time_str:
            return datetime.fromisoformat(time_str.replace("Z", "+00:00"))
        else:
            # Assume date format and add current time
            date_part = datetime.strptime(time_str, "%Y-%m-%d")
            return date_part.replace(hour=10)  # Default to 10:00
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date/time format. Use ISO format or YYYY-MM-DD",
        )


def validate_booking_time(start_time: datetime) -> bool:
    """Validate booking time is in the future and within business hours"""
    now = datetime.utcnow()

    # Must be in the future
    if start_time <= now:
        return False

    # Must be within business hours (6:00 - 22:00)
    hour = start_time.hour
    if hour < 6 or hour >= 22:
        return False

    # Must be within next 30 days
    if start_time > now + timedelta(days=30):
        return False

    return True


def check_availability(
    location_id: int, start_time: datetime, duration_minutes: int, db: Session
) -> bool:
    """Check if time slot is available"""
    end_time = start_time + timedelta(minutes=duration_minutes)

    # Check for conflicting bookings
    conflicting_sessions = (
        db.query(GameSession)
        .filter(
            GameSession.location_id == location_id,
            GameSession.status.in_(
                [GameSessionStatus.SCHEDULED, GameSessionStatus.CONFIRMED]
            ),
            GameSession.scheduled_start < end_time,
            GameSession.scheduled_end > start_time,
        )
        .count()
    )

    return conflicting_sessions == 0


def create_game_session(
    booking_request: BookingRequest,
    user: User,
    location: Location,
    start_time: datetime,
    db: Session,
) -> GameSession:
    """Create a new game session"""
    session_id = generate_session_id()
    end_time = start_time + timedelta(minutes=booking_request.duration_minutes)
    cost = calculate_booking_cost(
        booking_request.game_type, booking_request.duration_minutes, location
    )

    # Get game definition
    game_definition = (
        db.query(GameDefinition)
        .filter(GameDefinition.game_id == booking_request.game_type)
        .first()
    )

    if not game_definition:
        # Create default game definition if not exists
        game_definition = GameDefinition(
            game_id=booking_request.game_type,
            name=f"Game {booking_request.game_type[-1]}",
            description="Football training session",
            min_players=1,
            max_players=1,
            duration_minutes=booking_request.duration_minutes,
            base_credit_cost=cost,
        )
        db.add(game_definition)
        db.commit()
        db.refresh(game_definition)

    # Create session
    session = GameSession(
        session_id=session_id,
        location_id=location.id,
        game_definition_id=game_definition.id,
        user_id=user.id,
        scheduled_start=start_time,
        scheduled_end=end_time,
        status=GameSessionStatus.SCHEDULED,
        participants=[user.id],
        max_participants=1,
        notes=booking_request.notes,
        cost_credits=cost,
        created_at=datetime.utcnow(),
    )

    return session


# === BOOKING ENDPOINTS ===


@router.get("/availability")
async def check_availability_simple(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    location_id: int = Query(1, description="Location ID"),
    game_type: str = Query("GAME1", description="Game type"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """🔍 Check availability - SIMPLE VERSION"""
    try:
        # Validate location
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Location not found"
            )

        # Parse date
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD",
            )

        # Generate time slots for the day
        slots = []
        for hour in range(6, 22):  # 6:00 to 21:00
            slot_time = target_date.replace(hour=hour, minute=0, second=0)

            # Check availability
            available = check_availability(location_id, slot_time, 60, db)

            # Calculate cost
            cost = calculate_booking_cost(game_type, 60, location)

            slots.append(
                AvailabilitySlot(
                    time=f"{hour:02d}:00",
                    available=available,
                    cost_credits=cost,
                    weather_warning=None,
                )
            )

        return {
            "location_id": location_id,
            "location_name": location.name,
            "date": date,
            "game_type": game_type,
            "slots": slots,
            "total_slots": len(slots),
            "available_slots": sum(1 for slot in slots if slot.available),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Availability check error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check availability",
        )


@router.post("/book", response_model=BookingResponse)
async def create_booking(
    booking_request: BookingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """📅 Create a new booking"""
    try:
        # Validate location
        location = (
            db.query(Location)
            .filter(Location.id == booking_request.location_id)
            .first()
        )
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Location not found"
            )

        # Parse and validate booking time
        start_time = parse_booking_time(booking_request)

        if not validate_booking_time(start_time):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid booking time. Must be in the future and within business hours (6:00-22:00)",
            )

        # Check availability
        if not check_availability(
            booking_request.location_id,
            start_time,
            booking_request.duration_minutes,
            db,
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Time slot is not available",
            )

        # Calculate cost
        cost = calculate_booking_cost(
            booking_request.game_type, booking_request.duration_minutes, location
        )

        # Check user credits
        if current_user.credits < cost:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Insufficient credits. Required: {cost}, Available: {current_user.credits}",
            )

        # Create game session
        session = create_game_session(
            booking_request, current_user, location, start_time, db
        )

        # Deduct credits
        current_user.credits -= cost

        # Add session to database
        db.add(session)
        db.commit()
        db.refresh(session)

        logger.info(
            f"✅ Booking created: {session.session_id} for user {current_user.id}"
        )

        return BookingResponse(
            success=True,
            message="Booking created successfully",
            id=str(session.id),
            session_id=session.session_id,
            booking_reference=session.session_id,
            credits_charged=cost,
            weather_warning=None,
            refund_policy="Free cancellation up to 2 hours before start time",
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Booking creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create booking",
        )


@router.get("/my-bookings", response_model=List[SessionDetails])
async def get_user_bookings(
    status_filter: Optional[GameSessionStatus] = Query(
        None, description="Filter by status"
    ),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """📋 Get user's bookings"""
    try:
        query = db.query(GameSession).filter(GameSession.user_id == current_user.id)

        if status_filter:
            query = query.filter(GameSession.status == status_filter)

        sessions = query.order_by(GameSession.scheduled_start.desc()).limit(limit).all()

        session_details = []
        for session in sessions:
            # Get location and game info
            location = (
                db.query(Location).filter(Location.id == session.location_id).first()
            )
            game_def = (
                db.query(GameDefinition)
                .filter(GameDefinition.id == session.game_definition_id)
                .first()
            )

            session_details.append(
                SessionDetails(
                    id=session.id,
                    session_id=session.session_id,
                    location_id=session.location_id,
                    location_name=location.name if location else "Unknown Location",
                    game_type=game_def.game_id if game_def else "GAME1",
                    game_name=game_def.name if game_def else "Football Training",
                    scheduled_start=session.scheduled_start,
                    scheduled_end=session.scheduled_end,
                    duration_minutes=session.duration_minutes,
                    status=session.status,
                    cost_credits=session.cost_credits,
                    participants=session.participants or [],
                    notes=session.notes,
                    weather_conditions=session.weather_conditions,
                    created_at=session.created_at,
                )
            )

        return session_details

    except Exception as e:
        logger.error(f"❌ Get user bookings error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bookings",
        )


@router.get("/booking/{session_id}", response_model=SessionDetails)
async def get_booking_details(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """🔍 Get booking details"""
    try:
        session = (
            db.query(GameSession).filter(GameSession.session_id == session_id).first()
        )

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
            )

        # Check ownership
        if session.user_id != current_user.id and current_user.user_type not in [
            "admin",
            "moderator",
        ]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        # Get location and game info
        location = db.query(Location).filter(Location.id == session.location_id).first()
        game_def = (
            db.query(GameDefinition)
            .filter(GameDefinition.id == session.game_definition_id)
            .first()
        )

        return SessionDetails(
            id=session.id,
            session_id=session.session_id,
            location_id=session.location_id,
            location_name=location.name if location else "Unknown Location",
            game_type=game_def.game_id if game_def else "GAME1",
            game_name=game_def.name if game_def else "Football Training",
            scheduled_start=session.scheduled_start,
            scheduled_end=session.scheduled_end,
            duration_minutes=session.duration_minutes,
            status=session.status,
            cost_credits=session.cost_credits,
            participants=session.participants or [],
            notes=session.notes,
            weather_conditions=session.weather_conditions,
            created_at=session.created_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get booking details error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve booking details",
        )


@router.put("/booking/{session_id}")
async def update_booking(
    session_id: str,
    update_data: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """✏️ Update booking details"""
    try:
        session = (
            db.query(GameSession).filter(GameSession.session_id == session_id).first()
        )

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
            )

        # Check ownership
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        # Check if booking can be modified
        if session.status not in [GameSessionStatus.SCHEDULED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking cannot be modified in current status",
            )

        # Update fields
        if update_data.notes is not None:
            session.notes = update_data.notes

        if update_data.additional_players is not None:
            # Update participants list
            current_participants = session.participants or [current_user.id]
            # Add logic to handle additional players
            session.participants = current_participants

        session.updated_at = datetime.utcnow()

        db.commit()

        logger.info(f"✅ Booking updated: {session_id} by user {current_user.id}")

        return {
            "success": True,
            "message": "Booking updated successfully",
            "session_id": session_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Update booking error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update booking",
        )


@router.delete("/booking/{session_id}")
async def cancel_booking(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """❌ Cancel a booking"""
    try:
        session = (
            db.query(GameSession).filter(GameSession.session_id == session_id).first()
        )

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
            )

        # Check ownership
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        # Check if booking can be cancelled
        if session.status not in [
            GameSessionStatus.SCHEDULED,
            GameSessionStatus.CONFIRMED,
        ]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking cannot be cancelled in current status",
            )

        # Check cancellation policy (2 hours before)
        time_until_start = session.scheduled_start - datetime.utcnow()
        if time_until_start < timedelta(hours=2):
            # No refund for late cancellation
            refund_amount = 0
            refund_message = (
                "No refund for cancellations less than 2 hours before start time"
            )
        else:
            # Full refund for early cancellation
            refund_amount = session.cost_credits
            refund_message = f"Full refund of {refund_amount} credits"
            current_user.credits += refund_amount

        # Update session status
        session.status = GameSessionStatus.CANCELLED
        session.updated_at = datetime.utcnow()
        session.refund_amount = refund_amount
        session.refund_reason = "User cancellation"

        db.commit()

        logger.info(
            f"✅ Booking cancelled: {session_id} by user {current_user.id}, refund: {refund_amount}"
        )

        return {
            "success": True,
            "message": "Booking cancelled successfully",
            "refund_amount": refund_amount,
            "refund_message": refund_message,
            "session_id": session_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Cancel booking error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel booking",
        )


# === ADMIN ENDPOINTS ===


@router.get("/admin/all-bookings")
async def get_all_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[GameSessionStatus] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """👥 Get all bookings (admin only)"""
    if current_user.user_type not in ["admin", "moderator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )

    try:
        query = db.query(GameSession)

        if status_filter:
            query = query.filter(GameSession.status == status_filter)

        sessions = (
            query.order_by(GameSession.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return {
            "bookings": [
                {
                    "session_id": session.session_id,
                    "user_id": session.user_id,
                    "location_id": session.location_id,
                    "status": session.status,
                    "scheduled_start": session.scheduled_start,
                    "cost_credits": session.cost_credits,
                    "created_at": session.created_at,
                }
                for session in sessions
            ],
            "total_count": len(sessions),
        }

    except Exception as e:
        logger.error(f"❌ Get all bookings error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve all bookings",
        )


# === HEALTH CHECK ===


@router.get("/health")
async def booking_health_check():
    """🏥 Booking service health check"""
    return {
        "status": "healthy",
        "service": "booking",
        "features": {
            "availability_check": "active",
            "booking_creation": "active",
            "booking_management": "active",
            "cancellation": "active",
            "admin_operations": "active",
        },
    }


# Export router
print("✅ Booking router imported successfully")
