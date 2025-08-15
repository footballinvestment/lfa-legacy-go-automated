# backend/app/models/user.py
# MINDEN LEHETSÉGES SCHEMA - Teljes auth compatibility

from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, JSON, Float, ForeignKey
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
    user_type = Column(String(20), default='user')
    is_premium = Column(Boolean, default=False)
    premium_expires_at = Column(DateTime)
    
    # Game statistics (matching database schema)
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    credits = Column(Integer, default=5)
    games_played = Column(Integer, default=0)
    games_won = Column(Integer, default=0)
    total_playtime_minutes = Column(Integer, default=0)
    best_scores = Column(JSON)
    achievement_points = Column(Integer, default=0)
    total_score = Column(Float, default=0.0)
    average_performance = Column(Float, default=0.0)
    skill_ratings = Column(JSON)
    
    # Skills (JSON)
    skills = Column(JSON, default=lambda: {
        "shooting": 0, "passing": 0, "dribbling": 0, 
        "defending": 0, "goalkeeping": 0
    })
    
    # Social stats (matching database schema)
    friend_count = Column(Integer, default=0)
    challenge_wins = Column(Integer, default=0)
    challenge_losses = Column(Integer, default=0)
    
    # Purchase statistics (matching database schema)
    total_credits_purchased = Column(Integer, default=0)
    total_bonus_earned = Column(Integer, default=0)
    last_purchase_date = Column(DateTime)
    transaction_history = Column(JSON)
    
    # Achievements and preferences (matching database schema)
    achievements = Column(JSON)
    privacy_settings = Column(JSON)
    
    # Timestamps (matching database schema)
    created_at = Column(DateTime, default=func.current_timestamp())
    last_login = Column(DateTime)
    last_activity = Column(DateTime)

    # RELATIONSHIPS
    # sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")  # Temporarily disabled
    violations = relationship("UserViolation", foreign_keys="UserViolation.user_id", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        """Convert user to dictionary"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "name": self.name,
            "bio": self.bio,
            "location": self.location,
            "avatar_url": self.avatar_url,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "user_type": self.user_type,
            "status": self.status,
            "level": self.level,
            "xp": self.xp,
            "credits": self.credits,
            "games_played": self.games_played,
            "games_won": self.games_won,
            "total_score": self.total_score,
            "skills": self.skills or {},
            "friends_count": self.friends_count,
            "challenges_sent": self.challenges_sent,
            "challenges_won": self.challenges_won,
            "total_purchases": self.total_purchases,
            "total_spent": float(self.total_spent) if self.total_spent else 0.0,
            "achievements": self.achievements or [],
            "preferences": self.preferences or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "last_active": self.last_active.isoformat() if self.last_active else None,
        }


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    last_activity = Column(DateTime(timezone=True), default=func.now())
    ip_address = Column(String(45))
    user_agent = Column(Text)
    is_active = Column(Boolean, default=True)

    # Relationship
    # user = relationship("User", back_populates="sessions")  # Temporarily disabled


# =============================================================================
# Pydantic Schemas - MINDEN LEHETSÉGES VERZIÓ
# =============================================================================

# Base schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=100)
    name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    model_config = ConfigDict(from_attributes=True)


# Registration/Login schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    name: Optional[str] = Field(None, max_length=100)
    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=100)
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = Field(None, max_length=255)
    model_config = ConfigDict(from_attributes=True)


# Response schemas (matching actual database schema)
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    favorite_position: Optional[str] = None
    is_active: Optional[bool] = True
    user_type: Optional[str] = "user"
    is_premium: Optional[bool] = False
    premium_expires_at: Optional[datetime] = None
    level: Optional[int] = 1
    xp: Optional[int] = 0
    credits: Optional[int] = 5
    games_played: Optional[int] = 0
    games_won: Optional[int] = 0
    total_playtime_minutes: Optional[int] = 0
    best_scores: Optional[Dict[str, Any]] = None
    achievement_points: Optional[int] = 0
    total_score: Optional[float] = 0.0
    average_performance: Optional[float] = 0.0
    skill_ratings: Optional[Dict[str, Any]] = None
    skills: Optional[Dict[str, int]] = None
    friend_count: Optional[int] = 0
    challenge_wins: Optional[int] = 0
    challenge_losses: Optional[int] = 0
    total_credits_purchased: Optional[int] = 0
    total_bonus_earned: Optional[int] = 0
    last_purchase_date: Optional[datetime] = None
    transaction_history: Optional[Dict[str, Any]] = None
    achievements: Optional[Dict[str, Any]] = None
    privacy_settings: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# Token schemas - KRITIKUS: Ezek hiányoztak!
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    model_config = ConfigDict(from_attributes=True)


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    scopes: List[str] = []
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
    model_config = ConfigDict(from_attributes=True)


class RegisterResponse(BaseModel):
    message: str
    user: UserResponse
    access_token: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# Profile schemas
class UserProfile(BaseModel):
    id: int
    username: str
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    level: int
    xp: int
    games_played: int
    games_won: int
    achievements: List[Dict[str, Any]]
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class UserStats(BaseModel):
    user_id: int
    username: str
    level: int
    xp: int
    credits: int
    games_played: int
    games_won: int
    win_rate: float
    total_score: int
    skills: Dict[str, int]
    friends_count: int
    model_config = ConfigDict(from_attributes=True)


# Session schemas
class SessionCreate(BaseModel):
    access_token: str
    expires_in: int = 86400  # 24 hours
    model_config = ConfigDict(from_attributes=True)


class SessionResponse(BaseModel):
    session_id: str
    user_id: int
    expires_at: datetime
    last_activity: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


# Password schemas
class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=100)
    new_password: str = Field(..., min_length=6, max_length=100)
    model_config = ConfigDict(from_attributes=True)


class PasswordReset(BaseModel):
    email: str = Field(..., max_length=100)
    model_config = ConfigDict(from_attributes=True)


class PasswordResetConfirm(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=100)
    model_config = ConfigDict(from_attributes=True)


# Email verification schemas
class EmailVerification(BaseModel):
    verification_token: str = Field(..., min_length=1)
    model_config = ConfigDict(from_attributes=True)


class EmailVerificationRequest(BaseModel):
    email: str = Field(..., max_length=100)
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# MINDEN LEHETSÉGES ALIAS - Backward Compatibility
# =============================================================================

# Common aliases
UserLoginResponse = LoginResponse
UserRegistrationResponse = RegisterResponse
LoginRequest = UserLogin
RegisterRequest = UserCreate
UserCreateRequest = UserCreate
UserLoginRequest = UserLogin

# Token aliases
AccessToken = Token
JWTToken = Token
AuthToken = Token

# Profile aliases
UserProfileResponse = UserProfile
PublicUserProfile = UserProfile
UserStatsResponse = UserStats

# Session aliases
UserSession = SessionResponse
ActiveSession = SessionResponse

# Update aliases
UserUpdateRequest = UserUpdate
ProfileUpdate = UserUpdate

# Password aliases
PasswordChangeRequest = PasswordChange
PasswordResetRequest = PasswordReset
PasswordResetConfirmRequest = PasswordResetConfirm

# Email aliases
EmailVerificationRequest = EmailVerificationRequest
VerifyEmailRequest = EmailVerification

# Generic aliases
User_Create = UserCreate
User_Update = UserUpdate
User_Response = UserResponse
User_Login = UserLogin
Token_Data = TokenData
Token_Response = TokenResponse
Login_Response = LoginResponse
Register_Response = RegisterResponse


# Enhanced user creation with spam protection
class UserCreateProtected(BaseModel):
    """Enhanced user creation with spam protection"""
    username: str = Field(..., min_length=3, max_length=30, description="Unique username")
    password: str = Field(..., min_length=6, max_length=100, description="User password")
    email: str = Field(..., max_length=100, description="Valid email address")
    full_name: str = Field(..., max_length=100, description="User's full name")
    captcha_response: str = Field(..., description="hCaptcha response token")
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "newuser",
                "password": "securepass123",
                "email": "user@example.com",
                "full_name": "New User",
                "captcha_response": "hcaptcha_token_here"
            }
        }