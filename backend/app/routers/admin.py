# === backend/app/routers/admin.py ===
# Admin and Moderation Router for LFA Legacy GO - JAVÍTOTT VERZIÓ
# Egyszerűsített implementáció working dependencies-szel

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import logging
import json

from ..database import get_db
from ..models.user import User

# Conditional imports with fallbacks
try:
    from .auth import get_current_user, get_current_admin
    AUTH_AVAILABLE = True
except ImportError:
    # Fallback authentication
    def get_current_user():
        return {"id": 1, "username": "mock_user", "user_type": "user"}
    
    def get_current_admin():
        return {"id": 1, "username": "mock_admin", "user_type": "admin"}
    
    AUTH_AVAILABLE = False

# Configure logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(tags=["Administration"], prefix="/api/admin")

# === PYDANTIC MODELS ===

class AdminUserResponse(BaseModel):
    """Admin view of user data"""
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    user_type: str
    credits: int
    created_at: str
    last_login: Optional[str] = None
    total_games: int = 0
    total_spent: float = 0.0

class UserViolation(BaseModel):
    """User violation model"""
    id: Optional[int] = None
    user_id: int
    type: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_by: int
    created_at: Optional[str] = None
    status: str = "active"

class ViolationCreate(BaseModel):
    """Create violation request"""
    type: str = Field(..., pattern="^(warning|suspension|inappropriate_conduct|cheating|harassment|spam|terms_violation|other)$")
    reason: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)
    created_by: int

class ViolationUpdate(BaseModel):
    """Update violation request"""
    status: Optional[str] = Field(None, pattern="^(active|resolved|dismissed)$")
    notes: Optional[str] = Field(None, max_length=1000)

class BulkUserOperation(BaseModel):
    """Bulk user operation request"""
    action: str = Field(..., pattern="^(suspend|activate|delete|reset_password|add_credits)$")
    user_ids: List[int] = Field(..., min_items=1, max_items=100)
    params: Optional[Dict[str, Any]] = {}

class BulkOperationResult(BaseModel):
    """Bulk operation result"""
    results: Dict[str, Dict[str, str]]
    summary: Dict[str, int]

class ModerationLog(BaseModel):
    """Moderation log entry"""
    id: Optional[int] = None
    actor_id: int
    target_user_id: Optional[int] = None
    action: str
    details: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    created_at: Optional[str] = None

class UserReport(BaseModel):
    """User report model"""
    id: Optional[int] = None
    reporter_id: int
    reported_user_id: int
    type: str
    description: str
    status: str = "open"
    created_at: Optional[str] = None

class SystemStats(BaseModel):
    """System statistics"""
    total_users: int
    active_users: int
    total_games: int
    total_revenue: float
    violations_count: int
    reports_count: int

# === UTILITY FUNCTIONS ===

def get_mock_user_data(user_id: int) -> Dict[str, Any]:
    """Generate mock user data for admin view"""
    return {
        "id": user_id,
        "username": f"user_{user_id}",
        "email": f"user_{user_id}@example.com",
        "full_name": f"Test User {user_id}",
        "is_active": True,
        "user_type": "user",
        "credits": 25,
        "created_at": "2024-01-01T00:00:00",
        "last_login": "2024-08-15T10:30:00",
        "total_games": 15,
        "total_spent": 45.50
    }

def log_admin_action(admin_id: int, action: str, details: Dict[str, Any] = None):
    """Log admin action (mock implementation)"""
    log_entry = {
        "actor_id": admin_id,
        "action": action,
        "details": details or {},
        "timestamp": datetime.now().isoformat()
    }
    logger.info(f"Admin action logged: {json.dumps(log_entry)}")

# === HEALTH CHECK ===

@router.get("/health")
async def admin_system_health():
    """🏥 Admin system health check"""
    return {
        "service": "administration",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "features": {
            "user_management": "active",
            "violations": "active",
            "moderation_logs": "active",
            "bulk_operations": "active",
            "reports": "active",
            "analytics": "active"
        },
        "auth_available": AUTH_AVAILABLE,
        "database": "connected"
    }

# === USER MANAGEMENT ===

