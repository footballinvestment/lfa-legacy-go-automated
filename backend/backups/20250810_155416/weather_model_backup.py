# === backend/app/models/weather.py ===
# Weather Integration Models for LFA Legacy GO - JAVÍTOTT VERZIÓ
# Complete weather system with forecasts, alerts, and game suitability analysis

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, JSON, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Session
from datetime import datetime, timedelta
from ..database import Base
from typing import Optional, Dict, List
from enum import Enum as PyEnum
from pydantic import BaseModel, validator

# === WEATHER ENUMS ===

class WeatherCondition(str, PyEnum):
    """Weather condition types"""
    CLEAR = "clear"
    PARTLY_CLOUDY = "partly_cloudy"
    CLOUDY = "cloudy"
    OVERCAST = "overcast"
    LIGHT_RAIN = "light_rain"
    MODERATE_RAIN = "moderate_rain"
    HEAVY_RAIN = "heavy_rain"
    DRIZZLE = "drizzle"
    THUNDERSTORM = "thunderstorm"
    SNOW = "snow"
    SLEET = "sleet"
    FOG = "fog"
    MIST = "mist"
    HAIL = "hail"
    WINDY = "windy"

class WeatherSeverity(str, PyEnum):
    """Weather severity levels"""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    EXTREME = "extreme"

# === WEATHER MODELS ===

class LocationWeather(Base):
    """
    Current weather conditions for specific locations
    """
    __tablename__ = "location_weather"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    
    # Basic Weather Data
    temperature = Column(Float, nullable=False)  # Celsius
    feels_like = Column(Float, nullable=False)   # Apparent temperature
    humidity = Column(Integer, nullable=False)   # Percentage 0-100
    pressure = Column(Float, nullable=False)      # hPa
    
    # Wind Information
    wind_speed = Column(Float, nullable=False)    # m/s
    wind_direction = Column(Integer, nullable=True)  # Degrees 0-360
    wind_gust = Column(Float, nullable=True)      # m/s
    
    # Visibility and Precipitation
    visibility = Column(Float, default=10.0)     # km
    precipitation = Column(Float, default=0.0)   # mm/h
    precipitation_probability = Column(Integer, default=0)  # Percentage
    
    # Weather Condition
    condition = Column(Enum(WeatherCondition), nullable=False)
    description = Column(String(100), nullable=False)
    weather_code = Column(Integer, nullable=True)  # API specific code
    
    # Additional Data
    uv_index = Column(Float, nullable=True)       # UV index 0-11+
    air_quality_index = Column(Integer, nullable=True)  # AQI
    
    # Weather Analysis
    severity = Column(Enum(WeatherSeverity), default=WeatherSeverity.LOW)
    is_game_suitable = Column(Boolean, default=True)
    suitability_reasons = Column(JSON, default=lambda: [])
    
    # Data Source
    data_source = Column(String(50), default="openweather")
    api_response = Column(JSON, nullable=True)  # Raw API response for debugging
    
    # Timestamps
    weather_time = Column(DateTime, nullable=False)  # When weather was recorded
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    location = relationship("Location", back_populates="current_weather")
    
    def __repr__(self):
        return f"<LocationWeather(location_id={self.location_id}, temp={self.temperature}°C, condition='{self.condition.value}')>"
    
    @property
    def temperature_fahrenheit(self) -> float:
        """Convert temperature to Fahrenheit"""
        return (self.temperature * 9/5) + 32
    
    @property
    def wind_speed_kmh(self) -> float:
        """Convert wind speed to km/h"""
        return self.wind_speed * 3.6
    
    @property
    def weather_emoji(self) -> str:
        """Get emoji representation of weather"""
        emoji_map = {
            WeatherCondition.CLEAR: "☀️",
            WeatherCondition.PARTLY_CLOUDY: "⛅",
            WeatherCondition.CLOUDY: "☁️",
            WeatherCondition.OVERCAST: "☁️",
            WeatherCondition.LIGHT_RAIN: "🌦️",
            WeatherCondition.MODERATE_RAIN: "🌧️",
            WeatherCondition.HEAVY_RAIN: "⛈️",
            WeatherCondition.DRIZZLE: "🌦️",
            WeatherCondition.THUNDERSTORM: "⛈️",
            WeatherCondition.SNOW: "❄️",
            WeatherCondition.SLEET: "🌨️",
            WeatherCondition.FOG: "🌫️",
            WeatherCondition.MIST: "🌫️",
            WeatherCondition.HAIL: "🌨️",
            WeatherCondition.WINDY: "💨"
        }
        return emoji_map.get(self.condition, "🌤️")
    
    def calculate_game_suitability(self, game_type: str = "GAME1") -> Dict:
        """Calculate game suitability based on weather conditions"""
        reasons = []
        suitable = True
        
        # Temperature checks
        if self.temperature < 0:
            suitable = False
            reasons.append("Temperature too low (freezing)")
        elif self.temperature > 35:
            suitable = False
            reasons.append("Temperature too high (extreme heat)")
        
        # Precipitation checks
        if self.precipitation > 2.0:
            suitable = False
            reasons.append("Heavy precipitation")
        elif self.precipitation > 0.5:
            reasons.append("Light precipitation - exercise caution")
        
        # Wind checks
        if self.wind_speed > 15:
            suitable = False
            reasons.append("Strong winds")
        elif self.wind_speed > 10:
            reasons.append("Moderate winds")
        
        # Visibility checks
        if self.visibility < 1.0:
            suitable = False
            reasons.append("Poor visibility")
        elif self.visibility < 5.0:
            reasons.append("Reduced visibility")
        
        # Severe weather conditions
        severe_conditions = [
            WeatherCondition.THUNDERSTORM,
            WeatherCondition.HEAVY_RAIN,
            WeatherCondition.HAIL
        ]
        if self.condition in severe_conditions:
            suitable = False
            reasons.append(f"Severe weather: {self.condition.value}")
        
        return {
            "suitable": suitable,
            "reasons": reasons,
            "recommendation": "safe" if suitable else "postpone"
        }

