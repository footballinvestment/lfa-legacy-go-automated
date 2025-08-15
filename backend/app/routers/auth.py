# === backend/app/routers/auth.py ===
# TELJES FÁJL - JAVÍTOTT IMPORT-TAL

# Enhanced Authentication System with Complete JWT Management & User System
# Comprehensive user registration, login, and profile management with session tracking

from datetime import datetime, timedelta
from typing import Optional
import secrets
import time
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from jose import JWTError, jwt
from passlib.context import CryptContext

from ..database import get_db
from ..models.user import (
    User, UserSession, UserCreate, UserResponse, LoginResponse, TokenData,
    UserUpdate, PasswordChange, UserLogin, UserCreateProtected  # Added UserCreateProtected
)
from ..core.security import SpamProtection, limiter
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security configuration
SECRET_KEY = "lfa-legacy-go-jwt-secret-key-2024-production-ready"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Router configuration
router = APIRouter(tags=["Authentication"])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a new JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_user_session(db: Session, user_id: int, session_token: str, 
                       request: Request) -> UserSession:
    """Create a new user session"""
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


async def get_current_user(token: str = Depends(oauth2_scheme), 
                          db: Session = Depends(get_db)):
    """Get the current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get the current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_admin(current_user: User = Depends(get_current_active_user)):
    """Get current admin user"""
    if current_user.user_type not in ["admin", "moderator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


# =============================================================================
# AUTHENTICATION ENDPOINTS
# =============================================================================

@router.post("/register", response_model=LoginResponse)
@limiter.limit("5/minute")  # Basic rate limiting
async def register_protected(
    user_data: UserCreateProtected, 
    request: Request, 
    db: Session = Depends(get_db)
):
    """🛡️ Protected user registration with spam prevention"""
    start_time = time.time()
    client_ip = SpamProtection.get_client_ip(request)
    
    logger.info(f"🔒 Registration attempt from IP: {client_ip}, email: {user_data.email}")
    
    try:
        # 1. Advanced rate limiting check
        if not SpamProtection.check_registration_rate_limit(client_ip, user_data.email):
            logger.warning(f"🚫 Rate limit exceeded - IP: {client_ip}, email: {user_data.email}")
            raise HTTPException(
                status_code=429,
                detail="Too many registration attempts. Please try again later."
            )
        
        # 2. hCaptcha verification
        if not await SpamProtection.verify_hcaptcha(user_data.captcha_response, client_ip):
            logger.warning(f"🚫 Captcha failed - IP: {client_ip}")
            raise HTTPException(
                status_code=400,
                detail="Captcha verification failed. Please try again."
            )
        
        # 3. Check if user already exists
        existing_user = db.query(User).filter(
            (User.username == user_data.username) | 
            (User.email == user_data.email)
        ).first()
        
        if existing_user:
            logger.warning(f"🚫 Duplicate user attempt - IP: {client_ip}, username: {user_data.username}")
            raise HTTPException(
                status_code=400,
                detail="Username or email already registered"
            )
        
        # 4. Create new user (existing code)
        hashed_password = get_password_hash(user_data.password)
        
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            is_active=True,
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow(),
            last_activity=datetime.utcnow()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # 5. Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(new_user.id)}, 
            expires_delta=access_token_expires
        )
        
        logger.info(f"✅ Protected registration successful: {new_user.username} (IP: {client_ip}) in {time.time() - start_time:.2f}s")
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(new_user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Protected registration error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Registration failed"
        )


# Keep the original register endpoint for backward compatibility
@router.post("/register-simple", response_model=LoginResponse)
async def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """🆕 Simple user registration (backward compatibility)"""
    start_time = time.time()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.username == user_data.username) | 
            (User.email == user_data.email)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.name or user_data.username,
            level=1,
            xp=0,
            credits=5,
            games_played=0,
            games_won=0
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(new_user.id)}, 
            expires_delta=access_token_expires
        )
        
        # Update last login
        new_user.last_login = datetime.utcnow()
        db.commit()
        
        logger.info(f"✅ User registered: {new_user.username} (ID: {new_user.id}) in {time.time() - start_time:.2f}s")
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(new_user)
        )
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username or email already exists"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=LoginResponse)
async def login(user_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """🔐 User login with JWT token generation"""
    start_time = time.time()
    
    try:
        # Find user by username
        user = db.query(User).filter(User.username == user_data.username).first()
        
        if not user or not verify_password(user_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is disabled"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, 
            expires_delta=access_token_expires
        )
        
        # Create session - temporarily disabled  
        # create_user_session(db, user.id, access_token, request)
        
        # Update last login
        user.last_login = datetime.utcnow()
        user.last_activity = datetime.utcnow()
        db.commit()
        
        logger.info(f"✅ User login: {user.username} (ID: {user.id}) in {time.time() - start_time:.2f}s")
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """👤 Get current user profile"""
    start_time = time.time()
    logger.info(f"✅ Profile access: {current_user.username} in {time.time() - start_time:.2f}s")
    return UserResponse.model_validate(current_user)


@router.get("/test-protected")
async def test_protected_endpoint(current_user: User = Depends(get_current_active_user)):
    """🔒 Test protected endpoint"""
    return {
        "message": "Access granted to protected endpoint",
        "user": current_user.username,
        "user_id": current_user.id,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.put("/update-profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """✏️ Update user profile"""
    try:
        # Update fields if provided
        if user_update.name is not None:
            current_user.full_name = user_update.name
        if user_update.bio is not None:
            current_user.bio = user_update.bio
        if user_update.location is not None:
            current_user.location = user_update.location
        if user_update.phone is not None:
            current_user.phone = user_update.phone
        if user_update.avatar_url is not None:
            current_user.avatar_url = user_update.avatar_url
        
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"✅ Profile updated: {current_user.username}")
        return UserResponse.model_validate(current_user)
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Profile update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed"
        )


@router.post("/change-password")
async def change_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """🔑 Change user password"""
    try:
        # Verify current password
        if not verify_password(password_change.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        current_user.hashed_password = get_password_hash(password_change.new_password)
        db.commit()
        
        logger.info(f"✅ Password changed: {current_user.username}")
        return {"message": "Password updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Password change error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )



@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """🚪 User logout"""
    try:
        # Update last activity
        current_user.last_activity = datetime.utcnow()
        db.commit()
        
        logger.info(f"✅ User logout: {current_user.username}")
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"❌ Logout error: {str(e)}")
        return {"message": "Logout completed with warnings"}


# Add spam protection status endpoint
@router.get("/spam-protection-status")
async def get_spam_protection_status():
    """🛡️ Get spam protection system status"""
    try:
        status = SpamProtection.get_rate_limit_status()
        return {
            "spam_protection": "active",
            "hcaptcha_configured": bool(os.getenv("HCAPTCHA_SECRET_KEY")),
            "rate_limiting": status,
            "timestamp": time.time()
        }
    except Exception as e:
        return {
            "spam_protection": "error",
            "error": str(e),
            "timestamp": time.time()
        }


# =============================================================================
# UTILITY FUNCTIONS FOR OTHER MODULES
# =============================================================================

def get_current_user_optional(token: str = Depends(oauth2_scheme), 
                              db: Session = Depends(get_db)) -> Optional[User]:
    """Get current user without raising exception if not authenticated"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user if user and user.is_active else None
    except:
        return None


# Export the important functions for use in other modules
__all__ = [
    "router", 
    "get_current_user", 
    "get_current_active_user", 
    "get_current_admin",
    "get_current_user_optional"
]