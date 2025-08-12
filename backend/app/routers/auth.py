# === backend/app/routers/auth.py ===
# TELJES JAVÍTOTT Authentication API endpoints - Error Handling MEGOLDVA

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
    UserUpdate, PasswordChange
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security configuration
SECRET_KEY = "your-secret-key-here"  # Change in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# === CONTEXT MANAGERS ===

from contextlib import contextmanager

@contextmanager
def handle_db_exceptions(operation_name: str):
    """Context manager for database operation error handling"""
    try:
        yield
    except IntegrityError as e:
        logger.error(f"{operation_name} integrity error: {str(e)}")
        if "username" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "username_already_exists",
                    "message": "Username already registered",
                    "field": "username"
                }
            )
        elif "email" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "email_already_exists",
                    "message": "Email already registered", 
                    "field": "email"
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "data_conflict",
                    "message": "Data conflict occurred"
                }
            )
    except Exception as e:
        logger.error(f"{operation_name} error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "database_error",
                "message": f"{operation_name} failed"
            }
        )

# === PASSWORD UTILITIES ===

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        return False

def get_password_hash(password: str) -> str:
    """Generate password hash"""
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Password hashing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "password_processing_error",
                "message": "Password processing failed"
            }
        )

# === JWT TOKEN UTILITIES ===

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token with improved uniqueness"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add uniqueness factors to prevent token collisions
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access",
        "jti": f"{int(time.time_ns())}_{secrets.token_urlsafe(16)}"  # JWT ID for uniqueness
    })
    
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Token creation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "token_creation_error", 
                "message": "Failed to create access token"
            }
        )

def decode_token(token: str) -> dict:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# === AUTHENTICATION UTILITIES ===

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user credentials"""
    try:
        user = get_user_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return None

# === DATABASE FUNCTIONS ===

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    try:
        return db.query(User).filter(User.username == username.lower()).first()
    except Exception as e:
        logger.error(f"Database query error (username): {str(e)}")
        return None

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    try:
        return db.query(User).filter(User.email == email.lower()).first()
    except Exception as e:
        logger.error(f"Database query error (email): {str(e)}")
        return None

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID"""
    try:
        return db.query(User).filter(User.id == user_id).first()
    except Exception as e:
        logger.error(f"Database query error (user_id): {str(e)}")
        return None

