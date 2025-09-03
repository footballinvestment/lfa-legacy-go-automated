# app/models/user_fixed.py
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text
from sqlalchemy.sql import func
from ..database_postgres import Base

class UserFixed(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Authentication fields
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile fields
    full_name = Column(String(100), nullable=False)
    display_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    profile_picture = Column(String(255), nullable=True)
    favorite_position = Column(String(50), nullable=True)
    
    # Status fields
    is_active = Column(Boolean, default=True)
    user_type = Column(String(20), default="user")  # "user", "admin", "premium"
    is_premium = Column(Boolean, default=False)
    
    # Game progress
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    credits = Column(Integer, default=5)
    
    # Statistics
    games_played = Column(Integer, default=0)
    games_won = Column(Integer, default=0)
    friend_count = Column(Integer, default=0)
    achievement_points = Column(Integer, default=0)
    average_performance = Column(Float, default=0.0)
    
    # Timestamps
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"