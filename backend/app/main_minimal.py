# backend/app/main_minimal.py
# ⚡ LFA Legacy GO - Working Minimal Backend (Health + Locations + Social)

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
import uvicorn
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="LFA Legacy GO - Minimal API",
    description="Minimal working backend for LFA Legacy GO with Health and Locations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ⚡ CORS Configuration - Production Ready
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",           # Local development
        "http://localhost:8080",           # Alternative local port
        "https://lfa-legacy-go.netlify.app",  # Production frontend
        "https://lfa-legacy-go-backend-376491487980.us-central1.run.app",  # Production backend
        "http://localhost:8001",           # Test port
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ======================
# IN-MEMORY DATA STORE
# ======================

USERS = {
    "testuser": {
        "id": 4,
        "username": "testuser", 
        "email": "testuser@lfatest.com",
        "full_name": "Test User",
        "credits": 50,
        "user_type": "user"
    },
    "admin": {
        "id": 1,
        "username": "admin",
        "email": "admin@lfatest.com", 
        "full_name": "Admin User",
        "credits": 100,
        "user_type": "admin"
    }
}

FRIEND_REQUESTS = []
FRIENDSHIPS = []

# Helper function to get user by ID
def get_user_by_id(user_id: int):
    """Get user data by ID"""
    for username, user_data in USERS.items():
        if user_data["id"] == user_id:
            return user_data
    return None

# ======================
# PYDANTIC MODELS
# ======================

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    hasToken: bool = True
    hasUser: bool = True
    userId: int
    userType: str
    expires_in: int = 3600
    user: Dict[str, Any]

class FriendRequestResponse(BaseModel):
    accept: bool

# ======================
# AUTH HELPER FUNCTIONS
# ======================

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Mock JWT authentication"""
    token = credentials.credentials
    
    # Simple token format: "user:{username}"
    if token.startswith("user:"):
        username = token.replace("user:", "")
        if username in USERS:
            return USERS[username]
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials"
    )

# 📍 IMPORT ROUTERS (Only working ones)
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

# ======================
# AUTHENTICATION ENDPOINTS
# ======================

@app.post("/api/auth/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """Login endpoint - accepts any password for testing"""
    
    if request.username in USERS:
        user = USERS[request.username]
        return LoginResponse(
            access_token=f"user:{request.username}",
            userId=user["id"],
            userType=user["user_type"],
            user=user
        )
    
    raise HTTPException(
        status_code=401, 
        detail="Invalid username or password"
    )

@app.get("/api/auth/me")
def get_current_user_profile(current_user=Depends(get_current_user)):
    """Get current user profile"""
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"], 
        "full_name": current_user["full_name"],
        "credits": current_user["credits"],
        "user_type": current_user["user_type"],
        "is_admin": current_user["user_type"] == "admin"
    }

@app.post("/api/auth/logout")
def logout(current_user=Depends(get_current_user)):
    """Logout endpoint - returns success for mock authentication"""
    return {
        "success": True,
        "message": "Logged out successfully"
    }

# ======================
# SOCIAL ENDPOINTS - WITH WIN_RATE FIX
# ======================

@app.get("/api/social/search-users")
def search_users(q: str = "", current_user=Depends(get_current_user)):
    """Search real users - FIXED: win_rate at root level"""
    found_users = []
    
    if q:
        query_lower = q.lower()
        current_user_id = current_user["id"]
        
        for username, user_data in USERS.items():
            if user_data["id"] == current_user_id:
                continue
                
            matches = (
                query_lower in username.lower() or
                query_lower in user_data.get("email", "").lower() or  
                query_lower in user_data.get("full_name", "").lower()
            )
            
            if matches:
                found_users.append({
                    "id": user_data["id"],
                    "username": user_data["username"],
                    "full_name": user_data["full_name"],
                    "email": user_data["email"],
                    "level": 1,
                    "credits": user_data["credits"],
                    "is_online": True,
                    "last_seen": "2025-09-02T10:00:00Z",
                    "profile_picture": None,
                    
                    # ✅ FIX: Add win_rate to root level + safety defaults
                    "win_rate": 0.6,
                    "games_played": 10,
                    "games_won": 6,
                    "games_lost": 4,
                    
                    # ✅ Keep stats object for compatibility
                    "stats": {
                        "games_played": 10,
                        "games_won": 6,
                        "win_rate": 0.6
                    }
                })
    
    return found_users

@app.get("/api/social/friends")
def get_friends_list(current_user=Depends(get_current_user)):
    """Get user's friends - with win_rate fix"""
    user_id = current_user["id"]
    friends = []
    
    for friendship in FRIENDSHIPS:
        friend_id = None
        if friendship["user1_id"] == user_id:
            friend_id = friendship["user2_id"]
        elif friendship["user2_id"] == user_id:
            friend_id = friendship["user1_id"]
            
        if friend_id:
            friend_data = None
            for username, user in USERS.items():
                if user["id"] == friend_id:
                    friend_data = user
                    break
            
            if friend_data:
                friends.append({
                    "id": friend_data["id"],
                    "username": friend_data["username"],
                    "full_name": friend_data["full_name"],
                    "email": friend_data["email"],
                    "level": 1,
                    "credits": friend_data["credits"],
                    "is_online": True,
                    "last_seen": "2025-09-02T10:00:00Z",
                    "profile_picture": None,
                    
                    # ✅ FIX: Add win_rate at root level for frontend
                    "win_rate": 0.65,
                    "games_played": 15,
                    "games_won": 10,
                    "games_lost": 5,
                    
                    "stats": {
                        "games_played": 15,
                        "games_won": 10,
                        "win_rate": 0.65
                    },
                    "status": "accepted",
                    "created_at": friendship["created_at"]
                })
    
    return friends

