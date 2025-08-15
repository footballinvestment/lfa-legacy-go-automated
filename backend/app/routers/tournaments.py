# === backend/app/routers/tournaments.py ===
# JAVÍTOTT Tournament Management API Router - Import hibák megoldva

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi import status as http_status  # 🔧 JAVÍTÁS: explicit import alias
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, validator
from enum import Enum

from ..database import get_db
from ..models.user import User
from ..models.tournament import (
    Tournament, TournamentParticipant, TournamentMatch, TournamentBracket,
    TournamentType, TournamentFormat, TournamentStatus, ParticipantStatus, MatchStatus
)
from ..services.tournament_service import (
    TournamentService, TournamentLifecycleManager, TournamentTemplateService, 
    TournamentAnalyticsService, SingleEliminationService
)
from ..routers.auth import get_current_user

# Initialize router
router = APIRouter(tags=["Tournaments"])

# === PYDANTIC SCHEMAS ===

class TournamentCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    tournament_type: TournamentType
    game_type: str = Field(..., pattern="^GAME[1-5]$")
    format: TournamentFormat
    location_id: int
    start_time: datetime
    end_time: datetime
    registration_deadline: datetime
    min_participants: int = Field(4, ge=2, le=32)
    max_participants: int = Field(..., ge=4, le=64)
    entry_fee_credits: int = Field(0, ge=0, le=1000)
    prize_distribution: Dict[str, int] = Field(
        default_factory=lambda: {"1st": 50, "2nd": 30, "3rd": 20}
    )
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Weekly Championship",
                "description": "Competitive weekly tournament",
                "tournament_type": "weekly_cup", 
                "game_type": "GAME1",
                "format": "single_elimination",
                "location_id": 1,
                "start_time": "2024-12-25T18:00:00",
                "end_time": "2024-12-25T20:00:00", 
                "registration_deadline": "2024-12-25T16:00:00",
                "min_participants": 4,
                "max_participants": 16,
                "entry_fee_credits": 100,
                "prize_distribution": {"1st": 50, "2nd": 30, "3rd": 20}
            }
        }

class TournamentRegistrationRequest(BaseModel):
    tournament_id: int

class TournamentAnalyticsResponse(BaseModel):
    tournament_stats: Dict[str, Any]
    participant_analytics: Dict[str, Any]
    performance_metrics: Dict[str, Any]
    bracket_analysis: Dict[str, Any]

class TournamentResponse(BaseModel):
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
    winner_id: Optional[int]
    winner_username: Optional[str]
    is_registration_open: bool
    is_full: bool
    can_start: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ParticipantResponse(BaseModel):
    id: int
    user_id: int
    username: str
    full_name: str
    level: int
    registration_time: datetime
    status: ParticipantStatus
    current_round: int
    matches_played: int
    matches_won: int
    matches_lost: int
    total_score: int
    average_score: float
    points: float  # For Swiss system
    final_position: Optional[int]
    prize_won: int
    performance_rating: float
    
    class Config:
        from_attributes = True

class MatchResponse(BaseModel):
    id: int
    match_id: str
    tournament_id: int
    round_number: int
    match_number: int
    bracket_position: Optional[str]
    player1_id: int
    player1_username: str
    player2_id: Optional[int]
    player2_username: Optional[str]
    scheduled_time: datetime
    actual_start_time: Optional[datetime]
    actual_end_time: Optional[datetime]
    status: MatchStatus
    winner_id: Optional[int]
    winner_username: Optional[str]
    player1_score: Optional[int]
    player2_score: Optional[int]
    is_bye: bool
    duration_minutes: Optional[int]
    competitiveness_score: Optional[float]
    match_notes: Optional[str]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class TournamentDetailResponse(BaseModel):
    tournament: TournamentResponse
    participants: List[ParticipantResponse]
    bracket: Optional[Dict[str, Any]]
    current_round: int
    total_rounds: int
    user_participation: Optional[ParticipantResponse]
    can_register: bool
    can_withdraw: bool
    upcoming_matches: List[MatchResponse]
    completed_matches: List[MatchResponse]
    tournament_rules: Dict[str, Any]

