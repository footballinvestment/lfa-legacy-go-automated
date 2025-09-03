# app/routers/auth_enhanced.py - Enhanced Authentication with All New Features
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from jose import jwt

from ..database import get_db
from ..models.user import User
from ..services.auth_enhanced import auth_service
from ..services.email_service import email_service
from ..middleware.security import brute_force_protection
from ..validators.input_validators import (
    StrictUserRegistration, 
    PasswordResetRequest, 
    PasswordResetConfirm,
    RefreshTokenRequest, 
    TokenResponse
)
from ..cache_redis import redis_manager
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Enhanced Authentication"])

@router.post("/register", response_model=dict)
async def register_user_enhanced(
    user_data: StrictUserRegistration,
    db: Session = Depends(get_db)
):
    """Enhanced user registration with validation and welcome email"""
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        if existing_user.username == user_data.username:
            raise HTTPException(
                status_code=400, 
                detail="Username already taken"
            )
        else:
            raise HTTPException(
                status_code=400, 
                detail="Email already registered"
            )
    
    # Hash password
    hashed_password = auth_service.pwd_context.hash(user_data.password)
    
    # Create user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_active=True,
        credits=5,  # Starting credits
        level=1,
        xp=0,
        created_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Send welcome email
    try:
        email_service.send_welcome_email(new_user.email, new_user.username)
    except Exception as e:
        logger.error(f"Failed to send welcome email to {new_user.email}: {e}")
    
    # Create token pair for immediate login
    token_pair = auth_service.create_token_pair(new_user)
    
    logger.info(f"✅ New user registered: {new_user.username} ({new_user.email})")
    
    return {
        "success": True,
        "message": "Registration successful",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "level": new_user.level,
            "credits": new_user.credits
        },
        **token_pair
    }

@router.post("/login", response_model=TokenResponse)
async def login_enhanced(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Enhanced login with brute force protection"""
    identifier = form_data.username  # Can be username or email
    
    # Check if account is locked
    if brute_force_protection.is_account_locked(identifier):
        raise HTTPException(
            status_code=429,
            detail="Account temporarily locked due to too many failed attempts. Try again in 30 minutes."
        )
    
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()
    
    # Verify password
    if not user or not auth_service.pwd_context.verify(form_data.password, user.hashed_password):
        brute_force_protection.record_failed_attempt(identifier)
        raise HTTPException(
            status_code=401,
            detail="Incorrect username/email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is deactivated"
        )
    
    # Clear failed attempts on successful login
    brute_force_protection.clear_failed_attempts(identifier)
    
    # Update last login
    user.last_login = datetime.utcnow()
    user.login_count = (user.login_count or 0) + 1
    db.commit()
    
    # Create token pair
    token_pair = auth_service.create_token_pair(user)
    
    logger.info(f"✅ User logged in: {user.username}")
    
    return TokenResponse(**token_pair)

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

@router.post("/logout")
async def logout_user(
    refresh_token: str = Form(...),
    current_user: User = Depends(get_current_user)  # You'll need to import this
):
    """Logout user and revoke refresh token"""
    try:
        payload = jwt.decode(refresh_token, auth_service.SECRET_KEY, algorithms=[auth_service.ALGORITHM])
        jti = payload.get("jti")
        if jti:
            auth_service.revoke_refresh_token(current_user.id, jti)
    except:
        pass  # Token already invalid
    
    return {"message": "Successfully logged out"}

@router.post("/logout-all")
async def logout_all_devices(
    current_user: User = Depends(get_current_user)  # You'll need to import this
):
    """Logout from all devices"""
    auth_service.revoke_all_user_tokens(current_user.id)
    return {"message": "Successfully logged out from all devices"}

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
    try:
        email_sent = email_service.send_password_reset_email(
            email=user.email,
            reset_token=reset_token,
            username=user.username
        )
        
        if email_sent:
            logger.info(f"Password reset email sent to {user.email}")
        else:
            logger.error(f"Failed to send password reset email to {user.email}")
    except Exception as e:
        logger.error(f"Error sending password reset email: {e}")
    
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
    hashed_password = auth_service.pwd_context.hash(request.new_password)
    user.hashed_password = hashed_password
    
    # Revoke all existing tokens for security
    auth_service.revoke_all_user_tokens(user.id)
    
    db.commit()
    
    # Clean up reset token
    redis_manager.delete(f"password_reset:{request.token}")
    
    logger.info(f"Password reset completed for user: {user.username}")
    
    return {"message": "Password reset successful"}

@router.get("/verify-token")
async def verify_token_endpoint(current_user: User = Depends(get_current_user)):  # You'll need to import this
    """Verify if current token is valid"""
    return {
        "valid": True,
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "level": current_user.level,
            "credits": current_user.credits
        }
    }