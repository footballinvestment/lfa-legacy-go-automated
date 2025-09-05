# === backend/app/main_production.py ===
# LFA Legacy GO - Production Ready with Standardized API
# Version 3.0 with comprehensive API standards, monitoring, and production features

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware as FastAPICORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import logging
import sys
import os
from datetime import datetime

# Import production-ready components
from app.core.api_response import ResponseBuilder, ApiException
from app.middleware.api_middleware import (
    RequestLoggingMiddleware,
    CORSMiddleware,
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
    RequestSizeMiddleware,
)
from app.core.database_production import db_config
from app.core.logging import setup_logging, get_logger
from app.core.openapi_config import setup_enhanced_openapi

# Setup production logging - disable file logging for Google Cloud
setup_logging(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    enable_file_logging=False,  # Disabled for Google Cloud (read-only filesystem)
    enable_json_logging=os.getenv("JSON_LOGGING", "false").lower() == "true",
)

logger = get_logger("main")

# Initialize FastAPI app with comprehensive metadata and performance optimizations
app = FastAPI(
    title="LFA Legacy GO API",
    default_response_class=ORJSONResponse,  # Faster JSON responses
    description="""
    🏆 **Football Training Platform - Production API**

    A comprehensive football training and tournament management system
    with gamification elements inspired by Pokémon GO.

    ## Features
    - User authentication and management
    - Tournament creation and participation
    - Location-based training sessions
    - Social features (friends, challenges)
    - Credit system and rewards
    - Real-time performance tracking

    ## API Standards
    All endpoints follow consistent response formats:
    - Success responses include `success`, `data`, `message`, `timestamp`, `request_id`
    - Error responses include `success`, `error`, `message`, `timestamp`, `request_id`
    - Pagination support for list endpoints
    - Request tracking with unique IDs
    """,
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "Authentication",
            "description": "User authentication and authorization",
        },
        {"name": "Users", "description": "User management and profiles"},
        {"name": "Tournaments", "description": "Tournament creation and management"},
        {"name": "Locations", "description": "Training location services"},
        {"name": "Booking", "description": "Session booking and scheduling"},
        {"name": "Social", "description": "Friends, challenges, and social features"},
        {"name": "Credits", "description": "Credit system and transactions"},
        {"name": "Game Results", "description": "Game results and statistics"},
        {"name": "Weather", "description": "Weather information for training"},
        {"name": "Admin", "description": "Administrative functions"},
        {"name": "Health", "description": "System health and monitoring"},
        {"name": "Performance", "description": "Performance monitoring and metrics"},
    ],
    contact={
        "name": "LFA Legacy GO Support",
        "email": "support@lfa-legacy-go.com",
    },
    license_info={
        "name": "MIT",
    },
)

# Setup enhanced OpenAPI documentation
setup_enhanced_openapi(app)

# WebSocket integration
try:
    import socketio
    from app.websocket.chat_manager import sio
    logger.info("🔌 Integrating WebSocket support...")
    
    # Mount Socket.IO app
    socket_app = socketio.ASGIApp(sio, app)
    logger.info("✅ WebSocket integration completed")
except ImportError as e:
    logger.warning(f"⚠️ WebSocket not available: {e}")
    socket_app = app
except Exception as e:
    logger.error(f"❌ WebSocket integration failed: {e}")
    socket_app = app

# Production middleware stack (order matters!)
logger.info("🔧 Setting up production middleware stack...")

# 0. GZip compression (first for response compression)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 1. Security headers (first for all responses)
app.add_middleware(SecurityHeadersMiddleware)

# 2. Request size limiting
max_request_size = int(os.getenv("MAX_REQUEST_SIZE", str(10 * 1024 * 1024)))  # 10MB
app.add_middleware(RequestSizeMiddleware, max_size=max_request_size)

# 3. Rate limiting
rate_limit_requests = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
rate_limit_window = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
app.add_middleware(
    RateLimitMiddleware,
    max_requests=rate_limit_requests,
    window_seconds=rate_limit_window,
)

