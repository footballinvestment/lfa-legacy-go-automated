#!/usr/bin/env python3
"""
LFA Legacy GO - Google Cloud Run Optimized
Location: backend/app/main.py
"""

import os
import sys
import uvicorn
import signal
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Database imports
from app.database import engine, Base, create_tables, verify_database_connection

# === ROUTER IMPORTS ===
# Import all routers with error handling

def safe_import_router(module_name, router_name="router"):
    """Safely import routers with error handling"""
    try:
        # Direct relative import without package parameter
        if module_name == "auth":
            from app.routers.auth import router
        elif module_name == "credits":
            from app.routers.credits import router
        elif module_name == "social":
            from app.routers.social import router
        elif module_name == "locations":
            from app.routers.locations import router
        elif module_name == "booking":
            from app.routers.booking import router
        elif module_name == "tournaments":
            from app.routers.tournaments import router
        elif module_name == "weather":
            from app.routers.weather import router
        elif module_name == "game_results":
            from app.routers.game_results import router
        elif module_name == "admin":
            from app.routers.admin import router
        elif module_name == "health":
            from app.routers.health import router
        else:
            print(f"❌ Unknown router: {module_name}")
            return None
            
        print(f"✅ Successfully imported {module_name} router")
        return router
    except Exception as e:
        print(f"❌ Failed to import {module_name} router: {e}")
        return None

# Import all available routers
auth_router = safe_import_router("auth")
credits_router = safe_import_router("credits") 
social_router = safe_import_router("social")
locations_router = safe_import_router("locations")
booking_router = safe_import_router("booking")
tournaments_router = safe_import_router("tournaments")
weather_router = safe_import_router("weather")
game_results_router = safe_import_router("game_results")
admin_router = safe_import_router("admin")
health_router = safe_import_router("health")

# === FASTAPI APPLICATION SETUP ===

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=os.getenv("API_TITLE", "LFA Legacy GO API - Protected"),
    description="🛡️ Spam-Protected Football Training Platform",
    version=os.getenv("API_VERSION", "3.1.0"),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    debug=os.getenv("DEBUG", "false").lower() == "true"
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# === CORS CONFIGURATION ===

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://lfa-legacy-go.netlify.app",              # Netlify frontend
        "https://*.run.app",                              # Cloud Run domains
        "http://localhost:3000",                          # Local frontend
        "http://localhost:3001", 
        "http://localhost:8000",                          # Local backend
        "http://localhost:8001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8001"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    expose_headers=["*"],
    max_age=600,
)

# === ROOT ENDPOINTS ===

@app.options("/{full_path:path}")
async def options_handler():
    """Handle CORS preflight OPTIONS requests"""
    from fastapi import Response
    return Response(status_code=200)

