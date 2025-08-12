# === backend/app/services/weather_service.py ===
# Weather Integration Service for LFA Legacy GO

import aiohttp
import asyncio
import logging
import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
try:
    from ..models.weather import (
        LocationWeather, WeatherForecast, WeatherAlert, GameWeatherSuitability,
        WeatherCondition, WeatherSeverity
    )
    from ..models.location import Location, GameSession
    from ..models.user import User
except ImportError:
    from models.weather import (
        LocationWeather, WeatherForecast, WeatherAlert, GameWeatherSuitability,
        WeatherCondition, WeatherSeverity
    )
    from models.location import Location, GameSession
    from models.user import User

logger = logging.getLogger(__name__)

class WeatherAPIService:
    """Weather API integration service"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "http://api.openweathermap.org/data/2.5"
        self.forecast_url = "http://api.openweathermap.org/data/2.5/forecast"
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get_current_weather(self, lat: float, lon: float) -> Optional[Dict]:
        """Get current weather for coordinates"""
        url = f"{self.base_url}/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "metric",
            "lang": "hu"  # Hungarian language
        }
        
        try:
            timeout = aiohttp.ClientTimeout(total=10)
            async with self.session.get(url, params=params, timeout=timeout) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_current_weather(data)
                else:
                    logger.error(f"Weather API error: {response.status}")
                    return None
        except Exception as e:
            logger.error(f"Weather API request failed: {str(e)}")
            return None
    
    async def get_hourly_forecast(self, lat: float, lon: float, hours: int = 24) -> List[Dict]:
        """Get hourly forecast for next N hours"""
        url = self.forecast_url
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "metric",
            "lang": "hu"
        }
        
        try:
            timeout = aiohttp.ClientTimeout(total=15)
            async with self.session.get(url, params=params, timeout=timeout) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_forecast(data, hours)
                else:
                    logger.error(f"Forecast API error: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Forecast API request failed: {str(e)}")
            return []
    
    async def get_weather_alerts(self, lat: float, lon: float) -> List[Dict]:
        """Get weather alerts for location"""
        url = f"{self.base_url}/onecall"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "exclude": "minutely,daily",
            "units": "metric"
        }
        
        try:
            timeout = aiohttp.ClientTimeout(total=15)
            async with self.session.get(url, params=params, timeout=timeout) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("alerts", [])
                else:
                    return []
        except Exception as e:
            logger.error(f"Weather alerts API request failed: {str(e)}")
            return []
    
    def _parse_current_weather(self, data: Dict) -> Dict:
        """Parse OpenWeatherMap current weather response"""
        main = data.get("main", {})
        weather = data.get("weather", [{}])[0]
        wind = data.get("wind", {})
        
        # Map OpenWeatherMap condition to our enum
        condition = self._map_weather_condition(weather.get("main", ""))
        severity = self._calculate_severity(main, weather, wind)
        
        return {
            "temperature": main.get("temp", 0),
            "feels_like": main.get("feels_like", 0),
            "humidity": main.get("humidity", 0),
            "wind_speed": wind.get("speed", 0) * 3.6,  # Convert m/s to km/h
            "wind_direction": wind.get("deg", 0),
            "visibility": data.get("visibility", 10000) / 1000,  # Convert m to km
            "condition": condition,
            "description": weather.get("description", ""),
            "severity": severity,
            "precipitation_probability": 0,  # Not available in current weather
            "precipitation_amount": data.get("rain", {}).get("1h", 0),
            "uv_index": 0,  # Requires separate API call
            "weather_time": datetime.utcnow(),
            "api_response": data
        }
    
    def _parse_forecast(self, data: Dict, hours: int) -> List[Dict]:
        """Parse OpenWeatherMap forecast response"""
        forecasts = []
        items = data.get("list", [])[:hours//3]  # 3-hour intervals
        
        for item in items:
            main = item.get("main", {})
            weather = item.get("weather", [{}])[0]
            wind = item.get("wind", {})
            
            condition = self._map_weather_condition(weather.get("main", ""))
            severity = self._calculate_severity(main, weather, wind)
            
            forecasts.append({
                "forecast_time": datetime.fromtimestamp(item.get("dt", 0)),
                "temperature": main.get("temp", 0),
                "condition": condition,
                "precipitation_probability": item.get("pop", 0) * 100,
                "precipitation_amount": item.get("rain", {}).get("3h", 0) / 3,  # Convert to mm/h
                "wind_speed": wind.get("speed", 0) * 3.6,
                "severity": severity,
                "forecast_range": "hourly"
            })
        
        return forecasts
    
    def _map_weather_condition(self, openweather_main: str) -> WeatherCondition:
        """Map OpenWeatherMap condition to our enum"""
        mapping = {
            "Clear": WeatherCondition.CLEAR,
            "Clouds": WeatherCondition.CLOUDY,
            "Rain": WeatherCondition.LIGHT_RAIN,
            "Drizzle": WeatherCondition.LIGHT_RAIN,
            "Thunderstorm": WeatherCondition.THUNDERSTORM,
            "Snow": WeatherCondition.SNOW,
            "Mist": WeatherCondition.FOG,
            "Fog": WeatherCondition.FOG,
            "Haze": WeatherCondition.FOG
        }
        return mapping.get(openweather_main, WeatherCondition.CLEAR)
    
    def _calculate_severity(self, main: Dict, weather: Dict, wind: Dict) -> WeatherSeverity:
        """Calculate weather severity based on conditions"""
        temp = main.get("temp", 20)
        wind_speed = wind.get("speed", 0) * 3.6  # km/h
        condition = weather.get("main", "")
        
        # Extreme conditions
        if condition in ["Thunderstorm"] or wind_speed > 50 or temp < -5 or temp > 35:
            return WeatherSeverity.EXTREME
        
        # High severity
        if condition in ["Rain", "Snow"] or wind_speed > 30 or temp < 0 or temp > 30:
            return WeatherSeverity.HIGH
        
        # Moderate severity
        if condition in ["Clouds", "Drizzle", "Fog"] or wind_speed > 15:
            return WeatherSeverity.MODERATE
        
        return WeatherSeverity.LOW

class WeatherService:
    """Main weather service for managing weather data"""
    
    def __init__(self, db: Session, api_service: WeatherAPIService = None):
        self.db = db
        self.api_service = api_service
    
    async def update_location_weather(self, location_id: int) -> bool:
        """Update weather data for a specific location"""
        location = self.db.query(Location).filter(Location.id == location_id).first()
        if not location or not self.api_service:
            return False
        
        try:
            # Get current weather
            weather_data = await self.api_service.get_current_weather(
                float(location.latitude), 
                float(location.longitude)
            )
            
            if not weather_data:
                return False
            
            # Create or update weather record
            weather_record = LocationWeather(
                location_id=location_id,
                **weather_data
            )
            
            self.db.add(weather_record)
            self.db.commit()
            
            # Check for weather alerts
            await self._check_weather_alerts(location, weather_record)
            
            logger.info(f"Weather updated for location {location_id}: {weather_record.condition.value} {weather_record.temperature}°C")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update weather for location {location_id}: {str(e)}")
            self.db.rollback()
            return False
    
    async def update_all_locations_weather(self) -> int:
        """Update weather for all active locations"""
        if not self.api_service:
            logger.warning("Weather API service not available")
            return 0
            
        locations = self.db.query(Location).filter(Location.status == "active").all()
        updated_count = 0
        
        for location in locations:
            try:
                success = await self.update_location_weather(location.id)
                if success:
                    updated_count += 1
                    # Small delay to avoid rate limiting
                    await asyncio.sleep(0.5)
            except Exception as e:
                logger.error(f"Error updating weather for location {location.id}: {str(e)}")
                continue
        
        logger.info(f"Weather updated for {updated_count}/{len(locations)} locations")
        return updated_count
    
    async def get_weather_forecast(self, location_id: int, hours: int = 24) -> List[WeatherForecast]:
        """Get weather forecast for location"""
        location = self.db.query(Location).filter(Location.id == location_id).first()
        if not location or not self.api_service:
            return []
        
        try:
            forecast_data = await self.api_service.get_hourly_forecast(
                float(location.latitude),
                float(location.longitude),
                hours
            )
            
            forecasts = []
            for data in forecast_data:
                forecast = WeatherForecast(
                    location_id=location_id,
                    **data
                )
                forecasts.append(forecast)
                self.db.add(forecast)
            
            self.db.commit()
            return forecasts
            
        except Exception as e:
            logger.error(f"Failed to get forecast for location {location_id}: {str(e)}")
            self.db.rollback()
            return []
    
    def get_current_weather(self, location_id: int) -> Optional[LocationWeather]:
        """Get most recent weather data for location"""
        return self.db.query(LocationWeather)\
            .filter(LocationWeather.location_id == location_id)\
            .order_by(LocationWeather.updated_at.desc())\
            .first()
    
    def is_game_suitable_for_weather(self, game_type: str, location_id: int) -> Tuple[bool, str]:
        """Check if game type is suitable for current weather"""
        
        # Get current weather
        weather = self.get_current_weather(location_id)
        if not weather:
            return True, "No weather data available"
        
        # Get game weather suitability rules
        suitability = self.db.query(GameWeatherSuitability)\
            .filter(GameWeatherSuitability.game_type == game_type)\
            .first()
        
        if not suitability:
            # Default: allow all games in moderate weather
            is_suitable = weather.severity in [WeatherSeverity.LOW, WeatherSeverity.MODERATE]
            return is_suitable, f"Weather severity: {weather.severity.value} (using default rules)"
        
        return suitability.is_suitable_for_weather(weather)
    
    async def _check_weather_alerts(self, location: Location, weather: LocationWeather):
        """Check for weather alerts and create notifications"""
        
        # Check for severe weather
        if weather.severity == WeatherSeverity.EXTREME:
            alert = WeatherAlert(
                location_id=location.id,
                alert_type="severe_weather",
                severity=weather.severity,
                title=f"Severe Weather Alert - {location.name}",
                description=f"Extreme weather conditions detected: {weather.description}. All outdoor activities may be affected.",
                starts_at=datetime.utcnow(),
                ends_at=datetime.utcnow() + timedelta(hours=2)
            )
            self.db.add(alert)
            
            # Handle weather alert (cancel sessions, notify users)
            await self._handle_weather_alert(alert)
    
    async def _handle_weather_alert(self, alert: WeatherAlert):
        """Handle weather alert by notifying users and adjusting sessions"""
        
        try:
            # Get affected sessions in next 4 hours
            start_time = datetime.utcnow()
            end_time = start_time + timedelta(hours=4)
            
            try:
                from ..models.location import GameSession, SessionStatus
            except ImportError:
                from models.location import GameSession, SessionStatus
            
            affected_sessions = self.db.query(GameSession).filter(
                GameSession.location_id == alert.location_id,
                GameSession.start_time >= start_time,
                GameSession.start_time <= end_time,
                GameSession.status.in_(["scheduled", "confirmed"])
            ).all()
            
            alert.sessions_affected = len(affected_sessions)
            
            for session in affected_sessions:
                # Check if game is suitable for weather
                suitable, reason = self.is_game_suitable_for_weather(
                    session.game_definition.game_type, 
                    session.location_id
                )
                
                if not suitable:
                    # Auto-cancel with full refund
                    session.status = SessionStatus.CANCELLED
                    session.cancellation_reason = f"Weather: {reason}"
                    session.cancelled_at = datetime.utcnow()
                    
                    # Refund credits to all players
                    for player_data in session.players:
                        user = self.db.query(User).filter(User.id == player_data["user_id"]).first()
                        if user:
                            user.credits += session.total_cost_credits
                            
                            # Add to transaction history
                            if not user.transaction_history:
                                user.transaction_history = []
                            
                            refund_transaction = {
                                "transaction_id": f"weather_refund_{session.session_id}_{datetime.utcnow().timestamp()}",
                                "type": "refund",
                                "amount": session.total_cost_credits,
                                "timestamp": datetime.utcnow().isoformat(),
                                "description": f"Weather cancellation refund for session {session.session_id}",
                                "reason": "weather_cancellation"
                            }
                            user.transaction_history.append(refund_transaction)
                    
                    logger.info(f"Auto-cancelled session {session.session_id} due to weather: {reason}")
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error handling weather alert {alert.id}: {str(e)}")
            self.db.rollback()

class WeatherAnalyticsService:
    """Analytics service for weather impact on bookings"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_weather_impact_report(self, start_date: datetime, end_date: datetime) -> Dict:
        """Generate weather impact report for date range"""
        
        # Get all sessions in date range
        try:
            from ..models.location import GameSession, SessionStatus
        except ImportError:
            from models.location import GameSession, SessionStatus
        
        sessions = self.db.query(GameSession).filter(
            GameSession.start_time >= start_date,
            GameSession.start_time <= end_date
        ).all()
        
        # Get weather data for the same period
        weather_data = self.db.query(LocationWeather).filter(
            LocationWeather.weather_time >= start_date,
            LocationWeather.weather_time <= end_date
        ).all()
        
        # Calculate statistics
        total_sessions = len(sessions)
        weather_cancelled = len([s for s in sessions if s.status == SessionStatus.CANCELLED and s.cancellation_reason and "weather" in s.cancellation_reason.lower()])
        weather_warnings = len([s for s in sessions if s.booking_notes and "weather" in s.booking_notes.lower()])
        
        # Weather condition breakdown
        condition_stats = {}
        for weather in weather_data:
            condition = weather.condition.value
            if condition not in condition_stats:
                condition_stats[condition] = {"count": 0, "avg_temp": 0, "sessions": 0}
            condition_stats[condition]["count"] += 1
            condition_stats[condition]["avg_temp"] += weather.temperature
        
        # Calculate averages
        for condition in condition_stats:
            stats = condition_stats[condition]
            if stats["count"] > 0:
                stats["avg_temp"] = round(stats["avg_temp"] / stats["count"], 1)
        
        # Revenue impact
        cancelled_revenue = sum(s.total_cost_credits for s in sessions if s.status == SessionStatus.CANCELLED and s.cancellation_reason and "weather" in s.cancellation_reason.lower())
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days
            },
            "session_impact": {
                "total_sessions": total_sessions,
                "weather_cancelled": weather_cancelled,
                "weather_warnings": weather_warnings,
                "cancellation_rate": round((weather_cancelled / total_sessions * 100) if total_sessions > 0 else 0, 2)
            },
            "revenue_impact": {
                "cancelled_credits": cancelled_revenue,
                "estimated_loss": round(cancelled_revenue * 0.2, 2)  # Assuming 20% don't rebook
            },
            "weather_conditions": condition_stats,
            "recommendations": self._generate_weather_recommendations(condition_stats, weather_cancelled, total_sessions)
        }
    
    def _generate_weather_recommendations(self, condition_stats: Dict, cancelled_count: int, total_sessions: int) -> List[str]:
        """Generate weather-based recommendations"""
        
        recommendations = []
        
        cancellation_rate = (cancelled_count / total_sessions) if total_sessions > 0 else 0
        
        if cancellation_rate > 0.15:  # More than 15% cancellation rate
            recommendations.append("High weather cancellation rate detected. Consider implementing indoor alternatives or flexible rescheduling policies.")
        
        if "heavy_rain" in condition_stats and condition_stats["heavy_rain"]["count"] > 5:
            recommendations.append("Frequent heavy rain detected. Consider covered areas or indoor facilities for rainy season.")
        
        if any(stats["avg_temp"] > 30 for stats in condition_stats.values()):
            recommendations.append("High temperature periods detected. Consider early morning or evening time slots during summer.")
        
        if any(stats["avg_temp"] < 5 for stats in condition_stats.values()):
            recommendations.append("Cold weather periods detected. Consider heated facilities or winter equipment.")
        
        if not recommendations:
            recommendations.append("Weather impact is within normal range. Current weather policies are working well.")
        
        return recommendations

# Global weather service instance (will be initialized in main.py)
weather_api_service = None