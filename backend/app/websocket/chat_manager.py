# chat_manager.py
import socketio
import asyncio
from typing import Dict, List, Set
from datetime import datetime
import json
import logging
from ..models.user import User
from ..database import get_db
from .auth import authenticate_websocket_connection, ws_auth

logger = logging.getLogger(__name__)

# Create Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins="*",
    async_mode="asgi"
)

class ChatManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, str]] = {}  # session_id -> {user_id, username}
        self.user_rooms: Dict[str, Set[str]] = {}  # user_id -> set of room_ids
        self.room_users: Dict[str, Set[str]] = {}  # room_id -> set of user_ids
        
    async def connect_user(self, session_id: str, user_id: str, username: str = None):
        """Connect user to chat system with username"""
        self.active_connections[session_id] = {
            'user_id': user_id,
            'username': username or f"User{user_id}"
        }
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        
        logger.info(f"User {username} ({user_id}) connected with session {session_id}")
        
        # Join user to their personal rooms (direct messages, etc.)
        await self.join_user_rooms(session_id, user_id)
        
    async def disconnect_user(self, session_id: str):
        """Disconnect user from chat system"""
        if session_id in self.active_connections:
            user_info = self.active_connections[session_id]
            user_id = user_info['user_id'] if isinstance(user_info, dict) else user_info
            del self.active_connections[session_id]
            
            # Leave all rooms
            if user_id in self.user_rooms:
                for room_id in self.user_rooms[user_id]:
                    sio.leave_room(session_id, room_id)
                    if room_id in self.room_users:
                        self.room_users[room_id].discard(user_id)
            
            logger.info(f"User {user_id} disconnected")
    
    async def join_user_rooms(self, session_id: str, user_id: str):
        """Join user to their default rooms"""
        try:
            # Join personal room for direct messages
            personal_room = f"user_{user_id}"
            sio.enter_room(session_id, personal_room)
            
            # Join global chat room
            sio.enter_room(session_id, "global_chat")
            self.user_rooms[user_id].add("global_chat")
            
            if "global_chat" not in self.room_users:
                self.room_users["global_chat"] = set()
            self.room_users["global_chat"].add(user_id)
            
            logger.info(f"User {user_id} joined default rooms successfully")
            
        except Exception as e:
            logger.error(f"Error joining user rooms: {e}")
            # Don't re-raise, just log the error

chat_manager = ChatManager()


# WebSocket Events
@sio.event
async def connect(sid, environ, auth=None):
    """Handle client connection with enhanced authentication"""
    logger.info(f"Client connected: {sid}")
    
    # Enhanced authentication using the new auth service
    if auth:
        logger.info(f"Client auth data received: {auth}")
        
        # Extract query parameters from environ if available
        query_params = {}
        if environ.get('QUERY_STRING'):
            from urllib.parse import parse_qs
            query_params = parse_qs(environ['QUERY_STRING'])
            # Flatten single-value query params
            query_params = {k: v[0] if len(v) == 1 else v for k, v in query_params.items()}
        
        # Attempt authentication
        user_data = await authenticate_websocket_connection(sid, auth, query_params)
        if user_data:
            # Store enhanced user data
            await chat_manager.connect_user(
                sid, 
                user_data['user_id'], 
                user_data['username']
            )
            
            # Send successful auth response
            await sio.emit('authenticated', {
                'status': 'success',
                'user_id': user_data['user_id'],
                'username': user_data['username'],
                'user_type': user_data['user_type'],
                'is_premium': user_data['is_premium'],
                'rooms': list(chat_manager.user_rooms.get(user_data['user_id'], []))
            }, to=sid)
            
            logger.info(f"Enhanced authentication successful for {user_data['username']}")
            return True
        else:
            await sio.emit('auth_error', {'message': 'Authentication failed'}, to=sid)
            return False
    
    # Allow connection without auth (auth can happen later)
    await sio.emit('connection_status', {'status': 'connected'}, to=sid)
    return True

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {sid}")
    await chat_manager.disconnect_user(sid)

@sio.event
async def authenticate(sid, data):
    """Enhanced authenticate event using WebSocketAuthService"""
    try:
        # Use the enhanced authentication service
        user_data = await authenticate_websocket_connection(sid, data, {})
        
        if user_data:
            # Store enhanced user data in chat manager
            await chat_manager.connect_user(
                sid, 
                user_data['user_id'], 
                user_data['username']
            )
            
            # Send comprehensive auth response
            await sio.emit('authenticated', {
                'status': 'success',
                'user_id': user_data['user_id'],
                'username': user_data['username'],
                'email': user_data['email'],
                'user_type': user_data['user_type'],
                'is_premium': user_data['is_premium'],
                'rooms': list(chat_manager.user_rooms.get(user_data['user_id'], []))
            }, to=sid)
            
            logger.info(f"Enhanced authentication successful for {user_data['username']} (session: {sid})")
        else:
            await sio.emit('auth_error', {
                'status': 'failed',
                'message': 'Authentication failed - invalid or expired token'
            }, to=sid)
            
    except Exception as e:
        logger.error(f"Authentication error for session {sid}: {e}")
        await sio.emit('auth_error', {
            'status': 'error',
            'message': 'Authentication service error'
        }, to=sid)