class WeatherForecast(Base):
    """
    Weather forecast data for locations
    """
    __tablename__ = "weather_forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    
    # Forecast Details
    forecast_time = Column(DateTime, nullable=False, index=True)
    forecast_hours = Column(Integer, nullable=False)  # Hours ahead (1, 3, 6, 12, 24, etc.)
    
    # Weather Data (same structure as current weather)
    temperature = Column(Float, nullable=False)
    feels_like = Column(Float, nullable=False)
    humidity = Column(Integer, nullable=False)
    pressure = Column(Float, nullable=False)
    wind_speed = Column(Float, nullable=False)
    wind_direction = Column(Integer, nullable=True)
    visibility = Column(Float, default=10.0)
    precipitation = Column(Float, default=0.0)
    precipitation_probability = Column(Integer, default=0)
    
    # Weather Condition
    condition = Column(Enum(WeatherCondition), nullable=False)
    description = Column(String(100), nullable=False)
    weather_code = Column(Integer, nullable=True)
    
    # Forecast Quality
    confidence_level = Column(Float, default=0.8)  # 0.0-1.0
    data_source = Column(String(50), default="openweather")
    
    # Game Planning
    is_game_suitable = Column(Boolean, default=True)
    suitability_score = Column(Float, default=1.0)  # 0.0-1.0
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    location = relationship("Location", back_populates="weather_forecasts")
    
    def __repr__(self):
        return f"<WeatherForecast(location_id={self.location_id}, forecast_time='{self.forecast_time}', temp={self.temperature}°C)>"
    
    @property
    def weather_emoji(self) -> str:
        """Get emoji representation of forecast weather"""
        emoji_map = {
            WeatherCondition.CLEAR: "☀️",
            WeatherCondition.PARTLY_CLOUDY: "⛅",
            WeatherCondition.CLOUDY: "☁️",
            WeatherCondition.OVERCAST: "☁️",
            WeatherCondition.LIGHT_RAIN: "🌦️",
            WeatherCondition.MODERATE_RAIN: "🌧️",
            WeatherCondition.HEAVY_RAIN: "⛈️",
            WeatherCondition.DRIZZLE: "🌦️",
            WeatherCondition.THUNDERSTORM: "⛈️",
            WeatherCondition.SNOW: "❄️",
            WeatherCondition.SLEET: "🌨️",
            WeatherCondition.FOG: "🌫️",
            WeatherCondition.MIST: "🌫️",
            WeatherCondition.HAIL: "🌨️",
            WeatherCondition.WINDY: "💨"
        }
        return emoji_map.get(self.condition, "🌤️")

