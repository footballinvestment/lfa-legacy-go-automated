# === backend/app/models/location.py ===
# TELJES JAVÍTOTT LOCATION MODEL - TOURNAMENT RELATIONSHIP HOZZÁADVA

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, JSON, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Session
from datetime import datetime, timedelta
from ..database import Base
from typing import Optional, List, Dict
from enum import Enum as PyEnum
from pydantic import BaseModel, validator, Field

# === LOCATION ENUMS ===

class LocationType(str, PyEnum):
    OUTDOOR = "outdoor"
    INDOOR = "indoor"
    SEMI_COVERED = "semi_covered"
    MIXED = "mixed"

class LocationStatus(str, PyEnum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    TEMPORARILY_CLOSED = "temporarily_closed"
    PERMANENTLY_CLOSED = "permanently_closed"

class GameSessionStatus(str, PyEnum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

# Alias for backwards compatibility
SessionStatus = GameSessionStatus

# === LOCATION MODEL - JAVÍTOTT ===

class Location(Base):
    """
    Enhanced location model with tournament relationship
    """
    __tablename__ = "locations"
    
    # Basic Information
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False, index=True)
    address = Column(String(200), nullable=False)
    city = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    
    # Geographic Information  
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, nullable=True)  # Meters above sea level
    timezone = Column(String(50), default="Europe/Budapest")
    
    # Physical Properties
    capacity = Column(Integer, nullable=False, default=1)
    area_sqm = Column(Float, nullable=True)
    location_type = Column(Enum(LocationType), nullable=False, default=LocationType.OUTDOOR)
    status = Column(Enum(LocationStatus), default=LocationStatus.ACTIVE)
    
    # Weather and Environment
    weather_protected = Column(Boolean, default=False)
    shelter_available = Column(Boolean, default=False)
    indoor_backup_available = Column(Boolean, default=False)
    
    # Facilities and Equipment
    facilities = Column(JSON, default=dict)  # Equipment, amenities, etc.
    amenities = Column(JSON, default=list)  # List of amenities
    
    # Pricing and Business
    base_cost_per_hour = Column(Float, default=0.0)
    price_per_hour = Column(Float, default=0.0)
    currency = Column(String(3), default="HUF")
    payment_methods = Column(JSON, default=list)
    
    # Booking and Availability
    is_bookable = Column(Boolean, default=True)
    requires_approval = Column(Boolean, default=False)
    advance_booking_days = Column(Integer, default=30)
    min_booking_duration = Column(Integer, default=60)  # minutes
    max_booking_duration = Column(Integer, default=480)  # minutes
    
    # Operating Hours
    operating_hours = Column(JSON, default=lambda: {
        "monday": {"open": "06:00", "close": "22:00"},
        "tuesday": {"open": "06:00", "close": "22:00"},
        "wednesday": {"open": "06:00", "close": "22:00"},
        "thursday": {"open": "06:00", "close": "22:00"},
        "friday": {"open": "06:00", "close": "22:00"},
        "saturday": {"open": "08:00", "close": "20:00"},
        "sunday": {"open": "08:00", "close": "20:00"}
    })
    
    # Quality and Rating
    rating = Column(Float, default=4.0)
    rating_count = Column(Integer, default=0)
    quality_score = Column(Float, default=4.0)
    
    # Media and Images
    image_url = Column(String(255), nullable=True)
    images = Column(JSON, default=list)  # List of image URLs
    video_url = Column(String(255), nullable=True)
    
    # Contact Information
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    manager_name = Column(String(100), nullable=True)
    
    # Statistics and Analytics
    total_bookings = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    popularity_score = Column(Float, default=0.0)
    utilization_rate = Column(Float, default=0.0)
    
    # Frontend Compatibility Fields
    available_slots = Column(JSON, default=list)  # For frontend compatibility
    
    # Status and Metadata
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    verification_date = Column(DateTime, nullable=True)
    
    # Audit Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # ✅ JAVÍTOTT: Tournament Relationship with explicit foreign_keys
    tournaments = relationship("Tournament", foreign_keys="Tournament.location_id", back_populates="location", cascade="all, delete-orphan")
    game_sessions = relationship("GameSession", back_populates="location")
    game_results = relationship("GameResult", back_populates="location")
    
    # ⚠️ WEATHER RELATIONSHIPS TEMPORARILY DISABLED
    # Uncomment when weather models are fixed:
    # current_weather = relationship("LocationWeather", back_populates="location", uselist=False)
    # weather_forecasts = relationship("WeatherForecast", back_populates="location")
    # weather_alerts = relationship("WeatherAlert", back_populates="location")
    # game_weather_suitability = relationship("GameWeatherSuitability", back_populates="location")
    
    def __repr__(self):
        return f"<Location(id={self.id}, name='{self.name}', city='{self.city}')>"

    @property
    def is_operating_now(self) -> bool:
        """Check if location is currently operating"""
        if not self.is_active or self.status != LocationStatus.ACTIVE:
            return False
        
        now = datetime.now()
        weekday = now.strftime("%A").lower()
        current_time = now.strftime("%H:%M")
        
        hours = self.operating_hours.get(weekday, {})
        if not hours:
            return False
            
        return hours.get("open", "00:00") <= current_time <= hours.get("close", "23:59")

    @property
    def average_rating(self) -> float:
        """Get average rating or default"""
        return self.rating or 4.0

    def update_rating(self, new_rating: float):
        """Update location rating with new rating"""
        if self.rating_count == 0:
            self.rating = new_rating
            self.rating_count = 1
        else:
            total_rating = self.rating * self.rating_count
            self.rating_count += 1
            self.rating = (total_rating + new_rating) / self.rating_count

    def is_available_at(self, datetime_obj: datetime) -> bool:
        """Check if location is available at specific datetime"""
        if not self.is_active or self.status != LocationStatus.ACTIVE:
            return False
        
        weekday = datetime_obj.strftime("%A").lower()
        time_str = datetime_obj.strftime("%H:%M")
        
        hours = self.operating_hours.get(weekday, {})
        if not hours:
            return False
            
        return hours.get("open", "00:00") <= time_str <= hours.get("close", "23:59")

    def get_available_hours(self, date: datetime) -> List[str]:
        """Get list of available time slots for a specific date"""
        if not self.is_available_at(date):
            return []
        
        weekday = date.strftime("%A").lower()
        hours = self.operating_hours.get(weekday, {})
        
        if not hours:
            return []
        
        # Generate hourly slots between open and close
        available_hours = []
        start_hour = int(hours.get("open", "06:00").split(":")[0])
        end_hour = int(hours.get("close", "22:00").split(":")[0])
        
        for hour in range(start_hour, end_hour):
            available_hours.append(f"{hour:02d}:00")
        
        return available_hours

