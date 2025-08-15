# ===================================================================
# LFA LEGACY GO - SPAM PROTECTION SYSTEM
# Location: backend/app/core/security.py
# ===================================================================

import time
import hashlib
import httpx
import redis
from typing import Dict, Optional
from fastapi import HTTPException, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)

# Redis connection for advanced rate limiting
try:
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        db=0,
        decode_responses=True
    )
    redis_available = True
    print("✅ Redis connection established")
except:
    redis_available = False
    print("⚠️ Redis not available - using in-memory rate limiting")

# In-memory fallback for rate limiting
rate_limit_cache: Dict[str, Dict] = {}

# hCaptcha configuration
HCAPTCHA_SECRET_KEY = os.getenv("HCAPTCHA_SECRET_KEY")
HCAPTCHA_SITE_KEY = os.getenv("HCAPTCHA_SITE_KEY", "3eae1014-b628-4f88-8034-cbc0d02eab34")
HCAPTCHA_VERIFY_URL = "https://hcaptcha.com/siteverify"

logger = logging.getLogger(__name__)

class SpamProtection:
    """🛡️ Complete spam protection system"""
    
    @staticmethod
    async def verify_hcaptcha(captcha_response: str, client_ip: str) -> bool:
        """Verify hCaptcha response"""
        if not HCAPTCHA_SECRET_KEY:
            logger.warning("⚠️ hCaptcha not configured - skipping verification in development")
            return True  # Allow in development
            
        if not captcha_response or captcha_response == "development_bypass":
            logger.warning("⚠️ Development bypass token used")
            return True  # Development bypass
            
        data = {
            'secret': HCAPTCHA_SECRET_KEY,
            'response': captcha_response,
            'remoteip': client_ip
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(HCAPTCHA_VERIFY_URL, data=data, timeout=10)
                result = response.json()
                
                if result.get('success', False):
                    logger.info(f"✅ hCaptcha verified for IP: {client_ip}")
                    return True
                else:
                    logger.warning(f"❌ hCaptcha failed for IP: {client_ip} - Errors: {result.get('error-codes', [])}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ hCaptcha verification error: {str(e)}")
            return False
    
    @staticmethod
    def check_registration_rate_limit(client_ip: str, email: str) -> bool:
        """Enhanced rate limiting for registration"""
        current_time = int(time.time())
        
        # Create unique keys for different rate limit types
        ip_key = f"reg_ip:{client_ip}"
        email_key = f"reg_email:{hashlib.md5(email.encode()).hexdigest()}"
        
        if redis_available:
            return SpamProtection._check_redis_rate_limit(ip_key, email_key, current_time)
        else:
            return SpamProtection._check_memory_rate_limit(ip_key, email_key, current_time)
    
    @staticmethod
    def _check_redis_rate_limit(ip_key: str, email_key: str, current_time: int) -> bool:
        """Redis-based rate limiting"""
        try:
            # IP-based limits: 3 registrations per hour
            ip_count = redis_client.get(ip_key) or 0
            if int(ip_count) >= 3:
                logger.warning(f"🚫 IP rate limit exceeded: {ip_key}")
                return False
            
            # Email-based limits: 1 registration per day
            email_count = redis_client.get(email_key) or 0
            if int(email_count) >= 1:
                logger.warning(f"🚫 Email rate limit exceeded: {email_key}")
                return False
            
            # Update counters
            redis_client.setex(ip_key, 3600, int(ip_count) + 1)  # 1 hour
            redis_client.setex(email_key, 86400, int(email_count) + 1)  # 24 hours
            
            logger.info(f"✅ Rate limit check passed for IP: {ip_key}")
            return True
            
        except Exception as e:
            logger.error(f"⚠️ Redis rate limit error: {str(e)}")
            return True  # Allow on Redis error
    
    @staticmethod
    def _check_memory_rate_limit(ip_key: str, email_key: str, current_time: int) -> bool:
        """In-memory rate limiting fallback"""
        # Clean old entries
        SpamProtection._cleanup_old_entries(current_time)
        
        # Check IP rate limit (3 per hour)
        if ip_key in rate_limit_cache:
            if rate_limit_cache[ip_key]['count'] >= 3:
                logger.warning(f"🚫 Memory IP rate limit exceeded: {ip_key}")
                return False
            rate_limit_cache[ip_key]['count'] += 1
        else:
            rate_limit_cache[ip_key] = {'count': 1, 'expires': current_time + 3600}
        
        # Check email rate limit (1 per day)
        if email_key in rate_limit_cache:
            if rate_limit_cache[email_key]['count'] >= 1:
                logger.warning(f"🚫 Memory email rate limit exceeded: {email_key}")
                return False
            rate_limit_cache[email_key]['count'] += 1
        else:
            rate_limit_cache[email_key] = {'count': 1, 'expires': current_time + 86400}
        
        logger.info(f"✅ Memory rate limit check passed")
        return True
    
    @staticmethod
    def _cleanup_old_entries(current_time: int):
        """Clean expired entries from memory cache"""
        expired_keys = [
            key for key, data in rate_limit_cache.items()
            if data['expires'] < current_time
        ]
        for key in expired_keys:
            del rate_limit_cache[key]
    
    @staticmethod
    def get_client_ip(request: Request) -> str:
        """Get real client IP address"""
        # Check for forwarded headers (Cloud Run, load balancers)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"

    @staticmethod
    def get_rate_limit_status() -> dict:
        """Get current rate limiting status for monitoring"""
        if redis_available:
            try:
                info = redis_client.info()
                return {
                    "rate_limiting": "redis",
                    "redis_connected": True,
                    "redis_version": info.get("redis_version", "unknown")
                }
            except:
                return {"rate_limiting": "redis", "redis_connected": False}
        else:
            return {
                "rate_limiting": "memory",
                "cached_entries": len(rate_limit_cache)
            }