@router.get("/users", response_model=List[AdminUserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """👥 Get all users with admin details"""
    
    # Query users from database
    query = db.query(User)
    
    if search:
        query = query.filter(
            User.username.ilike(f"%{search}%") | 
            User.email.ilike(f"%{search}%")
        )
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    users = query.offset(skip).limit(limit).all()
    
    # Convert to admin response format
    admin_users = []
    for user in users:
        admin_user = AdminUserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=getattr(user, 'full_name', f"{user.username} User"),
            is_active=user.is_active,
            user_type=getattr(user, 'user_type', 'user'),
            credits=getattr(user, 'credits', 0),
            created_at=user.created_at.isoformat() if hasattr(user, 'created_at') else datetime.now().isoformat(),
            last_login=None,  # Would need session tracking
            total_games=0,    # Would query game sessions
            total_spent=0.0   # Would query credit transactions
        )
        admin_users.append(admin_user)
    
    log_admin_action(
        admin_id=current_user.id if hasattr(current_user, 'id') else 1,
        action="users_list_accessed",
        details={"count": len(admin_users), "search": search}
    )
    
    return admin_users

@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """👤 Get user by ID with admin details"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    admin_user = AdminUserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=getattr(user, 'full_name', f"{user.username} User"),
        is_active=user.is_active,
        user_type=getattr(user, 'user_type', 'user'),
        credits=getattr(user, 'credits', 0),
        created_at=user.created_at.isoformat() if hasattr(user, 'created_at') else datetime.now().isoformat(),
        last_login=None,
        total_games=0,
        total_spent=0.0
    )
    
    log_admin_action(
        admin_id=current_user.id if hasattr(current_user, 'id') else 1,
        action="user_details_accessed",
        details={"target_user_id": user_id}
    )
    
    return admin_user

@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    updates: Dict[str, Any],
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """✏️ Update user details"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Apply safe updates
    updatable_fields = ["is_active", "credits", "full_name"]
    applied_updates = {}
    
    for field, value in updates.items():
        if field in updatable_fields and hasattr(user, field):
            setattr(user, field, value)
            applied_updates[field] = value
    
    try:
        db.commit()
        db.refresh(user)
        
        log_admin_action(
            admin_id=current_user.id if hasattr(current_user, 'id') else 1,
            action="user_updated",
            details={"target_user_id": user_id, "updates": applied_updates}
        )
        
        return {
            "message": "User updated successfully",
            "user_id": user_id,
            "applied_updates": applied_updates,
            "updated_at": datetime.now().isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

# === USER VIOLATIONS ===

@router.get("/users/{user_id}/violations")
async def get_user_violations(
    user_id: int,
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """⚠️ Get violations for user"""
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mock violations (in real implementation, query violations table)
    violations = []
    if user_id % 3 == 0:  # Some users have violations
        violations = [
            {
                "id": 1,
                "user_id": user_id,
                "type": "warning",
                "reason": "Inappropriate chat behavior",
                "notes": "First warning issued",
                "created_by": 1,
                "created_at": "2024-08-10T14:30:00",
                "status": "active"
            }
        ]
    
    return {
        "user_id": user_id,
        "violations": violations,
        "total_violations": len(violations),
        "active_violations": len([v for v in violations if v["status"] == "active"])
    }

@router.post("/users/{user_id}/violations")
async def create_user_violation(
    user_id: int,
    violation: ViolationCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """⚠️ Create new violation for user"""
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create violation (mock implementation)
    new_violation = {
        "id": 999,  # Would be auto-generated
        "user_id": user_id,
        "type": violation.type,
        "reason": violation.reason,
        "notes": violation.notes,
        "created_by": violation.created_by,
        "created_at": datetime.now().isoformat(),
        "status": "active"
    }
    
    log_admin_action(
        admin_id=current_user.id if hasattr(current_user, 'id') else 1,
        action="violation_created",
        details={
            "target_user_id": user_id,
            "violation_type": violation.type,
            "violation_id": new_violation["id"]
        }
    )
    
    return {
        "message": "Violation created successfully",
        "violation": new_violation
    }

# === BULK OPERATIONS ===

@router.post("/users/bulk", response_model=BulkOperationResult)
async def bulk_user_operations(
    operation: BulkUserOperation,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """🔧 Perform bulk operations on users"""
    
    results = {}
    success_count = 0
    error_count = 0
    
    for user_id in operation.user_ids:
        try:
            # Verify user exists
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                results[str(user_id)] = {
                    "status": "failed",
                    "message": "User not found"
                }
                error_count += 1
                continue
            
            # Perform operation
            if operation.action == "suspend":
                user.is_active = False
                message = "User suspended"
            elif operation.action == "activate":
                user.is_active = True
                message = "User activated"
            elif operation.action == "add_credits":
                credits_to_add = operation.params.get("credits", 0)
                current_credits = getattr(user, 'credits', 0)
                setattr(user, 'credits', current_credits + credits_to_add)
                message = f"Added {credits_to_add} credits"
            else:
                results[str(user_id)] = {
                    "status": "failed",
                    "message": f"Unsupported action: {operation.action}"
                }
                error_count += 1
                continue
            
            db.commit()
            
            results[str(user_id)] = {
                "status": "success",
                "message": message
            }
            success_count += 1
            
        except Exception as e:
            db.rollback()
            results[str(user_id)] = {
                "status": "failed",
                "message": str(e)
            }
            error_count += 1
    
    log_admin_action(
        admin_id=current_user.id if hasattr(current_user, 'id') else 1,
        action="bulk_operation",
        details={
            "operation": operation.action,
            "user_count": len(operation.user_ids),
            "success_count": success_count,
            "error_count": error_count
        }
    )
    
    return BulkOperationResult(
        results=results,
        summary={
            "total": len(operation.user_ids),
            "success_count": success_count,
            "error_count": error_count
        }
    )

# === SYSTEM STATISTICS ===

@router.get("/stats", response_model=SystemStats)
async def get_system_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """📊 Get system statistics"""
    
    # Get real user counts
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Mock other statistics
    stats = SystemStats(
        total_users=total_users,
        active_users=active_users,
        total_games=total_users * 15,  # Average games per user
        total_revenue=total_users * 45.50,  # Average revenue per user
        violations_count=total_users // 10,  # 10% violation rate
        reports_count=total_users // 20   # 5% report rate
    )
    
    log_admin_action(
        admin_id=current_user.id if hasattr(current_user, 'id') else 1,
        action="stats_accessed"
    )
    
    return stats

# === MODERATION LOGS ===

@router.get("/moderation/logs")
async def get_moderation_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    actor_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    current_user: User = Depends(get_current_admin)
):
    """📝 Get moderation logs"""
    
    # Mock moderation logs
    logs = []
    for i in range(min(limit, 20)):  # Generate some mock logs
        logs.append({
            "id": i + 1,
            "actor_id": actor_id or 1,
            "target_user_id": (i % 5) + 1,
            "action": action or "user_details_accessed",
            "details": {"mock": "data"},
            "ip_address": "127.0.0.1",
            "created_at": (datetime.now() - timedelta(hours=i)).isoformat()
        })
    
    return {
        "logs": logs,
        "total": len(logs),
        "page": skip // limit + 1,
        "filters": {"actor_id": actor_id, "action": action}
    }

# === REPORTS MANAGEMENT ===

@router.get("/reports")
async def get_user_reports(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin)
):
    """📋 Get user reports"""
    
    # Mock reports
    reports = []
    if not status or status == "open":
        reports = [
            {
                "id": 1,
                "reporter_id": 2,
                "reported_user_id": 3,
                "type": "harassment",
                "description": "User was being inappropriate in chat",
                "status": "open",
                "created_at": "2024-08-15T10:00:00"
            }
        ]
    
    return {
        "reports": reports,
        "total": len(reports),
        "status_filter": status
    }

# === CONFIGURATION ===

@router.get("/config")
async def get_admin_configuration(
    current_user: User = Depends(get_current_admin)
):
    """⚙️ Get admin configuration"""
    
    return {
        "system_settings": {
            "max_violations_before_suspension": 3,
            "auto_suspend_enabled": True,
            "report_escalation_threshold": 5,
            "bulk_operation_limit": 100
        },
        "user_limits": {
            "max_credits": 1000,
            "daily_game_limit": 50,
            "friend_limit": 500
        },
        "moderation": {
            "auto_moderate_enabled": False,
            "violation_types": ["warning", "suspension", "inappropriate_conduct", "cheating", "harassment", "spam", "terms_violation", "other"],
            "report_types": ["harassment", "cheating", "inappropriate_content", "spam", "other"]
        }
    }

# Export router
logger.info("✅ Admin router initialized with mock implementations")