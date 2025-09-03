"""
Cached User Operations Router
High-performance user endpoints with Redis caching
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from app.core.database_production import get_db  
from app.core.smart_cache import UserCache, cached, smart_cache
from app.models.user import User
from app.core.api_response import ResponseBuilder
from app.middleware.enhanced_security import authenticate

router = APIRouter(prefix="/api/cached", tags=["Cached Operations"])
logger = logging.getLogger(__name__)


@router.get("/users/{user_id}")
async def get_user_cached(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(authenticate)
):
    """Get user by ID with Redis caching"""
    
    # Try cache first
    cached_user = UserCache.get_user(user_id)
    if cached_user:
        logger.info(f"Cache HIT: user {user_id}")
        return ResponseBuilder.success(
            data=cached_user,
            message="User retrieved from cache"
        )
    
    # Cache miss - get from database
    logger.info(f"Cache MISS: user {user_id}")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    # Convert to dict for caching
    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": getattr(user, "full_name", user.username),
        "is_active": user.is_active,
        "credits": getattr(user, "credits", 0),
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": getattr(user, "last_login", None),
        "cached_at": datetime.utcnow().isoformat()
    }
    
    # Cache for 10 minutes
    UserCache.set_user(user_id, user_data, ttl=600)
    
    return ResponseBuilder.success(
        data=user_data,
        message="User retrieved from database (cached)"
    )


@router.get("/users")
@cached(ttl=300, key_func=lambda *args, **kwargs: f"all_users:{kwargs.get('limit', 50)}:{kwargs.get('offset', 0)}")
async def get_users_cached(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: dict = Depends(authenticate)
):
    """Get all users with caching"""
    
    users = db.query(User).offset(offset).limit(limit).all()
    
    users_data = []
    for user in users:
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": getattr(user, "full_name", user.username),
            "is_active": user.is_active,
            "credits": getattr(user, "credits", 0),
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
        users_data.append(user_data)
        
        # Cache individual users too
        UserCache.set_user(user.id, user_data, ttl=300)
    
    return ResponseBuilder.success(
        data={
            "users": users_data,
            "count": len(users_data),
            "offset": offset,
            "limit": limit,
            "cached_at": datetime.utcnow().isoformat()
        },
        message=f"Retrieved {len(users_data)} users (cached)"
    )


@router.post("/users/{user_id}/invalidate-cache")
async def invalidate_user_cache(
    user_id: int,
    current_user: dict = Depends(authenticate)
):
    """Invalidate user cache (admin only)"""
    
    # Check if user is admin (simplified check)
    if not current_user.get("username") == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Invalidate specific user cache
    success = UserCache.invalidate_user(user_id)
    
    # Also invalidate related patterns
    smart_cache.invalidate_pattern(f"all_users:*")
    
    return ResponseBuilder.success(
        data={"user_id": user_id, "invalidated": success},
        message="User cache invalidated"
    )


@router.get("/performance/cache-stats")
async def get_cache_stats(current_user: dict = Depends(authenticate)):
    """Get cache performance statistics"""
    
    stats = smart_cache.get_stats()
    
    # Add application-specific metrics
    app_stats = {
        "cache_engine": "Redis",
        "redis_stats": stats,
        "cache_patterns": {
            "users": "users:*",
            "games": "games:*", 
            "tournaments": "tournaments:*",
            "locations": "locations:*"
        },
        "measured_at": datetime.utcnow().isoformat()
    }
    
    return ResponseBuilder.success(
        data=app_stats,
        message="Cache statistics retrieved"
    )


@router.post("/performance/warm-cache")
async def warm_cache(
    db: Session = Depends(get_db),
    current_user: dict = Depends(authenticate)
):
    """Warm up essential caches"""
    
    # Check admin access
    if not current_user.get("username") == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Warm user cache
        users = db.query(User).filter(User.is_active == True).limit(100).all()
        
        warmed_users = 0
        for user in users:
            user_data = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": getattr(user, "full_name", user.username),
                "is_active": user.is_active,
                "credits": getattr(user, "credits", 0),
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "cached_at": datetime.utcnow().isoformat()
            }
            
            if UserCache.set_user(user.id, user_data, ttl=1800):  # 30 minutes
                warmed_users += 1
        
        return ResponseBuilder.success(
            data={
                "warmed_users": warmed_users,
                "total_users": len(users),
                "cache_ttl_minutes": 30
            },
            message="Cache warming completed"
        )
        
    except Exception as e:
        logger.error(f"Cache warming failed: {e}")
        return ResponseBuilder.error(
            error_code="CACHE_WARM_FAILED",
            error_message=f"Cache warming failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Performance monitoring endpoint
@router.get("/performance/test")
async def test_performance(
    iterations: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(authenticate)
):
    """Test cache vs database performance"""
    
    import time
    
    # Test user with known ID
    test_user_id = 1
    
    results = {
        "test_user_id": test_user_id,
        "iterations": iterations,
        "database_times": [],
        "cache_times": [],
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Test database performance
    for i in range(iterations):
        start_time = time.time()
        user = db.query(User).filter(User.id == test_user_id).first()
        db_time = (time.time() - start_time) * 1000  # ms
        results["database_times"].append(round(db_time, 2))
    
    # Warm cache
    if user:
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": getattr(user, "full_name", user.username)
        }
        UserCache.set_user(test_user_id, user_data)
    
    # Test cache performance  
    for i in range(iterations):
        start_time = time.time()
        cached_user = UserCache.get_user(test_user_id)
        cache_time = (time.time() - start_time) * 1000  # ms
        results["cache_times"].append(round(cache_time, 2))
    
    # Calculate statistics
    db_avg = sum(results["database_times"]) / len(results["database_times"])
    cache_avg = sum(results["cache_times"]) / len(results["cache_times"]) 
    
    results["performance_summary"] = {
        "database_avg_ms": round(db_avg, 2),
        "cache_avg_ms": round(cache_avg, 2),
        "speedup_factor": round(db_avg / max(cache_avg, 0.01), 1),
        "cache_hit_available": cached_user is not None
    }
    
    return ResponseBuilder.success(
        data=results,
        message=f"Performance test completed ({iterations} iterations)"
    )