@app.get("/api/social/friend-requests") 
def get_pending_friend_requests(current_user=Depends(get_current_user)):
    """Get pending friend requests - WITH USER DATA"""
    user_id = current_user["id"]
    
    # DEBUG: Log the current state
    print(f"🔍 DEBUG - User {user_id} requesting friend requests")
    print(f"📊 DEBUG - Total FRIEND_REQUESTS: {len(FRIEND_REQUESTS)}")
    print(f"🔍 DEBUG - All requests: {FRIEND_REQUESTS}")
    
    pending = [
        req for req in FRIEND_REQUESTS 
        if req["receiver_id"] == user_id and req["status"] == "pending"
    ]
    
    print(f"🔍 DEBUG - Filtered pending for user {user_id}: {pending}")
    
    # Add user data for frontend
    result = []
    for req in pending:
        sender_user = get_user_by_id(req["sender_id"])
        receiver_user = get_user_by_id(req["receiver_id"])
        
        result.append({
            "id": req["id"],
            "from_user_id": req["sender_id"],
            "to_user_id": req["receiver_id"],
            "status": req["status"],
            "created_at": req["created_at"],
            "from_user": {
                "username": sender_user["username"] if sender_user else f"user_{req['sender_id']}",
                "full_name": sender_user["full_name"] if sender_user else f"User {req['sender_id']}",
                "level": 1
            },
            "to_user": {
                "username": receiver_user["username"] if receiver_user else f"user_{req['receiver_id']}",
                "full_name": receiver_user["full_name"] if receiver_user else f"User {req['receiver_id']}",
                "level": 1
            }
        })
    
    print(f"✅ DEBUG - Returning {len(result)} requests with user data")
    return result

@app.get("/api/social/friend-requests/sent")
def get_sent_friend_requests(current_user=Depends(get_current_user)):
    """Get friend requests sent by current user - SENT TAB"""
    user_id = current_user["id"]
    
    # DEBUG: Same style as existing endpoint
    print(f"🔍 DEBUG - User {user_id} requesting SENT friend requests")
    print(f"📊 DEBUG - Total FRIEND_REQUESTS: {len(FRIEND_REQUESTS)}")
    print(f"🔍 DEBUG - All requests: {FRIEND_REQUESTS}")
    
    # SENT requests = ahol current user a SENDER
    sent_requests = [req for req in FRIEND_REQUESTS 
                    if req["sender_id"] == user_id and req["status"] == "pending"]
    
    print(f"🔍 DEBUG - Sent requests for user {user_id}: {sent_requests}")
    
    # Format with receiver user data (same structure as incoming)
    result = []
    for req in sent_requests:
        receiver_user = get_user_by_id(req["receiver_id"])
        
        result.append({
            "id": req["id"],
            "from_user_id": req["sender_id"],  # Current user
            "to_user_id": req["receiver_id"],   # Target user
            "status": req["status"],
            "created_at": req["created_at"],
            "to_user": {  # Target user info for display
                "username": receiver_user["username"] if receiver_user else f"user_{req['receiver_id']}",
                "full_name": receiver_user["full_name"] if receiver_user else f"User {req['receiver_id']}",
                "level": 1
            }
        })
    
    print(f"✅ DEBUG - Returning {len(result)} sent requests with user data")
    return result