class WeatherAlert(Base):
    """
    Weather alerts and warnings for locations
    """
    __tablename__ = "weather_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(100), unique=True, index=True, nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    
    # Alert Information
    alert_type = Column(String(50), nullable=False)  # "wind", "rain", "temperature", etc.
    severity = Column(Enum(WeatherSeverity), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    
    # Time Information
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    issued_time = Column(DateTime, nullable=False)
    
    # Source Information
    source = Column(String(100), nullable=False)
    source_url = Column(String(500), nullable=True)
    
    # Game Impact
    affects_gaming = Column(Boolean, default=True)
    recommended_action = Column(String(100), nullable=True)  # "cancel", "postpone", "indoor_only"
    
    # Alert Status
    is_active = Column(Boolean, default=True)
    is_acknowledged = Column(Boolean, default=False)
    acknowledgment_time = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime, nullable=True)  # HOZZÁADOTT MEZŐ
    
    # === RELATIONSHIPS - JAVÍTOTT VERZIÓ overlaps paraméterrel ===
    location = relationship("Location", back_populates="weather_alerts", overlaps="weather_alerts")
    
    def __repr__(self):
        return f"<WeatherAlert(location_id={self.location_id}, type='{self.alert_type}', severity='{self.severity.value}')>"
    
    @property
    def is_current(self) -> bool:
        """Check if alert is currently active"""
        now = datetime.now()
        return self.is_active and self.start_time <= now <= self.end_time
    
    @property
    def duration_hours(self) -> float:
        """Get alert duration in hours"""
        duration = self.end_time - self.start_time
        return duration.total_seconds() / 3600
    
    @property
    def time_until_start(self) -> Optional[timedelta]:
        """Get time until alert starts"""
        now = datetime.now()
        if now < self.start_time:
            return self.start_time - now
        return None
    
    @property
    def time_until_end(self) -> Optional[timedelta]:
        """Get time until alert ends"""
        now = datetime.now()
        if now < self.end_time:
            return self.end_time - now
        return None
    
    def get_severity_emoji(self) -> str:
        """Get emoji for alert severity"""
        emoji_map = {
            WeatherSeverity.LOW: "🟡",
            WeatherSeverity.MODERATE: "🟠",
            WeatherSeverity.HIGH: "🔴",
            WeatherSeverity.EXTREME: "🔴⚠️"
        }
        return emoji_map.get(self.severity, "ℹ️")