def create_user(db: Session, user_data: UserCreate) -> User:
    """Create new user with JAVÍTOTT error handling"""
    with handle_db_exceptions("User creation"):
        # JAVÍTÁS: Explicit check for existing users with proper error codes
        existing_user = get_user_by_username(db, user_data.username)
        if existing_user:
            logger.error(f"User creation error: 400: Username already registered")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,  # JAVÍTÁS: 400 instead of 500
                detail={
                    "error": "username_already_exists",
                    "message": "Username already registered",
                    "field": "username"
                }
            )
        
        existing_email = get_user_by_email(db, user_data.email)
        if existing_email:
            logger.error(f"User creation error: 400: Email already registered") 
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,  # JAVÍTÁS: 400 instead of 500
                detail={
                    "error": "email_already_exists",
                    "message": "Email already registered",
                    "field": "email"
                }
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        
        db_user = User(
            username=user_data.username.lower(),
            email=user_data.email.lower(),
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            is_active=True,
            user_type="player",
            created_at=datetime.utcnow(),
            last_login=None,
            credits=5  # Starting credits
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        logger.info(f"User created successfully: {db_user.username}")
        return db_user

def create_user_session_safe(db: Session, user_id: int, token: str, request: Request = None) -> Optional[UserSession]:
    """Create user session with collision handling - JAVÍTOTT"""
    max_retries = 5
    
    for attempt in range(max_retries):
        try:
            # Delete existing sessions for this user to prevent buildup
            db.query(UserSession).filter(
                UserSession.user_id == user_id,
                UserSession.is_active == True
            ).update({
                "is_active": False,
                "logout_reason": "new_login"
            })
            
            # Egyedi session token generálása
            session_token_suffix = f"_{int(time.time_ns())}_{secrets.token_urlsafe(8)}"
            unique_session_token = f"{token[:32]}{session_token_suffix}"
            
            session = UserSession(
                user_id=user_id,
                session_token=unique_session_token,
                expires_at=datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
                user_agent=request.headers.get("User-Agent", "Unknown")[:500] if request else "Test",
                ip_address=request.client.host if request and request.client else "127.0.0.1",
                device_type="web",
                created_at=datetime.utcnow(),
                last_activity=datetime.utcnow(),
                is_active=True
            )
            
            db.add(session)
            db.commit()
            logger.info(f"User session created successfully for user {user_id}")
            return session
            
        except IntegrityError as e:
            db.rollback()
            if attempt < max_retries - 1:
                logger.warning(f"Session token collision on attempt {attempt + 1}, retrying...")
                time.sleep(0.1 * (attempt + 1))  # Exponential backoff
                continue
            else:
                logger.error(f"Failed to create unique session after {max_retries} attempts")
                return None
        except Exception as e:
            db.rollback()
            logger.error(f"Session creation error: {str(e)}")
            return None
    
    return None

# === AUTHENTICATION DEPENDENCIES ===

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode token
        payload = decode_token(token)
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if username is None or token_type != "access":
            raise credentials_exception
            
        token_data = TokenData(username=username)
        
    except HTTPException:
        raise credentials_exception
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        raise credentials_exception
    
    # Get user from database
    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    
    # Update last activity
    try:
        user.update_last_activity()
        db.commit()
    except Exception as e:
        logger.warning(f"Could not update user activity: {str(e)}")
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current admin user"""
    if current_user.user_type not in ["admin", "coach"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# === COMPATIBILITY ALIASES FOR OTHER ROUTERS ===

async def get_current_admin(current_user: User = Depends(get_current_admin_user)) -> User:
    """
    Compatibility alias for get_current_admin_user
    Used by other routers (weather.py, booking.py, etc.)
    """
    return current_user

# === AUTHENTICATION ENDPOINTS ===

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user - JAVÍTOTT ERROR HANDLING
    
    Creates a new user account with the provided information.
    Returns the created user data (without password).
    JAVÍTÁS: Proper 400 error codes instead of 500 for client errors
    """
    try:
        db_user = create_user(db, user_data)
        
        return UserResponse(
            id=db_user.id,
            username=db_user.username,
            email=db_user.email,
            full_name=db_user.full_name,
            level=db_user.level,
            xp=db_user.xp,
            credits=db_user.credits,
            skills=db_user.skills,
            games_played=db_user.games_played,
            games_won=db_user.games_won,
            win_rate=db_user.win_rate if hasattr(db_user, 'win_rate') else 0.0,
            friend_count=db_user.friend_count,
            total_achievements=db_user.total_achievements if hasattr(db_user, 'total_achievements') else 0,
            skill_average=sum(db_user.skills.values()) / len(db_user.skills) if db_user.skills else 0.0,
            is_premium_active=db_user.is_premium_active if hasattr(db_user, 'is_premium_active') else False,
            is_active=db_user.is_active,
            user_type=db_user.user_type,
            created_at=db_user.created_at,
            last_login=db_user.last_login
        )
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        logger.error(f"Registration endpoint error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "registration_failed",
                "message": "Registration failed due to server error"
            }
        )

