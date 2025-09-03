# gamification.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict
from ..database import get_db
from ..services.gamification_engine import GamificationService, ActivityType
from ..routers.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/gamification", tags=["gamification"])

@router.get("/stats/{user_id}")
async def get_gamification_stats(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get gamification stats for a user"""
    
    try:
        service = GamificationService(db)
        stats = service.get_user_gamification_stats(user_id)
        return {
            "success": True,
            "data": stats
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/award-xp")
async def award_xp(
    user_id: int,
    activity_type: str,
    performance_score: float = 0.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Award XP to a user for an activity"""
    
    try:
        # Convert string to enum
        activity_enum = ActivityType(activity_type)
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid activity type: {activity_type}"
        )
    
    try:
        service = GamificationService(db)
        result = service.award_xp(
            user_id=user_id,
            activity_type=activity_enum,
            performance_score=performance_score
        )
        
        return {
            "success": True,
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.get("/my-stats")
async def get_my_gamification_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get gamification stats for current user"""
    
    try:
        service = GamificationService(db)
        stats = service.get_user_gamification_stats(current_user.id)
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/challenge-completed")
async def challenge_completed(
    opponent_user_id: int,
    won: bool,
    performance_score: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Award XP for completing a challenge"""
    
    try:
        service = GamificationService(db)
        
        # Award XP based on win/loss
        activity_type = ActivityType.CHALLENGE_WIN if won else ActivityType.CHALLENGE_LOSS
        
        result = service.award_xp(
            user_id=current_user.id,
            activity_type=activity_type,
            performance_score=performance_score
        )
        
        # Update user challenge stats
        if won:
            current_user.challenge_wins = getattr(current_user, 'challenge_wins', 0) + 1
            current_user.games_won += 1
        else:
            current_user.challenge_losses = getattr(current_user, 'challenge_losses', 0) + 1
            if hasattr(current_user, 'games_lost'):
                current_user.games_lost += 1
        
        current_user.games_played += 1
        db.commit()
        
        return {
            "success": True,
            "data": result,
            "message": f"Challenge {'won' if won else 'lost'}! XP awarded."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.get("/achievements")
async def get_my_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get achievements for current user"""
    
    try:
        from ..services.achievement_service import AchievementService
        service = AchievementService(db)
        achievements = service.get_user_achievements(current_user.id)
        
        return {
            "success": True,
            "data": achievements
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/check-achievements")
async def check_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually check for new achievements"""
    
    try:
        from ..services.achievement_service import AchievementService
        service = AchievementService(db)
        new_achievements = service.check_user_achievements(current_user.id)
        
        return {
            "success": True,
            "data": {
                "new_achievements": new_achievements,
                "count": len(new_achievements)
            },
            "message": f"Found {len(new_achievements)} new achievements!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")