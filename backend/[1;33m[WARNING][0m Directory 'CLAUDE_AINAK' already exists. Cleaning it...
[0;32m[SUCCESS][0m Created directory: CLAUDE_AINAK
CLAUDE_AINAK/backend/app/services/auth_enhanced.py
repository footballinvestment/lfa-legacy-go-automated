# app/services/auth_enhanced.py
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import hashlib
from ..models.user import User
from ..database import SessionLocal
from ..cache_redis import redis_manager
import logging
import os

logger = logging.getLogger(__name__)

class EnhancedAuthService:
    def __init__(self):
        self.SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
        self.ALGORITHM = "HS256"
        self.ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Short-lived access tokens
        self.REFRESH_TOKEN_EXPIRE_DAYS = 7     # Long-lived refresh tokens
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def create_access_token(self, data: dict) -> str:
        """Create short-lived access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({
            "exp": expire,
            "type": "access",
            "iat": datetime.utcnow()
        })
        return jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)
    
    def create_refresh_token(self, user_id: int) -> str:
        """Create long-lived refresh token"""
        jti = secrets.token_urlsafe(32)  # Unique token ID
        expire = datetime.utcnow() + timedelta(days=self.REFRESH_TOKEN_EXPIRE_DAYS)
        
        token_data = {
            "sub": str(user_id),
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh",
            "jti": jti
        }
        
        refresh_token = jwt.encode(token_data, self.SECRET_KEY, algorithm=self.ALGORITHM)
        
        # Store token hash in Redis for validation
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        redis_manager.set(
            f"refresh_token:{user_id}:{jti}", 
            token_hash, 
            expire=int(timedelta(days=self.REFRESH_TOKEN_EXPIRE_DAYS).total_seconds())
        )
        
        return refresh_token
    
    def create_token_pair(self, user: User) -> Dict[str, Any]:
        """Create access and refresh token pair"""
        access_token = self.create_access_token({
            "sub": str(user.id),
            "username": user.username,
            "user_type": user.user_type
        })
        
        refresh_token = self.create_refresh_token(user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "user_type": user.user_type,
                "level": user.level,
                "credits": user.credits
            }
        }
    
    def verify_refresh_token(self, token: str) -> Optional[int]:
        """Verify refresh token and return user_id"""
        try:
            payload = jwt.decode(token, self.SECRET_KEY, algorithms=[self.ALGORITHM])
            
            if payload.get("type") != "refresh":
                return None
            
            user_id = int(payload.get("sub"))
            jti = payload.get("jti")
            
            # Check if token exists in Redis
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            stored_hash = redis_manager.get(f"refresh_token:{user_id}:{jti}")
            
            if stored_hash != token_hash:
                logger.warning(f"Invalid refresh token for user {user_id}")
                return None
            
            return user_id
            
        except JWTError as e:
            logger.error(f"JWT verification failed: {e}")
            return None
    
    def revoke_refresh_token(self, user_id: int, jti: str):
        """Revoke specific refresh token"""
        redis_manager.delete(f"refresh_token:{user_id}:{jti}")
    
    def revoke_all_user_tokens(self, user_id: int):
        """Revoke all refresh tokens for user"""
        redis_manager.flush_pattern(f"refresh_token:{user_id}:*")

auth_service = EnhancedAuthService()