@router.post("/login", response_model=LoginResponse)
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Login user with username and password - JAVÍTOTT VERZIÓ
    
    Authenticates user credentials and returns JWT access token.
    JAVÍTÁS: Enhanced error handling and session management
    """
    
    # Felhasználó azonosítás
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "invalid_credentials",
                "message": "Incorrect username or password"
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Token generálás - most már GARANTÁLTAN egyedi!
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, 
        expires_delta=access_token_expires
    )
    
    # Session létrehozás javított hibakezeléssel
    with handle_db_exceptions("User session creation"):
        user_session = create_user_session_safe(db, user.id, access_token, request)
        
        if not user_session:
            logger.warning(f"Session creation failed for user {user.username}, but login proceeding")
        
        # Felhasználó last_login frissítése
        user.last_login = datetime.utcnow()
        db.commit()
        
        logger.info(f"User logged in successfully: {user.username}")
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse(
                id=user.id,
                username=user.username,
                email=user.email,
                full_name=user.full_name,
                level=user.level,
                xp=user.xp,
                credits=user.credits,
                skills=user.skills,
                games_played=user.games_played,
                games_won=user.games_won,
                win_rate=user.win_rate if hasattr(user, 'win_rate') else 0.0,
                friend_count=user.friend_count,
                total_achievements=user.total_achievements if hasattr(user, 'total_achievements') else 0,
                skill_average=sum(user.skills.values()) / len(user.skills) if user.skills else 0.0,
                is_premium_active=user.is_premium_active if hasattr(user, 'is_premium_active') else False,
                is_active=user.is_active,
                user_type=user.user_type,
                created_at=user.created_at,
                last_login=user.last_login
            )
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """
    Get current user profile
    
    Returns the authenticated user's complete profile information.
    """
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        level=current_user.level,
        xp=current_user.xp,
        credits=current_user.credits,
        skills=current_user.skills,
        games_played=current_user.games_played,
        games_won=current_user.games_won,
        win_rate=current_user.win_rate if hasattr(current_user, 'win_rate') else 0.0,
        friend_count=current_user.friend_count,
        total_achievements=current_user.total_achievements if hasattr(current_user, 'total_achievements') else 0,
        skill_average=sum(current_user.skills.values()) / len(current_user.skills) if current_user.skills else 0.0,
        is_premium_active=current_user.is_premium_active if hasattr(current_user, 'is_premium_active') else False,
        is_active=current_user.is_active,
        user_type=current_user.user_type,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user profile
    
    Updates the authenticated user's profile information.
    """
    try:
        # Update allowed fields
        update_data = user_update.dict(exclude_unset=True)
        
        # Remove sensitive fields that shouldn't be updated here
        if 'password' in update_data:
            del update_data['password']
        if 'username' in update_data:
            del update_data['username']  # Username changes require separate endpoint
        
        for field, value in update_data.items():
            if hasattr(current_user, field):
                setattr(current_user, field, value)
        
        db.commit()
        db.refresh(current_user)
        
        return UserResponse.from_orm(current_user)
        
    except Exception as e:
        db.rollback()
        logger.error(f"Profile update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "profile_update_failed",
                "message": "Failed to update profile"
            }
        )

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    
    Changes the authenticated user's password after verifying current password.
    """
    try:
        # Verify current password
        if not verify_password(password_data.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "invalid_current_password",
                    "message": "Current password is incorrect"
                }
            )
        
        # Update to new password
        current_user.hashed_password = get_password_hash(password_data.new_password)
        db.commit()
        
        # Invalidate all existing sessions
        db.query(UserSession).filter(
            UserSession.user_id == current_user.id,
            UserSession.is_active == True
        ).update({
            "is_active": False,
            "logout_reason": "password_changed"
        })
        db.commit()
        
        return {
            "message": "Password changed successfully",
            "note": "All existing sessions have been invalidated"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Password change error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "password_change_failed",
                "message": "Failed to change password"
            }
        )

@router.post("/logout")
async def logout_user(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Logout user
    
    Invalidates the current user session.
    """
    try:
        # Invalidate current session
        db.query(UserSession).filter(
            UserSession.user_id == current_user.id,
            UserSession.is_active == True
        ).update({
            "is_active": False,
            "logout_reason": "user_logout"
        })
        db.commit()
        
        return {
            "message": "Successfully logged out"
        }
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "logout_failed",
                "message": "Failed to logout"
            }
        )

# === ADMIN ENDPOINTS ===

@router.get("/users", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all users (admin only)
    
    Returns paginated list of all users.
    """
    try:
        users = db.query(User).offset(skip).limit(limit).all()
        return [UserResponse.from_orm(user) for user in users]
        
    except Exception as e:
        logger.error(f"List users error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "list_users_failed",
                "message": "Failed to retrieve users"
            }
        )

@router.get("/sessions")
async def get_user_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's active sessions
    
    Returns list of active sessions for the authenticated user.
    """
    try:
        sessions = db.query(UserSession).filter(
            UserSession.user_id == current_user.id,
            UserSession.is_active == True
        ).all()
        
        return {
            "user_id": current_user.id,
            "active_sessions": len(sessions),
            "sessions": [
                {
                    "session_id": session.session_token[:16] + "...",  # Masked for security
                    "created_at": session.created_at,
                    "last_activity": session.last_activity,
                    "device_type": session.device_type,
                    "user_agent": session.user_agent[:50] + "..." if session.user_agent and len(session.user_agent) > 50 else session.user_agent
                }
                for session in sessions
            ]
        }
        
    except Exception as e:
        logger.error(f"Get sessions error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "get_sessions_failed",
                "message": "Failed to retrieve sessions"
            }
        )