# === backend/app/routers/booking.py ===
# TELJES JAVÍTOTT Real-Time Location Booking System Router - TIMEZONE FIX

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import uuid
import logging
from pydantic import BaseModel

from ..database import get_db
from ..models.user import User
from ..models.location import Location, GameDefinition, GameSession, SessionStatus
from ..routers.auth import get_current_user

# Initialize router and logger
router = APIRouter(tags=["Real-Time Booking with Weather"])
logger = logging.getLogger(__name__)

# === JAVÍTOTT PYDANTIC MODELS ===

class BookingRequest(BaseModel):
    location_id: int
    game_type: str = "GAME1"  # Default to GAME1
    start_time: Optional[str] = None  # ISO format datetime
    scheduled_time: Optional[str] = None  # Alternative field name
    duration_minutes: int = 60
    additional_players: Optional[List[Dict]] = []
    notes: Optional[str] = None

class BookingResponse(BaseModel):
    success: bool
    message: str
    id: Optional[str] = None  # session ID
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

# === JAVÍTOTT AVAILABILITY ENDPOINTS ===

@router.get("/availability")
async def check_availability_simple(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    location_id: int = Query(1, description="Location ID"),
    game_type: str = Query("GAME1", description="Game type"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """🔍 Check availability - JAVÍTOTT FIELD NAMES"""
    
    try:
        # Validate location
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Parse date
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Check if date is in the past
        if target_date.date() < datetime.now().date():
            raise HTTPException(status_code=400, detail="Cannot check availability for past dates")
        
        # Generate sample time slots for the day
        slots = []
        start_hour = 8  # 8 AM
        end_hour = 22   # 10 PM
        
        for hour in range(start_hour, end_hour, 2):  # Every 2 hours
            slot_time = target_date.replace(hour=hour, minute=0, second=0)
            
            # JAVÍTOTT: Helyes field név használata
            existing_session = db.query(GameSession).filter(
                GameSession.location_id == location_id,
                GameSession.scheduled_start <= slot_time,
                GameSession.scheduled_end > slot_time,
                GameSession.status.in_(['scheduled', 'confirmed', 'in_progress'])
            ).first()
            
            slot = AvailabilitySlot(
                time=slot_time.strftime("%H:%M"),
                available=existing_session is None,
                cost_credits=5,  # Standard cost
                weather_warning=None
            )
            slots.append(slot)
        
        logger.info(f"Availability checked for location {location_id}, date {date}: {len(slots)} slots")
        
        return {
            "date": date,
            "location_id": location_id,
            "location_name": location.name,
            "slots": [slot.dict() for slot in slots],
            "total_slots": len(slots),
            "available_slots": len([s for s in slots if s.available])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Availability check error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error checking availability"
        )

@router.get("/check-availability")
async def check_basic_availability(
    location_id: int = Query(...),
    date: str = Query(...),
    game_type: str = Query("GAME1"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """🔍 Check basic availability (legacy endpoint)"""
    
    # Redirect to the new unified endpoint
    return await check_availability_simple(date, location_id, game_type, current_user, db)

# === JAVÍTOTT BOOKING CREATION ENDPOINTS ===

@router.post("/sessions", response_model=BookingResponse)
async def create_booking_session(
    booking_request: BookingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """📅 Create booking session - JAVÍTOTT TIMEZONE HANDLING"""
    
    try:
        # Validate location
        location = db.query(Location).filter(Location.id == booking_request.location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Parse start time - handle both field names
        start_time_str = booking_request.start_time or booking_request.scheduled_time
        if not start_time_str:
            raise HTTPException(status_code=400, detail="start_time or scheduled_time is required")
        
        try:
            start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
            # Ensure start_time is timezone-aware (assume UTC if naive)
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid datetime format")
        
        # JAVÍTÁS: Timezone-aware összehasonlítás
        now_utc = datetime.now(timezone.utc)
        if start_time <= now_utc:
            raise HTTPException(status_code=400, detail="Cannot book in the past")
        
        # Check user credits
        credits_needed = 5  # Standard cost
        if current_user.credits < credits_needed:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient credits. Need {credits_needed}, have {current_user.credits}"
            )
        
        # JAVÍTOTT: Check if slot is available - helyes field nevek + timezone fix
        end_time = start_time + timedelta(minutes=booking_request.duration_minutes)
        
        # Convert to naive datetime for database comparison (database stores naive datetimes)
        start_time_naive = start_time.replace(tzinfo=None)
        end_time_naive = end_time.replace(tzinfo=None)
        
        existing_session = db.query(GameSession).filter(
            GameSession.location_id == booking_request.location_id,
            GameSession.scheduled_start < end_time_naive,
            GameSession.scheduled_end > start_time_naive,
            GameSession.status.in_(['scheduled', 'confirmed', 'in_progress'])
        ).first()
        
        if existing_session:
            raise HTTPException(status_code=400, detail="Time slot already booked")
        
        # Get default game definition
        game_definition = db.query(GameDefinition).filter(
            GameDefinition.game_id == booking_request.game_type
        ).first()
        
        if not game_definition:
            game_definition = db.query(GameDefinition).first()  # Fallback to first game
        
        if not game_definition:
            raise HTTPException(status_code=500, detail="No game definitions available")
        
        # JAVÍTOTT: Create new game session - helyes field nevek
        session_id = str(uuid.uuid4())
        
        # Use the already-defined naive datetimes for database storage
        
        new_session = GameSession(
            session_id=session_id,
            location_id=booking_request.location_id,
            game_definition_id=game_definition.id,
            booked_by_id=current_user.id,  # JAVÍTOTT: booked_by_id
            scheduled_start=start_time_naive,    # JAVÍTOTT: timezone-naive
            scheduled_end=end_time_naive,        # JAVÍTOTT: timezone-naive
            status='scheduled',
            participants=[current_user.id],
            max_participants=location.capacity or 4,
            total_cost=credits_needed,
            payment_status="completed",
            notes=booking_request.notes or f"Booking for {booking_request.duration_minutes} minutes"
        )
        
        db.add(new_session)
        
        # Deduct credits from user
        current_user.credits -= credits_needed
        
        # Commit transaction
        db.commit()
        db.refresh(new_session)
        
        # Background tasks
        background_tasks.add_task(send_booking_confirmation, session_id)
        
        logger.info(f"Booking created: Session {session_id} for user {current_user.username}, "
                   f"Location {booking_request.location_id}, Time {start_time_naive}")
        
        return BookingResponse(
            success=True,
            message="Booking created successfully",
            id=session_id,
            session_id=session_id,
            booking_reference=f"LFA-{session_id[:8].upper()}",
            credits_charged=credits_needed
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Booking creation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating booking"
        )

@router.post("/create", response_model=BookingResponse)
async def create_booking(
    booking_request: BookingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """📅 Create booking (legacy endpoint)"""
    
    # Redirect to the new unified endpoint
    return await create_booking_session(booking_request, background_tasks, current_user, db)

# === USER BOOKING MANAGEMENT ===

@router.get("/my-bookings")
async def get_my_bookings(
    include_weather: bool = Query(True, description="Include weather information"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """📋 Get user's bookings - JAVÍTOTT FIELD NAMES"""
    
    try:
        # JAVÍTOTT: Get user's bookings - helyes field név
        user_sessions = db.query(GameSession).filter(
            GameSession.booked_by_id == current_user.id  # JAVÍTOTT: booked_by_id
        ).order_by(GameSession.scheduled_start.desc()).all()  # JAVÍTOTT: scheduled_start
        
        bookings = []
        
        for session in user_sessions:
            booking_info = {
                "session_id": session.session_id,
                "booking_reference": f"LFA-{session.session_id[-8:].upper()}",
                "game_name": session.game_definition.name if session.game_definition else "Unknown Game",
                "location_name": session.location.name,
                "start_time": session.scheduled_start.isoformat(),  # JAVÍTOTT: scheduled_start
                "end_time": session.scheduled_end.isoformat(),      # JAVÍTOTT: scheduled_end
                "status": session.status.value if hasattr(session.status, 'value') else str(session.status),
                "total_cost": session.total_cost,
                "participants": session.participants or [],
                "notes": session.notes
            }
            
            if include_weather and hasattr(session, 'weather_at_start'):
                booking_info["weather"] = session.weather_at_start
            
            bookings.append(booking_info)
        
        return {
            "bookings": bookings,
            "total_bookings": len(bookings),
            "upcoming_bookings": len([b for b in bookings if b["status"] in ["scheduled", "confirmed"]])
        }
        
    except Exception as e:
        logger.error(f"Error fetching user bookings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving bookings"
        )

# === BOOKING CANCELLATION ===

@router.delete("/sessions/{session_id}")
async def cancel_booking(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """❌ Cancel booking - JAVÍTOTT FIELD NAMES"""
    
    try:
        # Find the booking session
        session = db.query(GameSession).filter(
            GameSession.session_id == session_id,
            GameSession.booked_by_id == current_user.id  # JAVÍTOTT: booked_by_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Check if cancellation is allowed
        now = datetime.now()
        if session.scheduled_start <= now:  # JAVÍTOTT: scheduled_start
            raise HTTPException(status_code=400, detail="Cannot cancel past or ongoing bookings")
        
        # Check cancellation policy (24 hours before)
        hours_until_booking = (session.scheduled_start - now).total_seconds() / 3600  # JAVÍTOTT: scheduled_start
        if hours_until_booking < 24:
            raise HTTPException(status_code=400, detail="Cannot cancel within 24 hours of booking")
        
        # Update session status
        session.status = 'cancelled'
        
        # Calculate refund (50% if cancelled more than 24 hours before)
        refund_amount = int(session.total_cost * 0.5)  # 50% refund
        
        current_user.credits += refund_amount
        
        db.commit()
        
        logger.info(f"Booking cancelled: Session {session_id}, Refund: {refund_amount} credits")
        
        return {
            "message": "Booking cancelled successfully",
            "session_id": session_id,
            "refund_amount": refund_amount,
            "new_credit_balance": current_user.credits
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Booking cancellation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error cancelling booking"
        )

# === LOCATION AVAILABILITY ===

@router.get("/locations/{location_id}/availability")
async def get_location_availability(
    location_id: int,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """📅 Get availability for specific location - JAVÍTOTT FIELD NAMES"""
    
    try:
        # Validate location
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Parse dates
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d") if end_date else start
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
        
        # JAVÍTOTT: Get existing bookings - helyes field nevek
        existing_sessions = db.query(GameSession).filter(
            GameSession.location_id == location_id,
            GameSession.scheduled_start >= start,  # JAVÍTOTT: scheduled_start
            GameSession.scheduled_start <= end + timedelta(days=1),  # JAVÍTOTT: scheduled_start
            GameSession.status.in_(['scheduled', 'confirmed', 'in_progress'])
        ).all()
        
        # Build availability data
        availability = {}
        current_date = start
        
        while current_date <= end:
            date_str = current_date.strftime("%Y-%m-%d")
            daily_slots = []
         
            # Generate hourly slots (8 AM to 10 PM)
            for hour in range(8, 22):
                slot_time = current_date.replace(hour=hour, minute=0, second=0)
                
                # JAVÍTOTT: Check if slot is booked - helyes field nevek
                is_booked = any(
                    session.scheduled_start <= slot_time < session.scheduled_end  # JAVÍTOTT: scheduled_start/end
                    for session in existing_sessions
                )
                
                daily_slots.append({
                    "time": f"{hour:02d}:00",
                    "datetime": slot_time.isoformat(),
                    "available": not is_booked,
                    "cost_credits": 5
                })
            
            availability[date_str] = daily_slots
            current_date += timedelta(days=1)
        
        return {
            "location_id": location_id,
            "location_name": location.name,
            "start_date": start_date,
            "end_date": end_date or start_date,
            "availability": availability
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Location availability error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving location availability"
        )

# === BACKGROUND TASKS ===

async def send_booking_confirmation(session_id: str):
    """Send booking confirmation"""
    logger.info(f"Sending booking confirmation for session {session_id}")
    # TODO: Implement email/push notification

# === HEALTH CHECK ===

@router.get("/health")
async def booking_system_health():
    """🏥 Booking system health check"""
    
    return {
        "status": "healthy",
        "features": [
            "availability_check",
            "session_creation",
            "booking_management",
            "cancellation_system",
            "credit_integration"
        ],
        "endpoints": [
            "/api/booking/availability",
            "/api/booking/sessions",
            "/api/booking/my-bookings"
        ],
        "field_mappings": {
            "start_time": "scheduled_start",
            "end_time": "scheduled_end",
            "booked_by": "booked_by_id"
        },
        "last_check": datetime.now(timezone.utc).isoformat()
    }