# === backend/app/routers/auth.py ===
# HELYES JAVÍTÁS - eredeti struktúra + total_credits_purchased fix

from datetime import datetime, timedelta
from typing import Optional, List
import secrets
import time
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.openapi.models import Example
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from jose import JWTError, jwt
from passlib.context import CryptContext

from ..database import get_db
from ..models.user import (
    User,
    UserSession,
    UserCreate,
    UserResponse,
    LoginResponse,
    TokenData,
    UserUpdate,
    PasswordChange,
    UserLogin,
    UserCreateProtected,
)

# Import new infrastructure services
try:
    from ..services.auth_enhanced import auth_service
    from ..services.email_service import email_service
    from ..cache_redis import redis_manager
    from ..middleware.security import brute_force_protection
    ENHANCED_AUTH_AVAILABLE = True
except ImportError:
    ENHANCED_AUTH_AVAILABLE = False

from pydantic import BaseModel
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

# OAuth2 scheme - Fixed tokenUrl to match OAuth2 standard
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# Router configuration - EREDETI STRUKTÚRA
router = APIRouter(tags=["Authentication"])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    """Get current user from JWT token"""
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
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return current_user


# =============================================================================
# AUTHENTICATION ENDPOINTS
# =============================================================================


@router.post(
    "/register",
    response_model=LoginResponse,
    summary="🆕 User Registration",
    description="""
    Create a new user account and receive immediate JWT authentication.

    ## Validation Rules
    - **Username**: 3-30 characters, alphanumeric + underscore only
    - **Email**: Valid email format, must be unique
    - **Password**: Minimum 8 characters, recommended to include numbers/symbols
    - **Full Name**: Minimum 2 characters, used for display purposes

    ## Features
    - Immediate JWT token generation (no email verification required)
    - Starting credits: 5 (for new users)
    - Automatic profile setup with display name
    - Password hashing with bcrypt for security

    ## Response
    Returns complete login response with user profile and JWT token valid for 30 days.

    ## Example Usage
    ```javascript
    const newUser = {
        username: 'newplayer',
        email: 'newplayer@example.com',
        password: 'securePassword123',
        full_name: 'Jane Doe'
    };

    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
    });

    const { access_token, user } = await response.json();
    localStorage.setItem('token', access_token);
    ```

    ## Common Errors
    - **400**: Username or email already exists
    - **400**: Validation error (invalid format)
    - **500**: Server error during registration
    """,
    responses={
        200: {
            "description": "Registration successful with JWT token",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "data": {
                            "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                            "token_type": "bearer",
                            "expires_in": 2592000,
                            "user": {
                                "id": 124,
                                "username": "newplayer",
                                "email": "newplayer@example.com",
                                "full_name": "Jane Doe",
                                "level": 1,
                                "credits": 5,
                                "is_active": True,
                            },
                        },
                        "message": "Registration successful",
                        "timestamp": "2025-08-21T14:00:00Z",
                    }
                }
            },
        },
        400: {
            "description": "Registration failed - validation error or duplicate user",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": {
                            "code": "VALIDATION_ERROR",
                            "message": "Username or email already registered",
                            "details": {"field": "username", "value": "existing_user"},
                        },
                        "timestamp": "2025-08-21T14:00:00Z",
                    }
                }
            },
        },
    },
)
async def register(
    user_data: UserCreate, request: Request, db: Session = Depends(get_db)
):
    """🆕 User registration with password hashing and JWT tokens"""
    start_time = time.time()
    client_ip = request.client.host if request.client else "unknown"

    logger.info(
        f"🔍 Registration attempt from IP: {client_ip}, email: {user_data.email}"
    )

    try:
        # Check if user already exists
        existing_user = (
            db.query(User)
            .filter(
                (User.username == user_data.username) | (User.email == user_data.email)
            )
            .first()
        )

        if existing_user:
            logger.warning(
                f"🚫 Duplicate user attempt - IP: {client_ip}, username: {user_data.username}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered",
            )

        # Validate full_name
        if not user_data.full_name or len(user_data.full_name.strip()) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Full name must be at least 2 characters long",
            )

        # Create hashed password
        hashed_password = get_password_hash(user_data.password)

        # ✅ EGYETLEN JAVÍTÁS: total_credits_purchased eltávolítva
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name.strip(),
            display_name=user_data.full_name.strip(),
            is_active=True,
            level=1,
            credits=5,
            # total_credits_purchased automatikusan 0 lesz (default)
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            # registration_ip eltávolítva - nincs ilyen mező
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(new_user.id)}, expires_delta=access_token_expires
        )

        logger.info(
            f"✅ User registered: {new_user.username} in {time.time() - start_time:.2f}s"
        )

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(new_user),
        )

    except IntegrityError:
        db.rollback()
        logger.error(f"❌ Integrity error during registration for {user_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username or email already exists",
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )


