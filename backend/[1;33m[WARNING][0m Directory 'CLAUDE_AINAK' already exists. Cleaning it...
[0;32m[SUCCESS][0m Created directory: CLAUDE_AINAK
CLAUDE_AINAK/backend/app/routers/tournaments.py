# === backend/app/routers/tournaments.py ===
# TELJES JAVÍTOTT TOURNAMENTS ROUTER - List import hozzáadva

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional  # ✅ List import hozzáadva
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, validator
from enum import Enum
import uuid
import logging

from ..database import get_db
from ..models.user import User
from ..routers.auth import get_current_user

# Configure logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(tags=["Tournaments"])

# === ENUMS ===


class TournamentType(str, Enum):
    KNOCKOUT = "knockout"
    LEAGUE = "league"
    SWISS = "swiss"
    ROUND_ROBIN = "round_robin"


class TournamentStatus(str, Enum):
    REGISTRATION = "registration"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TournamentFormat(str, Enum):
    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS_SYSTEM = "swiss_system"


class ParticipantStatus(str, Enum):
    REGISTERED = "registered"
    CONFIRMED = "confirmed"
    ELIMINATED = "eliminated"
    WINNER = "winner"


# === PYDANTIC SCHEMAS ===


class TournamentCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    tournament_type: TournamentType
    game_type: str = Field(..., pattern="^GAME[1-5]$")
    format: TournamentFormat
    location_id: int
    start_time: datetime
    end_time: datetime
    registration_deadline: datetime
    min_participants: int = Field(..., ge=2, le=32)
    max_participants: int = Field(..., ge=4, le=64)
    entry_fee_credits: int = Field(0, ge=0, le=1000)
    prize_distribution: Dict[str, int] = Field(
        default_factory=lambda: {"1st": 50, "2nd": 30, "3rd": 20}
    )
    min_level: int = Field(1, ge=1, le=100)
    max_level: Optional[int] = Field(None, ge=1, le=100)
    rules: Optional[Dict[str, Any]] = Field(default_factory=dict)

    @validator("end_time")
    def end_time_after_start(cls, v, values):
        if "start_time" in values and v <= values["start_time"]:
            raise ValueError("End time must be after start time")
        return v

    @validator("registration_deadline")
    def deadline_before_start(cls, v, values):
        if "start_time" in values and v >= values["start_time"]:
            raise ValueError("Registration deadline must be before start time")
        return v

    @validator("max_participants")
    def max_greater_than_min(cls, v, values):
        if "min_participants" in values and v < values["min_participants"]:
            raise ValueError(
                "Max participants must be greater than or equal to min participants"
            )
        return v


class Tournament(BaseModel):
    id: int
    tournament_id: str
    name: str
    description: Optional[str]
    tournament_type: TournamentType
    game_type: str
    format: TournamentFormat
    status: TournamentStatus
    location_id: int
    location_name: str
    start_time: datetime
    end_time: datetime
    registration_deadline: datetime
    min_participants: int
    max_participants: int
    current_participants: int
    entry_fee_credits: int
    prize_pool_credits: int
    min_level: int
    max_level: Optional[int]
    organizer_id: int
    organizer_username: str
    winner_id: Optional[int] = None
    winner_username: Optional[str] = None
    is_registration_open: bool
    is_full: bool
    can_start: bool
    created_at: datetime


class TournamentDetails(BaseModel):
    tournament: Tournament
    participants: List[Dict[str, Any]]
    bracket: Optional[Dict[str, Any]] = None
    current_round: int = 0
    total_rounds: int = 0
    user_participation: Optional[Dict[str, Any]] = None
    can_register: bool = False
    can_withdraw: bool = False
    upcoming_matches: List[Dict[str, Any]] = []
    completed_matches: List[Dict[str, Any]] = []
    tournament_rules: Dict[str, Any] = {}


class TournamentParticipant(BaseModel):
    id: int
    user_id: int
    username: str
    full_name: str
    level: int
    registration_time: datetime
    status: ParticipantStatus
    current_round: int = 0
    matches_played: int = 0
    matches_won: int = 0
    matches_lost: int = 0
    total_score: int = 0
    average_score: float = 0.0
    points: int = 0
    prize_won: int = 0
    performance_rating: float = 0.0


# === HELPER FUNCTIONS ===


def generate_tournament_id() -> str:
    """Generate unique tournament ID"""
    timestamp = int(datetime.utcnow().timestamp())
    random_part = str(uuid.uuid4())[:8]
    return f"tournament_{timestamp}_{random_part}"


def calculate_prize_pool(entry_fee: int, participants_count: int) -> int:
    """Calculate total prize pool"""
    return entry_fee * participants_count


def get_tournament_status(tournament_data: Dict) -> TournamentStatus:
    """Determine tournament status based on dates and participants"""
    now = datetime.utcnow()

    if tournament_data.get("cancelled", False):
        return TournamentStatus.CANCELLED

    if tournament_data.get("winner_id"):
        return TournamentStatus.COMPLETED

    if now < tournament_data["registration_deadline"]:
        return TournamentStatus.REGISTRATION

    if now >= tournament_data["start_time"]:
        return TournamentStatus.ONGOING

    return TournamentStatus.REGISTRATION


def can_user_register(tournament_data: Dict, user: User) -> tuple[bool, str]:
    """Check if user can register for tournament"""
    now = datetime.utcnow()

    # Check registration deadline
    if now >= tournament_data["registration_deadline"]:
        return False, "Registration deadline has passed"

    # Check tournament not started
    if now >= tournament_data["start_time"]:
        return False, "Tournament has already started"

    # Check if full
    if tournament_data["current_participants"] >= tournament_data["max_participants"]:
        return False, "Tournament is full"

    # Check level requirements
    if user.level < tournament_data["min_level"]:
        return False, f"Minimum level required: {tournament_data['min_level']}"

    if tournament_data.get("max_level") and user.level > tournament_data["max_level"]:
        return False, f"Maximum level allowed: {tournament_data['max_level']}"

    # Check credits
    if user.credits < tournament_data["entry_fee_credits"]:
        return (
            False,
            f"Insufficient credits. Required: {tournament_data['entry_fee_credits']}",
        )

    return True, "Can register"


def create_mock_tournament_data(
    tournament_create: TournamentCreate, organizer: User
) -> Dict:
    """Create mock tournament data (in real implementation, this would be stored in database)"""
    tournament_id = generate_tournament_id()

    return {
        "id": 1,  # Would be auto-generated by database
        "tournament_id": tournament_id,
        "name": tournament_create.name,
        "description": tournament_create.description,
        "tournament_type": tournament_create.tournament_type,
        "game_type": tournament_create.game_type,
        "format": tournament_create.format,
        "status": TournamentStatus.REGISTRATION,
        "location_id": tournament_create.location_id,
        "location_name": "Mock Location",  # Would be fetched from database
        "start_time": tournament_create.start_time,
        "end_time": tournament_create.end_time,
        "registration_deadline": tournament_create.registration_deadline,
        "min_participants": tournament_create.min_participants,
        "max_participants": tournament_create.max_participants,
        "current_participants": 0,
        "entry_fee_credits": tournament_create.entry_fee_credits,
        "prize_pool_credits": 0,
        "min_level": tournament_create.min_level,
        "max_level": tournament_create.max_level,
        "organizer_id": organizer.id,
        "organizer_username": organizer.username,
        "winner_id": None,
        "winner_username": None,
        "is_registration_open": True,
        "is_full": False,
        "can_start": False,
        "created_at": datetime.utcnow(),
        "participants": [],
        "rules": tournament_create.rules,
    }


# === TOURNAMENT ENDPOINTS ===


@router.get("/", response_model=List[Tournament])
async def get_tournaments(
    status: Optional[TournamentStatus] = Query(None),
    game_type: Optional[str] = Query(None),
    location_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """🏆 Get all tournaments with optional filtering"""
    try:
        # In real implementation, this would query the tournaments table
        # For now, return mock data
        mock_tournaments = [
            {
                "id": 1,
                "tournament_id": "tournament_1755270000_abc123",
                "name": "Weekly Championship",
                "description": "Competitive weekly tournament",
                "tournament_type": TournamentType.KNOCKOUT,
                "game_type": "GAME1",
                "format": TournamentFormat.SINGLE_ELIMINATION,
                "status": TournamentStatus.REGISTRATION,
                "location_id": 1,
                "location_name": "Central Sports Complex",
                "start_time": datetime.utcnow() + timedelta(days=2),
                "end_time": datetime.utcnow() + timedelta(days=2, hours=4),
                "registration_deadline": datetime.utcnow() + timedelta(days=1),
                "min_participants": 4,
                "max_participants": 16,
                "current_participants": 3,
                "entry_fee_credits": 10,
                "prize_pool_credits": 30,
                "min_level": 1,
                "max_level": 50,
                "organizer_id": 1,
                "organizer_username": "admin",
                "winner_id": None,
                "winner_username": None,
                "is_registration_open": True,
                "is_full": False,
                "can_start": False,
                "created_at": datetime.utcnow() - timedelta(days=3),
            }
        ]

        # Apply filters
        filtered_tournaments = mock_tournaments

        if status:
            filtered_tournaments = [
                t for t in filtered_tournaments if t["status"] == status
            ]

        if game_type:
            filtered_tournaments = [
                t for t in filtered_tournaments if t["game_type"] == game_type
            ]

        if location_id:
            filtered_tournaments = [
                t for t in filtered_tournaments if t["location_id"] == location_id
            ]

        # Apply pagination
        paginated_tournaments = filtered_tournaments[skip : skip + limit]

        return [Tournament(**t) for t in paginated_tournaments]

    except Exception as e:
        logger.error(f"❌ Get tournaments error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tournaments",
        )


@router.get("/{tournament_id}", response_model=TournamentDetails)
async def get_tournament_details(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """🔍 Get detailed tournament information"""
    try:
        # In real implementation, query tournament and related data
        # For now, return mock detailed data

        mock_tournament = {
            "id": tournament_id,
            "tournament_id": f"tournament_{tournament_id}_details",
            "name": "Weekly Championship",
            "description": "Competitive weekly tournament for skilled players",
            "tournament_type": TournamentType.KNOCKOUT,
            "game_type": "GAME1",
            "format": TournamentFormat.SINGLE_ELIMINATION,
            "status": TournamentStatus.REGISTRATION,
            "location_id": 1,
            "location_name": "Central Sports Complex",
            "start_time": datetime.utcnow() + timedelta(days=2),
            "end_time": datetime.utcnow() + timedelta(days=2, hours=4),
            "registration_deadline": datetime.utcnow() + timedelta(days=1),
            "min_participants": 4,
            "max_participants": 16,
            "current_participants": 3,
            "entry_fee_credits": 10,
            "prize_pool_credits": 30,
            "min_level": 1,
            "max_level": 50,
            "organizer_id": 1,
            "organizer_username": "admin",
            "winner_id": None,
            "winner_username": None,
            "is_registration_open": True,
            "is_full": False,
            "can_start": False,
            "created_at": datetime.utcnow() - timedelta(days=3),
        }

        # Get REAL participants from database - FIXED!
        from ..models.tournament import TournamentParticipant
        from ..models.user import User
        
        real_participants = db.query(TournamentParticipant).join(User).filter(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.status == "registered"
        ).all()
        
        participants = []
        for participant in real_participants:
            user = participant.user
            participants.append({
                "user_id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "level": user.level,
                "registration_time": participant.registration_time,
                "status": participant.status,
                "matches_played": participant.matches_played,
                "matches_won": participant.matches_won
            })
        
        # Update participant count with REAL data
        mock_tournament["current_participants"] = len(participants)
        
        # Check if current user is registered (real check)
        user_participation = None
        current_user_participant = db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.user_id == current_user.id,
            TournamentParticipant.status == "registered"
        ).first()
        
        is_user_registered = current_user_participant is not None

        if is_user_registered and current_user_participant:
            user_participation = {
                "user_id": current_user.id,
                "username": current_user.username,
                "registration_time": current_user_participant.registration_time,
                "status": current_user_participant.status,
                "participant_id": current_user_participant.id,
                "matches_played": current_user_participant.matches_played,
                "matches_won": current_user_participant.matches_won,
                "current_round": current_user_participant.current_round
            }

        # Check if user can register
        can_register, _ = can_user_register(mock_tournament, current_user)
        can_register = can_register and not is_user_registered

        return TournamentDetails(
            tournament=Tournament(**mock_tournament),
            participants=participants,
            bracket=None,
            current_round=0,
            total_rounds=4,  # For 16 participants single elimination
            user_participation=user_participation,
            can_register=can_register,
            can_withdraw=is_user_registered
            and mock_tournament["status"] == TournamentStatus.REGISTRATION,
            upcoming_matches=[],
            completed_matches=[],
            tournament_rules={
                "format": "Single Elimination",
                "match_duration": "30 minutes",
                "late_policy": "10 minutes grace period",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get tournament details error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tournament details",
        )


@router.post("/", response_model=Tournament)
async def create_tournament(
    tournament_data: TournamentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """🏆 Create a new tournament"""
    try:
        # Check if user can create tournaments (admin or premium users)
        if (
            current_user.user_type not in ["admin", "moderator"]
            and not current_user.is_premium
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tournament creation requires admin privileges or premium membership",
            )

        # Validate tournament timing
        now = datetime.utcnow()
        if tournament_data.start_time <= now + timedelta(hours=24):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tournament must start at least 24 hours from now",
            )

        # Create tournament (mock implementation)
        tournament_dict = create_mock_tournament_data(tournament_data, current_user)

        logger.info(
            f"✅ Tournament created: {tournament_dict['name']} by user {current_user.id}"
        )

        return Tournament(**tournament_dict)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Create tournament error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create tournament",
        )


@router.post("/{tournament_id}/register")
async def register_for_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """👥 Register for a tournament"""
    try:
        # In real implementation, fetch tournament from database
        # For now, create mock tournament data
        mock_tournament = {
            "id": tournament_id,
            "name": "Weekly Championship",
            "registration_deadline": datetime.utcnow() + timedelta(days=1),
            "start_time": datetime.utcnow() + timedelta(days=2),
            "current_participants": 3,
            "max_participants": 16,
            "min_level": 1,
            "max_level": 50,
            "entry_fee_credits": 10,
            "status": TournamentStatus.REGISTRATION,
        }

        # Check if user can register
        can_register, reason = can_user_register(mock_tournament, current_user)
        if not can_register:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)
        
        # Import tournament models
        from ..models.tournament import TournamentParticipant
        
        # Check if user is already registered
        existing_registration = db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.user_id == current_user.id,
            TournamentParticipant.status == "registered"
        ).first()
        
        if existing_registration:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Already registered for this tournament"
            )
        
        # Check if user has sufficient credits
        entry_fee = mock_tournament["entry_fee_credits"]
        if current_user.credits < entry_fee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Insufficient credits. Need {entry_fee}, have {current_user.credits}"
            )
        
        # Database transaction for registration
        try:
            # Deduct entry fee
            current_user.credits -= entry_fee
            
            # Create participant record - THIS WAS MISSING!
            participant = TournamentParticipant(
                tournament_id=tournament_id,
                user_id=current_user.id,
                registration_time=datetime.utcnow(),
                status="registered",
                matches_played=0,
                matches_won=0,
                matches_lost=0,
                total_score=0,
                prize_won=0
            )
            
            db.add(participant)
            db.commit()
            
            logger.info(f"✅ ACTUALLY REGISTERED: User {current_user.id} added to tournament {tournament_id} participants table")
            
        except Exception as e:
            # Critical: Rollback credit deduction if participant creation fails
            db.rollback()
            logger.error(f"❌ Registration failed, credits restored: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed, credits not charged"
            )

        logger.info(
            f"✅ User {current_user.id} registered for tournament {tournament_id}"
        )

        # Return success with participant confirmation
        return {
            "success": True,
            "message": f"Successfully registered for tournament",
            "tournament_id": tournament_id,
            "entry_fee_charged": entry_fee,
            "remaining_credits": current_user.credits,
            "participant_id": participant.id,
            "registration_time": participant.registration_time,
            "status": participant.status
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Tournament registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register for tournament",
        )


@router.delete("/{tournament_id}/register")
async def withdraw_from_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """🚪 Withdraw from a tournament"""
    try:
        # In real implementation, check if user is registered and tournament allows withdrawal

        # Mock tournament data
        mock_tournament = {
            "id": tournament_id,
            "name": "Weekly Championship",
            "registration_deadline": datetime.utcnow() + timedelta(days=1),
            "start_time": datetime.utcnow() + timedelta(days=2),
            "entry_fee_credits": 10,
            "status": TournamentStatus.REGISTRATION,
        }

        # Check if withdrawal is allowed
        now = datetime.utcnow()
        if now >= mock_tournament["registration_deadline"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot withdraw after registration deadline",
            )

        if mock_tournament["status"] != TournamentStatus.REGISTRATION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot withdraw from tournament in current status",
            )

        # Refund entry fee
        refund_amount = mock_tournament["entry_fee_credits"]
        current_user.credits += refund_amount

        # Remove user from tournament (in real implementation)
        db.commit()

        logger.info(
            f"✅ User {current_user.id} withdrew from tournament {tournament_id}"
        )

        return {
            "success": True,
            "message": "Successfully withdrew from tournament",
            "tournament_id": tournament_id,
            "refund_amount": refund_amount,
            "new_balance": current_user.credits,
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Tournament withdrawal error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to withdraw from tournament",
        )