@sio.event
async def send_message(sid, data):
    """Send message with enhanced validation and permissions"""
    try:
        if sid not in chat_manager.active_connections:
            await sio.emit('error', {'message': 'Not authenticated'}, to=sid)
            return
            
        user_info = chat_manager.active_connections[sid]
        user_id = user_info['user_id']
        username = user_info['username']
        
        message_text = data.get('message', '').strip()
        if not message_text:
            await sio.emit('error', {'message': 'Message cannot be empty'}, to=sid)
            return
            
        room = data.get('room', 'global_chat')
        
        # Enhanced permission check
        try:
            # Get full user data for permission check
            user_data = {
                'user_id': user_id,
                'username': username,
                'user_type': 'regular',  # Default, could be enhanced from DB lookup
                'is_premium': False      # Default, could be enhanced from DB lookup
            }
            
            # Check send_message permission
            has_permission = await ws_auth.validate_user_permissions(user_data, 'send_message', room)
            if not has_permission:
                await sio.emit('error', {'message': 'Insufficient permissions to send message'}, to=sid)
                return
                
        except Exception as perm_error:
            logger.warning(f"Permission check failed for {user_id}: {perm_error}")
            # Allow by default if permission check fails
        
        # Content moderation
        try:
            from ..utils.content_filter import validate_chat_message
            is_valid, filtered_content, flags = validate_chat_message(message_text, int(user_id))
            
            if not is_valid:
                await sio.emit('message_blocked', {
                    'message': 'Message blocked by content filter',
                    'flags': flags
                }, to=sid)
                logger.warning(f"Message blocked for {username}: {flags}")
                return
                
            # Use filtered content if available
            message_text = filtered_content
            
        except ImportError:
            logger.warning("Content filter not available, proceeding without moderation")
        except Exception as mod_error:
            logger.error(f"Content moderation error: {mod_error}")
            # Continue without moderation if it fails
        
        # Create enhanced message with timestamp
        message_data = {
            'id': f"msg_{datetime.now().timestamp()}",
            'user_id': user_id,
            'username': username,
            'message': message_text,
            'room': room,
            'timestamp': datetime.now().isoformat(),
            'type': 'text',
            'moderated': len(flags) > 0 if 'flags' in locals() else False
        }
        
        # Broadcast to room
        await sio.emit('new_message', message_data, room=room)
        
        logger.info(f"Message sent by {username} ({user_id}) to {room}: {message_text[:50]}...")
        
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        await sio.emit('error', {'message': 'Failed to send message'}, to=sid)

@sio.event
async def join_room(sid, data):
    """Join a chat room with permission validation"""
    try:
        if sid not in chat_manager.active_connections:
            await sio.emit('error', {'message': 'Not authenticated'}, to=sid)
            return
        
        user_info = chat_manager.active_connections[sid]
        user_id = user_info['user_id'] if isinstance(user_info, dict) else user_info
        username = user_info.get('username', f'User{user_id}') if isinstance(user_info, dict) else f'User{user_info}'
        room_id = data.get('room')
        
        if not room_id:
            await sio.emit('error', {'message': 'Room ID required'}, to=sid)
            return
        
        # Enhanced permission check for room joining
        try:
            user_data = {
                'user_id': user_id,
                'username': username,
                'user_type': 'regular',  # Could be enhanced with DB lookup
                'is_premium': False      # Could be enhanced with DB lookup
            }
            
            # For private rooms, check if user has permission to join
            if room_id.startswith('private_'):
                has_permission = await ws_auth.validate_user_permissions(user_data, 'join_private_room', room_id)
                if not has_permission:
                    await sio.emit('error', {'message': 'Cannot join private room'}, to=sid)
                    return
                    
        except Exception as perm_error:
            logger.warning(f"Permission check failed for room join {user_id}: {perm_error}")
            # Allow by default if permission check fails
        
        sio.enter_room(sid, room_id)
        chat_manager.user_rooms[user_id].add(room_id)
        
        if room_id not in chat_manager.room_users:
            chat_manager.room_users[room_id] = set()
        chat_manager.room_users[room_id].add(user_id)
        
        await sio.emit('joined_room', {
            'room': room_id,
            'user_count': len(chat_manager.room_users[room_id])
        }, to=sid)
        
        await sio.emit('user_joined', {
            'user_id': user_id,
            'username': username,
            'room': room_id
        }, room=room_id)
        
        logger.info(f"User {username} ({user_id}) joined room {room_id}")
        
    except Exception as e:
        logger.error(f"Join room error: {e}")
        await sio.emit('error', {'message': 'Failed to join room'}, to=sid)

@sio.event
async def get_online_users(sid, data):
    """Get list of online users in a room"""
    try:
        room_id = data.get('room', 'global_chat')
        online_users = list(chat_manager.room_users.get(room_id, []))
        
        await sio.emit('online_users', {
            'room': room_id,
            'users': online_users,
            'count': len(online_users)
        }, to=sid)
        
    except Exception as e:
        logger.error(f"Get online users error: {e}")

# Create ASGI app
socket_app = socketio.ASGIApp(sio, other_asgi_app=None)