@router.post("/token", response_model=LoginResponse)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
    db: Session = Depends(get_db),
):
    """🔐 OAuth2-compliant token endpoint (accepts FormData)"""
    start_time = time.time()
    client_ip = request.client.host if request and request.client else "unknown"

    try:
        # Find user by username
        user = db.query(User).filter(User.username == form_data.username).first()

        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is disabled",
            )

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )

        # Update last login
        user.last_login = datetime.utcnow()
        user.last_activity = datetime.utcnow()
        user.increment_login()
        db.commit()

        logger.info(
            f"✅ User logged in via OAuth2: {user.username} (IP: {client_ip}) in {time.time() - start_time:.2f}s"
        )

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ OAuth2 token error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed",
        )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="🔐 User Login (JSON)",
    description="""
    Authenticate user with username/password and receive JWT token.

    ## Authentication Method
    This endpoint accepts JSON payloads for backward compatibility.
    For OAuth2-compliant authentication, use `/api/auth/token` instead.

    ## Request Format
    ```json
    {
        "username": "your_username",
        "password": "your_password"
    }
    ```

    ## Response
    Returns JWT token valid for 30 days with complete user profile.

    ## Token Usage
    Include the token in subsequent requests:
    ```
    Authorization: Bearer <access_token>
    ```

    ## Example Usage
    ```javascript
    const credentials = {
        username: 'player123',
        password: 'securePassword'
    };

    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });

    if (response.ok) {
        const { access_token, user } = await response.json();
        localStorage.setItem('token', access_token);
        console.log('Logged in as:', user.username);
    }
    ```

    ## Security Features
    - Bcrypt password verification
    - Account status validation (active users only)
    - Login tracking and analytics
    - IP logging for security monitoring

    ## Common Errors
    - **401**: Invalid username or password
    - **400**: User account disabled
    - **500**: Server error during authentication
    """,
    responses={
        200: {
            "description": "Login successful with JWT token and user profile",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "data": {
                            "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE2OTg4NjQwMDB9.ABC123",
                            "token_type": "bearer",
                            "expires_in": 2592000,
                            "user": {
                                "id": 123,
                                "username": "player123",
                                "email": "player@example.com",
                                "full_name": "John Doe",
                                "display_name": "John D.",
                                "level": 5,
                                "credits": 150,
                                "is_active": True,
                                "user_type": "user",
                                "last_login": "2025-08-21T14:00:00Z",
                            },
                        },
                        "message": "Login successful",
                        "timestamp": "2025-08-21T14:00:00Z",
                        "request_id": "auth-login-001",
                    }
                }
            },
        },
        401: {
            "description": "Authentication failed - invalid credentials",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": {
                            "code": "UNAUTHORIZED",
                            "message": "Incorrect username or password",
                            "details": {"hint": "Check your username and password"},
                        },
                        "timestamp": "2025-08-21T14:00:00Z",
                        "request_id": "auth-err-001",
                    }
                }
            },
        },
    },
)
async def login(user_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """🔐 JSON-based login endpoint with debugging (backward compatibility)"""
    start_time = time.time()
    client_ip = request.client.host if request.client else "unknown"
    
    logger.info(f"=== LOGIN DEBUG START === User: {user_data.username}, IP: {client_ip}")

    try:
        # Step 1: Database query
        logger.info("Step 1: Querying database...")
        user = db.execute(
            text("SELECT id, username, email, hashed_password, is_active FROM users WHERE username = :username"),
            {"username": user_data.username}
        ).fetchone()
        
        query_time = time.time() - start_time
        logger.info(f"Step 1 completed in {query_time:.3f}s - User found: {user is not None}")
        
        if not user:
            logger.info("Step 1 result: User not found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Step 2: Password verification  
        logger.info("Step 2: Verifying password...")
        step2_start = time.time()
        
        is_password_valid = pwd_context.verify(user_data.password, user.hashed_password)
        
        step2_time = time.time() - step2_start
        logger.info(f"Step 2 completed in {step2_time:.3f}s - Password valid: {is_password_valid}")
        
        if not is_password_valid:
            logger.info("Step 2 result: Invalid password")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Step 2b: Check if user is active
        if not user.is_active:
            logger.info("Step 2b result: User account disabled")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is disabled",
            )
        
        # Step 3: JWT token generation
        logger.info("Step 3: Generating JWT token...")
        step3_start = time.time()
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        step3_time = time.time() - step3_start
        logger.info(f"Step 3 completed in {step3_time:.3f}s - Token generated")
        
        # Step 4: Database updates and response preparation
        logger.info("Step 4: Updating database and preparing response...")
        step4_start = time.time()
        
        # Update last login using ORM query
        user_obj = db.query(User).filter(User.id == user.id).first()
        if user_obj:
            user_obj.last_login = datetime.utcnow()
            user_obj.last_activity = datetime.utcnow()
            user_obj.increment_login()
            db.commit()
        
        response_data = LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse(
                id=user.id,
                username=user.username,
                email=user.email,
                full_name=user_obj.full_name if user_obj else "Unknown",
                display_name=user_obj.display_name if user_obj else user.username,
                level=user_obj.level if user_obj else 1,
                credits=user_obj.credits if user_obj else 5,
                is_active=user.is_active,
                user_type=user_obj.user_type if user_obj else "user",
                is_premium=user_obj.is_premium if user_obj else False,
                xp=user_obj.xp if user_obj else 0,
                games_played=user_obj.games_played if user_obj else 0,
                games_won=user_obj.games_won if user_obj else 0,
                friend_count=user_obj.friend_count if user_obj else 0,
                achievement_points=user_obj.achievement_points if user_obj else 0,
                last_login=user_obj.last_login if user_obj else None,
                created_at=user_obj.created_at if user_obj else None,
                last_activity=user_obj.last_activity if user_obj else None
            ),
        )
        
        step4_time = time.time() - step4_start
        total_time = time.time() - start_time
        
        logger.info(f"Step 4 completed in {step4_time:.3f}s")
        logger.info(f"=== LOGIN DEBUG SUCCESS === Total time: {total_time:.3f}s")
        
        return response_data

    except HTTPException:
        total_time = time.time() - start_time
        logger.info(f"=== LOGIN DEBUG HTTP EXCEPTION === Total time: {total_time:.3f}s")
        raise
    except Exception as e:
        total_time = time.time() - start_time
        logger.error(f"=== LOGIN DEBUG ERROR === Exception: {e}, Time: {total_time:.3f}s")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """🚪 User logout"""
    try:
        logger.info(f"✅ User logged out: {current_user.username}")
        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"❌ Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Logout failed"
        )


