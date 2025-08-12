# === backend/app/routers/weather.py ===
# Weather API Endpoints for LFA Legacy GO - JAVÍTOTT VERZIÓ
# GYORS MOCK IMPLEMENTÁCIÓ a teszteléshez

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from pydantic import BaseModel, validator
import os

from ..database import get_db
from .auth import get_current_user, get_current_admin
from ..models.user import User
from ..models.location import Location
from ..models.weather import (
    LocationWeather, WeatherForecast, WeatherAlert, GameWeatherSuitability,
    WeatherCondition, WeatherSeverity, initialize_game_weather_suitability
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/weather", tags=["Weather"])

# === PYDANTIC MODELS ===

class WeatherResponse(BaseModel):
    """Weather data response model"""
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
    """Weather forecast response model"""
    location_id: int
    forecast_hours: int
    forecasts: List[Dict]

class GameSuitabilityResponse(BaseModel):
    """Game weather suitability response model"""
    game_type: str
    location_id: int
    is_suitable: bool
    reason: str
    current_weather: Dict

class WeatherRulesUpdate(BaseModel):
    """Weather rules update model"""
    min_temperature: Optional[float] = None
    max_temperature: Optional[float] = None
    max_wind_speed: Optional[float] = None
    max_precipitation: Optional[float] = None
    min_visibility: Optional[float] = None
    allowed_conditions: Optional[List[str]] = None
    blocked_conditions: Optional[List[str]] = None
    requires_shelter: Optional[bool] = None
    indoor_alternative: Optional[bool] = None
    weather_dependent: Optional[bool] = None

# === PUBLIC ENDPOINTS (NO AUTHENTICATION REQUIRED) ===

@router.get("/health")
async def weather_system_health(db: Session = Depends(get_db)):
    """🏥 Weather system health check - PUBLIC ENDPOINT"""
    
    try:
        # Check rules
        rules_count = db.query(GameWeatherSuitability).count()
        
        # Check alerts
        active_alerts = db.query(WeatherAlert).filter(WeatherAlert.is_active == True).count()
        
        # Check recent weather data
        recent_weather_count = db.query(LocationWeather).filter(
            LocationWeather.created_at >= datetime.utcnow() - timedelta(hours=24)
        ).count()
        
        # Check API key
        weather_api_key = os.getenv("WEATHER_API_KEY")
        api_configured = weather_api_key is not None and len(weather_api_key) > 10
        
        # Determine status
        status = "healthy" if rules_count > 0 and api_configured else "degraded"
        
        return {
            "status": status,
            "api_service_available": True,
            "api_key_configured": api_configured,
            "game_rules_configured": rules_count,
            "active_weather_alerts": active_alerts,
            "recent_weather_readings": recent_weather_count,
            "last_check": datetime.utcnow().isoformat(),
            "last_update": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "api_service_available": False,
            "last_check": datetime.utcnow().isoformat()
        }

@router.get("/rules/all")
async def get_all_weather_rules(db: Session = Depends(get_db)):
    """🎮 Get all game weather suitability rules - PUBLIC ENDPOINT"""
    
    rules = db.query(GameWeatherSuitability).all()
    
    if not rules:
        # Try to initialize default rules
        try:
            initialize_game_weather_suitability(db)
            rules = db.query(GameWeatherSuitability).all()
            logger.info("Weather rules initialized automatically")
        except Exception as e:
            logger.error(f"Failed to initialize weather rules: {str(e)}")
    
    return {
        "rules_count": len(rules),
        "rules": [rule.to_dict() for rule in rules]
    }

# === WEATHER INFORMATION ENDPOINTS (REQUIRE AUTHENTICATION) ===

@router.get("/location/{location_id}/current")
async def get_current_weather(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """🌦️ Get current weather for location - MOCK IMPLEMENTATION"""
    
    # Verify location exists
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # MOCK WEATHER DATA for testing (replace with real API later)
    # This simulates Budapest weather conditions
    mock_weather = {
        "location_id": location_id,
        "temperature": 12.5,
        "feels_like": 10.8,
        "condition": "partly_cloudy",
        "description": "Partly cloudy with light winds",
        "emoji": "⛅",
        "humidity": 65,
        "wind_speed": 3.2,
        "visibility": 10.0,
        "severity": "low",
        "is_game_suitable": True,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    return mock_weather

@router.get("/location/{location_id}/forecast")
async def get_weather_forecast(
    location_id: int,
    hours: int = Query(default=24, ge=1, le=168),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """🔮 Get weather forecast for location - MOCK IMPLEMENTATION"""
    
    # Verify location exists
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Generate mock forecast data
    forecasts = []
    base_temp = 12.5
    
    for i in range(0, min(hours, 48), 3):  # Every 3 hours, max 48 hours
        forecast_time = datetime.utcnow() + timedelta(hours=i)
        temp_variation = 2.0 * (0.5 - abs((i % 24 - 12) / 24))  # Daily temperature cycle
        
        forecast = {
            "forecast_time": forecast_time.isoformat(),
            "hours_ahead": i,
            "temperature": round(base_temp + temp_variation, 1),
            "feels_like": round(base_temp + temp_variation - 1.5, 1),
            "condition": "partly_cloudy" if i % 6 == 0 else "clear",
            "description": "Partly cloudy" if i % 6 == 0 else "Clear sky",
            "humidity": 60 + (i % 20),
            "wind_speed": 2.0 + (i % 5),
            "precipitation": 0.0 if i % 8 != 0 else 0.1,
            "precipitation_probability": 10 + (i % 30),
            "is_game_suitable": True
        }
        forecasts.append(forecast)
    
    return {
        "location_id": location_id,
        "forecast_hours": hours,
        "forecasts": forecasts
    }

@router.get("/location/{location_id}/alerts")
async def get_weather_alerts(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """⚠️ Get active weather alerts for location"""
    
    # Verify location exists
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # JAVÍTOTT: end_time használata expires_at helyett
    alerts = db.query(WeatherAlert).filter(
        WeatherAlert.location_id == location_id,
        WeatherAlert.is_active == True,
        WeatherAlert.end_time > datetime.utcnow()
    ).all()
    
    return {
        "location_id": location_id,
        "alert_count": len(alerts),
        "alerts": [
            {
                "id": alert.id,
                "alert_type": alert.alert_type,
                "severity": alert.severity.value if hasattr(alert.severity, 'value') else str(alert.severity),
                "title": alert.title,
                "description": alert.description,
                "start_time": alert.start_time.isoformat(),
                "end_time": alert.end_time.isoformat(),
                "issued_at": alert.issued_at.isoformat(),
                "is_current": alert.is_current,
                "affects_gaming": alert.affects_gaming,
                "recommended_action": alert.recommended_action
            } 
            for alert in alerts
        ]
    }

@router.get("/location/{location_id}/game/{game_type}/suitability")
async def check_game_weather_suitability(
    location_id: int,
    game_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """🎮 Check if weather is suitable for specific game type - MOCK IMPLEMENTATION"""
    
    # Verify location exists
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Get game rules
    rules = db.query(GameWeatherSuitability).filter(
        GameWeatherSuitability.game_type == game_type
    ).first()
    
    if not rules:
        raise HTTPException(status_code=404, detail=f"Game rules not found for {game_type}")
    
    # Mock current weather conditions (good conditions)
    current_temp = 12.5
    current_wind = 3.2
    current_precipitation = 0.0
    current_visibility = 10.0
    
    # Simple suitability check based on rules
    temp_ok = rules.min_temperature <= current_temp <= rules.max_temperature
    wind_ok = current_wind <= rules.max_wind_speed
    precip_ok = current_precipitation <= rules.max_precipitation
    visibility_ok = current_visibility >= rules.min_visibility
    
    suitable = temp_ok and wind_ok and precip_ok and visibility_ok
    
    # Generate reason
    reasons = []
    if not temp_ok:
        reasons.append(f"Temperature {current_temp}°C outside range {rules.min_temperature}-{rules.max_temperature}°C")
    if not wind_ok:
        reasons.append(f"Wind speed {current_wind} m/s exceeds limit {rules.max_wind_speed} m/s")
    if not precip_ok:
        reasons.append(f"Precipitation {current_precipitation} mm/h exceeds limit {rules.max_precipitation} mm/h")
    if not visibility_ok:
        reasons.append(f"Visibility {current_visibility} km below minimum {rules.min_visibility} km")
    
    reason = "Weather conditions are suitable for playing" if suitable else "; ".join(reasons)
    
    return {
        "game_type": game_type,
        "location_id": location_id,
        "is_suitable": suitable,
        "reason": reason,
        "current_weather": {
            "temperature": current_temp,
            "wind_speed": current_wind,
            "precipitation": current_precipitation,
            "visibility": current_visibility,
            "condition": "partly_cloudy",
            "description": "Good conditions for outdoor activities"
        }
    }

# === WEATHER RULES MANAGEMENT (ADMIN ONLY) ===

@router.post("/rules/initialize")
async def initialize_weather_rules(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """🎮 Initialize default game weather suitability rules (Admin only)"""
    
    # Check if rules already exist
    existing_rules = db.query(GameWeatherSuitability).count()
    if existing_rules > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Weather rules already initialized ({existing_rules} rules exist)"
        )
    
    initialize_game_weather_suitability(db)
    new_rules_count = db.query(GameWeatherSuitability).count()
    
    return {
        "message": "Weather rules initialized successfully",
        "rules_created": new_rules_count
    }

@router.put("/rules/game/{game_type}")
async def update_weather_rules(
    game_type: str,
    rules_data: WeatherRulesUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """🎮 Update weather suitability rules for game type (Admin only)"""
    
    rules = db.query(GameWeatherSuitability).filter(
        GameWeatherSuitability.game_type == game_type
    ).first()
    
    if not rules:
        raise HTTPException(status_code=404, detail="Game weather rules not found")
    
    # Update rules
    update_data = rules_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(rules, field):
            setattr(rules, field, value)
    
    rules.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": f"Weather rules updated for {game_type}",
        "updated_fields": list(update_data.keys()),
        "rules": rules.to_dict()
    }

# === WEATHER ANALYTICS (ADMIN ONLY) ===

@router.get("/analytics/impact")
async def get_weather_impact_analytics(
    start_date: str,
    end_date: str,
    location_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """📊 Get weather impact analytics (Admin only) - MOCK DATA"""
    
    try:
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD or ISO format.")
    
    # Mock analytics data
    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date,
            "days_analyzed": (end_dt - start_dt).days
        },
        "location_id": location_id,
        "impact_summary": {
            "total_sessions": 45,
            "weather_affected": 3,
            "cancellation_rate": 6.7,
            "average_suitability_score": 0.85
        },
        "weather_conditions": {
            "clear_days": 12,
            "cloudy_days": 8,
            "rainy_days": 2,
            "unsuitable_days": 1
        },
        "game_type_impact": {
            "GAME1": {"sessions": 15, "cancelled": 1, "rate": 6.7},
            "GAME2": {"sessions": 18, "cancelled": 1, "rate": 5.6},
            "GAME3": {"sessions": 12, "cancelled": 1, "rate": 8.3}
        }
    }

@router.get("/analytics/summary")
async def get_weather_summary(
    days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """📊 Get weather system summary (Admin only) - MOCK DATA"""
    
    return {
        "period_days": days,
        "system_health": {
            "api_availability": 99.2,
            "data_freshness_minutes": 15,
            "last_weather_update": datetime.utcnow().isoformat()
        },
        "rules_status": {
            "total_game_types": 3,
            "rules_configured": 3,
            "rules_active": 3
        },
        "alert_summary": {
            "total_alerts": 2,
            "active_alerts": 0,
            "sessions_affected": 1
        },
        "forecast_accuracy": {
            "24h_accuracy": 92.5,
            "48h_accuracy": 87.3,
            "prediction_confidence": 94.1
        }
    }