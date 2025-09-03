# === backend/app/routers/weather.py ===
# Weather API Endpoints for LFA Legacy GO - JAVÍTOTT VERZIÓ
# Mock implementáció a weather modellek nélkül

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import random
import logging

from ..database import get_db
from ..models.user import User
from ..models.location import Location

# Conditional imports - csak akkor importáljuk, ha léteznek
try:
    from .auth import get_current_user, get_current_admin

    AUTH_AVAILABLE = True
except ImportError:
    # Fallback authentication functions
    def get_current_user():
        return {"id": 1, "username": "mock_user"}

    def get_current_admin():
        return {"id": 1, "username": "mock_admin"}

    AUTH_AVAILABLE = False

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Weather"], prefix="/api/weather")

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


class ForecastItem(BaseModel):
    """Individual forecast item"""

    datetime: str
    temperature: float
    condition: str
    description: str
    emoji: str
    precipitation_chance: int
    wind_speed: float


class ForecastResponse(BaseModel):
    """Weather forecast response model"""

    location_id: int
    forecast_hours: int
    forecasts: List[ForecastItem]


class GameSuitabilityResponse(BaseModel):
    """Game weather suitability response model"""

    game_type: str
    location_id: int
    is_suitable: bool
    reason: str
    current_weather: Dict[str, Any]


class WeatherAlert(BaseModel):
    """Weather alert model"""

    id: str
    type: str
    severity: str
    title: str
    description: str
    start_time: str
    end_time: str
    affected_locations: List[int]


# === WEATHER UTILITIES ===


def generate_mock_weather(location_id: int) -> Dict[str, Any]:
    """Generate realistic mock weather data"""
    # Budapest-like weather patterns
    base_temp = random.uniform(-5, 25)  # Seasonal range
    conditions = [
        ("clear", "Clear sky", "☀️"),
        ("partly_cloudy", "Partly cloudy", "⛅"),
        ("cloudy", "Cloudy", "☁️"),
        ("overcast", "Overcast", "☁️"),
        ("light_rain", "Light rain", "🌦️"),
        ("rain", "Rain", "🌧️"),
        ("snow", "Snow", "❄️"),
        ("fog", "Fog", "🌫️"),
    ]

    condition, description, emoji = random.choice(conditions)

    return {
        "location_id": location_id,
        "temperature": round(base_temp, 1),
        "feels_like": round(base_temp + random.uniform(-3, 3), 1),
        "condition": condition,
        "description": description,
        "emoji": emoji,
        "humidity": random.randint(30, 90),
        "wind_speed": round(random.uniform(0, 15), 1),
        "visibility": round(random.uniform(2, 15), 1),
        "severity": random.choice(["low", "moderate", "high"]),
        "is_game_suitable": random.choice([True, True, True, False]),  # Mostly good
        "updated_at": datetime.now().isoformat(),
    }


def determine_game_suitability(
    weather: Dict[str, Any], game_type: str
) -> Dict[str, Any]:
    """Determine if weather is suitable for a specific game type"""

    # Game-specific weather requirements
    game_requirements = {
        "GAME1": {  # Pontossági Célzás
            "max_wind": 8.0,
            "min_visibility": 5.0,
            "rain_tolerance": False,
        },
        "GAME2": {  # Gyorsasági Slalom
            "max_wind": 12.0,
            "min_visibility": 10.0,
            "rain_tolerance": True,
        },
        "GAME3": {  # 1v1 Technikai Duel
            "max_wind": 10.0,
            "min_visibility": 8.0,
            "rain_tolerance": False,
        },
    }

    requirements = game_requirements.get(game_type, game_requirements["GAME1"])

    # Check suitability
    reasons = []
    suitable = True

    if weather["wind_speed"] > requirements["max_wind"]:
        suitable = False
        reasons.append(
            f"Wind speed ({weather['wind_speed']} m/s) too high for {game_type}"
        )

    if weather["visibility"] < requirements["min_visibility"]:
        suitable = False
        reasons.append(
            f"Visibility ({weather['visibility']} km) too low for {game_type}"
        )

    if not requirements["rain_tolerance"] and weather["condition"] in [
        "rain",
        "light_rain",
    ]:
        suitable = False
        reasons.append(f"Rain conditions not suitable for {game_type}")

    if weather["temperature"] < -10 or weather["temperature"] > 35:
        suitable = False
        reasons.append(f"Extreme temperature ({weather['temperature']}°C) not suitable")

    reason = (
        "Weather conditions are suitable for playing"
        if suitable
        else "; ".join(reasons)
    )

    return {
        "game_type": game_type,
        "location_id": weather["location_id"],
        "is_suitable": suitable,
        "reason": reason,
        "current_weather": weather,
    }