# === GAME DEFINITION MODEL ===

class GameDefinition(Base):
    """
    Game type definitions with comprehensive configuration
    """
    __tablename__ = "game_definitions"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String(20), unique=True, index=True, nullable=False)  # "GAME1", "GAME2", etc.
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Game Configuration
    min_players = Column(Integer, default=1)
    max_players = Column(Integer, default=1)
    duration_minutes = Column(Integer, default=60)
    difficulty_level = Column(Integer, default=1)  # 1-5 scale
    
    # Scoring and Performance
    max_possible_score = Column(Integer, default=100)
    scoring_system = Column(JSON, default=dict)
    performance_metrics = Column(JSON, default=list)
    
    # Requirements and Restrictions
    min_level_required = Column(Integer, default=1)
    equipment_required = Column(JSON, default=list)
    space_requirements = Column(JSON, default=dict)
    weather_dependent = Column(Boolean, default=True)
    
    # Credit System
    base_credit_cost = Column(Integer, default=1)
    premium_multiplier = Column(Float, default=1.0)
    
    # Game Rules and Instructions
    rules = Column(JSON, default=dict)
    instructions = Column(Text, nullable=True)
    tips = Column(JSON, default=list)
    
    # Media and Resources
    thumbnail_url = Column(String(255), nullable=True)
    video_tutorial_url = Column(String(255), nullable=True)
    
    # Status and Metadata
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    category = Column(String(50), default="training")
    tags = Column(JSON, default=list)
    
    # Statistics
    total_plays = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    average_duration = Column(Integer, default=0)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    game_sessions = relationship("GameSession", back_populates="game_definition")
    
    def __repr__(self):
        return f"<GameDefinition(id='{self.game_id}', name='{self.name}')>"

# === GAME SESSION MODEL ===

class GameSession(Base):
    """
    Individual game session tracking with comprehensive data
    """
    __tablename__ = "game_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Game Information
    game_definition_id = Column(Integer, ForeignKey("game_definitions.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    
    # User and Participants
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    participants = Column(JSON, default=list)  # List of user IDs
    max_participants = Column(Integer, default=1)
    
    # Timing
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Status and Results
    status = Column(Enum(GameSessionStatus), default=GameSessionStatus.SCHEDULED)
    completion_percentage = Column(Float, default=0.0)
    
    # Scoring and Performance
    final_score = Column(Integer, nullable=True)
    performance_data = Column(JSON, default=dict)
    achievements_earned = Column(JSON, default=list)
    
    # Cost and Credits
    cost_credits = Column(Integer, default=1)
    refund_amount = Column(Integer, default=0)
    refund_reason = Column(String(100), nullable=True)
    
    # Session Data
    session_data = Column(JSON, default=dict)  # Game-specific data
    notes = Column(Text, nullable=True)
    weather_conditions = Column(JSON, default=dict)
    
    # Quality and Feedback
    session_rating = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    technical_issues = Column(JSON, default=list)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ✅ JAVÍTOTT: Relationships
    location = relationship("Location", back_populates="game_sessions")
    game_definition = relationship("GameDefinition", back_populates="game_sessions")
    game_results_records = relationship("GameResult", back_populates="game_session")
    
    def __repr__(self):
        return f"<GameSession(id='{self.session_id}', game={self.game_definition_id}, user={self.user_id})>"

    @property
    def is_active(self) -> bool:
        """Check if session is currently active"""
        return self.status in [GameSessionStatus.SCHEDULED, GameSessionStatus.CONFIRMED, GameSessionStatus.IN_PROGRESS]

    @property
    def is_completed(self) -> bool:
        """Check if session is completed"""
        return self.status == GameSessionStatus.COMPLETED

    @property
    def can_be_cancelled(self) -> bool:
        """Check if session can be cancelled"""
        if self.status in [GameSessionStatus.COMPLETED, GameSessionStatus.CANCELLED]:
            return False
        
        # Allow cancellation up to 2 hours before scheduled start
        if self.scheduled_start:
            time_until_start = self.scheduled_start - datetime.utcnow()
            return time_until_start > timedelta(hours=2)
        
        return True

# === PYDANTIC RESPONSE MODELS ===

class LocationResponse(BaseModel):
    id: int
    name: str
    address: str
    city: Optional[str] = None
    capacity: int
    price_per_hour: float
    rating: float
    amenities: List[str] = []
    available_slots: List[str] = []
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True

class GameDefinitionResponse(BaseModel):
    id: int
    game_id: str
    name: str
    description: Optional[str] = None
    min_players: int
    max_players: int
    duration_minutes: int
    difficulty_level: int
    max_possible_score: int
    base_credit_cost: int

    class Config:
        from_attributes = True