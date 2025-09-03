# app/middleware/security.py
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
import hashlib
from ..cache_redis import redis_manager
import logging

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.rate_limits = {
            "/api/auth/login": {"requests": 5, "window": 300},  # 5 requests per 5 minutes
            "/api/auth/register": {"requests": 3, "window": 600},  # 3 requests per 10 minutes
            "/api/auth/password-reset-request": {"requests": 3, "window": 900},  # 3 per 15 minutes
        }
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Apply rate limiting
        if await self.is_rate_limited(request.url.path, client_ip):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        # Add performance header
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """Get real client IP address"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host
    
    async def is_rate_limited(self, path: str, client_ip: str) -> bool:
        """Check if request is rate limited"""
        if path not in self.rate_limits:
            return False
        
        limit_config = self.rate_limits[path]
        window = limit_config["window"]
        max_requests = limit_config["requests"]
        
        # Create rate limit key
        rate_key = f"rate_limit:{path}:{client_ip}"
        
        # Get current count
        current_count = redis_manager.get(rate_key) or 0
        
        if current_count >= max_requests:
            logger.warning(f"Rate limit exceeded for {client_ip} on {path}")
            return True
        
        # Increment counter
        redis_manager.set(rate_key, current_count + 1, expire=window)
        
        return False

class BruteForceProtection:
    @staticmethod
    def record_failed_attempt(identifier: str):
        """Record failed login attempt"""
        key = f"failed_attempts:{identifier}"
        current_attempts = redis_manager.get(key) or 0
        
        new_attempts = current_attempts + 1
        redis_manager.set(key, new_attempts, expire=900)  # 15 minutes
        
        # Lock account after 5 failed attempts
        if new_attempts >= 5:
            redis_manager.set(f"account_locked:{identifier}", True, expire=1800)  # 30 minutes
            logger.warning(f"Account locked due to brute force: {identifier}")
    
    @staticmethod
    def is_account_locked(identifier: str) -> bool:
        """Check if account is locked"""
        return bool(redis_manager.get(f"account_locked:{identifier}"))
    
    @staticmethod
    def clear_failed_attempts(identifier: str):
        """Clear failed attempts on successful login"""
        redis_manager.delete(f"failed_attempts:{identifier}")
        redis_manager.delete(f"account_locked:{identifier}")

brute_force_protection = BruteForceProtection()