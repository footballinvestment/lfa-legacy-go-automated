# achievement_service.py
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..models.user import User
from ..models.achievements import Achievement, UserAchievement
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AchievementService:
    """Service for managing achievements"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def initialize_default_achievements(self):
        """Initialize default achievements if they don't exist"""
        
        default_achievements = [
            {
                "name": "First Steps",
                "description": "Complete your first challenge",
                "category": "progression",
                "requirement_type": "challenges_completed",
                "requirement_value": 1,
                "xp_reward": 25,
                "credits_reward": 5,
                "rarity": "common"
            },
            {
                "name": "Rising Star", 
                "description": "Reach level 5",
                "category": "progression",
                "requirement_type": "level_reached",
                "requirement_value": 5,
                "xp_reward": 100,
                "credits_reward": 25,
                "rarity": "rare"
            },
            {
                "name": "Champion",
                "description": "Win 10 challenges in a row",
                "category": "competitive", 
                "requirement_type": "win_streak",
                "requirement_value": 10,
                "xp_reward": 200,
                "credits_reward": 50,
                "rarity": "epic"
            },
            {
                "name": "Social Butterfly",
                "description": "Add 5 friends",
                "category": "social",
                "requirement_type": "friends_count",
                "requirement_value": 5,
                "xp_reward": 50,
                "credits_reward": 10,
                "rarity": "common"
            },
            {
                "name": "XP Master",
                "description": "Earn 1000 total XP",
                "category": "progression",
                "requirement_type": "total_xp",
                "requirement_value": 1000,
                "xp_reward": 150,
                "credits_reward": 30,
                "rarity": "rare"
            },
        ]
        
        for ach_data in default_achievements:
            # Check if achievement already exists
            existing = self.db.query(Achievement).filter(
                Achievement.name == ach_data["name"]
            ).first()
            
            if not existing:
                achievement = Achievement(**ach_data)
                self.db.add(achievement)
                logger.info(f"Created achievement: {ach_data['name']}")
        
        self.db.commit()
        logger.info("Default achievements initialized")
    
    def check_user_achievements(self, user_id: int) -> List[Dict]:
        """Check and award any new achievements for user"""
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return []
        
        newly_earned = []
        
        # Get all achievements user doesn't have yet
        user_achievement_ids = self.db.query(UserAchievement.achievement_id).filter(
            and_(UserAchievement.user_id == user_id, UserAchievement.is_completed == True)
        ).all()
        
        user_achievement_ids = [ua[0] for ua in user_achievement_ids]
        
        available_achievements = self.db.query(Achievement).filter(
            and_(
                Achievement.is_active == True,
                ~Achievement.id.in_(user_achievement_ids)
            )
        ).all()
        
        for achievement in available_achievements:
            if self._check_achievement_requirement(user, achievement):
                # Award achievement
                user_achievement = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement.id,
                    current_progress=achievement.requirement_value,
                    is_completed=True
                )
                
                self.db.add(user_achievement)
                
                # Award XP and credits
                if achievement.xp_reward > 0:
                    user.xp += achievement.xp_reward
                if achievement.credits_reward > 0:
                    user.credits += achievement.credits_reward
                
                newly_earned.append({
                    "id": achievement.id,
                    "name": achievement.name,
                    "description": achievement.description,
                    "category": achievement.category,
                    "rarity": achievement.rarity,
                    "xp_reward": achievement.xp_reward,
                    "credits_reward": achievement.credits_reward,
                    "earned_at": datetime.now().isoformat()
                })
                
                logger.info(f"User {user_id} earned achievement: {achievement.name}")
        
        if newly_earned:
            self.db.commit()
            self.db.refresh(user)
        
        return newly_earned
    
    def _check_achievement_requirement(self, user: User, achievement: Achievement) -> bool:
        """Check if user meets achievement requirement"""
        
        req_type = achievement.requirement_type
        req_value = achievement.requirement_value
        
        if req_type == "level_reached":
            return user.level >= req_value
        elif req_type == "total_xp":
            return user.xp >= req_value
        elif req_type == "challenges_completed":
            total_challenges = getattr(user, 'challenge_wins', 0) + getattr(user, 'challenge_losses', 0)
            return total_challenges >= req_value
        elif req_type == "friends_count":
            return user.friend_count >= req_value
        elif req_type == "win_streak":
            # This would require more complex logic to track streaks
            # For now, return False (implement later)
            return False
        
        return False
    
    def get_user_achievements(self, user_id: int) -> Dict:
        """Get all achievements for a user"""
        
        # Get completed achievements
        completed = self.db.query(UserAchievement, Achievement).join(Achievement).filter(
            and_(
                UserAchievement.user_id == user_id,
                UserAchievement.is_completed == True
            )
        ).all()
        
        # Get available achievements (not completed)
        completed_ids = [ua.achievement_id for ua, _ in completed]
        available = self.db.query(Achievement).filter(
            and_(
                Achievement.is_active == True,
                ~Achievement.id.in_(completed_ids) if completed_ids else True
            )
        ).all()
        
        return {
            "completed_achievements": [
                {
                    "id": ach.id,
                    "name": ach.name,
                    "description": ach.description,
                    "category": ach.category,
                    "rarity": ach.rarity,
                    "earned_at": ua.earned_at.isoformat(),
                    "xp_reward": ach.xp_reward,
                    "credits_reward": ach.credits_reward
                }
                for ua, ach in completed
            ],
            "available_achievements": [
                {
                    "id": ach.id,
                    "name": ach.name,
                    "description": ach.description,
                    "category": ach.category,
                    "rarity": ach.rarity,
                    "requirement_type": ach.requirement_type,
                    "requirement_value": ach.requirement_value,
                    "xp_reward": ach.xp_reward,
                    "credits_reward": ach.credits_reward,
                    "is_hidden": ach.is_hidden
                }
                for ach in available if not ach.is_hidden
            ]
        }