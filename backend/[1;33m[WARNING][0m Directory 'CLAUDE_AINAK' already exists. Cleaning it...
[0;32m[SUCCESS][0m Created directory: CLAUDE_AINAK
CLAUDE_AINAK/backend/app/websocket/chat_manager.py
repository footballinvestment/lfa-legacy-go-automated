# chat_manager.py
import socketio
import asyncio
from typing import Dict, List, Set
from datetime import datetime
import json
import logging
from ..models.user import User
from ..database import get_db

logger = logging.getLogger(__name__)

# Create Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins="*",
    async_mode="asgi"
)

class ChatManager:
    def __init__(self):
        self.active_connections: Dict[str, str] = {}  # session_id -> user_id
        self.user_rooms: Dict[str, Set[str]] = {}  # user_id -> set of room_ids
        self.room_users: Dict[str, Set[str]] = {}  # room_id -> set of user_ids
        
    async def connect_user(self, session_id: str, user_id: str):
        """Connect user to chat system"""
        self.active_connections[session_id] = user_id
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        
        logger.info(f"User {user_id} connected with session {session_id}")
        
        # Join user to their personal rooms (direct messages, etc.)
        await self.join_user_rooms(session_id, user_id)
        
    async def disconnect_user(self, session_id: str):
        """Disconnect user from chat system"""
        if session_id in self.active_connections:
            user_id = self.active_connections[session_id]
            del self.active_connections[session_id]
            
            # Leave all rooms
            if user_id in self.user_rooms:
                for room_id in self.user_rooms[user_id]:
                    await sio.leave_room(session_id, room_id)
                    if room_id in self.room_users:
                        self.room_users[room_id].discard(user_id)
            
            logger.info(f"User {user_id} disconnected")
    
    async def join_user_rooms(self, session_id: str, user_id: str):
        """Join user to their default rooms"""
        # Join personal room for direct messages
        personal_room = f"user_{user_id}"
        await sio.enter_room(session_id, personal_room)
        
        # Join global chat room
        await sio.enter_room(session_id, "global_chat")
        self.user_rooms[user_id].add("global_chat")
        
        if "global_chat" not in self.room_users:
            self.room_users["global_chat"] = set()
        self.room_users["global_chat"].add(user_id)

chat_manager = ChatManager()

# WebSocket Events
@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    logger.info(f"Client connected: {sid}")
    await sio.emit('connection_status', {'status': 'connected'}, to=sid)

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {sid}")
    await chat_manager.disconnect_user(sid)

@sio.event
async def authenticate(sid, data):
    """Authenticate user with JWT token"""
    try:
        token = data.get('token')
        if not token:
            await sio.emit('auth_error', {'message': 'Token required'}, to=sid)
            return
        
        # Here you would validate the JWT token
        # For now, mock validation
        user_id = data.get('user_id', '1')  # Extract from JWT in real implementation
        
        await chat_manager.connect_user(sid, user_id)
        await sio.emit('authenticated', {
            'user_id': user_id,
            'rooms': list(chat_manager.user_rooms.get(user_id, []))
        }, to=sid)
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        await sio.emit('auth_error', {'message': 'Authentication failed'}, to=sid)

@sio.event
async def send_message(sid, data):
    """Handle sending messages"""
    try:
        if sid not in chat_manager.active_connections:
            await sio.emit('error', {'message': 'Not authenticated'}, to=sid)
            return
        
        user_id = chat_manager.active_connections[sid]
        room_id = data.get('room', 'global_chat')
        message = data.get('message', '').strip()
        
        if not message:
            await sio.emit('error', {'message': 'Message cannot be empty'}, to=sid)
            return
        
        # Create message object
        message_data = {
            'id': f"msg_{datetime.now().timestamp()}",
            'user_id': user_id,
            'username': data.get('username', f'User{user_id}'),
            'message': message,
            'room': room_id,
            'timestamp': datetime.now().isoformat(),
            'type': 'text'
        }
        
        # Broadcast to room
        await sio.emit('new_message', message_data, room=room_id)
        
        # Store message in database (implement in next phase)
        logger.info(f"Message sent by {user_id} to {room_id}: {message[:50]}...")
        
    except Exception as e:
        logger.error(f"Send message error: {e}")
        await sio.emit('error', {'message': 'Failed to send message'}, to=sid)

@sio.event
async def join_room(sid, data):
    """Join a chat room"""
    try:
        if sid not in chat_manager.active_connections:
            await sio.emit('error', {'message': 'Not authenticated'}, to=sid)
            return
        
        user_id = chat_manager.active_connections[sid]
        room_id = data.get('room')
        
        if not room_id:
            await sio.emit('error', {'message': 'Room ID required'}, to=sid)
            return
        
        await sio.enter_room(sid, room_id)
        chat_manager.user_rooms[user_id].add(room_id)
        
        if room_id not in chat_manager.room_users:
            chat_manager.room_users[room_id] = set()
        chat_manager.room_users[room_id].add(user_id)
        
        await sio.emit('joined_room', {'room': room_id}, to=sid)
        await sio.emit('user_joined', {'user_id': user_id, 'room': room_id}, room=room_id)
        
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