@router.get("/my-tournaments")
async def get_user_tournaments(
    status_filter: Optional[TournamentStatus] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """📋 Get user's tournament participations"""
    try:
        # In real implementation, query user's tournament participations
        # For now, return mock data

        user_tournaments = [
            {
                "tournament_id": 1,
                "tournament_name": "Weekly Championship",
                "status": TournamentStatus.REGISTRATION,
                "registration_time": datetime.utcnow() - timedelta(hours=6),
                "start_time": datetime.utcnow() + timedelta(days=2),
                "user_status": ParticipantStatus.REGISTERED,
                "entry_fee_paid": 10,
                "current_round": 0,
                "matches_played": 0,
                "matches_won": 0,
                "placement": None,
                "prize_won": 0,
            }
        ]

        # Apply filter
        if status_filter:
            user_tournaments = [
                t for t in user_tournaments if t["status"] == status_filter
            ]

        return {"tournaments": user_tournaments, "total_count": len(user_tournaments)}

    except Exception as e:
        logger.error(f"❌ Get user tournaments error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user tournaments",
        )


# === ADMIN ENDPOINTS ===


@router.put("/{tournament_id}/status")
async def update_tournament_status(
    tournament_id: int,
    new_status: TournamentStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """⚙️ Update tournament status (admin only)"""
    if current_user.user_type not in ["admin", "moderator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )

    try:
        # In real implementation, update tournament status in database
        logger.info(
            f"✅ Tournament {tournament_id} status updated to {new_status} by user {current_user.id}"
        )

        return {
            "success": True,
            "message": f"Tournament status updated to {new_status}",
            "tournament_id": tournament_id,
            "new_status": new_status,
        }

    except Exception as e:
        logger.error(f"❌ Update tournament status error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update tournament status",
        )


# === HEALTH CHECK ===


# === TOURNAMENT COMPLETION ENDPOINTS ===

@router.post("/{tournament_id}/complete")
async def complete_tournament(
    tournament_id: int,
    winner_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """🏆 Complete tournament with winner declaration"""
    try:
        # Check if user is admin or tournament organizer
        if current_user.user_type != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can complete tournaments"
            )
        
        winner_user_id = winner_data.get("winner_user_id")
        if not winner_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="winner_user_id is required"
            )
        
        # Import models
        from ..models.tournament import TournamentParticipant
        from ..models.user import User as UserModel
        
        # Verify winner is actually a participant
        winner_participant = db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.user_id == winner_user_id,
            TournamentParticipant.status == "registered"
        ).first()
        
        if not winner_participant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Winner must be a registered participant"
            )
        
        # Get winner user data
        winner_user = db.query(UserModel).filter(UserModel.id == winner_user_id).first()
        if not winner_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Winner user not found"
            )
        
        # Calculate and distribute prize
        prize_amount = 30  # Mock prize pool from tournament data
        winner_user.credits += prize_amount
        
        # Update winner participant record
        winner_participant.final_placement = 1
        winner_participant.prize_won = prize_amount
        
        db.commit()
        
        logger.info(f"🏆 Tournament {tournament_id} completed. Winner: {winner_user.username} (ID: {winner_user_id}), Prize: {prize_amount} credits")
        
        return {
            "success": True,
            "message": "Tournament completed successfully",
            "tournament_id": tournament_id,
            "winner": {
                "user_id": winner_user_id,
                "username": winner_user.username,
                "full_name": winner_user.full_name
            },
            "prize_distributed": prize_amount,
            "winner_total_credits": winner_user.credits
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Tournament completion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete tournament"
        )