class GameWeatherSuitability(Base):
    """
    Game-specific weather suitability rules and thresholds
    """
    __tablename__ = "game_weather_suitability"
    
    id = Column(Integer, primary_key=True, index=True)
    game_type = Column(String(10), nullable=False, index=True)  # "GAME1", "GAME2", etc.
    
    # Temperature Thresholds
    min_temperature = Column(Float, default=0.0)   # Celsius
    max_temperature = Column(Float, default=35.0)  # Celsius
    optimal_temp_min = Column(Float, default=15.0)
    optimal_temp_max = Column(Float, default=25.0)
    
    # Wind Thresholds
    max_wind_speed = Column(Float, default=12.0)   # m/s
    optimal_wind_max = Column(Float, default=5.0)
    
    # Precipitation Thresholds
    max_precipitation = Column(Float, default=1.0)  # mm/h
    no_play_precipitation = Column(Float, default=5.0)
    
    # Visibility Thresholds
    min_visibility = Column(Float, default=1.0)    # km
    optimal_visibility_min = Column(Float, default=10.0)
    
    # Other Conditions
    allowed_conditions = Column(JSON, default=lambda: [
        "clear", "partly_cloudy", "cloudy", "light_rain", "drizzle"
    ])
    blocked_conditions = Column(JSON, default=lambda: [
        "thunderstorm", "heavy_rain", "hail", "snow"
    ])
    
    # Game-Specific Rules
    requires_shelter = Column(Boolean, default=False)
    indoor_alternative = Column(Boolean, default=False)
    weather_dependent = Column(Boolean, default=True)
    
    # Seasonal Adjustments
    seasonal_adjustments = Column(JSON, default=lambda: {})
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<GameWeatherSuitability(game_type='{self.game_type}', weather_dependent={self.weather_dependent})>"
    
    # 🚀 JAVÍTOTT: HIÁNYZÓ TO_DICT METÓDUS HOZZÁADVA
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "game_type": self.game_type,
            "min_temperature": self.min_temperature,
            "max_temperature": self.max_temperature,
            "optimal_temp_min": self.optimal_temp_min,
            "optimal_temp_max": self.optimal_temp_max,
            "max_wind_speed": self.max_wind_speed,
            "optimal_wind_max": self.optimal_wind_max,
            "max_precipitation": self.max_precipitation,
            "no_play_precipitation": self.no_play_precipitation,
            "min_visibility": self.min_visibility,
            "optimal_visibility_min": self.optimal_visibility_min,
            "requires_shelter": self.requires_shelter,
            "indoor_alternative": self.indoor_alternative,
            "weather_dependent": self.weather_dependent,
            "allowed_conditions": self.allowed_conditions,
            "blocked_conditions": self.blocked_conditions,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def evaluate_weather(self, weather: LocationWeather) -> Dict:
        """Evaluate weather suitability for this game type"""
        score = 1.0
        reasons = []
        suitable = True
        
        # Temperature evaluation
        if weather.temperature < self.min_temperature:
            suitable = False
            score = 0.0
            reasons.append(f"Temperature too low ({weather.temperature}°C < {self.min_temperature}°C)")
        elif weather.temperature > self.max_temperature:
            suitable = False
            score = 0.0
            reasons.append(f"Temperature too high ({weather.temperature}°C > {self.max_temperature}°C)")
        elif self.optimal_temp_min <= weather.temperature <= self.optimal_temp_max:
            score *= 1.0  # Optimal temperature
        else:
            # Sub-optimal but acceptable temperature
            temp_penalty = min(
                abs(weather.temperature - self.optimal_temp_min),
                abs(weather.temperature - self.optimal_temp_max)
            ) / 10.0
            score *= max(0.7, 1.0 - temp_penalty)
        
        # Wind evaluation
        if weather.wind_speed > self.max_wind_speed:
            suitable = False
            score = 0.0
            reasons.append(f"Wind too strong ({weather.wind_speed:.1f} m/s > {self.max_wind_speed} m/s)")
        elif weather.wind_speed > self.optimal_wind_max:
            wind_penalty = (weather.wind_speed - self.optimal_wind_max) / 20.0
            score *= max(0.6, 1.0 - wind_penalty)
            reasons.append("Moderate winds")
        
        # Precipitation evaluation
        if weather.precipitation > self.no_play_precipitation:
            suitable = False
            score = 0.0
            reasons.append(f"Heavy precipitation ({weather.precipitation:.1f} mm/h)")
        elif weather.precipitation > self.max_precipitation:
            precip_penalty = weather.precipitation / 10.0
            score *= max(0.3, 1.0 - precip_penalty)
            reasons.append("Light precipitation")
        
        # Visibility evaluation
        if weather.visibility < self.min_visibility:
            suitable = False
            score = 0.0
            reasons.append(f"Poor visibility ({weather.visibility:.1f} km)")
        elif weather.visibility < self.optimal_visibility_min:
            vis_penalty = (self.optimal_visibility_min - weather.visibility) / 20.0
            score *= max(0.7, 1.0 - vis_penalty)
        
        # Weather condition evaluation
        if weather.condition.value in self.blocked_conditions:
            suitable = False
            score = 0.0
            reasons.append(f"Blocked weather condition: {weather.condition.value}")
        elif weather.condition.value not in self.allowed_conditions:
            score *= 0.5
            reasons.append(f"Sub-optimal weather condition: {weather.condition.value}")
        
        return {
            "suitable": suitable,
            "score": round(score, 2),
            "reasons": reasons,
            "recommendation": self._get_recommendation(score, suitable),
            "alternative_suggested": not suitable and self.indoor_alternative
        }
    
    def _get_recommendation(self, score: float, suitable: bool) -> str:
        """Get recommendation based on suitability score"""
        if not suitable:
            return "cancel" if not self.indoor_alternative else "move_indoors"
        elif score >= 0.8:
            return "proceed"
        elif score >= 0.6:
            return "proceed_with_caution"
        else:
            return "consider_postponing"

