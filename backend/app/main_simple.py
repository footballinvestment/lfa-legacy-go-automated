# LFA Legacy GO - Simple Backend with Phase 1+2 Authentication
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="LFA Legacy GO - Enhanced Auth API",
    description="Enhanced authentication with NIST 2024 password security and email verification",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://lfa-legacy-go.netlify.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
        "http://localhost:8001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Import and include auth router
try:
    from .routers.auth import router as auth_router
    app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
    logger.info("✅ Enhanced auth router imported successfully")
except Exception as e:
    logger.error(f"❌ Failed to import auth router: {str(e)}")

# Import working routers
try:
    from .routers.health import router as health_router
    app.include_router(health_router, prefix="/api/health", tags=["Health"])
    logger.info("✅ Health router imported successfully")
except Exception as e:
    logger.error(f"❌ Failed to import health router: {str(e)}")

try:
    from .routers.locations import router as locations_router
    app.include_router(locations_router, prefix="/api/locations", tags=["Locations"])
    logger.info("✅ Locations router imported successfully")
except Exception as e:
    logger.error(f"❌ Failed to import locations router: {str(e)}")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "LFA Legacy GO - Enhanced Auth API",
        "version": "2.0.0",
        "status": "operational",
        "features": [
            "NIST 2024 Password Security",
            "Email Verification System", 
            "Argon2id Password Hashing",
            "Breach Database Integration"
        ]
    }

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "lfa-legacy-go-enhanced-auth",
        "version": "2.0.0",
        "components": {
            "authentication": "operational",
            "password_security": "operational",
            "email_verification": "operational"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run("app.main_simple:app", host="0.0.0.0", port=port, reload=False)