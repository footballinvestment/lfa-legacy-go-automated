# === backend/app/main.py ===
# LFA Legacy GO - EMERGENCY FIX - Absolute Imports
# VÉGSŐ JAVÍTÁS - Minden router importálás javítva

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
import logging
import sys
import os
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="LFA Legacy GO API", 
    description="Football Training Platform - Pokémon GO Style",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "https://lfa-legacy-go.netlify.app",
        "https://glittering-unicorn-b00443.netlify.app",
        "https://*.netlify.app",
        "https://*.railway.app", 
        "https://*.vercel.app",
        "https://*.run.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Router status tracking
routers_status = {}
active_routers = 0

def safe_import_router(router_path: str, router_name: str = "router"):
    """Safely import a router with absolute imports"""
    try:
        # Use absolute imports
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
        elif router_path == "game_results":
            from app.routers.game_results import router
        elif router_path == "weather":
            from app.routers.weather import router
        elif router_path == "admin":
            from app.routers.admin import router
        else:
            raise ImportError(f"Unknown router: {router_path}")
            
        routers_status[router_path] = "✅ SUCCESS"
        logger.info(f"✅ {router_path} router imported successfully")
        return router
        
    except ImportError as e:
        routers_status[router_path] = f"❌ IMPORT ERROR: {str(e)}"
        logger.error(f"❌ Failed to import {router_path} router: {e}")
        return None
    except Exception as e:
        routers_status[router_path] = f"❌ UNKNOWN ERROR: {str(e)}"
        logger.error(f"❌ Unexpected error importing {router_path}: {e}")
        return None

# Import all routers
logger.info("🚀 Starting LFA Legacy GO Backend...")
logger.info("📦 Importing routers with absolute imports...")

# Import routers one by one
auth_router = safe_import_router("auth")
credits_router = safe_import_router("credits")
social_router = safe_import_router("social")
locations_router = safe_import_router("locations")
booking_router = safe_import_router("booking")
tournaments_router = safe_import_router("tournaments")
game_results_router = safe_import_router("game_results")
weather_router = safe_import_router("weather")
admin_router = safe_import_router("admin")

# Register routers with the app
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
    app.include_router(tournaments_router, prefix="/api/tournaments", tags=["Tournaments"])
    active_routers += 1

if game_results_router:
    app.include_router(game_results_router, prefix="/api/game-results", tags=["Game Results"])
    active_routers += 1

if weather_router:
    app.include_router(weather_router, tags=["Weather"])
    active_routers += 1

if admin_router:
    app.include_router(admin_router, tags=["Administration"])
    active_routers += 1

# Router status summary
total_routers = 9
logger.info("📊 Router Status Summary:")
for router_name, status in routers_status.items():
    logger.info(f"   {router_name}: {status}")

logger.info(f"🎯 Active Routers: {active_routers}/{total_routers}")

if active_routers == total_routers:
    logger.info("🏆 ALL ROUTERS ACTIVE - 9/9 SUCCESS!")
elif active_routers >= 7:
    logger.warning(f"⚠️ Most routers active ({active_routers}/{total_routers}) - Core functionality working")
else:
    logger.error(f"🔴 Critical router failures ({active_routers}/{total_routers}) - System may be unstable")

# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "LFA Legacy GO API",
        "version": "2.1.0",
        "status": "operational",
        "active_routers": f"{active_routers}/{total_routers}",
        "router_status": routers_status,
        "timestamp": datetime.now().isoformat()
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check"""
    
    # Database check (simplified)
    db_status = "healthy"
    try:
        from app.database import SessionLocal
        from sqlalchemy import text
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception as e:
        db_status = f"degraded: {str(e)[:100]}"
        db_healthy = False
    
    # Overall status
    overall_status = "healthy" if active_routers >= 7 and db_healthy else "degraded"
    
    return {
        "status": overall_status,
        "timestamp": datetime.now().isoformat(),
        "version": "2.1.0",
        "database": {
            "status": db_status,
            "healthy": db_healthy
        },
        "routers": {
            "active": active_routers,
            "total": total_routers,
            "percentage": round((active_routers / total_routers) * 100, 1),
            "status": routers_status
        }
    }

# API Health check endpoint (frontend compatibility)
@app.get("/api/health") 
async def api_health_check():
    """API Health check for frontend compatibility"""
    
    # Database check (simplified)
    db_status = "healthy"
    try:
        from app.database import SessionLocal
        from sqlalchemy import text
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception as e:
        db_status = f"degraded: {str(e)[:100]}"
        db_healthy = False
    
    # Overall status
    overall_status = "healthy" if active_routers >= 7 and db_healthy else "degraded"
    
    return {
        "status": overall_status,
        "service": "LFA Legacy GO API",
        "timestamp": datetime.now().isoformat(),
        "version": "2.1.0", 
        "database": {
            "status": db_status,
            "healthy": db_healthy
        },
        "routers": {
            "active": active_routers,
            "total": total_routers,
            "percentage": round((active_routers / total_routers) * 100, 1)
        },
        "features": {
            "authentication": "active",
            "tournaments": "active", 
            "credits": "active",
            "coupons": "active",
            "social": "active"
        }
    }

# Database initialization
@app.on_event("startup")
async def startup_event():
    """Application startup"""
    logger.info("🔥 Application startup initiated")
    
    try:
        # Database initialization (optional)
        try:
            from app.database import init_database
            init_database()
            logger.info("✅ Database initialization complete")
            
            # Create admin user if not exists
            try:
                from app.models.user import User
                from app.database import SessionLocal
                from passlib.context import CryptContext
                from sqlalchemy import text
                
                pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
                
                with SessionLocal() as db:
                    # Check if admin exists
                    result = db.execute(text("SELECT id, username FROM users WHERE username = 'admin'")).fetchone()
                    
                    if not result:
                        # Create admin user
                        password_hash = pwd_context.hash("admin123")
                        
                        sql = """
                        INSERT INTO users (
                            username, email, full_name, hashed_password, user_type, is_active, is_premium,
                            level, xp, credits, games_played, games_won, total_playtime_minutes,
                            achievement_points, total_score, average_performance,
                            friend_count, challenge_wins, challenge_losses, tournament_wins,
                            total_credits_purchased, login_count, total_sessions,
                            language, timezone, platform
                        ) 
                        VALUES (
                            :username, :email, :full_name, :password_hash, :user_type, :is_active, :is_premium,
                            :level, :xp, :credits, :games_played, :games_won, :total_playtime_minutes,
                            :achievement_points, :total_score, :average_performance,
                            :friend_count, :challenge_wins, :challenge_losses, :tournament_wins,
                            :total_credits_purchased, :login_count, :total_sessions,
                            :language, :timezone, :platform
                        )
                        """
                        
                        db.execute(text(sql), {
                            'username': 'admin',
                            'email': 'admin@lfagolegacy.com',
                            'full_name': 'System Administrator',
                            'password_hash': password_hash,
                            'user_type': 'admin',
                            'is_active': True,
                            'is_premium': False,
                            'level': 1,
                            'xp': 0,
                            'credits': 1000,
                            'games_played': 0,
                            'games_won': 0,
                            'total_playtime_minutes': 0,
                            'achievement_points': 0,
                            'total_score': 0.0,
                            'average_performance': 0.0,
                            'friend_count': 0,
                            'challenge_wins': 0,
                            'challenge_losses': 0,
                            'tournament_wins': 0,
                            'total_credits_purchased': 0,
                            'login_count': 0,
                            'total_sessions': 0,
                            'language': 'en',
                            'timezone': 'UTC',
                            'platform': 'web'
                        })
                        
                        db.commit()
                        logger.info("✅ Admin user created: admin/admin123")
                    else:
                        logger.info("✅ Admin user already exists")
                        
            except Exception as e:
                logger.warning(f"⚠️ Could not create admin user: {e}")
                
        except Exception as e:
            logger.info(f"📋 Database initialization skipped: {e}")
        
        logger.info("🎉 LFA Legacy GO Backend startup complete!")
        logger.info(f"📊 Final Status: {active_routers}/{total_routers} routers active")
        
        if active_routers == total_routers:
            logger.info("🏆 PERFECT STARTUP - ALL SYSTEMS OPERATIONAL!")
        
    except Exception as e:
        logger.error(f"💥 Startup error: {str(e)}")

@app.on_event("shutdown") 
async def shutdown_event():
    """Application shutdown"""
    logger.info("🛑 Application shutdown")

# Development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)), reload=True)