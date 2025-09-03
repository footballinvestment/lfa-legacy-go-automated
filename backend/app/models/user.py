# === backend/app/models/user.py ===
# JAVÍTOTT USER MODEL - LOGIN_COUNT HIBA JAVÍTVA

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Text,
    DateTime,
    JSON,
    Float,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from ..database import Base

# Pydantic imports
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List, Union

# =============================================================================
# SQLAlchemy Models
# =============================================================================


class User(Base):
    __tablename__ = "users"

    # Primary fields
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # Profile fields (matching database schema)
    full_name = Column(String(100), nullable=False)
    display_name = Column(String(100))
    bio = Column(Text)
    profile_picture = Column(String(200))
    favorite_position = Column(String(50))

    # Status and verification (matching database schema)
    is_active = Column(Boolean, default=True)
    user_type = Column(String(20), default="user")
    is_premium = Column(Boolean, default=False)
    premium_expires_at = Column(DateTime)

    # Game statistics (matching database schema)
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    credits = Column(Integer, default=5)
    games_played = Column(Integer, default=0)
    games_won = Column(Integer, default=0)
    games_lost = Column(Integer, default=0)
    total_playtime_minutes = Column(Integer, default=0)
    best_scores = Column(JSON, default=dict)
    achievement_points = Column(Integer, default=0)
    total_score = Column(Float, default=0.0)
    average_performance = Column(Float, default=0.0)
    skill_ratings = Column(JSON, default=dict)
    skills = Column(JSON, default=dict)

    # Social statistics (matching database schema)
    friend_count = Column(Integer, default=0)
    challenge_wins = Column(Integer, default=0)
    challenge_losses = Column(Integer, default=0)
    tournament_wins = Column(Integer, default=0)

    # Settings and preferences (matching database schema)
    notification_preferences = Column(JSON, default=dict)
    privacy_settings = Column(JSON, default=dict)
    language = Column(String(10), default="en")
    timezone = Column(String(50), default="UTC")

    # Audit fields (matching database schema)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    last_activity = Column(DateTime)

    # ✅ JAVÍTÁS: login_count mező hozzáadva a hiányzó funkcionalitáshoz
    login_count = Column(Integer, default=0)
    
    # Enhanced security fields
    password_updated_at = Column(DateTime, default=datetime.utcnow)
    password_breach_checked = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(DateTime, nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    force_password_reset = Column(Boolean, default=False)
    
    # ✅ JAVÍTÁS: last_purchase_date mező hozzáadva a credits funkcionalitáshoz
    last_purchase_date = Column(DateTime, nullable=True)
    
    # ✅ JAVÍTÁS: total_credits_purchased mező hozzáadva a credits funkcionalitáshoz
    total_credits_purchased = Column(Integer, default=0)
    
    # ✅ JAVÍTÁS: transaction_history mező hozzáadva a credits funkcionalitáshoz
    transaction_history = Column(JSON, default=list)

    # Relationships - EGYSZERŰSÍTETT (moderation relationships eltávolítva a konfliktus elkerülésére)
    sessions = relationship("UserSession", back_populates="user")
    
    # Chat system relationships
    chat_messages = relationship("ChatMessage", back_populates="user")
    chat_memberships = relationship("ChatRoomMembership", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username})>"

    # Utility methods
    def deduct_credits(self, amount: int) -> bool:
        """Deduct credits from user account. Returns True if successful."""
        if self.credits >= amount:
            self.credits -= amount
            return True
        return False

    def update_last_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()

    def increment_login(self):
        """✅ JAVÍTOTT: Increment login count and update last login - NULL érték kezelése"""
        if self.login_count is None:
            self.login_count = 0
        self.login_count += 1
        self.last_login = datetime.utcnow()

    def add_xp(self, amount: int):
        """Add experience points and check for level up"""
        self.xp += amount
        # Simple level calculation - 100 XP per level
        new_level = (self.xp // 100) + 1
        if new_level > self.level:
            self.level = new_level

    def get_win_rate(self) -> float:
        """Calculate win rate percentage"""
        if self.games_played == 0:
            return 0.0
        return (self.games_won / self.games_played) * 100

    def is_admin(self) -> bool:
        """Check if user has admin privileges"""
        return self.user_type in ["admin", "moderator"]

    def can_afford(self, cost: int) -> bool:
        """Check if user can afford a certain cost"""
        return self.credits >= cost
    
    def add_credits(self, amount: int):
        """Add credits to user account"""
        if amount > 0:
            self.credits += amount


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    ip_address = Column(String(45))
    user_agent = Column(Text)

    # Relationship
    user = relationship("User", back_populates="sessions")

    def __repr__(self):
        return f"<UserSession(id={self.id}, user_id={self.user_id})>"


# =============================================================================
# Pydantic Schemas
# =============================================================================


class UserBase(BaseModel):
    """Base user model with common fields"""

    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=100, pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    full_name: str = Field(..., min_length=2, max_length=100)


class UserCreate(UserBase):
    """User creation model"""

    password: str = Field(..., min_length=6, max_length=100)

    model_config = ConfigDict(from_attributes=True)


class UserCreateProtected(BaseModel):
    """Protected user creation with additional validations"""

    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: str = Field(..., max_length=100, pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    display_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    favorite_position: Optional[str] = Field(None, max_length=50)

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """User login model"""

    username: str = Field(..., max_length=50)
    password: str = Field(..., max_length=100)

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """User update model"""

    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    display_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    favorite_position: Optional[str] = Field(None, max_length=50)
    notification_preferences: Optional[Dict[str, Any]] = None
    privacy_settings: Optional[Dict[str, Any]] = None
    language: Optional[str] = Field(None, max_length=10)
    timezone: Optional[str] = Field(None, max_length=50)

    model_config = ConfigDict(from_attributes=True)


class PasswordChange(BaseModel):
    """Password change model"""

    current_password: str = Field(..., max_length=100)
    new_password: str = Field(..., min_length=6, max_length=100)
    confirm_password: str = Field(..., max_length=100)

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    """User response model for API"""

    id: int
    username: str
    email: str
    full_name: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    favorite_position: Optional[str] = None
    is_active: bool
    user_type: str
    is_premium: bool
    level: int
    xp: int
    credits: int
    games_played: int
    games_won: int
    friend_count: int
    achievement_points: int
    average_performance: Optional[float] = None
    last_activity: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PublicUserProfile(BaseModel):
    """Public user profile (limited information)"""

    id: int
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    level: int
    games_played: int
    games_won: int
    achievement_points: int
    average_performance: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class UserStats(BaseModel):
    """User statistics model"""

    games_played: int
    games_won: int
    win_rate: float
    total_playtime_minutes: int
    best_scores: Optional[Dict[str, Any]] = None
    achievement_points: int
    total_score: float
    average_performance: Optional[float] = None
    skill_ratings: Optional[Dict[str, Any]] = None
    challenge_wins: int
    challenge_losses: int
    tournament_wins: int

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    """Login response model"""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)


class TokenData(BaseModel):
    """Token data model"""

    username: Optional[str] = None
    user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
