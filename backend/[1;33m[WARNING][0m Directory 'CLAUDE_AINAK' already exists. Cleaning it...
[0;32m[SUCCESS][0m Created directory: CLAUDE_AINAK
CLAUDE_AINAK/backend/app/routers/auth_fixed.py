# app/routers/auth_fixed.py - COMPLETE REWRITE OF AUTHENTICATION

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import logging
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from ..database_postgres import get_db
from ..models.user_fixed import UserFixed as User

router = APIRouter()
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = "lfa-legacy-go-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class UserRegistration(BaseModel):
    username: str
    email: str
    password: str
    full_name: str

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)

def authenticate_user(db: Session, username: str, password: str):
    """Authenticate user with error handling"""
    try:
        # Get user from database
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            logger.info(f"User not found: {username}")
            return None
            
        if not user.is_active:
            logger.info(f"Inactive user attempted login: {username}")
            return None
            
        # Verify password
        if not verify_password(password, user.hashed_password):
            logger.info(f"Invalid password for user: {username}")
            return None
            
        logger.info(f"Successful authentication for user: {username}")
        return user
        
    except Exception as e:
        logger.error(f"Authentication error for user {username}: {e}")
        return None

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint with comprehensive error handling"""
    
    try:
        logger.info(f"Login attempt for user: {form_data.username}")
        
        # Authenticate user
        user = authenticate_user(db, form_data.username, form_data.password)
        
        if not user:
            logger.warning(f"Failed login attempt: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "username": user.username},
            expires_delta=access_token_expires
        )
        
        logger.info(f"Token generated for user: {user.username}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "credits": user.credits,
                "level": user.level
            }
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in login endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

@router.post("/register")
async def register_user(
    user_data: UserRegistration,
    db: Session = Depends(get_db)
):
    """User registration with comprehensive error handling"""
    
    try:
        logger.info(f"Registration attempt for username: {user_data.username}")
        
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.username == user_data.username) | 
            (User.email == user_data.email)
        ).first()
        
        if existing_user:
            if existing_user.username == user_data.username:
                raise HTTPException(
                    status_code=400,
                    detail="Username already registered"
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
                )
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        
        # Create new user
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            is_active=True,
            user_type="user",
            level=1,
            xp=0,
            credits=5,  # Starting credits
            games_played=0,
            games_won=0,
            friend_count=0,
            achievement_points=0,
            average_performance=0.0
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"User registered successfully: {new_user.username} (ID: {new_user.id})")
        
        # Create access token for immediate login
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(new_user.id), "username": new_user.username},
            expires_delta=access_token_expires
        )
        
        return {
            "message": "User registered successfully",
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email,
                "full_name": new_user.full_name,
                "credits": new_user.credits,
                "level": new_user.level
            }
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except IntegrityError as e:
        logger.error(f"Database integrity error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="User registration failed - data conflict"
        )
    except Exception as e:
        logger.error(f"Unexpected error in registration: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Internal server error during registration"
        )

@router.get("/health")
async def auth_health_check():
    """Authentication service health check"""
    return {
        "status": "healthy",
        "service": "authentication-fixed",
        "endpoints": ["POST /login", "POST /register"],
        "timestamp": datetime.utcnow().isoformat()
    }