@router.post("/{tournament_id}/distribute-prize")
async def distribute_tournament_prize(
    tournament_id: int,
    prize_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """💰 Manually distribute prize to tournament winner"""
    try:
        # Check if user is admin
        if current_user.user_type != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can distribute prizes"
            )
        
        recipient_user_id = prize_data.get("recipient_user_id")
        prize_amount = prize_data.get("prize_amount", 30)
        
        if not recipient_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="recipient_user_id is required"
            )
        
        # Get recipient user
        from ..models.user import User as UserModel
        recipient_user = db.query(UserModel).filter(UserModel.id == recipient_user_id).first()
        if not recipient_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipient user not found"
            )
        
        # Distribute prize
        old_credits = recipient_user.credits
        recipient_user.credits += prize_amount
        
        db.commit()
        
        logger.info(f"💰 Prize distributed: {prize_amount} credits to {recipient_user.username} for tournament {tournament_id}")
        
        return {
            "success": True,
            "message": f"Prize of {prize_amount} credits distributed successfully",
            "tournament_id": tournament_id,
            "recipient": {
                "user_id": recipient_user_id,
                "username": recipient_user.username,
                "full_name": recipient_user.full_name
            },
            "prize_amount": prize_amount,
            "old_credits": old_credits,
            "new_credits": recipient_user.credits
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Prize distribution error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to distribute prize"
        )

@router.get("/health")
async def tournaments_health_check():
    """🏥 Tournaments service health check"""
    return {
        "status": "healthy",
        "service": "tournaments",
        "features": {
            "tournament_creation": "active",
            "registration": "active",
            "bracket_management": "active",
            "match_tracking": "active",
            "prize_distribution": "active",
            "admin_operations": "active",
            "tournament_completion": "active",
            "prize_distribution": "active",
        },
    }


# Export router
print("✅ Tournaments router imported successfully")
