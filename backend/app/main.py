from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db
from pydantic import BaseModel

app = FastAPI(title="LFA Legacy GO API")

# CRITICAL: CORS configuration to allow Netlify domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://lfa-legacy-go.netlify.app",
        "https://lfa-legacy-go-frontend.netlify.app", 
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    username: str
    email: str  
    password: str
    full_name: str

class LoginRequest(BaseModel):
    username: str
    password: str

@app.get("/health")
async def health():
    return {"status": "healthy", "database": "postgresql", "cors": "enabled"}

@app.post("/api/auth/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Create proper AuthResponse for frontend compatibility
    mock_user = {
        "id": 1,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "display_name": user.full_name,
        "bio": "",
        "level": 1,
        "xp": 0,
        "credits": 1000,
        "skills": {},
        "games_played": 0,
        "games_won": 0,
        "games_lost": 0,
        "friend_count": 0,
        "challenge_wins": 0,
        "challenge_losses": 0,
        "total_achievements": 0,
        "is_premium": False,
        "premium_expires_at": None,
        "user_type": "user",
        "is_active": True,
        "is_admin": False,
        "mfa_enabled": False,
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": None,
        "last_activity": None
    }
    
    return {
        "access_token": f"mock_token_for_{user.username}",
        "token_type": "bearer",
        "expires_in": 86400,
        "user": mock_user
    }

@app.post("/api/auth/login") 
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    # Create proper AuthResponse for frontend compatibility
    mock_user = {
        "id": 1,
        "username": credentials.username,
        "email": f"{credentials.username}@example.com",
        "full_name": f"User {credentials.username}",
        "display_name": f"User {credentials.username}",
        "bio": "",
        "level": 1,
        "xp": 0,
        "credits": 1000,
        "skills": {},
        "games_played": 0,
        "games_won": 0,
        "games_lost": 0,
        "friend_count": 0,
        "challenge_wins": 0,
        "challenge_losses": 0,
        "total_achievements": 0,
        "is_premium": False,
        "premium_expires_at": None,
        "user_type": "user",
        "is_active": True,
        "is_admin": False,
        "mfa_enabled": False,
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": None,
        "last_activity": None
    }
    
    return {
        "access_token": f"mock_token_for_{credentials.username}",
        "token_type": "bearer",
        "expires_in": 86400,
        "user": mock_user
    }

@app.get("/api/auth/me")
async def get_current_user(db: Session = Depends(get_db)):
    # Return mock user data for testing
    return {
        "id": 1,
        "username": "current_user",
        "email": "current_user@example.com",
        "full_name": "Current User",
        "display_name": "Current User",
        "bio": "",
        "level": 1,
        "xp": 0,
        "credits": 1000,
        "skills": {},
        "games_played": 0,
        "games_won": 0,
        "games_lost": 0,
        "friend_count": 0,
        "challenge_wins": 0,
        "challenge_losses": 0,
        "total_achievements": 0,
        "is_premium": False,
        "premium_expires_at": None,
        "user_type": "user",
        "is_active": True,
        "is_admin": False,
        "mfa_enabled": False,
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": None,
        "last_activity": None
    }

@app.post("/api/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}

@app.post("/api/auth/mfa/setup-totp")
async def setup_totp(db: Session = Depends(get_db)):
    """Setup TOTP authenticator for user"""
    # Mock TOTP setup response
    secret = "JBSWY3DPEHPK3PXP"  # Base32 encoded secret
    username = "user@example.com"  # In real app, get from authenticated user
    issuer = "LFA Legacy GO"
    
    qr_url = f"otpauth://totp/{issuer}:{username}?secret={secret}&issuer={issuer}"
    
    return {
        "success": True,
        "secret": secret,
        "qr_code_url": qr_url,
        "backup_codes": [
            "12345678", "87654321", "11111111", "22222222", "33333333",
            "44444444", "55555555", "66666666", "77777777", "88888888"
        ]
    }

@app.post("/api/auth/mfa/verify-totp")
async def verify_totp(request: dict, db: Session = Depends(get_db)):
    """Verify TOTP code"""
    code = request.get("code", "")
    
    # Mock verification logic
    if len(code) == 6 and code.isdigit():
        # Accept any 6-digit code for testing
        return {
            "success": True,
            "message": "TOTP code verified successfully"
        }
    else:
        return {
            "success": False,
            "message": "Invalid TOTP code. Please enter a 6-digit code."
        }

@app.post("/api/auth/mfa/verify-setup")
async def verify_mfa_setup(request: dict, db: Session = Depends(get_db)):
    """Verify MFA setup completion"""
    code = request.get("code", "")
    
    if len(code) == 6 and code.isdigit():
        return {
            "success": True,
            "message": "MFA setup completed successfully",
            "backup_codes": [
                "12345678", "87654321", "11111111", "22222222", "33333333"
            ]
        }
    else:
        return {
            "success": False,
            "message": "Invalid verification code"
        }

@app.post("/api/auth/mfa/disable")
async def disable_mfa(db: Session = Depends(get_db)):
    """Disable MFA for user"""
    return {
        "success": True,
        "message": "Two-factor authentication has been disabled"
    }

@app.get("/api/auth/mfa/status")
async def get_mfa_status(db: Session = Depends(get_db)):
    """Get MFA status for current user"""
    return {
        "mfa_enabled": False,  # Mock - in real app check user's MFA status
        "backup_codes_remaining": 5
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