# === UTILITY FUNCTIONS ===

def initialize_game_weather_suitability(db: Session):
    """Initialize default game weather suitability rules"""
    
    default_rules = [
        {
            "game_type": "GAME1",  # Football Skills Challenge
            "min_temperature": 5.0,
            "max_temperature": 30.0,
            "optimal_temp_min": 15.0,
            "optimal_temp_max": 25.0,
            "max_wind_speed": 10.0,
            "optimal_wind_max": 5.0,
            "max_precipitation": 0.5,
            "no_play_precipitation": 3.0,
            "min_visibility": 5.0,
            "optimal_visibility_min": 10.0,
            "requires_shelter": False,
            "indoor_alternative": False,
            "weather_dependent": True
        },
        {
            "game_type": "GAME2",  # Penalty Shootout
            "min_temperature": 0.0,
            "max_temperature": 35.0,
            "optimal_temp_min": 10.0,
            "optimal_temp_max": 30.0,
            "max_wind_speed": 15.0,
            "optimal_wind_max": 8.0,
            "max_precipitation": 1.0,
            "no_play_precipitation": 5.0,
            "min_visibility": 3.0,
            "optimal_visibility_min": 8.0,
            "requires_shelter": False,
            "indoor_alternative": True,
            "weather_dependent": True
        },
        {
            "game_type": "GAME3",  # Speed Challenge
            "min_temperature": 10.0,
            "max_temperature": 28.0,
            "optimal_temp_min": 18.0,
            "optimal_temp_max": 25.0,
            "max_wind_speed": 8.0,
            "optimal_wind_max": 3.0,
            "max_precipitation": 0.1,
            "no_play_precipitation": 1.0,
            "min_visibility": 8.0,
            "optimal_visibility_min": 15.0,
            "requires_shelter": False,
            "indoor_alternative": False,
            "weather_dependent": True
        }
    ]
    
    for rule_data in default_rules:
        existing = db.query(GameWeatherSuitability).filter(
            GameWeatherSuitability.game_type == rule_data["game_type"]
        ).first()
        
        if not existing:
            rule = GameWeatherSuitability(**rule_data)
            db.add(rule)
    
    db.commit()

# === PYDANTIC SCHEMAS ===

class WeatherResponse(BaseModel):
    """Weather data response schema"""
    location_id: int
    temperature: float
    feels_like: float
    condition: str
    description: str
    emoji: str
    humidity: int
    wind_speed: float
    visibility: float
    severity: str
    is_game_suitable: bool
    updated_at: str

class ForecastResponse(BaseModel):
    """Weather forecast response schema"""
    location_id: int
    forecast_hours: int
    forecasts: List[Dict]

class AlertResponse(BaseModel):
    """Weather alert response schema"""
    alert_id: str
    location_id: int
    alert_type: str
    severity: str
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    is_current: bool
    affects_gaming: bool
    recommended_action: Optional[str]