@app.get("/")
async def root():
    """Root endpoint with comprehensive application status"""
    return {
        "message": "LFA Legacy GO API - Google Cloud Run",
        "status": "running",
        "version": os.getenv("API_VERSION", "3.0.0"),
        "environment": os.getenv("ENVIRONMENT", "production"),
        "platform": "google_cloud_run",
        "port": os.getenv("PORT", "8080"),
        "location": "backend/app/main.py",
        "routers_loaded": get_loaded_routers_count(),
        "database_status": "connected",
        "scaling": "automatic",
        "features": [
            "Authentication System", "Credit Purchase System", "Social Features",
            "Location Management", "Booking System", "Tournament Management",
            "Weather Integration", "Game Results Tracking", "Admin Panel",
            "Health Monitoring"
        ]
    }

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint for Cloud Run"""
    try:
        db_status = verify_database_connection()
        router_count = get_loaded_routers_count()
        
        return {
            "status": "healthy",
            "service": "LFA Legacy GO API",
            "version": os.getenv("API_VERSION", "3.0.0"),
            "environment": os.getenv("ENVIRONMENT", "production"),
            "platform": "google_cloud_run",
            "database": "connected" if db_status else "disconnected",
            "routers_active": router_count,
            "routers_expected": 10,
            "location": "backend/app/main.py",
            "port": os.getenv("PORT", "8080"),
            "revision": os.getenv("K_REVISION", "unknown"),
            "service_name": os.getenv("K_SERVICE", "unknown")
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "service": "LFA Legacy GO API",
                "platform": "google_cloud_run"
            }
        )

def get_loaded_routers_count():
    """Count successfully loaded routers"""
    routers = [
        auth_router, credits_router, social_router, locations_router,
        booking_router, tournaments_router, weather_router, 
        game_results_router, admin_router, health_router
    ]
    return len([r for r in routers if r is not None])

# === ROUTER REGISTRATION ===

def register_all_routers():
    """Register all available routers with comprehensive error handling"""
    
    router_configs = [
        (auth_router, "/api/auth", "Authentication", "JWT-based user authentication system"),
        (credits_router, "/api/credits", "Credits", "Credit purchase and management system"),
        (social_router, "/api/social", "Social", "Friend requests and social features"),
        (locations_router, "/api/locations", "Locations", "Location and venue management"),
        (booking_router, "/api/booking", "Booking", "Game session booking system"),
        (tournaments_router, "/api/tournaments", "Tournaments", "Tournament management system"),
        (weather_router, "/api/weather", "Weather", "Weather integration service"),
        (game_results_router, "/api/game-results", "Game Results", "Game statistics and results tracking"),
        (admin_router, "/api/admin", "Administration", "Admin panel and moderation tools"),
        (health_router, "/api/health", "Health", "System health monitoring")
    ]
    
    loaded_count = 0
    failed_routers = []
    
    for router, prefix, name, description in router_configs:
        if router is not None:
            try:
                app.include_router(router, prefix=prefix, tags=[name])
                print(f"✅ Registered {name} router at {prefix} - {description}")
                loaded_count += 1
            except Exception as e:
                print(f"❌ Failed to register {name} router: {e}")
                failed_routers.append(name)
        else:
            print(f"⚠️ Skipped {name} router (import failed)")
            failed_routers.append(name)
    
    print(f"🚀 Successfully loaded {loaded_count}/10 routers")
    
    if failed_routers:
        print(f"⚠️ Failed routers: {', '.join(failed_routers)}")
    
    return loaded_count

# === DATABASE INITIALIZATION ===

def initialize_database():
    """Initialize database tables and verify connection"""
    try:
        print("🗄️ Initializing database...")
        
        # Create all tables
        create_tables()
        print("✅ Database tables created/verified")
        
        # Verify connection
        if verify_database_connection():
            print("✅ Database connection verified")
            return True
        else:
            print("❌ Database connection failed")
            return False
            
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        return False

# === APPLICATION STARTUP ===

@app.on_event("startup")
async def startup_event():
    """Complete application startup sequence"""
    print("🚀 LFA Legacy GO API Starting on Google Cloud Run...")
    print("=" * 60)
    print(f"📍 Location: backend/app/main.py")
    print(f"🌍 Environment: {os.getenv('ENVIRONMENT', 'production')}")
    print(f"🔧 Port: {os.getenv('PORT', '8080')}")
    print(f"☁️ Platform: Google Cloud Run")
    print(f"🔄 Revision: {os.getenv('K_REVISION', 'unknown')}")
    print("=" * 60)
    
    try:
        db_success = initialize_database()
        if not db_success:
            print("⚠️ Database initialization failed, but continuing...")
        
        router_count = register_all_routers()
        
        print("=" * 60)
        print(f"✅ Cloud Run startup complete!")
        print(f"🔥 {router_count}/10 routers active")
        print(f"🌐 Available at: https://<service-url>.run.app")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Critical startup error: {e}")
        print("🚨 Application may not function properly!")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown sequence"""
    print("🛑 LFA Legacy GO API shutting down...")

# === EXCEPTION HANDLERS ===

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler with helpful information"""
    return JSONResponse(
        status_code=404,
        content={
            "status": "error",
            "code": 404,
            "message": "Endpoint not found",
            "suggestion": "Check the API documentation",
            "available_endpoints": {
                "documentation": "/docs",
                "health_check": "/health", 
                "authentication": "/api/auth",
                "credits": "/api/credits",
                "social": "/api/social",
                "locations": "/api/locations",
                "booking": "/api/booking",
                "tournaments": "/api/tournaments",
                "weather": "/api/weather",
                "game_results": "/api/game-results",
                "admin": "/api/admin"
            }
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Custom 500 handler"""
    return JSONResponse(
        status_code=500,
        content={
            "status": "error", 
            "code": 500,
            "message": "Internal server error",
            "service": "LFA Legacy GO API",
            "suggestion": "Check server logs for details"
        }
    )

# === CLOUD RUN OPTIMIZED STARTUP ===
def handle_signals():
    """Handle Cloud Run shutdown signals gracefully"""
    def signal_handler(signum, frame):
        print(f"🔔 Received signal {signum}, shutting down gracefully...")
        sys.exit(0)
    
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))  # Cloud Run uses 8080 default
    host = "0.0.0.0"  # Required for Cloud Run
    
    handle_signals()
    
    print("☁️ Google Cloud Run Deployment Starting...")
    print("=" * 70)
    print(f"📍 Application: LFA Legacy GO API")
    print(f"🌍 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"☁️ Platform: Google Cloud Run")
    print("=" * 70)
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        log_level="info",
        access_log=True,
        workers=1,
        loop="uvloop",
        http="httptools",
        reload=False,
        timeout_keep_alive=30
    )