# =============================================================================
# USER PROFILE ENDPOINTS
# =============================================================================


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """👤 Get current user profile"""
    try:
        return UserResponse.model_validate(current_user)
    except Exception as e:
        logger.error(f"❌ Error getting user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user profile",
        )


@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """✏️ Update user profile"""
    try:
        # Update only provided fields
        update_data = user_update.dict(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(current_user, field):
                setattr(current_user, field, value)

        current_user.update_last_activity()
        db.commit()
        db.refresh(current_user)

        logger.info(f"✅ Profile updated for user: {current_user.username}")

        return UserResponse.model_validate(current_user)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Profile update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed",
        )


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """🔒 Change user password"""
    try:
        # Verify current password
        if not verify_password(
            password_data.current_password, current_user.hashed_password
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        # Verify new password confirmation
        if password_data.new_password != password_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New passwords do not match",
            )

        # Update password
        current_user.hashed_password = get_password_hash(password_data.new_password)
        current_user.update_last_activity()
        db.commit()

        logger.info(f"✅ Password changed for user: {current_user.username}")

        return {"message": "Password changed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Password change error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed",
        )


@router.post("/register-protected", response_model=LoginResponse)
async def register_protected(
    user_data: UserCreateProtected, request: Request, db: Session = Depends(get_db)
):
    """🛡️ Protected user registration with enhanced security"""
    start_time = time.time()
    client_ip = request.client.host if request.client else "unknown"

    logger.info(
        f"🛡️ Protected registration attempt from IP: {client_ip}, email: {user_data.email}"
    )

    try:
        # Verify captcha (in real implementation)
        if not user_data.captcha_response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Captcha verification required",
            )

        # Check if user already exists
        existing_user = (
            db.query(User)
            .filter(
                (User.username == user_data.username) | (User.email == user_data.email)
            )
            .first()
        )

        if existing_user:
            logger.warning(f"🚫 Duplicate protected user attempt - IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered",
            )

        # Create new user
        hashed_password = get_password_hash(user_data.password)

        # ✅ JAVÍTÁS: total_credits_purchased eltávolítva itt is
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name.strip(),
            display_name=user_data.full_name.strip(),
            is_active=True,
            level=1,
            credits=10,  # Protected users get extra credits
            # total_credits_purchased automatikusan 0 lesz (default)
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            # registration_ip eltávolítva - nincs ilyen mező
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(new_user.id)}, expires_delta=access_token_expires
        )

        logger.info(
            f"✅ Protected user registered: {new_user.username} in {time.time() - start_time:.2f}s"
        )

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(new_user),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Protected registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


# =============================================================================
# ADMIN ENDPOINTS
# =============================================================================


