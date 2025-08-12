# === backend/app/models/location.py ===
# Location and Game Session Models for LFA Legacy GO - JAVÍTOTT VERZIÓ
# Enhanced location management with weather integration and comprehensive booking system

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

# === LOCATION MODEL ===

class Location(Base):
    """
    Enhanced location model with weather integration and comprehensive facilities management
    """
    __tablename__ = "locations"
    
    # Basic Information
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False, index=True)
    address = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Geographic Information
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, nullable=True)  # Meters above sea level
    timezone = Column(String(50), default="Europe/Budapest")
    
    # Location Characteristics
    location_type = Column(Enum(LocationType), default=LocationType.OUTDOOR)
    capacity = Column(Integer, nullable=False)
    area_sqm = Column(Float, nullable=True)  # Square meters
    
    # Facilities and Features
    facilities = Column(JSON, default=lambda: {
        "parking": False,
        "restrooms": False,
        "changing_rooms": False,
        "water_fountain": False,
        "first_aid": False,
        "lighting": False,
        "covered_area": False,
        "equipment_storage": False,
        "spectator_seating": False,
        "accessibility": False
    })
    
    # Weather Protection
    weather_protected = Column(Boolean, default=False)
    shelter_available = Column(Boolean, default=False)
    drainage_quality = Column(String(20), default="good")  # "poor", "fair", "good", "excellent"
    
    # Operational Information
    status = Column(Enum(LocationStatus), default=LocationStatus.ACTIVE)
    operating_hours = Column(JSON, default=lambda: {
        "monday": {"open": "08:00", "close": "20:00"},
        "tuesday": {"open": "08:00", "close": "20:00"},
        "wednesday": {"open": "08:00", "close": "20:00"},
        "thursday": {"open": "08:00", "close": "20:00"},
        "friday": {"open": "08:00", "close": "20:00"},
        "saturday": {"open": "09:00", "close": "18:00"},
        "sunday": {"open": "09:00", "close": "18:00"}
    })
    
    # Pricing and Access
    base_cost_per_hour = Column(Float, default=0.0)
    peak_hour_multiplier = Column(Float, default=1.5)
    requires_booking = Column(Boolean, default=True)
    advance_booking_days = Column(Integer, default=7)
    
    # Equipment and Games Available
    available_games = Column(JSON, default=lambda: ["GAME1", "GAME2", "GAME3"])
    equipment_available = Column(JSON, default=lambda: {
        "footballs": 10,
        "cones": 20,
        "goals": 2,
        "bibs": 20
    })
    
    # Maintenance and Safety
    last_maintenance = Column(DateTime, nullable=True)
    next_maintenance = Column(DateTime, nullable=True)
    safety_rating = Column(Float, default=5.0)  # 1-5 scale
    safety_notes = Column(Text, nullable=True)
    
    # Contact Information
    contact_person = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(100), nullable=True)
    website = Column(String(200), nullable=True)
    
    # Additional Information
    special_requirements = Column(JSON, default=lambda: [])
    restrictions = Column(JSON, default=lambda: [])
    additional_info = Column(Text, nullable=True)
    
    # Statistics
    total_bookings = Column(Integer, default=0)
    total_hours_booked = Column(Float, default=0.0)
    average_rating = Column(Float, default=5.0)
    rating_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # === RELATIONSHIPS - JAVÍTOTT VERZIÓ overlaps paraméterekkel ===
    
    # Game sessions
    game_sessions = relationship("GameSession", back_populates="location", cascade="all, delete-orphan")
    
    # Weather relationships - JAVÍTOTT VERZIÓ overlaps paraméterekkel
    current_weather = relationship("LocationWeather", back_populates="location")
    weather_forecasts = relationship("WeatherForecast", back_populates="location", overlaps="location")
    weather_alerts = relationship("WeatherAlert", back_populates="location", overlaps="location")
    
    # Tournament relationships
    tournaments = relationship("Tournament", back_populates="location")
    
    def __repr__(self):
        return f"<Location(id='{self.location_id}', name='{self.name}', type='{self.location_type.value}')>"
    
    # === PROPERTY METHODS ===
    
    @property
    def is_operational(self) -> bool:
        """Check if location is currently operational"""
        return self.status == LocationStatus.ACTIVE
    
    @property
    def is_weather_dependent(self) -> bool:
        """Check if location is weather dependent"""
        return self.location_type == LocationType.OUTDOOR and not self.weather_protected
    
    @property
    def coordinates(self) -> tuple:
        """Get coordinates as tuple"""
        return (self.latitude, self.longitude)
    
    @property
    def capacity_utilization(self) -> float:
        """Calculate current capacity utilization (mock calculation)"""
        # This would need real-time booking data
        return 0.0  # Placeholder
    
    # === OPERATIONAL METHODS ===
    
    def is_open_at(self, check_time: datetime) -> bool:
        """Check if location is open at specified time"""
        if not self.is_operational:
            return False
        
        weekday = check_time.strftime("%A").lower()
        hours = self.operating_hours.get(weekday, {})
        
        if not hours:
            return False
        
        open_time = datetime.strptime(hours["open"], "%H:%M").time()
        close_time = datetime.strptime(hours["close"], "%H:%M").time()
        check_time_only = check_time.time()
        
        return open_time <= check_time_only <= close_time
    
    def get_availability_for_date(self, target_date: datetime) -> List[Dict]:
        """Get availability slots for a specific date"""
        if not self.is_operational:
            return []
        
        weekday = target_date.strftime("%A").lower()
        hours = self.operating_hours.get(weekday, {})
        
        if not hours:
            return []
        
        # Generate hourly slots
        slots = []
        open_hour = int(hours["open"].split(":")[0])
        close_hour = int(hours["close"].split(":")[0])
        
        for hour in range(open_hour, close_hour):
            slot_time = target_date.replace(hour=hour, minute=0, second=0, microsecond=0)
            slots.append({
                "time": slot_time,
                "available": True,  # Would check against bookings
                "cost": self.calculate_cost_for_hour(hour),
                "is_peak": self.is_peak_hour(hour)
            })
        
        return slots
    
    def calculate_cost_for_hour(self, hour: int) -> float:
        """Calculate cost for specific hour"""
        base_cost = self.base_cost_per_hour
        if self.is_peak_hour(hour):
            return base_cost * self.peak_hour_multiplier
        return base_cost
    
    def is_peak_hour(self, hour: int) -> bool:
        """Check if hour is peak time"""
        # Peak hours: 17-20 on weekdays, 10-16 on weekends
        # This is a simple implementation
        return 17 <= hour <= 20
    
    def supports_game_type(self, game_type: str) -> bool:
        """Check if location supports specific game type"""
        return game_type in self.available_games
    
    def get_weather_suitability(self) -> Dict:
        """Get current weather suitability for games"""
        # This would integrate with weather data
        if not self.is_weather_dependent:
            return {"suitable": True, "reason": "Indoor/protected location"}
        
        # Would check current weather conditions
        return {"suitable": True, "reason": "Weather conditions acceptable"}
    
    def update_statistics(self, booking_hours: float, rating: Optional[float] = None):
        """Update location statistics"""
        self.total_bookings += 1
        self.total_hours_booked += booking_hours
        
        if rating is not None:
            total_rating_points = self.average_rating * self.rating_count
            self.rating_count += 1
            self.average_rating = (total_rating_points + rating) / self.rating_count