class MatchResultRequest(BaseModel):
    winner_id: int
    player1_score: int = Field(..., ge=0, le=1000)
    player2_score: int = Field(..., ge=0, le=1000)
    match_notes: Optional[str] = Field(None, max_length=500)
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "winner_id": 123,
                "player1_score": 85,
                "player2_score": 72,
                "match_notes": "Great competitive match!"
            }
        }

# === TOURNAMENT LISTING AND SEARCH ===

@router.get("/", response_model=List[TournamentResponse])
async def get_tournaments(
    status: Optional[str] = Query(None, description="Filter by status"),
    tournament_type: Optional[str] = Query(None, description="Filter by type"),
    location_id: Optional[int] = Query(None, description="Filter by location"),
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    🏆 Get tournaments with filtering options
    """
    try:
        tournament_service = TournamentService(db)
        tournaments = tournament_service.get_tournaments(
            status=status,
            tournament_type=tournament_type,
            location_id=location_id,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
            offset=offset
        )
        
        # Convert to response model
        response_tournaments = []
        for tournament in tournaments:
            response_tournaments.append(TournamentResponse(
                id=tournament.id,
                tournament_id=tournament.tournament_id,
                name=tournament.name,
                description=tournament.description,
                tournament_type=tournament.tournament_type,
                game_type=tournament.game_type,
                format=tournament.format,
                status=tournament.status,
                location_id=tournament.location_id,
                location_name=tournament.location.name if tournament.location else "Unknown",
                start_time=tournament.start_time,
                end_time=tournament.end_time,
                registration_deadline=tournament.registration_deadline,
                min_participants=tournament.min_participants,
                max_participants=tournament.max_participants,
                current_participants=tournament.participant_count,
                entry_fee_credits=tournament.entry_fee_credits,
                prize_pool_credits=tournament.prize_pool_credits or 0,
                min_level=tournament.min_level,
                max_level=tournament.max_level,
                organizer_id=tournament.organizer_id,
                organizer_username=tournament.organizer.username if tournament.organizer else "System",
                winner_id=tournament.winner_id,
                winner_username=tournament.winner.username if tournament.winner else None,
                is_registration_open=tournament.is_registration_open,
                is_full=tournament.is_full,
                can_start=tournament.can_start,
                created_at=tournament.created_at
            ))
        
        return response_tournaments
        
    except Exception as e:
        raise HTTPException(
            status_code=500,  # 🔧 JAVÍTÁS: explicit status code
            detail=f"Error fetching tournaments: {str(e)}"
        )

@router.post("/", response_model=TournamentResponse, status_code=201)  # 🔧 JAVÍTÁS
async def create_tournament(
    tournament_data: TournamentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    🏆 Create new tournament (Admin/Organizer only)
    """
    if not current_user.user_type == "admin" and not getattr(current_user, 'can_organize_tournaments', False):
        raise HTTPException(
            status_code=403, 
            detail="Insufficient permissions to create tournaments"
        )
    
    try:
        tournament_service = TournamentService(db)
        tournament = tournament_service.create_tournament(
            tournament_data.dict(), 
            current_user.id
        )
        
        return TournamentResponse(
            id=tournament.id,
            tournament_id=tournament.tournament_id,
            name=tournament.name,
            description=tournament.description,
            tournament_type=tournament.tournament_type,
            game_type=tournament.game_type,
            format=tournament.format,
            status=tournament.status,
            location_id=tournament.location_id,
            location_name=tournament.location.name if tournament.location else "Unknown",
            start_time=tournament.start_time,
            end_time=tournament.end_time,
            registration_deadline=tournament.registration_deadline,
            min_participants=tournament.min_participants,
            max_participants=tournament.max_participants,
            current_participants=tournament.participant_count,
            entry_fee_credits=tournament.entry_fee_credits,
            prize_pool_credits=tournament.prize_pool_credits or 0,
            min_level=tournament.min_level,
            max_level=tournament.max_level,
            organizer_id=tournament.organizer_id,
            organizer_username=tournament.organizer.username if tournament.organizer else "System",
            winner_id=tournament.winner_id,
            winner_username=tournament.winner.username if tournament.winner else None,
            is_registration_open=tournament.is_registration_open,
            is_full=tournament.is_full,
            can_start=tournament.can_start,
            created_at=tournament.created_at
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,  # 🔧 JAVÍTÁS
            detail=f"Error creating tournament: {str(e)}"
        )

@router.get("/{tournament_id}", response_model=TournamentDetailResponse)
async def get_tournament_details(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    🏆 Get detailed tournament information including bracket and matches
    """
    try:
        tournament_service = TournamentService(db)
        tournament = tournament_service.get_tournament(tournament_id)
        
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Get participants
        participants = tournament_service.get_tournament_participants(tournament_id)
        participant_responses = []
        user_participation = None
        
        for participant in participants:
            participant_response = ParticipantResponse(
                id=participant.id,
                user_id=participant.user_id,
                username=participant.user.username,
                full_name=participant.user.full_name,
                level=participant.user.level,
                registration_time=participant.registration_time,
                status=participant.status,
                current_round=participant.current_round,
                matches_played=participant.matches_played,
                matches_won=participant.matches_won,
                matches_lost=participant.matches_lost,
                total_score=participant.total_score,
                average_score=participant.average_score,
                points=participant.points,
                final_position=participant.final_position,
                prize_won=participant.prize_won,
                performance_rating=participant.performance_rating
            )
            
            participant_responses.append(participant_response)
            
            if participant.user_id == current_user.id:
                user_participation = participant_response
        
        # Get bracket data
        bracket_data = None
        current_round = 0
        total_rounds = 0
        
        if tournament.bracket:
            bracket_data = tournament.bracket.structure
            current_round = tournament.bracket.current_round
            total_rounds = tournament.bracket.total_rounds
        
        # Get matches
        upcoming_matches = []
        completed_matches = []
        
        # Determine registration capabilities
        can_register = (
            user_participation is None and
            tournament.is_registration_open and
            not tournament.is_full and
            current_user.level >= tournament.min_level and
            (tournament.max_level is None or current_user.level <= tournament.max_level) and
            current_user.credits >= tournament.entry_fee_credits
        )
        
        can_withdraw = (
            user_participation is not None and 
            user_participation.status == ParticipantStatus.REGISTERED and
            tournament.status == TournamentStatus.REGISTRATION
        )
        
        # Tournament rules based on format
        tournament_rules = {
            "format": tournament.format.value,
            "entry_fee": tournament.entry_fee_credits,
            "min_participants": tournament.min_participants,
            "max_participants": tournament.max_participants,
            "prize_distribution": tournament.prize_distribution,
            "level_requirements": {
                "min_level": tournament.min_level,
                "max_level": tournament.max_level
            }
        }
        
        return TournamentDetailResponse(
            tournament=TournamentResponse(
                id=tournament.id,
                tournament_id=tournament.tournament_id,
                name=tournament.name,
                description=tournament.description,
                tournament_type=tournament.tournament_type,
                game_type=tournament.game_type,
                format=tournament.format,
                status=tournament.status,
                location_id=tournament.location_id,
                location_name=tournament.location.name if tournament.location else "Unknown",
                start_time=tournament.start_time,
                end_time=tournament.end_time,
                registration_deadline=tournament.registration_deadline,
                min_participants=tournament.min_participants,
                max_participants=tournament.max_participants,
                current_participants=tournament.participant_count,
                entry_fee_credits=tournament.entry_fee_credits,
                prize_pool_credits=tournament.prize_pool_credits or 0,
                min_level=tournament.min_level,
                max_level=tournament.max_level,
                organizer_id=tournament.organizer_id,
                organizer_username=tournament.organizer.username if tournament.organizer else "System",
                winner_id=tournament.winner_id,
                winner_username=tournament.winner.username if tournament.winner else None,
                is_registration_open=tournament.is_registration_open,
                is_full=tournament.is_full,
                can_start=tournament.can_start,
                created_at=tournament.created_at
            ),
            participants=participant_responses,
            bracket=bracket_data,
            current_round=current_round,
            total_rounds=total_rounds,
            user_participation=user_participation,
            can_register=can_register,
            can_withdraw=can_withdraw,
            upcoming_matches=upcoming_matches,
            completed_matches=completed_matches,
            tournament_rules=tournament_rules
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,  # 🔧 JAVÍTÁS
            detail=f"Error fetching tournament details: {str(e)}"
        )

# === TOURNAMENT REGISTRATION ===

@router.post("/{tournament_id}/register")
async def register_for_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    🎯 Register for tournament
    """
    try:
        # 🔧 JAVÍTÁS: Add detailed logging for debug
        tournament_service = TournamentService(db)
        tournament = tournament_service.get_tournament(tournament_id)
        
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # 🔧 JAVÍTÁS: Log validation details
        print(f"DEBUG: Registration attempt for tournament {tournament_id}")
        print(f"DEBUG: Tournament '{tournament.name}' - Status: {tournament.status}")
        print(f"DEBUG: Registration open: {tournament.is_registration_open}")
        print(f"DEBUG: Tournament full: {tournament.is_full}")
        print(f"DEBUG: Entry fee: {tournament.entry_fee_credits} credits")
        print(f"DEBUG: User '{current_user.username}' has {current_user.credits} credits")
        print(f"DEBUG: User level: {current_user.level}, Tournament min level: {tournament.min_level}")
        
        success = tournament_service.register_participant(tournament_id, current_user.id)
        
        if success:
            return {
                "message": "Successfully registered for tournament",
                "tournament_id": tournament_id,
                "user_id": current_user.id,
                "credits_charged": tournament.entry_fee_credits
            }
        else:
            raise HTTPException(status_code=400, detail="Registration failed")
            
    except ValueError as e:
        # 🔧 JAVÍTÁS: Enhanced error logging with context
        error_msg = str(e)
        print(f"DEBUG: Registration validation failed: {error_msg}")
        print(f"DEBUG: Tournament ID: {tournament_id}, User: {current_user.username}")
        
        # Provide more specific error messages
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        elif "closed" in error_msg.lower():
            raise HTTPException(status_code=400, detail=f"Registration is closed for this tournament")
        elif "full" in error_msg.lower():
            raise HTTPException(status_code=400, detail=f"Tournament is full - no more spots available")
        elif "already registered" in error_msg.lower():
            raise HTTPException(status_code=400, detail=f"You are already registered for this tournament")
        elif "insufficient credits" in error_msg.lower():
            tournament = tournament_service.get_tournament(tournament_id)
            raise HTTPException(status_code=400, detail=f"Insufficient credits. Need {tournament.entry_fee_credits} credits but you have {current_user.credits}")
        else:
            raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        print(f"DEBUG: Unexpected error in tournament registration: {str(e)}")
        raise HTTPException(
            status_code=500,  # 🔧 JAVÍTÁS
            detail=f"Error registering for tournament: {str(e)}"
        )

@router.delete("/{tournament_id}/register")
async def withdraw_from_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    🚫 Withdraw from tournament
    """
    try:
        tournament_service = TournamentService(db)
        success = tournament_service.withdraw_participant(tournament_id, current_user.id)
        
        if success:
            return {
                "message": "Successfully withdrew from tournament",
                "tournament_id": tournament_id,
                "user_id": current_user.id,
                "credits_refunded": tournament_service.get_tournament(tournament_id).entry_fee_credits
            }
        else:
            raise HTTPException(status_code=400, detail="Withdrawal failed")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,  # 🔧 JAVÍTÁS
            detail=f"Error withdrawing from tournament: {str(e)}"
        )

# === TOURNAMENT MANAGEMENT ===

@router.post("/{tournament_id}/start")
async def start_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    🚀 Start tournament (Admin/Organizer only)
    """
    try:
        tournament_service = TournamentService(db)
        tournament = tournament_service.get_tournament(tournament_id)
        
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        if tournament.organizer_id != current_user.id and current_user.user_type != "admin":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        lifecycle_manager = TournamentLifecycleManager(db)
        success = lifecycle_manager.start_tournament(tournament_id)
        
        if success:
            return {
                "message": "Tournament started successfully",
                "tournament_id": tournament_id,
                "status": "in_progress"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to start tournament")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,  # 🔧 JAVÍTÁS
            detail=f"Error starting tournament: {str(e)}"
        )

@router.post("/{tournament_id}/cancel")
async def cancel_tournament(
    tournament_id: int,
    reason: str = Query(..., description="Reason for cancellation"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ❌ Cancel tournament (Admin/Organizer only)
    """
    try:
        tournament_service = TournamentService(db)
        tournament = tournament_service.get_tournament(tournament_id)
        
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        if tournament.organizer_id != current_user.id and current_user.user_type != "admin":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        lifecycle_manager = TournamentLifecycleManager(db)
        success = lifecycle_manager.cancel_tournament(tournament_id, reason)
        
        if success:
            return {
                "message": "Tournament cancelled successfully",
                "tournament_id": tournament_id,
                "reason": reason,
                "refunds_processed": True
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to cancel tournament")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,  # 🔧 JAVÍTÁS
            detail=f"Error cancelling tournament: {str(e)}"
        )

# === MATCH MANAGEMENT ===

@router.post("/matches/{match_id}/result")
async def submit_match_result(
    match_id: int,
    result_data: MatchResultRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ⚽ Submit match result
    """
    try:
        lifecycle_manager = TournamentLifecycleManager(db)
        success = lifecycle_manager.submit_match_result(
            match_id,
            result_data.winner_id,
            result_data.player1_score,
            result_data.player2_score,
            current_user.id
        )
        
        if success:
            return {
                "message": "Match result submitted successfully",
                "match_id": match_id,
                "winner_id": result_data.winner_id,
                "scores": {
                    "player1": result_data.player1_score,
                    "player2": result_data.player2_score
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to submit result")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,  # 🔧 JAVÍTÁS
            detail=f"Error submitting match result: {str(e)}"
        )

# === ANALYTICS ENDPOINTS ===

@router.get("/{tournament_id}/analytics", response_model=TournamentAnalyticsResponse)
async def get_tournament_analytics(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    📊 Get tournament analytics (Admin/Organizer only)
    """
    try:
        tournament_service = TournamentService(db)
        tournament = tournament_service.get_tournament(tournament_id)
        
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        if tournament.organizer_id != current_user.id and current_user.user_type != "admin":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        analytics_service = TournamentAnalyticsService(db)
        analytics = analytics_service.get_tournament_stats(tournament_id)
        
        return TournamentAnalyticsResponse(
            tournament_stats=analytics,
            participant_analytics={},
            performance_metrics={},
            bracket_analysis={}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,  # 🔧 JAVÍTÁS
            detail=f"Error fetching analytics: {str(e)}"
        )

@router.get("/{tournament_id}/bracket")
async def get_tournament_bracket(
    tournament_id: int,
    db: Session = Depends(get_db)
):
    """
    🏆 Get tournament bracket
    """
    try:
        tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        bracket_data = None
        current_round = 0
        total_rounds = 0
        
        if tournament.bracket:
            bracket_data = tournament.bracket.structure
            current_round = tournament.bracket.current_round
            total_rounds = tournament.bracket.total_rounds
        
        return {
            "tournament_id": tournament.id,
            "tournament_name": tournament.name,
            "format": tournament.format.value,
            "status": tournament.status.value,
            "current_round": current_round,
            "total_rounds": total_rounds,
            "bracket": bracket_data or {"message": "Bracket not yet generated"}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching bracket: {str(e)}"
        )