@router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """👥 Get all users (admin only)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(user) for user in users]


@router.get("/admin/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """👤 Get user by ID (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


# =============================================================================
# HEALTH CHECK
# =============================================================================


@router.get("/health")
async def auth_health_check():
    """🏥 Authentication service health check"""
    return {
        "status": "healthy",
        "service": "authentication",
        "timestamp": datetime.utcnow().isoformat(),
        "features": {
            "registration": "active",
            "login": "active",
            "logout": "active",
            "jwt_tokens": "active",
            "password_hashing": "active",
            "profile_management": "active",
        },
    }


# =============================================================================
# LEGACY COMPATIBILITY
# =============================================================================


@router.post("/register-simple", response_model=LoginResponse)
async def register_simple(
    user_data: UserCreate, request: Request, db: Session = Depends(get_db)
):
    """🆕 Simple user registration (legacy compatibility)"""
    # This is just an alias for the main register endpoint
    return await register(user_data, request, db)


# =============================================================================
# ENHANCED AUTH ENDPOINTS (Infrastructure)
# =============================================================================

# Enhanced auth models
class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

if ENHANCED_AUTH_AVAILABLE:
    @router.post("/refresh", response_model=TokenResponse)
    async def refresh_access_token(
        request: RefreshTokenRequest,
        db: Session = Depends(get_db)
    ):
        """Refresh access token using refresh token"""
        user_id = auth_service.verify_refresh_token(request.refresh_token)
        
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token"
            )
        
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=401,
                detail="User not found or inactive"
            )
        
        # Create new token pair
        token_pair = auth_service.create_token_pair(user)
        
        return TokenResponse(**token_pair)

    @router.post("/password-reset-request")
    async def request_password_reset(
        request: PasswordResetRequest,
        db: Session = Depends(get_db)
    ):
        """Request password reset"""
        user = db.query(User).filter(User.email == request.email).first()
        
        if not user:
            # Don't reveal if email exists - security best practice
            return {"message": "If the email exists, a reset link has been sent"}
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        token_expiry = datetime.utcnow() + timedelta(hours=1)
        
        # Store token in Redis
        redis_manager.set(
            f"password_reset:{reset_token}",
            {
                "user_id": user.id,
                "email": user.email,
                "expires_at": token_expiry.isoformat()
            },
            expire=3600  # 1 hour
        )
        
        # Send email
        email_sent = email_service.send_password_reset_email(
            email=user.email,
            reset_token=reset_token,
            username=user.username
        )
        
        return {"message": "If the email exists, a reset link has been sent"}

    @router.post("/password-reset-confirm")
    async def confirm_password_reset(
        request: PasswordResetConfirm,
        db: Session = Depends(get_db)
    ):
        """Confirm password reset with token"""
        # Verify token
        token_data = redis_manager.get(f"password_reset:{request.token}")
        
        if not token_data:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset token"
            )
        
        # Check expiry
        expires_at = datetime.fromisoformat(token_data["expires_at"])
        if datetime.utcnow() > expires_at:
            redis_manager.delete(f"password_reset:{request.token}")
            raise HTTPException(
                status_code=400,
                detail="Reset token has expired"
            )
        
        # Get user and update password
        user = db.query(User).filter(User.id == token_data["user_id"]).first()
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
        
        # Hash new password
        hashed_password = pwd_context.hash(request.new_password)
        user.hashed_password = hashed_password
        
        # Revoke all existing tokens for security
        auth_service.revoke_all_user_tokens(user.id)
        
        db.commit()
        
        # Clean up reset token
        redis_manager.delete(f"password_reset:{request.token}")
        
        return {"message": "Password reset successful"}

    # ENHANCED LOGIN WITH BRUTE FORCE PROTECTION
    @router.post("/login-enhanced")
    async def enhanced_login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db),
        request: Request = None
    ):
        """Enhanced login with brute force protection"""
        
        # Get client IP
        client_ip = request.client.host if request else "unknown"
        login_identifier = f"{form_data.username}:{client_ip}"
        
        # Check if account is locked
        if brute_force_protection.is_account_locked(login_identifier):
            raise HTTPException(
                status_code=429,
                detail="Account temporarily locked due to too many failed attempts. Try again later."
            )
        
        # Authenticate user
        user = authenticate_user(db, form_data.username, form_data.password)
        
        if not user:
            # Record failed attempt
            brute_force_protection.record_failed_attempt(login_identifier)
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password"
            )
        
        # Clear failed attempts on successful login
        brute_force_protection.clear_failed_attempts(login_identifier)
        
        # Create token pair instead of single token
        token_pair = auth_service.create_token_pair(user)
        
        return token_pair

# Export router
print("✅ Auth router imported successfully")