# === PUBLIC ENDPOINTS (NO AUTHENTICATION REQUIRED) ===


@router.get("/health")
async def weather_system_health():
    """🏥 Weather system health check"""
    return {
        "service": "weather",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "features": {
            "current_weather": "active",
            "forecasts": "active",
            "game_suitability": "active",
            "alerts": "active",
            "analytics": "mock_data",
        },
        "data_source": "mock_weather_service",
        "auth_available": AUTH_AVAILABLE,
    }


@router.get("/{location_id}/current", response_model=WeatherResponse)
async def get_current_weather(location_id: int, db: Session = Depends(get_db)):
    """🌤️ Get current weather for location"""

    # Verify location exists
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # Generate mock weather
    weather_data = generate_mock_weather(location_id)

    return WeatherResponse(**weather_data)


@router.get("/{location_id}/forecast", response_model=ForecastResponse)
async def get_weather_forecast(
    location_id: int,
    hours: int = Query(24, ge=1, le=168),  # 1 hour to 1 week
    db: Session = Depends(get_db),
):
    """📅 Get weather forecast for location"""

    # Verify location exists
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # Generate hourly forecasts
    forecasts = []
    for hour in range(hours):
        forecast_time = datetime.now() + timedelta(hours=hour)

        # Generate weather with some progression
        base_temp = 15 + random.uniform(-10, 15)
        conditions = ["clear", "partly_cloudy", "cloudy", "light_rain"]
        condition = random.choice(conditions)

        emoji_map = {
            "clear": "☀️",
            "partly_cloudy": "⛅",
            "cloudy": "☁️",
            "light_rain": "🌦️",
        }

        forecast_item = ForecastItem(
            datetime=forecast_time.isoformat(),
            temperature=round(base_temp, 1),
            condition=condition,
            description=condition.replace("_", " ").title(),
            emoji=emoji_map.get(condition, "🌤️"),
            precipitation_chance=random.randint(0, 80),
            wind_speed=round(random.uniform(0, 12), 1),
        )

        forecasts.append(forecast_item)

    return ForecastResponse(
        location_id=location_id, forecast_hours=hours, forecasts=forecasts
    )


@router.get(
    "/{location_id}/suitability/{game_type}", response_model=GameSuitabilityResponse
)
async def check_game_suitability(
    location_id: int, game_type: str, db: Session = Depends(get_db)
):
    """🎮 Check if weather is suitable for specific game type"""

    # Verify location exists
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # Validate game type
    valid_games = ["GAME1", "GAME2", "GAME3"]
    if game_type not in valid_games:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid game type. Must be one of: {', '.join(valid_games)}",
        )

    # Get current weather
    current_weather = generate_mock_weather(location_id)

    # Determine suitability
    suitability_result = determine_game_suitability(current_weather, game_type)

    return GameSuitabilityResponse(**suitability_result)


@router.get("/alerts/active")
async def get_active_weather_alerts(location_ids: Optional[List[int]] = Query(None)):
    """🚨 Get active weather alerts"""

    # Generate mock alerts
    alerts = []

    if random.random() < 0.3:  # 30% chance of alert
        alert = WeatherAlert(
            id=f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            type=random.choice(["wind", "rain", "temperature", "fog"]),
            severity=random.choice(["low", "moderate", "high"]),
            title="Weather Advisory",
            description="Current weather conditions may affect outdoor activities",
            start_time=datetime.now().isoformat(),
            end_time=(datetime.now() + timedelta(hours=3)).isoformat(),
            affected_locations=location_ids or [1, 2, 3],
        )
        alerts.append(alert)

    return {
        "active_alerts": len(alerts),
        "alerts": alerts,
        "last_updated": datetime.now().isoformat(),
    }


# === USER ENDPOINTS (AUTHENTICATION REQUIRED) ===


@router.get("/user/preferences")
async def get_user_weather_preferences(current_user: User = Depends(get_current_user)):
    """👤 Get user weather notification preferences"""

    return {
        "user_id": current_user.id if hasattr(current_user, "id") else 1,
        "notifications_enabled": True,
        "alert_types": ["rain", "wind", "temperature"],
        "notification_threshold": "moderate",
        "preferred_conditions": ["clear", "partly_cloudy"],
        "game_specific_alerts": {"GAME1": True, "GAME2": True, "GAME3": False},
    }


