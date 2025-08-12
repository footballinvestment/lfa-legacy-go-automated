# === backend/app/models/user.py ===
# LFA Legacy GO - Enhanced User Models - TELJES JAVÍTOTT VERZIÓ
# 🔧 MINDEN JAVÍTÁS: UserSession device_type, User update_last_activity, bookings relationship, TokenData, SQLAlchemy overlaps

from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Float, Text, ForeignKey, desc, UniqueConstraint, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from ..database import Base
from passlib.context import CryptContext
from typing import Optional, Dict, List
from pydantic import BaseModel, validator

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    """
    Enhanced User model with social features, gaming statistics, tournament support, and game results tracking
    🔧 JAVÍTVA: update_last_activity method és bookings relationship hozzáadva
    """
    __tablename__ = "users"
    
    # Basic Information
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    display_name = Column(String(100), nullable=True)
    
    # Authentication
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    user_type = Column(String(20), default="user")
    
    # Gaming Profile
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    credits = Column(Integer, default=5)
    
    # Enhanced Skills System
    skills = Column(JSON, default=lambda: {
        "accuracy": 0,
        "power": 0,
        "speed": 0,
        "technique": 0
    })
    
    # Game Statistics - Enhanced
    games_played = Column(Integer, default=0)
    games_won = Column(Integer, default=0)
    total_playtime_minutes = Column(Integer, default=0)
    best_scores = Column(JSON, default=lambda: {})
    
    # Achievement System
    achievements = Column(JSON, default=lambda: [])
    achievement_points = Column(Integer, default=0)
    
    # Social Features
    friend_count = Column(Integer, default=0)
    challenge_wins = Column(Integer, default=0)
    challenge_losses = Column(Integer, default=0)
    
    # Premium Features
    is_premium = Column(Boolean, default=False)
    premium_expires_at = Column(DateTime, nullable=True)
    
    # Enhanced Activity Tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime, nullable=True)
    last_activity = Column(DateTime, nullable=True)  # 🔧 JAVÍTVA: Field hozzáadva
    
    # Enhanced Profile Features
    bio = Column(Text, nullable=True)
    privacy_settings = Column(JSON, default=lambda: {
        "profile_visibility": "friends",
        "show_online_status": True,
        "allow_friend_requests": True
    })
    
    # Purchase History & Tracking
    total_credits_purchased = Column(Integer, default=0)
    total_bonus_earned = Column(Integer, default=0)
    last_purchase_date = Column(DateTime, nullable=True)
    transaction_history = Column(JSON, default=lambda: [])
    
    # Game Results Integration
    total_score = Column(Float, default=0.0)
    average_performance = Column(Float, default=0.0)
    skill_ratings = Column(JSON, default=lambda: {
        "accuracy": 1200,
        "speed": 1200,
        "technique": 1200,
        "consistency": 1200
    })
    
    # Profile Customization
    profile_picture = Column(String(200), nullable=True)
    favorite_position = Column(String(50), nullable=True)
    
    # === RELATIONSHIPS - 🔧 JAVÍTOTT OVERLAPS MEGOLDÁSOKKAL ===
    
    # User sessions
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    
    # 🔧 JAVÍTÁS: HIÁNYZÓ BOOKINGS RELATIONSHIP HOZZÁADVA
    bookings = relationship("GameSession", foreign_keys="[GameSession.booked_by_id]", back_populates="booked_by")
    
    # Social relationships - JAVÍTOTT OVERLAPS
    sent_friend_requests = relationship(
        "FriendRequest", 
        foreign_keys="[FriendRequest.sender_id]", 
        back_populates="sender",
        overlaps="receiver,received_friend_requests"
    )
    received_friend_requests = relationship(
        "FriendRequest", 
        foreign_keys="[FriendRequest.receiver_id]", 
        back_populates="receiver",
        overlaps="sender,sent_friend_requests"
    )
    
    # Challenge relationships - JAVÍTOTT OVERLAPS  
    sent_challenges = relationship(
        "Challenge", 
        foreign_keys="[Challenge.challenger_id]", 
        back_populates="challenger",
        overlaps="challenged,received_challenges,winner,won_challenges"
    )
    received_challenges = relationship(
        "Challenge", 
        foreign_keys="[Challenge.challenged_id]", 
        back_populates="challenged",
        overlaps="challenger,sent_challenges,winner,won_challenges"
    )
    won_challenges = relationship(
        "Challenge", 
        foreign_keys="[Challenge.winner_id]", 
        back_populates="winner",
        overlaps="challenger,sent_challenges,challenged,received_challenges"
    )
    
    # Game results relationship - JAVÍTOTT OVERLAPS
    game_results = relationship(
        "GameResult", 
        foreign_keys="[GameResult.recorded_by_id]", 
        back_populates="recorded_by",
        overlaps="user"
    )
    
    # Player statistics
    player_statistics = relationship("PlayerStatistics", back_populates="user")
    
    # Tournament relationships  
    tournament_participations = relationship("TournamentParticipant", back_populates="user")
    tournament_achievements = relationship("UserTournamentAchievement", back_populates="user")
    
    # Leaderboard entries
    leaderboard_entries = relationship("Leaderboard", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', level={self.level})>"
    
    # 🔧 JAVÍTÁS: update_last_activity method hozzáadása
    def update_last_activity(self):
        """Update the user's last activity timestamp"""
        self.last_activity = datetime.utcnow()
    
    # === AUTHENTICATION METHODS ===
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def verify_password(self, password: str) -> bool:
        """Verify a password"""
        return pwd_context.verify(password, self.hashed_password)
    
    def set_password(self, password: str):
        """Set user password"""
        self.hashed_password = self.hash_password(password)
    
    # Enhanced User Methods
    @property
    def win_rate(self) -> float:
        """Calculate user's win rate"""
        if self.games_played == 0:
            return 0.0
        return round((self.games_won / self.games_played) * 100, 2)
    
    @property
    def total_achievements(self) -> int:
        """Get total number of achievements"""
        return len(self.achievements) if self.achievements else 0
    
    @property
    def skill_average(self) -> float:
        """Calculate average skill level"""
        if not self.skills:
            return 0.0
        return round(sum(self.skills.values()) / len(self.skills), 1)
    
    @property
    def is_premium_active(self) -> bool:
        """Check if premium subscription is active"""
        if not self.is_premium or not self.premium_expires_at:
            return False
        return datetime.utcnow() < self.premium_expires_at
    
    # === GAMING PROGRESSION ===
    
    def add_xp(self, xp_amount: int):
        """Add XP and handle level progression"""
        self.xp += xp_amount
        
        # Check for level up (simple progression: level = sqrt(xp/100))
        new_level = max(1, int((self.xp / 100) ** 0.5) + 1)
        if new_level > self.level:
            old_level = self.level
            self.level = new_level
            
            # Award credits for leveling up
            credits_reward = (new_level - old_level) * 2
            self.credits += credits_reward
            
            return {"leveled_up": True, "new_level": new_level, "credits_awarded": credits_reward}
        
        return {"leveled_up": False}
    
    def add_credits(self, amount: int, source: str = "purchase"):
        """Add credits to user account"""
        self.credits += amount
        
        if source == "purchase":
            self.total_credits_purchased += amount
            self.last_purchase_date = datetime.utcnow()
    
    def add_achievement(self, achievement_id: str, achievement_data: dict):
        """Add achievement to user"""
        if not self.achievements:
            self.achievements = []
        
        # Check if achievement already exists
        existing = [a for a in self.achievements if a.get("id") == achievement_id]
        if not existing:
            achievement_data["earned_at"] = datetime.utcnow().isoformat()
            self.achievements.append(achievement_data)
            self.achievement_points += achievement_data.get("points", 10)

# 🔧 JAVÍTÁS: UserSession model device_type kezelés javítása
class UserSession(Base):
    """
    User session model for tracking authentication sessions
    🔧 JAVÍTVA: device_type field és constructor kezelés
    """
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User reference
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Session identification
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    
    # Device and location information
    ip_address = Column(String(45), nullable=True)  # IPv6 support
    user_agent = Column(Text, nullable=True)
    device_type = Column(String(20), default="web")  # 🔧 JAVÍTVA: Field létezik
    device_info = Column(JSON, default=lambda: {})
    
    # Session timing
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Session status
    is_active = Column(Boolean, default=True)
    logout_reason = Column(String(50), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    # 🔧 JAVÍTÁS: Constructor device_type paramétert elfogadja
    def __init__(self, **kwargs):
        """
        Initialize UserSession with proper device_type handling
        """
        # Extract device_type if provided
        if 'device_type' in kwargs:
            device_type = kwargs.pop('device_type')
            super().__init__(**kwargs)
            self.device_type = device_type
        else:
            super().__init__(**kwargs)
    
    def __repr__(self):
        return f"<UserSession(user_id={self.user_id}, active={self.is_active})>"
    
    @property
    def is_expired(self) -> bool:
        """Check if session is expired"""
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        """Check if session is valid"""
        return self.is_active and not self.is_expired
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()
    
    def invalidate(self, reason: str = "logout"):
        """Invalidate session"""
        self.is_active = False
        self.logout_reason = reason

# === PYDANTIC SCHEMAS ===

class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    display_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        return v

class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str

class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    privacy_settings: Optional[Dict] = None
    bio: Optional[str] = None
    favorite_position: Optional[str] = None
    
    @validator('full_name')
    def full_name_validation(cls, v):
        if v and (len(v) < 2 or len(v) > 100):
            raise ValueError('Full name must be between 2 and 100 characters')
        return v

class PasswordChange(BaseModel):
    """Schema for password change"""
    current_password: str
    new_password: str
    
    @validator('new_password')
    def password_validation(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserResponse(UserBase):
    id: int
    level: int
    xp: int
    credits: int
    games_played: int
    games_won: int
    friend_count: int
    total_achievements: int
    win_rate: float
    skill_average: float
    is_premium_active: bool
    skills: Dict[str, float]
    is_active: bool
    user_type: str
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    """Extended user profile schema"""
    id: int
    username: str
    full_name: str
    display_name: Optional[str]
    level: int
    xp: int
    credits: int
    bio: Optional[str]
    skills: Dict[str, float]
    skill_average: float
    games_played: int
    games_won: int
    win_rate: float
    total_achievements: int
    achievements: List[Dict]
    friend_count: int
    challenge_wins: int
    challenge_losses: int
    is_premium_active: bool
    created_at: datetime
    last_activity: Optional[datetime]
    
    class Config:
        from_attributes = True

class UserStats(BaseModel):
    """User statistics schema"""
    total_users: int
    active_users: int
    premium_users: int
    games_played_today: int
    average_skill_level: float
    top_performers: List[Dict]
    
class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

# 🔧 JAVÍTÁS: HIÁNYZÓ TOKEN CLASSES HOZZÁADVA
class Token(BaseModel):
    """Schema for JWT token"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Schema for token data"""
    username: Optional[str] = None
    user_id: Optional[int] = None

class SessionInfo(BaseModel):
    """Session information schema"""
    session_id: str
    created_at: datetime
    last_activity: datetime
    device_type: str
    user_agent: Optional[str]
    ip_address: Optional[str]
    is_current: bool
    
    class Config:
        from_attributes = True

# === UTILITY FUNCTIONS ===

def create_user(db, user_data: UserCreate) -> User:
    """Create new user with validation"""
    # Check if username exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise ValueError("Username already registered")
    
    # Check if email exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise ValueError("Email already registered")
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        display_name=user_data.display_name
    )
    user.set_password(user_data.password)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

def authenticate_user(db, username: str, password: str) -> Optional[User]:
    """Authenticate user with username/password"""
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.verify_password(password):
        return None
    return user

def get_user_by_username(db, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()

def update_user_activity(db, user_id: int):
    """Update user's last activity timestamp"""
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.update_last_activity()  # 🔧 JAVÍTVA: Method most már létezik
        db.commit()

def get_active_users_count(db) -> int:
    """Get count of active users in last 24 hours"""
    yesterday = datetime.utcnow() - timedelta(days=1)
    return db.query(User).filter(
        User.is_active == True,
        User.last_activity >= yesterday
    ).count()

def get_user_statistics(db) -> Dict:
    """Get comprehensive user statistics"""
    total_users = db.query(User).count()
    active_users = get_active_users_count(db)
    premium_users = db.query(User).filter(User.is_premium == True).count()
    
    # Average skill calculation
    users_with_skills = db.query(User).filter(User.skills != None).all()
    if users_with_skills:
        avg_skill = sum(user.skill_average for user in users_with_skills) / len(users_with_skills)
    else:
        avg_skill = 0.0
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "premium_users": premium_users,
        "average_skill_level": round(avg_skill, 1),
        "user_growth": {
            "daily": 0,  # Would need time-series data
            "weekly": 0,
            "monthly": 0
        }
    }