# 4. CORS middleware
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,https://lfa-legacy-go.netlify.app,http://localhost:3001,http://localhost:8000").split(",")
app.add_middleware(
    CORSMiddleware,
    allowed_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 5. Performance monitoring middleware
from app.middleware.performance_middleware import PerformanceMiddleware

app.add_middleware(PerformanceMiddleware)

# 6. Request logging and ID tracking (last for complete request data)
app.add_middleware(RequestLoggingMiddleware)


# Global exception handler for API exceptions
@app.exception_handler(ApiException)
async def api_exception_handler(request: Request, exc: ApiException):
    """Handle custom API exceptions"""
    return ResponseBuilder.error(
        error_code=exc.error_code,
        error_message=exc.message,
        details=exc.details,
        status_code=exc.status_code,
        request_id=getattr(request.state, "request_id", None),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle FastAPI HTTP exceptions"""
    return ResponseBuilder.error(
        error_code="HTTP_ERROR",
        error_message=exc.detail,
        status_code=exc.status_code,
        request_id=getattr(request.state, "request_id", None),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.exception(f"Unhandled exception: {str(exc)}")
    return ResponseBuilder.internal_error(
        message="An unexpected error occurred",
        error_details=str(exc),
        request_id=getattr(request.state, "request_id", None),
    )


# Router status tracking
routers_status = {}
active_routers = 0


def safe_import_router(router_path: str):
    """Safely import a router with comprehensive error handling"""
    try:
        logger.info(f"📦 Importing {router_path} router...")

        # Use absolute imports with error handling
        if router_path == "auth":
            from app.routers.auth import router
        elif router_path == "credits":
            from app.routers.credits import router
        elif router_path == "social":
            from app.routers.social import router
        elif router_path == "locations":
            from app.routers.locations import router
        elif router_path == "booking":
            from app.routers.booking import router
        elif router_path == "tournaments":
            from app.routers.tournaments import router
        elif router_path == "monitoring":
            from app.routers.monitoring import router
        elif router_path == "game_results":
            from app.routers.game_results import router
        elif router_path == "weather":
            from app.routers.weather import router
        elif router_path == "admin":
            from app.routers.admin import router
        elif router_path == "health":
            from app.routers.health_v2 import router
        elif router_path == "frontend_errors":
            from app.routers.frontend_errors import router
        elif router_path == "cached_users":
            from app.routers.cached_users import router
        elif router_path == "advanced_cache":
            from app.routers.advanced_cache import router
        elif router_path == "chat":
            from app.routers.chat import router
        elif router_path == "moderation":
            from app.routers.moderation import router
        else:
            raise ImportError(f"Unknown router: {router_path}")

        routers_status[router_path] = "✅ SUCCESS"
        logger.info(f"✅ {router_path} router imported successfully")
        return router

    except ImportError as e:
        routers_status[router_path] = f"❌ IMPORT FAILED: {str(e)}"
        logger.error(f"❌ Failed to import {router_path} router: {e}")
        return None
    except Exception as e:
        routers_status[router_path] = f"💥 ERROR: {str(e)}"
        logger.error(f"💥 Unexpected error importing {router_path} router: {e}")
        return None


# Import routers with error handling
logger.info("🚀 Starting production router initialization...")

# Core routers
auth_router = safe_import_router("auth")
credits_router = safe_import_router("credits")
social_router = safe_import_router("social")
locations_router = safe_import_router("locations")
booking_router = safe_import_router("booking")
tournaments_router = safe_import_router("tournaments")
monitoring_router = safe_import_router("monitoring")
game_results_router = safe_import_router("game_results")
weather_router = safe_import_router("weather")
admin_router = safe_import_router("admin")
health_router = safe_import_router("health")
frontend_errors_router = safe_import_router("frontend_errors")
cached_users_router = safe_import_router("cached_users")
advanced_cache_router = safe_import_router("advanced_cache")
chat_router = safe_import_router("chat")
moderation_router = safe_import_router("moderation")

# Include routers with production configuration
if auth_router:
    app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
    active_routers += 1

if credits_router:
    app.include_router(credits_router, prefix="/api/credits", tags=["Credits"])
    active_routers += 1

if social_router:
    app.include_router(social_router, prefix="/api/social", tags=["Social"])
    active_routers += 1

if locations_router:
    app.include_router(locations_router, prefix="/api/locations", tags=["Locations"])
    active_routers += 1

if booking_router:
    app.include_router(booking_router, prefix="/api/booking", tags=["Booking"])
    active_routers += 1

if tournaments_router:
    app.include_router(
        tournaments_router, prefix="/api/tournaments", tags=["Tournaments"]
    )
    active_routers += 1

if monitoring_router:
    app.include_router(monitoring_router, tags=["Monitoring"])
    active_routers += 1

if game_results_router:
    app.include_router(
        game_results_router, prefix="/api/game-results", tags=["Game Results"]
    )
    active_routers += 1

if weather_router:
    app.include_router(weather_router, prefix="/api/weather", tags=["Weather"])
    active_routers += 1

if admin_router:
    app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
    active_routers += 1

if health_router:
    app.include_router(health_router, tags=["Health"])
    active_routers += 1

if frontend_errors_router:
    app.include_router(frontend_errors_router, prefix="/api", tags=["Monitoring"])
    active_routers += 1

if cached_users_router:
    app.include_router(cached_users_router, tags=["High Performance"])
    active_routers += 1

if advanced_cache_router:
    app.include_router(advanced_cache_router, tags=["Cache Analytics"])
    active_routers += 1

if chat_router:
    app.include_router(chat_router, tags=["Chat"])
    active_routers += 1
    logger.info("✅ Chat router registered with prefix /api/chat")

if moderation_router:
    app.include_router(moderation_router, tags=["Moderation"])
    active_routers += 1
    logger.info("✅ Moderation router registered with prefix /api/moderation")


# Additional production endpoints
@app.get("/ws/info", tags=["WebSocket"])
async def websocket_info():
    """WebSocket connection information"""
    return ResponseBuilder.success(
        data={
            "websocket_available": True,
            "endpoint": "/ws",
            "protocol": "socket.io",
            "transports": ["websocket", "polling"],
            "cors_enabled": True,
            "auth_required": True
        },
        message="WebSocket info retrieved successfully"
    )

@app.get("/api/health", tags=["Health"])
async def frontend_health_check(request: Request):
    """Frontend compatible health check endpoint"""
    health_data = db_config.health_check()
    
    return ResponseBuilder.success(
        data={
            "status": "healthy" if health_data.get("database", {}).get("status") == "healthy" else "degraded",
            "timestamp": datetime.now().isoformat(),
            "service": "LFA Legacy GO Backend",
            "version": "3.0.0",
        },
        message="Health check completed",
        request_id=getattr(request.state, "request_id", None),
    )

@app.get("/", tags=["Health"])
async def root(request: Request):
    """Root endpoint with API information"""
    return ResponseBuilder.success(
        data={
            "service": "LFA Legacy GO API",
            "version": "3.0.0",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "status": "operational",
            "features": [
                "Authentication & Authorization",
                "Tournament Management",
                "Location Services",
                "Social Features",
                "Credit System",
                "Performance Monitoring",
            ],
            "documentation": {"swagger": "/docs", "redoc": "/redoc"},
        },
        message="LFA Legacy GO API is operational",
        request_id=getattr(request.state, "request_id", None),
    )


@app.get("/api/status", tags=["Health"])
async def api_status(request: Request):
    """Comprehensive API status information"""
    health_data = db_config.health_check()

    return ResponseBuilder.success(
        data={
            "service": "LFA Legacy GO API",
            "version": "3.0.0",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "uptime": datetime.now().isoformat(),
            "routers": {
                "active": active_routers,
                "total": len(routers_status),
                "status": routers_status,
            },
            "database": health_data.get("database", {}),
            "cache": health_data.get("redis", {}),
            "performance": {
                "middleware": "active",
                "monitoring": "enabled",
                "rate_limiting": f"{rate_limit_requests} req/{rate_limit_window}s",
            },
        },
        message="API status retrieved successfully",
        request_id=getattr(request.state, "request_id", None),
    )


@app.get("/api/performance", tags=["Performance"])
async def performance_metrics(request: Request):
    """Get comprehensive performance metrics"""
    try:
        db_metrics = db_config.get_performance_metrics()
        health_data = db_config.health_check()

        # Get API performance stats from middleware
        from app.middleware.performance_middleware import get_performance_stats

        api_performance = get_performance_stats()

        return ResponseBuilder.success(
            data={
                "timestamp": datetime.now().isoformat(),
                "database": db_metrics,
                "system_health": health_data,
                "api_performance": api_performance,
                "api": {
                    "active_routers": active_routers,
                    "total_routers": len(routers_status),
                    "middleware_stack": [
                        "GZipCompression",
                        "SecurityHeaders",
                        "RequestSize",
                        "RateLimit",
                        "CORS",
                        "PerformanceMonitoring",
                        "RequestLogging",
                    ],
                    "optimizations": [
                        "ORJSON response serialization",
                        "GZip response compression",
                        "Connection keep-alive",
                        "Performance monitoring",
                        "Request timeout optimization",
                    ],
                },
            },
            message="Performance metrics retrieved successfully",
            request_id=getattr(request.state, "request_id", None),
        )
    except Exception as e:
        logger.error(f"Failed to get performance metrics: {str(e)}")
        return ResponseBuilder.error(
            error_code="METRICS_ERROR",
            error_message="Failed to retrieve performance metrics",
            details=str(e),
            request_id=getattr(request.state, "request_id", None),
        )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Application startup tasks"""
    logger.info("🔥 LFA Legacy GO API - Production Startup")
    logger.info(f"🌍 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"📊 Active Routers: {active_routers}/{len(routers_status)}")
    logger.info(
        f"🗄️ Database: {db_config.database_url.split('@')[1] if '@' in db_config.database_url else 'local'}"
    )
    logger.info(f"🔒 Security: Headers + Rate Limiting + CORS")
    logger.info(f"📝 Logging: Request tracking with unique IDs")
    logger.info("✅ Production API ready!")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks"""
    logger.info("🔄 Shutting down LFA Legacy GO API...")

    # Close database connections
    db_config.close_connections()

    logger.info("✅ Shutdown completed")


# Router status summary
total_routers = len(routers_status)
logger.info("📊 Production Router Status Summary:")
for router_name, status in routers_status.items():
    logger.info(f"   {router_name}: {status}")

logger.info(f"🎯 Active Routers: {active_routers}/{total_routers}")

if active_routers == total_routers:
    logger.info("🏆 ALL ROUTERS ACTIVE - PRODUCTION READY!")
elif active_routers >= total_routers * 0.8:  # 80% threshold
    logger.warning(
        f"⚠️ Most routers active ({active_routers}/{total_routers}) - Core functionality operational"
    )
else:
    logger.error(
        f"🔴 Critical router failures ({active_routers}/{total_routers}) - Production not recommended"
    )

logger.info("🚀 LFA Legacy GO - Production API initialized successfully!")
logger.info(
    f"📈 Version 3.0.0 with standardized responses, monitoring, and production features"
)