# === GAME DEFINITION MODEL ===

class GameDefinition(Base):
    """
    Game type definitions with rules and requirements
    """
    __tablename__ = "game_definitions"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String(20), unique=True, index=True, nullable=False)  # "GAME1", "GAME2", etc.
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    
    # Game Characteristics
    min_players = Column(Integer, default=1)
    max_players = Column(Integer, default=1)
    duration_minutes = Column(Integer, nullable=False)
    difficulty_level = Column(Integer, default=3)  # 1-5 scale
    skill_categories = Column(JSON, default=lambda: ["accuracy", "power", "speed"])
    
    # Requirements
    equipment_required = Column(JSON, default=lambda: ["football", "goals"])
    space_requirements = Column(JSON, default=lambda: {
        "min_area_sqm": 100,
        "min_length": 20,
        "min_width": 15
    })
    
    # Weather Requirements
    weather_dependent = Column(Boolean, default=True)
    min_temperature = Column(Float, default=5.0)
    max_temperature = Column(Float, default=35.0)
    max_wind_speed = Column(Float, default=15.0)
    rain_compatible = Column(Boolean, default=False)
    
    # Scoring and Rewards
    base_xp_reward = Column(Integer, default=10)
    base_credit_cost = Column(Integer, default=5)
    max_possible_score = Column(Integer, default=100)
    scoring_criteria = Column(JSON, default=lambda: {
        "accuracy": 40,
        "speed": 30,
        "technique": 30
    })
    
    # Game Rules
    rules = Column(JSON, default=lambda: [])
    instructions = Column(Text, nullable=True)
    tips = Column(JSON, default=lambda: [])
    
    # Availability
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    min_user_level = Column(Integer, default=1)
    
    # Statistics
    total_plays = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    average_duration = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    game_sessions = relationship("GameSession", back_populates="game_definition")
    
    def __repr__(self):
        return f"<GameDefinition(id='{self.game_id}', name='{self.name}', difficulty={self.difficulty_level})>"
    
    def is_suitable_for_location(self, location: Location) -> bool:
        """Check if game is suitable for location"""
        # Check space requirements
        space_req = self.space_requirements
        if location.area_sqm and location.area_sqm < space_req.get("min_area_sqm", 0):
            return False
        
        # Check equipment availability
        for equipment in self.equipment_required:
            if equipment not in location.equipment_available:
                return False
        
        # Check game type support
        return location.supports_game_type(self.game_id)
    
    def calculate_cost_for_user(self, user_level: int, is_premium: bool) -> int:
        """Calculate game cost for specific user"""
        if is_premium and self.is_premium:
            return max(1, self.base_credit_cost // 2)  # 50% discount for premium
        return self.base_credit_cost

# === GAME SESSION MODEL ===

class GameSession(Base):
    """
    Individual game session with complete tracking
    """
    __tablename__ = "game_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Session Details
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    game_definition_id = Column(Integer, ForeignKey("game_definitions.id"), nullable=False)
    booked_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Scheduling
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    
    # Session Status
    status = Column(Enum(GameSessionStatus), default=GameSessionStatus.SCHEDULED)
    
    # Participants
    participants = Column(JSON, default=lambda: [])  # List of user IDs
    max_participants = Column(Integer, default=1)
    
    # Booking Information
    booking_time = Column(DateTime(timezone=True), server_default=func.now())
    total_cost = Column(Integer, nullable=False)  # In credits
    payment_status = Column(String(20), default="pending")
    
    # Game Results
    scores = Column(JSON, default=lambda: {})  # {user_id: score}
    game_data = Column(JSON, default=lambda: {})  # Game-specific data
    performance_metrics = Column(JSON, default=lambda: {})
    
    # Session Notes
    notes = Column(Text, nullable=True)
    issues = Column(JSON, default=lambda: [])
    rating = Column(Float, nullable=True)  # 1-5 scale
    feedback = Column(Text, nullable=True)
    
    # Weather Conditions
    weather_at_start = Column(JSON, nullable=True)
    weather_impact = Column(String(50), nullable=True)  # "none", "minor", "significant"
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    location = relationship("Location", back_populates="game_sessions")
    game_definition = relationship("GameDefinition", back_populates="game_sessions")
    booked_by = relationship("User", back_populates="bookings")
    
    def __repr__(self):
        return f"<GameSession(id='{self.session_id}', status='{self.status.value}', location_id={self.location_id})>"
    
    @property
    def duration_minutes(self) -> Optional[int]:
        """Calculate actual session duration"""
        if self.actual_start and self.actual_end:
            duration = self.actual_end - self.actual_start
            return int(duration.total_seconds() / 60)
        return None
    
    @property
    def is_completed(self) -> bool:
        """Check if session is completed"""
        return self.status == GameSessionStatus.COMPLETED
    
    @property
    def is_active(self) -> bool:
        """Check if session is currently active"""
        return self.status == GameSessionStatus.IN_PROGRESS
    
    @property
    def can_be_cancelled(self) -> bool:
        """Check if session can be cancelled"""
        if self.status in [GameSessionStatus.COMPLETED, GameSessionStatus.CANCELLED]:
            return False
        
        # Can cancel up to 1 hour before scheduled start
        return datetime.now() < self.scheduled_start - timedelta(hours=1)
    
    def start_session(self):
        """Start the game session"""
        self.status = GameSessionStatus.IN_PROGRESS
        self.actual_start = datetime.now()
    
    def complete_session(self, scores: Dict[int, int] = None, notes: str = None):
        """Complete the game session"""
        self.status = GameSessionStatus.COMPLETED
        self.actual_end = datetime.now()
        
        if scores:
            self.scores = scores
        
        if notes:
            self.notes = notes
    
    def cancel_session(self, reason: str = "User cancellation"):
        """Cancel the game session"""
        self.status = GameSessionStatus.CANCELLED
        
        if not self.issues:
            self.issues = []
        
        self.issues.append({
            "type": "cancellation",
            "reason": reason,
            "timestamp": datetime.now().isoformat()
        })

# === UTILITY FUNCTIONS ===

def create_default_locations(db: Session):
    """Create default locations for the system"""
    
    default_locations = [
        {
            "location_id": "BP_VAROSLIGET_01",
            "name": "Városliget Főbejárat",
            "address": "1146 Budapest, Állatkerti krt. 9-11",
            "latitude": 47.5138,
            "longitude": 19.0773,
            "capacity": 8,
            "location_type": LocationType.OUTDOOR,
            "available_games": ["GAME1", "GAME2", "GAME3"],
            "facilities": {
                "parking": True,
                "restrooms": True,
                "changing_rooms": False,
                "water_fountain": True,
                "first_aid": True,
                "lighting": True,
                "covered_area": False,
                "equipment_storage": True,
                "spectator_seating": True,
                "accessibility": True
            },
            "base_cost_per_hour": 15.0
        },
        {
            "location_id": "BP_MARGITSZIGET_01",
            "name": "Margitsziget Sportpálya",
            "address": "1138 Budapest, Margitsziget",
            "latitude": 47.5316,
            "longitude": 19.0439,
            "capacity": 12,
            "location_type": LocationType.OUTDOOR,
            "available_games": ["GAME1", "GAME2", "GAME3"],
            "facilities": {
                "parking": False,
                "restrooms": True,
                "changing_rooms": True,
                "water_fountain": True,
                "first_aid": True,
                "lighting": False,
                "covered_area": True,
                "equipment_storage": True,
                "spectator_seating": False,
                "accessibility": True
            },
            "base_cost_per_hour": 20.0
        },
        {
            "location_id": "BP_NEPLIGET_01",
            "name": "Népliget Sport Center",
            "address": "1095 Budapest, Könyves Kálmán krt. 21",
            "latitude": 47.4761,
            "longitude": 19.0977,
            "capacity": 16,
            "location_type": LocationType.SEMI_COVERED,
            "available_games": ["GAME1", "GAME2"],
            "facilities": {
                "parking": True,
                "restrooms": True,
                "changing_rooms": True,
                "water_fountain": True,
                "first_aid": True,
                "lighting": True,
                "covered_area": True,
                "equipment_storage": True,
                "spectator_seating": True,
                "accessibility": True
            },
            "base_cost_per_hour": 25.0,
            "weather_protected": True
        }
    ]
    
    for location_data in default_locations:
        existing = db.query(Location).filter(
            Location.location_id == location_data["location_id"]
        ).first()
        
        if not existing:
            location = Location(**location_data)
            db.add(location)
    
    db.commit()

def create_default_games(db: Session):
    """Create default game definitions"""
    
    default_games = [
        {
            "game_id": "GAME1",
            "name": "Football Skills Challenge",
            "description": "Complete football skills course with accuracy and speed challenges",
            "duration_minutes": 20,
            "difficulty_level": 3,
            "base_credit_cost": 8,
            "max_possible_score": 100,
            "equipment_required": ["football", "cones", "goals"],
            "space_requirements": {
                "min_area_sqm": 200,
                "min_length": 30,
                "min_width": 20
            }
        },
        {
            "game_id": "GAME2",
            "name": "Penalty Shootout",
            "description": "Classic penalty shootout challenge with precision scoring",
            "duration_minutes": 15,
            "difficulty_level": 2,
            "base_credit_cost": 6,
            "max_possible_score": 100,
            "equipment_required": ["football", "goals"],
            "space_requirements": {
                "min_area_sqm": 100,
                "min_length": 20,
                "min_width": 15
            }
        },
        {
            "game_id": "GAME3",
            "name": "Speed Challenge",
            "description": "Timed agility and speed course with obstacle navigation",
            "duration_minutes": 25,
            "difficulty_level": 4,
            "base_credit_cost": 10,
            "max_possible_score": 100,
            "equipment_required": ["cones", "agility_ladder", "hurdles"],
            "space_requirements": {
                "min_area_sqm": 300,
                "min_length": 40,
                "min_width": 25
            }
        }
    ]
    
    for game_data in default_games:
        existing = db.query(GameDefinition).filter(
            GameDefinition.game_id == game_data["game_id"]
        ).first()
        
        if not existing:
            game = GameDefinition(**game_data)
            db.add(game)
    
    db.commit()

# === PYDANTIC SCHEMAS ===

class LocationBase(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    capacity: int
    location_type: LocationType

class LocationCreate(LocationBase):
    """Schema for creating a location"""
    description: Optional[str] = None
    area_sqm: Optional[float] = None
    facilities: Optional[Dict] = None
    weather_protected: bool = False
    shelter_available: bool = False
    operating_hours: Optional[Dict] = None
    base_cost_per_hour: float = 0.0
    available_games: List[str] = ["GAME1", "GAME2", "GAME3"]

class LocationUpdate(BaseModel):
    """Schema for updating a location"""
    name: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    facilities: Optional[Dict] = None
    operating_hours: Optional[Dict] = None
    base_cost_per_hour: Optional[float] = None
    status: Optional[LocationStatus] = None

class LocationResponse(LocationBase):
    id: int
    location_id: str
    status: LocationStatus
    facilities: Dict
    available_games: List[str]
    base_cost_per_hour: float
    weather_protected: bool
    average_rating: float
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class LocationDetailResponse(LocationResponse):
    """Extended location details"""
    area_sqm: Optional[float]
    operating_hours: Dict
    equipment_available: Dict
    total_bookings: int
    total_hours_booked: float
    safety_rating: float
    contact_person: Optional[str]
    contact_phone: Optional[str]
    
    class Config:
        from_attributes = True

class GameDefinitionCreate(BaseModel):
    """Schema for creating a game definition"""
    game_id: str = Field(..., pattern="^GAME[1-9]$")
    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    min_players: int = Field(default=1, ge=1, le=10)
    max_players: int = Field(default=1, ge=1, le=10)
    duration_minutes: int = Field(..., ge=5, le=120)
    difficulty_level: int = Field(default=3, ge=1, le=5)
    base_credit_cost: int = Field(default=5, ge=0, le=100)
    max_possible_score: int = Field(default=100, ge=1, le=1000)
    equipment_required: List[str] = []
    space_requirements: Optional[Dict] = None
    weather_dependent: bool = True
    is_active: bool = True
    is_premium: bool = False
    min_user_level: int = Field(default=1, ge=1, le=100)

class GameDefinitionUpdate(BaseModel):
    """Schema for updating a game definition"""
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    difficulty_level: Optional[int] = None
    base_credit_cost: Optional[int] = None
    is_active: Optional[bool] = None
    is_premium: Optional[bool] = None

class GameDefinitionResponse(BaseModel):
    """Schema for game definition response"""
    id: int
    game_id: str
    name: str
    description: str
    min_players: int
    max_players: int
    duration_minutes: int
    difficulty_level: int
    base_credit_cost: int
    max_possible_score: int
    is_active: bool
    
    class Config:
        from_attributes = True

class GameSessionCreate(BaseModel):
    """Schema for creating a game session"""
    location_id: int
    game_definition_id: int
    scheduled_start: datetime
    scheduled_end: Optional[datetime] = None
    participants: List[int] = []
    max_participants: int = Field(default=1, ge=1, le=10)
    notes: Optional[str] = None

class GameSessionUpdate(BaseModel):
    """Schema for updating a game session"""
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    status: Optional[GameSessionStatus] = None
    notes: Optional[str] = None
    scores: Optional[Dict] = None

class GameSessionRequest(BaseModel):
    """Schema for game session booking request"""
    location_id: int
    game_definition_id: int
    scheduled_start: datetime
    participants: Optional[List[int]] = []
    notes: Optional[str] = None

class GameSessionResponse(BaseModel):
    id: int
    session_id: str
    location_name: str
    game_name: str
    scheduled_start: datetime
    scheduled_end: datetime
    status: GameSessionStatus
    total_cost: int
    participant_count: int
    
    class Config:
        from_attributes = True

class AvailabilitySlot(BaseModel):
    """Schema for availability time slot"""
    time: datetime
    available: bool
    cost: float
    is_peak: bool
    weather_suitable: bool = True

class LocationAvailabilityResponse(BaseModel):
    """Schema for location availability response"""
    location_id: int
    date: str
    slots: List[AvailabilitySlot]
    total_slots: int
    available_slots: int
    weather_warnings: List[str] = []