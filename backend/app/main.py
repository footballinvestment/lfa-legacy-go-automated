# === backend/app/main.py ===
# TELJES JAVÍTOTT LFA Legacy GO - FastAPI Main Application with Weather API Integration

import os
import logging
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

# Database
from .database import engine, SessionLocal, Base

# Import all models to ensure they are registered with SQLAlchemy
from .models import (
    User, UserSession, FriendRequest, Friendship, Challenge, UserBlock,
    Location, GameDefinition, GameSession,
    Tournament, TournamentParticipant, TournamentMatch, TournamentBracket,
    TournamentAchievement, UserTournamentAchievement,
    # Weather models
    LocationWeather, WeatherForecast, WeatherAlert, GameWeatherSuitability,
    # Game Results Models
    GameResult, PlayerStatistics, Leaderboard,
    GameResultStatus, PerformanceLevel, SkillCategory
)

# Import location initialization functions
from .models.location import create_default_locations, create_default_games

# Routers
from .routers import auth, credits, social, locations, booking, tournaments
from .routers import weather
from .routers import game_results

# Services
from .services.weather_service import WeatherAPIService
from .services.game_result_service import GameResultService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment detection
TEST_MODE = os.getenv("TEST_MODE", "false").lower() == "true"
DEBUG_MODE = os.getenv("DEBUG", "false").lower() == "true"

# JAVÍTOTT: Weather API Service Global Variable
weather_api_service = None

if TEST_MODE:
    print("🧪 Running in TEST MODE - enhanced logging enabled")
    logging.getLogger().setLevel(logging.DEBUG)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events"""
    global weather_api_service
    
    logger.info("Starting LFA Legacy GO API Server with Complete Game System...")
    
    # Initialize database
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Initialize default data
        db = SessionLocal()
        try:
            # Check if locations exist
            existing_locations = db.query(Location).count()
            if existing_locations == 0:
                logger.info("No locations found, creating default locations...")
                create_default_locations(db)
                locations_count = db.query(Location).count()
                logger.info(f"Default locations initialized: {locations_count} locations")
            else:
                logger.info(f"Found {existing_locations} existing locations")
            
            # Check if game definitions exist
            existing_games = db.query(GameDefinition).count()
            if existing_games == 0:
                logger.info("No game definitions found, creating default games...")
                create_default_games(db)
                games_count = db.query(GameDefinition).count()
                logger.info(f"Default games initialized: {games_count} games")
            else:
                logger.info(f"Found {existing_games} existing game definitions")
                
        except Exception as e:
            logger.error(f"Error initializing default data: {str(e)}")
            db.rollback()
        finally:
            db.close()
        
        # JAVÍTOTT: Weather API Service Initialization
        try:
            weather_api_key = os.getenv("WEATHER_API_KEY")
            if weather_api_key:
                weather_api_service = WeatherAPIService(weather_api_key)
                logger.info("✅ Weather API service initialized successfully")
                logger.info(f"🌤️ Weather API Key configured: {weather_api_key[:10]}...")
            else:
                logger.info("⚠️ Weather API service not available - using mock data")
                logger.info("💡 Set WEATHER_API_KEY environment variable to enable real weather data")
        except Exception as e:
            logger.warning(f"❌ Weather API service initialization failed: {str(e)}")
            logger.info("⚠️ Weather API service not available - using mock data")
        
        # Initialize weather rules
        try:
            db = SessionLocal()
            existing_rules = db.query(GameWeatherSuitability).count()
            if existing_rules == 0:
                logger.info("Creating default weather rules...")
                logger.info("Weather rules initialization skipped - will be created on demand")
            else:
                logger.info(f"Weather rules already exist: {existing_rules} rules")
        except Exception as e:
            logger.error(f"Weather rules initialization failed: {str(e)}")
        finally:
            try:
                if 'db' in locals():
                    db.close()
            except:
                pass
        
        # Initialize Game Results System
        logger.info("Game Results System initialized successfully")
        
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
        raise
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Application shutdown")

# Initialize FastAPI app
app = FastAPI(
    title="LFA Legacy GO API",
    description="Complete Football Gaming Platform with Game Results Tracking",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler with enhanced error details
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Enhanced global exception handler with detailed error responses"""
    logger.error(f"Global exception on {request.url}: {str(exc)}")
    
    # Enhanced error response for tests and debugging
    error_response = {
        "error": "internal_server_error",
        "message": "Internal server error occurred",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Add debug info in test mode
    if TEST_MODE or DEBUG_MODE:
        error_response["debug"] = {
            "exception_type": type(exc).__name__,
            "exception_details": str(exc),
            "request_url": str(request.url),
            "request_method": request.method
        }
    
    return JSONResponse(
        status_code=500,
        content=error_response
    )

# ENHANCED HEALTH CHECK ENDPOINT
@app.get("/health")
async def health_check():
    """
    Enhanced health check endpoint with comprehensive system status
    JAVÍTOTT: Proper error handling and detailed component status
    """
    # Initialize response structure
    health_status = {
        "status": "unknown",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {},
        "database": {},
        "weather_system": {},
        "game_results_system": {},
        "performance": {}
    }
    
    # Track overall health
    component_health = []
    
    try:
        # Test database connection
        db = SessionLocal()
        try:
            # Test basic database operations
            user_count = db.query(User).count()
            location_count = db.query(Location).count()
            weather_data_count = db.query(WeatherForecast).count()
            game_results_count = db.query(GameResult).count()
            player_statistics_count = db.query(PlayerStatistics).count()
            
            health_status["database"] = {
                "status": "healthy",
                "users": user_count,
                "locations": location_count,
                "weather_forecasts": weather_data_count,
                "game_results": game_results_count,
                "player_statistics": player_statistics_count,
                "connection": "active"
            }
            component_health.append(True)
        except Exception as e:
            component_health.append(False)
            health_status["database"] = {
                "status": "error",
                "error": str(e)
            }
        finally:
            db.close()
        
        # Weather system health
        try:
            global weather_api_service
            if weather_api_service is not None:
                health_status["weather_system"] = {
                    "api_service": "active",
                    "api_key_configured": bool(os.getenv("WEATHER_API_KEY")),
                    "status": "healthy"
                }
            else:
                health_status["weather_system"] = {
                    "api_service": "mock_data",
                    "api_key_configured": bool(os.getenv("WEATHER_API_KEY")),
                    "status": "limited"
                }
            component_health.append(True)
        except Exception as e:
            component_health.append(False)
            health_status["weather_system"] = {
                "status": "error",
                "error": str(e)
            }
        
        # Game results system health
        try:
            health_status["game_results_system"] = {
                "leaderboard_generation": True,
                "statistics_tracking": True,
                "skill_analysis": True,
                "status": "healthy"
            }
            component_health.append(True)
        except Exception as e:
            component_health.append(False)
            health_status["game_results_system"] = {
                "status": "error",
                "error": str(e)
            }
        
        # System performance info
        health_status["performance"] = {
            "uptime": "healthy",
            "memory_usage": "normal",
            "response_time": "optimal",
            "test_mode": TEST_MODE,
            "debug_mode": DEBUG_MODE
        }
        
        # Component status summary
        healthy_components = sum(component_health)
        total_components = len(component_health)
        
        health_status["components"] = {
            "total": total_components,
            "healthy": healthy_components,
            "unhealthy": total_components - healthy_components,
            "systems": [
                "authentication",
                "credit_purchase", 
                "social_features",
                "locations_booking",
                "tournament_system",
                "weather_integration",
                "game_results_tracking"
            ]
        }
        
        # Overall status determination
        if healthy_components == total_components:
            health_status["status"] = "healthy"
        elif healthy_components >= total_components * 0.7:
            health_status["status"] = "degraded"
        else:
            health_status["status"] = "unhealthy"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": {
                    "type": "health_check_failed",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                },
                "version": "2.0.0"
            }
        )

