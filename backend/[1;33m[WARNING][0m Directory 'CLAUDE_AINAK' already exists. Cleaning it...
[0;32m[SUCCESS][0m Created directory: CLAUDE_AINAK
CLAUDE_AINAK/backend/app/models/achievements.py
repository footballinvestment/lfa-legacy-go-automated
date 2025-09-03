# achievements.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # "social", "competitive", "progression", "special"
    
    # Requirements
    requirement_type = Column(String(50), nullable=False)  # "xp_threshold", "win_streak", "challenges_won", etc.
    requirement_value = Column(Integer, nullable=False)
    
    # Rewards
    xp_reward = Column(Integer, default=0)
    credits_reward = Column(Integer, default=0)
    
    # Metadata
    icon = Column(String(100))  # Achievement icon filename
    rarity = Column(String(20), default="common")  # "common", "rare", "epic", "legendary"
    is_hidden = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"))
    
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Progress tracking
    current_progress = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    
    # Relationships
    achievement = relationship("Achievement")