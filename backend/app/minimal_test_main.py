from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import json
import uuid
from datetime import datetime

app = FastAPI(title="LFA Legacy GO - Minimal Test API", version="1.0.0")

# CORS setup for frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# In-memory data store (for testing only)
USERS = {
    "testuser": {
        "id": 4, 
        "username": "testuser", 
        "email": "test@test.com",
        "full_name": "Test User",
        "credits": 50,
        "level": 5,
        "xp": 1200,
        "user_type": "user",
        "is_active": True,
        "games_played": 10,
        "games_won": 6,
        "friend_count": 2
    },
    "admin": {
        "id": 1, 
        "username": "admin", 
        "email": "admin@test.com",
        "full_name": "Admin User",
        "credits": 100,
        "level": 10,
        "xp": 5000,
        "user_type": "admin",
        "is_active": True,
        "games_played": 50,
        "games_won": 35,
        "friend_count": 5
    }
}

FRIEND_REQUESTS = []
FRIENDSHIPS = []

# Models
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

class FriendRequestResponse(BaseModel):
    accept: bool  # CRITICAL: This is the fix for 422 error

class PurchaseRequest(BaseModel):
    package_id: str
    payment_method: str = "card"

# Mock JWT verification
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    # Simple mock: token format "user:{username}"
    if token.startswith("user:"):
        username = token.replace("user:", "")
        if username in USERS:
            return USERS[username]
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials"
    )

# Health endpoints
@app.get("/health")
def health():
    return {"status": "ok", "service": "minimal-test"}

@app.get("/api/health") 
def api_health():
    return {
        "status": "healthy",
        "service": "LFA Legacy GO - Minimal Test",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/")
def root():
    return {"message": "LFA Legacy GO Minimal Test API"}

# Auth endpoints
@app.post("/api/auth/login", response_model=LoginResponse)
def login(request: LoginRequest):
    # Mock login - accept any password for test users
    if request.username in USERS:
        user = USERS[request.username]
        return LoginResponse(
            access_token=f"user:{request.username}",
            userId=user["id"],
            userType=user["user_type"]
        )
    raise HTTPException(status_code=401, detail="Incorrect username or password")

@app.get("/api/auth/me")
def get_current_user_info(current_user=Depends(get_current_user)):
    return current_user

# Social endpoints - EXACT format to test your frontend fix
@app.get("/api/social/friends")
def get_friends(current_user=Depends(get_current_user)):
    user_id = current_user["id"]
    friends_list = []
    
    for friendship in FRIENDSHIPS:
        if friendship["user1_id"] == user_id:
            friend_id = friendship["user2_id"]
            friend_username = next((u["username"] for u in USERS.values() if u["id"] == friend_id), f"user_{friend_id}")
            friends_list.append({"id": friend_id, "username": friend_username})
        elif friendship["user2_id"] == user_id:
            friend_id = friendship["user1_id"]
            friend_username = next((u["username"] for u in USERS.values() if u["id"] == friend_id), f"user_{friend_id}")
            friends_list.append({"id": friend_id, "username": friend_username})
    
    return {"data": friends_list}

@app.get("/api/social/friend-requests")
def get_friend_requests(current_user=Depends(get_current_user)):
    user_id = current_user["id"]
    requests = []
    
    for req in FRIEND_REQUESTS:
        if req["receiver_id"] == user_id and req["status"] == "pending":
            sender = next((u for u in USERS.values() if u["id"] == req["sender_id"]), None)
            if sender:
                requests.append({
                    "id": req["id"],
                    "sender": {
                        "id": sender["id"],
                        "username": sender["username"],
                        "full_name": sender["full_name"]
                    },
                    "status": req["status"],
                    "created_at": req["created_at"]
                })
    
    return {"data": requests}

@app.post("/api/social/friend-request/{user_id}")
def send_friend_request(user_id: int, current_user=Depends(get_current_user)):
    # Check if target user exists
    target_user = next((u for u in USERS.values() if u["id"] == user_id), None)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if request already exists
    existing = next((req for req in FRIEND_REQUESTS 
                    if req["sender_id"] == current_user["id"] and req["receiver_id"] == user_id), None)
    if existing:
        raise HTTPException(status_code=400, detail="Friend request already sent")
    
    request_data = {
        "id": len(FRIEND_REQUESTS) + 1,
        "sender_id": current_user["id"],
        "receiver_id": user_id,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    FRIEND_REQUESTS.append(request_data)
    return {"success": True, "message": "Friend request sent", "request_id": request_data["id"]}

# CRITICAL: This endpoint tests your 422 fix
@app.post("/api/social/friend-request/{request_id}/respond")
def respond_to_friend_request(
    request_id: int, 
    response_data: FriendRequestResponse,  # This expects {accept: boolean}
    current_user=Depends(get_current_user)
):
    # Find the request
    request_obj = None
    for req in FRIEND_REQUESTS:
        if req["id"] == request_id:
            request_obj = req
            break
    
    if not request_obj:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    if request_obj["status"] != "pending":
        raise HTTPException(status_code=422, detail="Friend request already processed")
    
    if request_obj["receiver_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this request")
    
    if response_data.accept:
        # Accept the request
        request_obj["status"] = "accepted"
        # Create friendship
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
    
    return {"success": True, "message": message, "request_id": request_id}

# CRITICAL: Use exact package IDs that match your frontend fix
CREDIT_PACKAGES = [
    {
        "id": "starter_10",
        "name": "Starter Pack", 
        "credits": 10,
        "bonus_credits": 2,
        "price_huf": 2500,
        "price_usd": 25,
        "popular": False,
        "description": "Perfect for getting started"
    },
    {
        "id": "popular_25",
        "name": "Popular Pack",
        "credits": 25,
        "bonus_credits": 7, 
        "price_huf": 5500,
        "price_usd": 55,
        "popular": True,
        "description": "Most popular choice"
    },
    {
        "id": "value_50", 
        "name": "Value Pack",
        "credits": 50,
        "bonus_credits": 18,
        "price_huf": 9500,
        "price_usd": 95,
        "popular": False,
        "description": "Great value for dedicated players"
    },
    {
        "id": "premium_100",
        "name": "Premium Pack", 
        "credits": 100,
        "bonus_credits": 40,
        "price_huf": 16500,
        "price_usd": 165,
        "popular": False,
        "description": "Maximum value for serious competitors"
    }
]

# Credit endpoints
@app.get("/api/credits/packages")
def get_credit_packages():
    return CREDIT_PACKAGES

@app.get("/api/credits/balance")
def get_credit_balance(current_user=Depends(get_current_user)):
    return {"credits": current_user["credits"]}

@app.post("/api/credits/purchase")
def purchase_credits(purchase_data: PurchaseRequest, current_user=Depends(get_current_user)):
    # Find package
    package = None
    for pkg in CREDIT_PACKAGES:
        if pkg["id"] == purchase_data.package_id:
            package = pkg
            break
    
    if not package:
        raise HTTPException(status_code=404, detail=f"Credit package '{purchase_data.package_id}' not found")
    
    # Add credits to user
    total_credits = package["credits"] + package["bonus_credits"]
    USERS[current_user["username"]]["credits"] += total_credits
    
    return {
        "success": True,
        "message": "Credits purchased successfully",
        "package_id": purchase_data.package_id,
        "credits_added": total_credits,
        "base_credits": package["credits"],
        "bonus_credits": package["bonus_credits"],
        "new_balance": USERS[current_user["username"]]["credits"]
    }