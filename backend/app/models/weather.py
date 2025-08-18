# === backend/app/models/weather.py ===
# Weather Models for LFA Legacy GO - ÚJRA ENGEDÉLYEZETT VERZIÓ
# Egyszerűsített modellek a relationship konfliktusok elkerülésére

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Session
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from enum import Enum
import logging

from ..database import Base

logger = logging.getLogger(__name__)

# === ENUMS ===

class WeatherCondition(str, Enum):
    """Weather condition types"""
    CLEAR = "clear"
    PARTLY_CLOUDY = "partly_cloudy"
    CLOUDY = "cloudy"
    OVERCAST = "overcast"
    LIGHT_RAIN = "light_rain"
    RAIN = "rain"
    HEAVY_RAIN = "heavy_rain"
    SNOW = "snow"
    FOG = "fog"
    STORM = "storm"

class WeatherSeverity(str, Enum):
    """Weather severity levels"""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    EXTREME = "extreme"

# === MODELS ===

class LocationWeather(Base):
    """Current weather conditions for locations"""
    __tablename__ = "location_weather"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, index=True)  # Soft reference to avoid FK conflicts
    temperature = Column(Float)  # Celsius
    feels_like = Column(Float)  # Feels like temperature
    condition = Column(String(50))  # WeatherCondition enum value
    description = Column(String(200))
    humidity = Column(Integer)  # Percentage
    wind_speed = Column(Float)  # m/s
    wind_direction = Column(Integer)  # Degrees
    pressure = Column(Float)  # hPa
    visibility = Column(Float)  # km
    uv_index = Column(Float)
    precipitation = Column(Float, default=0.0)  # mm/h
    severity = Column(String(20), default="low")  # WeatherSeverity enum value
    is_game_suitable = Column(Boolean, default=True)
    
    # Metadata
    data_source = Column(String(100), default="mock_service")
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "location_id": self.location_id,
            "temperature": self.temperature,
            "feels_like": self.feels_like,
            "condition": self.condition,
            "description": self.description,
            "humidity": self.humidity,
            "wind_speed": self.wind_speed,
            "wind_direction": self.wind_direction,
            "pressure": self.pressure,
            "visibility": self.visibility,
            "uv_index": self.uv_index,
            "precipitation": self.precipitation,
            "severity": self.severity,
            "is_game_suitable": self.is_game_suitable,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None
        }

class WeatherForecast(Base):
    """Weather forecast data"""
    __tablename__ = "weather_forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, index=True)  # Soft reference
    forecast_time = Column(DateTime, index=True)
    temperature = Column(Float)
    condition = Column(String(50))
    description = Column(String(200))
    precipitation_chance = Column(Integer)  # Percentage
    wind_speed = Column(Float)
    humidity = Column(Integer)
    
    # Forecast metadata
    forecast_type = Column(String(20), default="hourly")  # hourly, daily
    hours_ahead = Column(Integer)
    confidence = Column(Float, default=0.8)  # 0-1 scale
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "location_id": self.location_id,
            "forecast_time": self.forecast_time.isoformat() if self.forecast_time else None,
            "temperature": self.temperature,
            "condition": self.condition,
            "description": self.description,
            "precipitation_chance": self.precipitation_chance,
            "wind_speed": self.wind_speed,
            "humidity": self.humidity,
            "forecast_type": self.forecast_type,
            "hours_ahead": self.hours_ahead,
            "confidence": self.confidence
        }

class WeatherAlert(Base):
    """Weather alerts and warnings"""
    __tablename__ = "weather_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(100), unique=True, index=True)  # External alert ID
    alert_type = Column(String(50))  # wind, rain, temperature, storm, etc.
    severity = Column(String(20))  # WeatherSeverity enum value
    title = Column(String(200))
    description = Column(Text)
    
    # Timing
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    issued_at = Column(DateTime, default=datetime.utcnow)
    
    # Location targeting
    affected_locations = Column(JSON)  # List of location IDs
    geographic_area = Column(String(200))  # Human-readable area description
    
    # Status
    is_active = Column(Boolean, default=True)
    is_automated = Column(Boolean, default=True)
    created_by = Column(Integer, nullable=True)  # User ID if manually created
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "alert_id": self.alert_id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "issued_at": self.issued_at.isoformat() if self.issued_at else None,
            "affected_locations": self.affected_locations,
            "geographic_area": self.geographic_area,
            "is_active": self.is_active,
            "is_automated": self.is_automated
        }

class GameWeatherSuitability(Base):
    """Game-specific weather suitability rules"""
    __tablename__ = "game_weather_suitability"
    
    id = Column(Integer, primary_key=True, index=True)
    game_type = Column(String(50), unique=True, index=True)  # GAME1, GAME2, GAME3
    
    # Temperature limits (Celsius)
    min_temperature = Column(Float, default=-10.0)
    max_temperature = Column(Float, default=35.0)
    
    # Wind limits (m/s)
    max_wind_speed = Column(Float, default=15.0)
    
    # Precipitation limits (mm/h)
    max_precipitation = Column(Float, default=2.0)
    
    # Visibility limits (km)
    min_visibility = Column(Float, default=1.0)
    
    # Condition rules
    allowed_conditions = Column(JSON)  # List of allowed WeatherCondition values
    blocked_conditions = Column(JSON)  # List of blocked WeatherCondition values
    
    # Game-specific settings
    requires_shelter = Column(Boolean, default=False)
    indoor_alternative = Column(Boolean, default=False)
    weather_dependent = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "game_type": self.game_type,
            "min_temperature": self.min_temperature,
            "max_temperature": self.max_temperature,
            "max_wind_speed": self.max_wind_speed,
            "max_precipitation": self.max_precipitation,
            "min_visibility": self.min_visibility,
            "allowed_conditions": self.allowed_conditions,
            "blocked_conditions": self.blocked_conditions,
            "requires_shelter": self.requires_shelter,
            "indoor_alternative": self.indoor_alternative,
            "weather_dependent": self.weather_dependent
        }

# === INITIALIZATION FUNCTIONS ===

def initialize_game_weather_suitability(db: Session):
    """Initialize default game weather suitability rules"""
    
    default_rules = [
        {
            "game_type": "GAME1",  # Pontossági Célzás
            "min_temperature": -5.0,
            "max_temperature": 30.0,
            "max_wind_speed": 8.0,
            "max_precipitation": 1.0,
            "min_visibility": 5.0,
            "allowed_conditions": ["clear", "partly_cloudy", "cloudy"],
            "blocked_conditions": ["rain", "heavy_rain", "snow", "storm"],
            "requires_shelter": False,
            "indoor_alternative": True,
            "weather_dependent": True
        },
        {
            "game_type": "GAME2",  # Gyorsasági Slalom
            "min_temperature": 0.0,
            "max_temperature": 35.0,
            "max_wind_speed": 12.0,
            "max_precipitation": 2.0,
            "min_visibility": 8.0,
            "allowed_conditions": ["clear", "partly_cloudy", "cloudy", "light_rain"],
            "blocked_conditions": ["heavy_rain", "snow", "storm"],
            "requires_shelter": False,
            "indoor_alternative": False,
            "weather_dependent": True
        },
        {
            "game_type": "GAME3",  # 1v1 Technikai Duel
            "min_temperature": -2.0,
            "max_temperature": 32.0,
            "max_wind_speed": 10.0,
            "max_precipitation": 1.5,
            "min_visibility": 10.0,
            "allowed_conditions": ["clear", "partly_cloudy", "cloudy"],
            "blocked_conditions": ["rain", "heavy_rain", "snow", "storm", "fog"],
            "requires_shelter": False,
            "indoor_alternative": True,
            "weather_dependent": True
        }
    ]
    
    for rule_data in default_rules:
        # Check if rule already exists
        existing_rule = db.query(GameWeatherSuitability).filter(
            GameWeatherSuitability.game_type == rule_data["game_type"]
        ).first()
        
        if not existing_rule:
            rule = GameWeatherSuitability(**rule_data)
            db.add(rule)
    
    try:
        db.commit()
        logger.info("✅ Game weather suitability rules initialized")
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to initialize weather rules: {e}")
        raise

def create_sample_weather_data(db: Session, location_ids: List[int]):
    """Create sample weather data for testing"""
    
    import random
    from datetime import datetime, timedelta
    
    conditions = [
        ("clear", "Clear sky"),
        ("partly_cloudy", "Partly cloudy"),
        ("cloudy", "Cloudy"),
        ("light_rain", "Light rain"),
        ("overcast", "Overcast")
    ]
    
    for location_id in location_ids:
        # Create current weather
        condition, description = random.choice(conditions)
        
        current_weather = LocationWeather(
            location_id=location_id,
            temperature=round(random.uniform(5, 25), 1),
            feels_like=round(random.uniform(3, 27), 1),
            condition=condition,
            description=description,
            humidity=random.randint(40, 80),
            wind_speed=round(random.uniform(0, 10), 1),
            wind_direction=random.randint(0, 360),
            pressure=round(random.uniform(1000, 1020), 1),
            visibility=round(random.uniform(5, 15), 1),
            uv_index=round(random.uniform(0, 8), 1),
            precipitation=0.0 if condition not in ["light_rain", "rain"] else round(random.uniform(0.1, 2.0), 1),
            severity="low",
            is_game_suitable=condition not in ["rain", "heavy_rain", "storm"]
        )
        
        # Remove existing weather for this location
        db.query(LocationWeather).filter(LocationWeather.location_id == location_id).delete()
        db.add(current_weather)
        
        # Create forecast data (next 24 hours)
        base_time = datetime.utcnow()
        for hour in range(1, 25):
            forecast_time = base_time + timedelta(hours=hour)
            condition, description = random.choice(conditions)
            
            forecast = WeatherForecast(
                location_id=location_id,
                forecast_time=forecast_time,
                temperature=round(random.uniform(5, 25), 1),
                condition=condition,
                description=description,
                precipitation_chance=random.randint(0, 60),
                wind_speed=round(random.uniform(0, 10), 1),
                humidity=random.randint(40, 80),
                forecast_type="hourly",
                hours_ahead=hour,
                confidence=round(random.uniform(0.7, 0.95), 2)
            )
            
            db.add(forecast)
    
    try:
        db.commit()
        logger.info(f"✅ Sample weather data created for {len(location_ids)} locations")
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to create sample weather data: {e}")
        raise

# === UTILITY FUNCTIONS ===

def check_game_weather_suitability(
    weather: LocationWeather, 
    game_type: str, 
    db: Session
) -> Dict[str, Any]:
    """Check if current weather is suitable for a specific game type"""
    
    # Get game rules
    rules = db.query(GameWeatherSuitability).filter(
        GameWeatherSuitability.game_type == game_type
    ).first()
    
    if not rules:
        return {
            "is_suitable": False,
            "reason": f"No weather rules found for game type: {game_type}",
            "rules_available": False
        }
    
    if not rules.weather_dependent:
        return {
            "is_suitable": True,
            "reason": "Game is not weather dependent",
            "rules_available": True
        }
    
    # Check each condition
    issues = []
    
    # Temperature check
    if weather.temperature < rules.min_temperature:
        issues.append(f"Temperature too low ({weather.temperature}°C < {rules.min_temperature}°C)")
    elif weather.temperature > rules.max_temperature:
        issues.append(f"Temperature too high ({weather.temperature}°C > {rules.max_temperature}°C)")
    
    # Wind check
    if weather.wind_speed > rules.max_wind_speed:
        issues.append(f"Wind too strong ({weather.wind_speed} m/s > {rules.max_wind_speed} m/s)")
    
    # Precipitation check
    if weather.precipitation > rules.max_precipitation:
        issues.append(f"Too much precipitation ({weather.precipitation} mm/h > {rules.max_precipitation} mm/h)")
    
    # Visibility check
    if weather.visibility < rules.min_visibility:
        issues.append(f"Visibility too low ({weather.visibility} km < {rules.min_visibility} km)")
    
    # Condition check
    if rules.blocked_conditions and weather.condition in rules.blocked_conditions:
        issues.append(f"Weather condition '{weather.condition}' is blocked for this game")
    
    if rules.allowed_conditions and weather.condition not in rules.allowed_conditions:
        issues.append(f"Weather condition '{weather.condition}' is not allowed for this game")
    
    is_suitable = len(issues) == 0
    reason = "Weather conditions are suitable" if is_suitable else "; ".join(issues)
    
    return {
        "is_suitable": is_suitable,
        "reason": reason,
        "rules_available": True,
        "issues_count": len(issues),
        "indoor_alternative": rules.indoor_alternative if not is_suitable else None
    }

logger.info("✅ Weather models re-enabled and initialized")