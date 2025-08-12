# === backend/app/main_weather_backup.py ===
# LFA Legacy GO - FastAPI Main Application with Weather Integration (Backup Version)

import os
import sys
import logging
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Now import everything with absolute paths
from database import engine, SessionLocal, Base
from models.user import User, UserSession
from models.friends import FriendRequest, Friendship, Challenge, UserBlock
from models.location import Location, GameDefinition, GameSession
from models.weather import LocationWeather, WeatherForecast, WeatherAlert, GameWeatherSuitability
from routers import auth, credits, social, locations, booking
from services.weather_service import WeatherAPIService

# Try to import weather router and tournament system
try:
    from routers import weather
    WEATHER_ROUTER_AVAILABLE = True
except ImportError:
    WEATHER_ROUTER_AVAILABLE = False
    print("⚠️ Weather router not available - continuing without weather features")

try:
    from routers import tournaments
    from models.tournament import Tournament, TournamentParticipant, TournamentMatch
    TOURNAMENT_AVAILABLE = True
except ImportError:
    TOURNAMENT_AVAILABLE = False
    print("⚠️ Tournament system not available - continuing without tournaments")

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global weather service variable
global_weather_api_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    
    # Startup
    logger.info("Starting LFA Legacy GO API Server with Weather Integration...")
    
    # Create database tables
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Initialize weather API service if API key is available
        weather_api_key = os.getenv("OPENWEATHERMAP_API_KEY")
        if weather_api_key and WEATHER_ROUTER_AVAILABLE:
            global global_weather_api_service
            global_weather_api_service = WeatherAPIService(weather_api_key) 
            
            # Store in services module for global access
            import services.weather_service as weather_service_module
            weather_service_module.weather_api_service = global_weather_api_service
            
            logger.info("Weather API service initialized successfully")
            
            # Initialize default weather rules if they don't exist
            with SessionLocal() as db:
                from models.weather import initialize_game_weather_suitability
                existing_rules = db.query(GameWeatherSuitability).count()
                if existing_rules == 0:
                    result = initialize_game_weather_suitability(db)
                    logger.info(f"Weather rules initialized: {result['message']}")
        else:
            if not weather_api_key:
                logger.warning("OPENWEATHERMAP_API_KEY not set - weather features will be limited")
            if not WEATHER_ROUTER_AVAILABLE:
                logger.warning("Weather router not available - weather features disabled")
        
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
        raise e
    
    yield
    
    # Shutdown
    logger.info("Shutting down LFA Legacy GO API Server...")
    
    # Close weather API service if it exists
    if global_weather_api_service and hasattr(global_weather_api_service, 'session'):
        if global_weather_api_service.session:
            await global_weather_api_service.session.close()
            logger.info("Weather API service closed")

# Create FastAPI app with lifespan
app = FastAPI(
    title="LFA Legacy GO - API",
    description="Location-based Football Game Platform with Weather Integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(credits.router)
app.include_router(social.router)
app.include_router(locations.router)
app.include_router(booking.router)

if TOURNAMENT_AVAILABLE:
    app.include_router(tournaments.router)
    logger.info("Tournament router included")

if WEATHER_ROUTER_AVAILABLE:
    app.include_router(weather.router)
    logger.info("Weather router included")

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# Root endpoint
@app.get("/")
async def root():
    """API Status and Information"""
    features = [
        "user_authentication",
        "credit_system", 
        "social_features",
        "location_management",
        "booking_system"
    ]
    
    if TOURNAMENT_AVAILABLE:
        features.append("tournament_system")
    
    if WEATHER_ROUTER_AVAILABLE:
        features.append("weather_integration")
    
    return {
        "service": "LFA Legacy GO API",
        "version": "1.0.0",
        "status": "operational",
        "features": features,
        "weather_enabled": os.getenv("OPENWEATHERMAP_API_KEY") is not None and WEATHER_ROUTER_AVAILABLE,
        "tournament_enabled": TOURNAMENT_AVAILABLE,
        "timestamp": datetime.utcnow().isoformat(),
        "docs": "/docs"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Comprehensive Health Check with Weather System Status"""
    
    try:
        # Database health
        with SessionLocal() as db:
            user_count = db.query(User).count()
            location_count = db.query(Location).count()
            
            # Weather specific checks
            weather_rules_count = 0
            recent_weather_count = 0
            
            if WEATHER_ROUTER_AVAILABLE:
                weather_rules_count = db.query(GameWeatherSuitability).count()
                recent_weather_count = db.query(LocationWeather).filter(
                    LocationWeather.updated_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                ).count()
        
        # Weather API health
        weather_api_available = global_weather_api_service is not None
        weather_api_key_set = os.getenv("OPENWEATHERMAP_API_KEY") is not None
        
        # Active routers
        active_routers = ["auth", "credits", "social", "locations", "booking"]
        
        if TOURNAMENT_AVAILABLE:
            active_routers.append("tournaments")
        
        if WEATHER_ROUTER_AVAILABLE:
            active_routers.append("weather")
        
        # Services status
        services = {
            "database": "healthy",
            "authentication": "active",
            "credit_system": "active",
            "social_system": "active",
            "booking_system": "active"
        }
        
        if TOURNAMENT_AVAILABLE:
            services["tournament_system"] = "active"
        
        if WEATHER_ROUTER_AVAILABLE:
            services["weather_api"] = "active" if weather_api_available else "limited"
            services["weather_rules"] = "configured" if weather_rules_count > 0 else "not_configured"
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "uptime": "running",
            "database": {
                "status": "connected",
                "users": user_count,
                "locations": location_count,
                "weather_rules": weather_rules_count,
                "recent_weather_readings": recent_weather_count
            },
            "weather_system": {
                "enabled": WEATHER_ROUTER_AVAILABLE,
                "api_available": weather_api_available,
                "api_key_configured": weather_api_key_set,
                "rules_configured": weather_rules_count > 0,
                "recent_readings": recent_weather_count
            },
            "tournament_system": {
                "enabled": TOURNAMENT_AVAILABLE
            },
            "active_routers": active_routers,
            "services": services,
            "endpoints_count": len([
                route for route in app.routes 
                if hasattr(route, 'methods') and 'GET' in route.methods
            ])
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
                "services": {
                    "database": "error",
                    "weather_system": "unknown"
                }
            }
        )

# Development server startup
if __name__ == "__main__":
    import uvicorn
    
    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        logger.warning("python-dotenv not installed - using system environment variables only")
    
    # Check for port availability
    port = int(os.getenv("PORT", 8000))
    
    logger.info(f"🚀 Starting LFA Legacy GO API Server on port {port}")
    logger.info(f"🌦️ Weather Integration: {'Enabled' if os.getenv('OPENWEATHERMAP_API_KEY') and WEATHER_ROUTER_AVAILABLE else 'Disabled'}")
    logger.info(f"🏆 Tournament System: {'Enabled' if TOURNAMENT_AVAILABLE else 'Disabled'}")
    logger.info(f"📱 API Documentation: http://localhost:{port}/docs")
    logger.info(f"🏥 Health Check: http://localhost:{port}/health")
    
    try:
        uvicorn.run(
            "main_weather_backup:app",
            host="0.0.0.0", 
            port=port,
            reload=True,
            log_level="info",
            access_log=True
        )
    except OSError as e:
        if "Address already in use" in str(e):
            alternative_port = port + 1
            logger.warning(f"Port {port} is in use, trying port {alternative_port}")
            uvicorn.run(
                "main_weather_backup:app",
                host="0.0.0.0",
                port=alternative_port,
                reload=True,
                log_level="info",
                access_log=True
            )
        else:
            raise e