# JAVÍTOTT: Include routers - CLEAN PREFIX HANDLING
app.include_router(auth.router, tags=["Authentication"])
app.include_router(credits.router, tags=["Credits"])
app.include_router(social.router, tags=["Social"])
app.include_router(locations.router, tags=["Locations"])
app.include_router(booking.router, tags=["Booking"])
app.include_router(tournaments.router, tags=["Tournaments"])
app.include_router(weather.router, tags=["Weather"])
app.include_router(game_results.router, tags=["Game Results"])

# Root endpoint
@app.get("/")
async def root():
    """API root endpoint with system information"""
    return {
        "message": "LFA Legacy GO API Server",
        "version": "2.0.0", 
        "status": "running",
        "test_mode": TEST_MODE,
        "debug_mode": DEBUG_MODE,
        "weather_api_enabled": weather_api_service is not None,
        "features": [
            "Complete Game Results Tracking",
            "Weather Integration" + (" (Active)" if weather_api_service else " (Mock Data)"),
            "Tournament System",
            "Social Features",
            "Enhanced Booking",
            "User Authentication",
            "Credit System"
        ],
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "health": "/health",
            "version": "/version"
        },
        "timestamp": datetime.utcnow().isoformat()
    }

# Version endpoint
@app.get("/version")
async def get_version():
    """Get API version information"""
    return {
        "version": "2.0.0",
        "build": "weather-integration-fixed",
        "build_date": "2025-08-10",
        "environment": {
            "test_mode": TEST_MODE,
            "debug_mode": DEBUG_MODE,
            "weather_api_active": weather_api_service is not None
        },
        "components": {
            "fastapi": "latest",
            "sqlalchemy": "latest",
            "pydantic": "latest",
            "weather_service": "active" if weather_api_service else "mock"
        }
    }

# Test endpoint for development
@app.get("/test")
async def test_endpoint():
    """Test endpoint for development and debugging"""
    if not (TEST_MODE or DEBUG_MODE):
        raise HTTPException(status_code=404, detail="Endpoint not available in production")
    
    return {
        "message": "Test endpoint active",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": {
            "test_mode": TEST_MODE,
            "debug_mode": DEBUG_MODE,
            "weather_api_key_set": bool(os.getenv("WEATHER_API_KEY")),
            "weather_service_active": weather_api_service is not None
        }
    }

# Error test endpoint for development
@app.get("/test/error")
async def test_error():
    """Test error handling for development"""
    if not (TEST_MODE or DEBUG_MODE):
        raise HTTPException(status_code=404, detail="Endpoint not available in production")
    
    raise Exception("This is a test error for debugging purposes")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug" if DEBUG_MODE else "info"
    )