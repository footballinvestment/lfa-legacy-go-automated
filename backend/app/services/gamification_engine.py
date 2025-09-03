# gamification_engine.py
from typing import Dict, List, Optional, Tuple
from enum import Enum
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.user import User
from ..database import get_db
# from .achievement_service import AchievementService  # Disabled due to model conflicts
import logging

logger = logging.getLogger(__name__)

class ActivityType(Enum):
    """Types of activities that generate XP"""
    CHALLENGE_WIN = "challenge_win"
    CHALLENGE_LOSS = "challenge_loss" 
    TOURNAMENT_WIN = "tournament_win"
    TOURNAMENT_PARTICIPATION = "tournament_participation"
    FRIEND_REFERRAL = "friend_referral"
    DAILY_LOGIN = "daily_login"
    PROFILE_COMPLETION = "profile_completion"
    FIRST_GAME = "first_game"

class XPCalculator:
    """Core XP calculation logic"""
    
    # Base XP values for different activities
    BASE_XP_VALUES = {
        ActivityType.CHALLENGE_WIN: 50,
        ActivityType.CHALLENGE_LOSS: 10,
        ActivityType.TOURNAMENT_WIN: 200,
        ActivityType.TOURNAMENT_PARTICIPATION: 25,
        ActivityType.FRIEND_REFERRAL: 30,
        ActivityType.DAILY_LOGIN: 5,
        ActivityType.PROFILE_COMPLETION: 20,
        ActivityType.FIRST_GAME: 15,
    }
    
    # Multipliers for different performance levels
    PERFORMANCE_MULTIPLIERS = {
        "excellent": 2.0,    # 90-100% performance
        "good": 1.5,         # 70-89% performance  
        "average": 1.0,      # 50-69% performance
        "poor": 0.7,         # Below 50% performance
    }
    
    @staticmethod
    def calculate_base_xp(activity_type: ActivityType, performance_score: float = 0.0) -> int:
        """Calculate base XP for an activity"""
        base_xp = XPCalculator.BASE_XP_VALUES.get(activity_type, 0)
        
        if performance_score > 0:
            # Apply performance multiplier
            if performance_score >= 90:
                multiplier = XPCalculator.PERFORMANCE_MULTIPLIERS["excellent"]
            elif performance_score >= 70:
                multiplier = XPCalculator.PERFORMANCE_MULTIPLIERS["good"]
            elif performance_score >= 50:
                multiplier = XPCalculator.PERFORMANCE_MULTIPLIERS["average"]
            else:
                multiplier = XPCalculator.PERFORMANCE_MULTIPLIERS["poor"]
                
            base_xp = int(base_xp * multiplier)
        
        return base_xp
    
    @staticmethod
    def calculate_streak_bonus(user_id: int, db: Session) -> int:
        """Calculate bonus XP for consecutive daily logins"""
        # Get user's last 7 days of activity
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        # This would check user's login streak in the future
        # For now, return a simple bonus
        return 5  # Placeholder streak bonus

class LevelCalculator:
    """Level progression calculations"""
    
    @staticmethod
    def calculate_level_from_xp(total_xp: int) -> int:
        """Calculate user level based on total XP"""
        # Progressive XP requirements: Level 1=0, Level 2=100, Level 3=250, etc.
        if total_xp < 100:
            return 1
        elif total_xp < 250:
            return 2
        elif total_xp < 450:
            return 3
        elif total_xp < 700:
            return 4
        elif total_xp < 1000:
            return 5
        else:
            # After level 5, each level needs 350 more XP
            additional_xp = total_xp - 1000
            additional_levels = additional_xp // 350
            return 6 + additional_levels
    
    @staticmethod
    def calculate_xp_for_next_level(current_xp: int) -> int:
        """Calculate XP needed for next level"""
        current_level = LevelCalculator.calculate_level_from_xp(current_xp)
        next_level = current_level + 1
        
        # Calculate XP threshold for next level
        if next_level == 2:
            return 100 - current_xp
        elif next_level == 3:
            return 250 - current_xp
        elif next_level == 4:
            return 450 - current_xp
        elif next_level == 5:
            return 700 - current_xp
        elif next_level == 6:
            return 1000 - current_xp
        else:
            # After level 6, each level needs 350 XP
            level_threshold = 1000 + (next_level - 6) * 350
            return level_threshold - current_xp

class GamificationService:
    """Main service for gamification operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.xp_calculator = XPCalculator()
        self.level_calculator = LevelCalculator()
    
    def award_xp(self, user_id: int, activity_type: ActivityType, 
                 performance_score: float = 0.0, bonus_reason: str = "") -> Dict:
        """Award XP to user for an activity"""
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Calculate XP
        base_xp = self.xp_calculator.calculate_base_xp(activity_type, performance_score)
        streak_bonus = self.xp_calculator.calculate_streak_bonus(user_id, self.db)
        
        total_xp_gained = base_xp + streak_bonus
        
        # Store previous level
        previous_level = user.level
        previous_xp = user.xp
        
        # Update user XP
        user.xp += total_xp_gained
        
        # Calculate new level
        new_level = self.level_calculator.calculate_level_from_xp(user.xp)
        level_up = new_level > previous_level
        
        if level_up:
            user.level = new_level
            logger.info(f"User {user_id} leveled up from {previous_level} to {new_level}")
        
        # Calculate XP needed for next level
        xp_to_next = self.level_calculator.calculate_xp_for_next_level(user.xp)
        
        self.db.commit()
        self.db.refresh(user)
        
        # Check for new achievements - disabled due to model conflicts
        # achievement_service = AchievementService(self.db)
        # new_achievements = achievement_service.check_user_achievements(user_id)
        new_achievements = []  # Placeholder - will be implemented later
        
        result = {
            "user_id": user_id,
            "activity_type": activity_type.value,
            "xp_gained": total_xp_gained,
            "base_xp": base_xp,
            "bonus_xp": streak_bonus,
            "total_xp": user.xp,
            "previous_xp": previous_xp,
            "level": user.level,
            "previous_level": previous_level,
            "level_up": level_up,
            "xp_to_next_level": xp_to_next,
            "performance_score": performance_score,
            "new_achievements": new_achievements,  # NEW: Include achievements
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"XP awarded to user {user_id}: {result}")
        return result
    
    def get_user_gamification_stats(self, user_id: int) -> Dict:
        """Get complete gamification stats for a user"""
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        xp_to_next = self.level_calculator.calculate_xp_for_next_level(user.xp)
        
        return {
            "user_id": user_id,
            "username": user.username,
            "level": user.level,
            "xp": user.xp,
            "xp_to_next_level": xp_to_next,
            "credits": user.credits,
            "games_played": user.games_played,
            "games_won": user.games_won,
            "games_lost": getattr(user, 'games_lost', 0),
            "win_rate": (user.games_won / max(user.games_played, 1)) * 100,
            "achievement_points": user.achievement_points,
            "challenge_wins": getattr(user, 'challenge_wins', 0),
            "challenge_losses": getattr(user, 'challenge_losses', 0),
            "tournament_wins": getattr(user, 'tournament_wins', 0),
        }