@app.post("/api/social/friend-request/{user_id}")
def send_friend_request(user_id: int, current_user=Depends(get_current_user)):
    """Send friend request - WITH DEBUG"""
    
    print(f"🔍 DEBUG - Sending request from {current_user['id']} to {user_id}")
    
    request_data = {
        "id": len(FRIEND_REQUESTS) + 1,
        "sender_id": current_user["id"],
        "receiver_id": user_id,
        "status": "pending", 
        "created_at": datetime.now().isoformat()
    }
    
    FRIEND_REQUESTS.append(request_data)
    
    print(f"🔍 DEBUG - Added request: {request_data}")
    print(f"🔍 DEBUG - Total requests now: {len(FRIEND_REQUESTS)}")
    
    return {
        "success": True,
        "message": "Friend request sent",
        "request_id": request_data["id"]
    }

@app.post("/api/social/friend-request/{request_id}/respond")
def respond_to_friend_request(
    request_id: int,
    response_data: FriendRequestResponse,
    current_user=Depends(get_current_user)
):
    """Respond to friend request with win_rate fix"""
    
    request_obj = None
    for req in FRIEND_REQUESTS:
        if req["id"] == request_id:
            request_obj = req
            break
    
    if not request_obj or request_obj["status"] != "pending":
        raise HTTPException(
            status_code=422, 
            detail="Friend request not found or already processed"
        )
    
    if response_data.accept:
        request_obj["status"] = "accepted"
        
        friendship = {
            "user1_id": min(request_obj["sender_id"], request_obj["receiver_id"]),
            "user2_id": max(request_obj["sender_id"], request_obj["receiver_id"]),
            "status": "active",
            "created_at": datetime.now().isoformat()
        }
        FRIENDSHIPS.append(friendship)
        message = "Friend request accepted"
    else:
        request_obj["status"] = "declined"
        message = "Friend request declined"
    
    return {
        "success": True,
        "message": message,
        "request_id": request_id
    }

@app.get("/api/social/challenges")
def get_challenges(current_user=Depends(get_current_user)):
    """Get user's challenges - FIXED VERSION"""
    try:
        user_id = current_user["id"]
        
        # Mock challenges data
        challenges = [
            {
                "id": 1,
                "challenger_id": user_id,
                "opponent_id": 2,
                "status": "pending",
                "game_type": "football",
                "created_at": datetime.now().isoformat(),
                "expires_at": (datetime.now().replace(hour=23, minute=59)).isoformat()
            }
        ]
        
        return challenges
        
    except Exception as e:
        print(f"🔍 DEBUG - Challenges error: {str(e)}")
        return []  # Return empty list instead of crashing

# ⚡ CORE ENDPOINTS

@app.get("/", tags=["Root"])
async def root():
    """⚡ Root endpoint - API status"""
    return {
        "message": "LFA Legacy GO - Minimal API (Working)",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "docs": "/docs",
            "health": "/api/health", 
            "locations": "/api/locations"
        }
    }

@app.get("/api/health", tags=["Health"])
async def health_check():
    """⚡ Main health check endpoint"""
    return {
        "status": "healthy",
        "service": "lfa-legacy-go-minimal",
        "version": "1.0.0",
        "components": {
            "locations": "operational", 
            "health": "operational"
        },
        "uptime": "operational"
    }

@app.get("/api/status", tags=["Status"])
async def api_status():
    """⚡ API status with router information"""
    return {
        "api_name": "LFA Legacy GO - Minimal (Working)",
        "version": "1.0.0",
        "status": "active",
        "active_routers": [
            "health - System health monitoring",
            "locations - Football location management"
        ],
        "router_count": 2,
        "environment": os.getenv("ENVIRONMENT", "production"),
        "api_docs": "/docs"
    }

# 🔧 ERROR HANDLERS

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """⚡ Custom 404 handler"""
    return {
        "error": "Not Found",
        "message": f"The requested endpoint {request.url.path} was not found",
        "available_endpoints": [
            "/",
            "/api/health", 
            "/api/status",
            "/api/locations/*"
        ],
        "docs": "/docs"
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """⚡ Custom 500 handler"""
    logger.error(f"Internal server error: {exc}")
    return {
        "error": "Internal Server Error",
        "message": "An unexpected error occurred"
    }

# 🚀 DEVELOPMENT SERVER

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))  # Use port 8001 for minimal version
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"⚡ Starting minimal server on {host}:{port}")
    logger.info("📍 Health + Locations routers active!")
    
    uvicorn.run(
        "app.main_minimal:app",
        host=host,
        port=port,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )