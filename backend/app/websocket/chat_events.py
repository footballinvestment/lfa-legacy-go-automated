# backend/app/websocket/chat_events.py
import logging
from typing import List, Dict, Any
from .chat_manager import sio, chat_manager
from ..models.chat import ChatMessage, ChatRoom, ChatRoomMembership
from ..schemas.chat import WSMessageEvent, ChatMessageResponse

logger = logging.getLogger(__name__)

class ChatEventBroadcaster:
    @staticmethod
    async def broadcast_new_message(room_id: int, message_data: Dict, db_session):
        """Új üzenet broadcast minden room résztvevőnek"""
        try:
            # Room participants lookup
            from sqlalchemy import text
            participants_sql = text("""
                SELECT crm.user_id, u.username 
                FROM chat_room_memberships crm
                LEFT JOIN users u ON crm.user_id = u.id
                WHERE crm.room_id = :room_id
            """)
            
            participants = db_session.execute(participants_sql, {"room_id": room_id}).fetchall()
            
            # Create message response schema
            message_response = ChatMessageResponse(
                id=message_data["id"],
                room_id=message_data["room_id"],
                user_id=message_data["user_id"],
                content=message_data["message"],
                message_type=message_data["message_type"],
                created_at=message_data["created_at"],
                username=message_data["username"]
            )
            
            # WebSocket event
            ws_event = WSMessageEvent(
                event="new_message",
                room_id=room_id,
                message=message_response
            )
            
            # Broadcast to room (Socket.IO room-based)
            room_name = f"room_{room_id}"
            await sio.emit('new_message', ws_event.model_dump(), room=room_name)
            
            # Also broadcast to individual sessions for users in this room
            online_sessions = []
            for participant in participants:
                user_sessions = chat_manager.get_user_sessions(str(participant.user_id))
                online_sessions.extend(user_sessions)
            
            if online_sessions:
                logger.info(f"Broadcasted message {message_data['id']} to room {room_id} ({len(online_sessions)} sessions)")
            
        except Exception as e:
            logger.error(f"Failed to broadcast message {message_data.get('id', 'unknown')}: {e}")
    
    @staticmethod
    async def notify_user_joined_room(room_id: int, user_id: int, username: str):
        """User csatlakozott szobához notification"""
        try:
            room_name = f"room_{room_id}"
            
            await sio.emit('user_joined', {
                'event': 'user_joined',
                'room_id': room_id,
                'user_id': user_id,
                'username': username
            }, room=room_name)
            
            logger.info(f"User {username} joined room {room_id} notification sent")
        except Exception as e:
            logger.error(f"Failed to notify user joined: {e}")
    
    @staticmethod
    async def notify_user_left_room(room_id: int, user_id: int, username: str):
        """User elhagyta a szobát notification"""
        try:
            room_name = f"room_{room_id}"
            
            await sio.emit('user_left', {
                'event': 'user_left',
                'room_id': room_id,
                'user_id': user_id,
                'username': username
            }, room=room_name)
            
            logger.info(f"User {username} left room {room_id} notification sent")
        except Exception as e:
            logger.error(f"Failed to notify user left: {e}")

# Global instance
broadcaster = ChatEventBroadcaster()

# Add method to ChatManager for getting user sessions
def get_user_sessions(self, user_id: str) -> List[str]:
    """Get all session IDs for a user"""
    sessions = []
    for session_id, user_info in self.active_connections.items():
        if isinstance(user_info, dict):
            if user_info.get('user_id') == user_id:
                sessions.append(session_id)
        elif user_info == user_id:  # Old format support
            sessions.append(session_id)
    return sessions

# Add the method to chat_manager
chat_manager.get_user_sessions = get_user_sessions.__get__(chat_manager, type(chat_manager))

# Enhanced Socket.IO event handlers
@sio.event
async def join_room_enhanced(sid, data):
    """User csatlakozik chat szobához with enhanced features"""
    try:
        room_id = data.get('room_id')
        if not room_id:
            await sio.emit('error', {'message': 'room_id required'}, room=sid)
            return
        
        room_name = f"room_{room_id}"
        await sio.enter_room(sid, room_name)
        
        # User info lekérése
        if sid in chat_manager.active_connections:
            user_data = chat_manager.active_connections[sid]
            user_id = user_data.get('user_id') if isinstance(user_data, dict) else user_data
            username = user_data.get('username') if isinstance(user_data, dict) else f"User{user_id}"
            
            await broadcaster.notify_user_joined_room(room_id, user_id, username)
        
        await sio.emit('joined_room', {'room_id': room_id}, room=sid)
        logger.info(f"User joined room {room_id} via WebSocket")
        
    except Exception as e:
        logger.error(f"Failed to join room: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)

@sio.event 
async def leave_room_enhanced(sid, data):
    """User elhagyja a chat szobát"""
    try:
        room_id = data.get('room_id')
        if not room_id:
            await sio.emit('error', {'message': 'room_id required'}, room=sid)
            return
        
        room_name = f"room_{room_id}"
        await sio.leave_room(sid, room_name)
        
        # User info lekérése
        if sid in chat_manager.active_connections:
            user_data = chat_manager.active_connections[sid]
            user_id = user_data.get('user_id') if isinstance(user_data, dict) else user_data
            username = user_data.get('username') if isinstance(user_data, dict) else f"User{user_id}"
            
            await broadcaster.notify_user_left_room(room_id, user_id, username)
        
        await sio.emit('left_room', {'room_id': room_id}, room=sid)
        
    except Exception as e:
        logger.error(f"Failed to leave room: {e}")

@sio.event
async def send_message_ws(sid, data):
    """WebSocket üzenet küldés (real-time alternative to REST API)"""
    try:
        if sid not in chat_manager.active_connections:
            await sio.emit('error', {'message': 'Not authenticated'}, room=sid)
            return
        
        room_id = data.get('room_id')
        content = data.get('content') or data.get('message')
        
        if not room_id or not content:
            await sio.emit('error', {'message': 'Missing room_id or content'}, room=sid)
            return
        
        user_info = chat_manager.active_connections[sid]
        user_id = user_info.get('user_id') if isinstance(user_info, dict) else user_info
        username = user_info.get('username') if isinstance(user_info, dict) else f"User{user_id}"
        
        # Save message to database using chat service
        from ..services.chat_service import ChatService
        from ..database import SessionLocal
        
        db = SessionLocal()
        try:
            service = ChatService(db)
            
            # Ensure user is member of room
            try:
                service.get_room_messages(room_id, int(user_id), limit=1)
            except ValueError:
                # User not member, join automatically
                service.join_room(room_id, int(user_id))
            
            # Save message
            message_data = service.send_message(room_id, int(user_id), content.strip())
            
            # Broadcast to room
            await broadcaster.broadcast_new_message(room_id, message_data, db)
            
        finally:
            db.close()
        
        logger.info(f"WebSocket message from {username} to room {room_id}: {content[:50]}...")
        
    except Exception as e:
        logger.error(f"WebSocket message error: {e}")
        await sio.emit('error', {'message': f'Failed to send message: {str(e)}'}, room=sid)