@router.put("/user/preferences")
async def update_user_weather_preferences(
    preferences: Dict[str, Any], current_user: User = Depends(get_current_user)
):
    """👤 Update user weather notification preferences"""

    return {
        "message": "Weather preferences updated successfully",
        "user_id": current_user.id if hasattr(current_user, "id") else 1,
        "updated_preferences": preferences,
        "updated_at": datetime.now().isoformat(),
    }


# === ADMIN ENDPOINTS (ADMIN AUTHENTICATION REQUIRED) ===


@router.get("/analytics/summary")
async def get_weather_analytics_summary(
    current_user: User = Depends(get_current_admin),
):
    """📊 Get weather impact analytics summary"""

    return {
        "report_period": "last_30_days",
        "total_weather_checks": random.randint(1000, 5000),
        "game_cancellations": {
            "weather_related": random.randint(50, 200),
            "percentage": random.uniform(5, 15),
        },
        "most_affected_locations": [
            {"location_id": 1, "cancellations": random.randint(10, 50)},
            {"location_id": 2, "cancellations": random.randint(5, 30)},
            {"location_id": 3, "cancellations": random.randint(3, 20)},
        ],
        "weather_patterns": {
            "clear_days": random.randint(15, 25),
            "rainy_days": random.randint(3, 8),
            "windy_days": random.randint(5, 12),
        },
        "generated_at": datetime.now().isoformat(),
    }


@router.post("/admin/refresh-cache")
async def refresh_weather_cache(current_user: User = Depends(get_current_admin)):
    """🔄 Refresh weather data cache (Admin only)"""

    return {
        "message": "Weather cache refreshed successfully",
        "cache_entries": random.randint(10, 50),
        "last_refresh": datetime.now().isoformat(),
        "next_refresh": (datetime.now() + timedelta(minutes=30)).isoformat(),
    }


# === BATCH ENDPOINTS ===


@router.get("/batch/multiple-locations")
async def get_weather_for_multiple_locations(
    location_ids: List[int] = Query(...), include_forecast: bool = Query(False)
):
    """🗺️ Get weather data for multiple locations at once"""

    if len(location_ids) > 10:
        raise HTTPException(
            status_code=400, detail="Maximum 10 locations allowed per batch request"
        )

    results = []

    for location_id in location_ids:
        weather_data = generate_mock_weather(location_id)

        location_result = {"location_id": location_id, "current_weather": weather_data}

        if include_forecast:
            # Generate short forecast
            forecast_items = []
            for hour in range(6):  # 6-hour forecast
                forecast_time = datetime.now() + timedelta(hours=hour + 1)
                forecast_items.append(
                    {
                        "datetime": forecast_time.isoformat(),
                        "temperature": weather_data["temperature"]
                        + random.uniform(-3, 3),
                        "condition": random.choice(
                            ["clear", "partly_cloudy", "cloudy"]
                        ),
                    }
                )

            location_result["forecast"] = forecast_items

        results.append(location_result)

    return {
        "locations_count": len(location_ids),
        "include_forecast": include_forecast,
        "results": results,
        "retrieved_at": datetime.now().isoformat(),
    }


# === INTEGRATION ENDPOINTS ===


@router.get("/integration/booking-recommendations/{location_id}")
async def get_booking_weather_recommendations(
    location_id: int,
    date: str = Query(...),  # YYYY-MM-DD format
    db: Session = Depends(get_db),
):
    """📅 Get weather-based booking recommendations for a specific date"""

    try:
        target_date = datetime.fromisoformat(date)
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Invalid date format. Use YYYY-MM-DD"
        )

    # Verify location exists
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # Generate hourly recommendations for the day
    recommendations = []

    for hour in range(8, 20):  # 8 AM to 8 PM
        hour_datetime = target_date.replace(hour=hour)
        weather = generate_mock_weather(location_id)

        # Simple recommendation logic
        if weather["is_game_suitable"]:
            if weather["condition"] == "clear":
                recommendation = "excellent"
            elif weather["condition"] in ["partly_cloudy", "cloudy"]:
                recommendation = "good"
            else:
                recommendation = "fair"
        else:
            recommendation = "poor"

        recommendations.append(
            {
                "hour": hour,
                "datetime": hour_datetime.isoformat(),
                "weather": weather,
                "recommendation": recommendation,
                "suitable_games": (
                    ["GAME1", "GAME2"] if weather["is_game_suitable"] else []
                ),
            }
        )

    return {
        "location_id": location_id,
        "date": date,
        "recommendations": recommendations,
        "best_hours": [
            r["hour"] for r in recommendations if r["recommendation"] == "excellent"
        ][:3],
    }


# Export router
logger.info("✅ Weather router initialized with mock data implementation")
