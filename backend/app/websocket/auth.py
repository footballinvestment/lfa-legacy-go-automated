# backend/app/websocket/auth.py
import logging
from jose import JWTError, jwt
from typing import Optional
from ..database import SessionLocal
from ..models.user import User

logger = logging.getLogger(__name__)

# JWT Settings - must match auth.py
SECRET_KEY = "lfa-legacy-go-jwt-secret-key-2024-production-ready"
ALGORITHM = "HS256"

class WebSocketAuthService:
    @staticmethod
    async def authenticate_token(token: str) -> Optional[dict]:
        """JWT token validálás WebSocket kapcsolathoz"""
        try:
            # Token dekódolása
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            
            if user_id is None:
                logger.warning("JWT payload missing 'sub' field")
                return None
            
            # User lekérdezése adatbázisból
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.id == int(user_id)).first()
                if user is None:
                    logger.warning(f"User with ID {user_id} not found in database")
                    return None
                
                # Check if user is active
                if not user.is_active:
                    logger.warning(f"User {user_id} is not active")
                    return None
                
                return {
                    'user_id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'user_type': user.user_type,
                    'is_premium': user.is_premium
                }
            finally:
                db.close()
                
        except JWTError as e:
            logger.warning(f"JWT validation failed: {e}")
            return None
        except ValueError as e:
            logger.warning(f"Invalid user ID in token: {e}")
            return None
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return None
    
    @staticmethod
    def extract_token_from_auth(auth_data: dict) -> Optional[str]:
        """Token kinyerése auth adatokból"""
        if not auth_data:
            return None
        
        # Direct token field
        token = auth_data.get('token')
        if token:
            return token
        
        # Bearer token format
        auth_header = auth_data.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            return auth_header[7:]  # Remove "Bearer " prefix
        
        # Authorization field (alternative)
        auth_header = auth_data.get('authorization', '')
        if auth_header.startswith('Bearer '):
            return auth_header[7:]
        
        return None
    
    @staticmethod
    def extract_token_from_query(query_params: dict) -> Optional[str]:
        """Token kinyerése query paraméterekből (fallback)"""
        if not query_params:
            return None
        
        # Common query parameter names for tokens
        for param_name in ['token', 'access_token', 'auth_token']:
            token = query_params.get(param_name)
            if token:
                return token
        
        return None
    
    @staticmethod
    async def validate_user_permissions(user_data: dict, action: str, resource: str = None) -> bool:
        """User jogosultságok ellenőrzése WebSocket műveletek számára"""
        try:
            user_type = user_data.get('user_type', 'regular')
            
            # Admin users can do everything
            if user_type == 'admin':
                return True
            
            # Premium users have enhanced permissions
            is_premium = user_data.get('is_premium', False)
            
            # Define permission rules
            if action == 'send_message':
                return True  # All authenticated users can send messages
            elif action == 'create_room':
                return is_premium or user_type in ['admin', 'moderator']
            elif action == 'delete_message':
                return user_type in ['admin', 'moderator']
            elif action == 'kick_user':
                return user_type in ['admin', 'moderator']
            else:
                return True  # Default allow for unknown actions
                
        except Exception as e:
            logger.error(f"Permission validation error: {e}")
            return False

# Global instance
ws_auth = WebSocketAuthService()

# Enhanced authentication wrapper
async def authenticate_websocket_connection(sid: str, auth_data: dict, query_params: dict = None) -> Optional[dict]:
    """
    Comprehensive WebSocket authentication
    Returns user data if successful, None if failed
    """
    try:
        # Try to extract token from auth data first
        token = ws_auth.extract_token_from_auth(auth_data)
        
        # Fallback to query parameters
        if not token and query_params:
            token = ws_auth.extract_token_from_query(query_params)
        
        if not token:
            logger.warning(f"No authentication token found for session {sid}")
            return None
        
        # Validate token
        user_data = await ws_auth.authenticate_token(token)
        if not user_data:
            logger.warning(f"Token validation failed for session {sid}")
            return None
        
        logger.info(f"WebSocket authentication successful for user {user_data['username']} (session {sid})")
        return user_data
        
    except Exception as e:
        logger.error(f"WebSocket authentication error for session {sid}: {e}")
        return None