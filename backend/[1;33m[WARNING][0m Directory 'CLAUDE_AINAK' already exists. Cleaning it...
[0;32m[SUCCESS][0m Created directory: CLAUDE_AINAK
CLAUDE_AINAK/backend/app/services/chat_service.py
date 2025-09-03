# chat_service.py
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from ..models.chat import ChatRoom, ChatMessage, ChatRoomMembership
from ..models.user import User
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_rooms(self, user_id: int) -> List[Dict]:
        """Get all rooms user has access to"""
        
        rooms = self.db.query(ChatRoom).join(ChatRoomMembership).filter(
            ChatRoomMembership.user_id == user_id,
            ChatRoom.is_active == True
        ).all()
        
        result = []
        for room in rooms:
            # Get last message
            last_message = self.db.query(ChatMessage).filter(
                ChatMessage.room_id == room.id
            ).order_by(desc(ChatMessage.created_at)).first()
            
            # Get unread count (simplified)
            unread_count = self.db.query(ChatMessage).filter(
                ChatMessage.room_id == room.id,
                ChatMessage.user_id != user_id
            ).count()
            
            result.append({
                "id": room.id,
                "name": room.name,
                "room_type": room.room_type,
                "description": room.description,
                "last_message": {
                    "message": last_message.message if last_message else None,
                    "created_at": last_message.created_at.isoformat() if last_message else None
                } if last_message else None,
                "unread_count": unread_count
            })
        
        return result
    
    def get_room_messages(self, room_id: int, user_id: int, limit: int = 50, offset: int = 0) -> List[Dict]:
        """Get messages from a room"""
        
        # Check if user has access to room
        membership = self.db.query(ChatRoomMembership).filter(
            and_(ChatRoomMembership.room_id == room_id, ChatRoomMembership.user_id == user_id)
        ).first()
        
        if not membership:
            raise ValueError("User not member of this room")
        
        messages = self.db.query(ChatMessage).join(User).filter(
            ChatMessage.room_id == room_id,
            ChatMessage.is_deleted == False
        ).order_by(desc(ChatMessage.created_at)).offset(offset).limit(limit).all()
        
        result = []
        for msg in messages:
            result.append({
                "id": msg.id,
                "user_id": msg.user_id,
                "username": msg.user.username,
                "message": msg.message,
                "message_type": msg.message_type,
                "created_at": msg.created_at.isoformat(),
                "edited_at": msg.edited_at.isoformat() if msg.edited_at else None,
                "reply_to": msg.reply_to
            })
        
        return list(reversed(result))  # Return in chronological order
    
    def save_message(self, room_id: int, user_id: int, message: str, message_type: str = "text") -> Dict:
        """Save a message to database"""
        
        new_message = ChatMessage(
            room_id=room_id,
            user_id=user_id,
            message=message,
            message_type=message_type
        )
        
        self.db.add(new_message)
        self.db.commit()
        self.db.refresh(new_message)
        
        # Get user info
        user = self.db.query(User).filter(User.id == user_id).first()
        
        return {
            "id": new_message.id,
            "room_id": new_message.room_id,
            "user_id": new_message.user_id,
            "username": user.username if user else f"User{user_id}",
            "message": new_message.message,
            "message_type": new_message.message_type,
            "created_at": new_message.created_at.isoformat()
        }
    
    def join_room(self, room_id: int, user_id: int) -> bool:
        """Add user to room"""
        
        # Check if already member
        existing = self.db.query(ChatRoomMembership).filter(
            and_(ChatRoomMembership.room_id == room_id, ChatRoomMembership.user_id == user_id)
        ).first()
        
        if existing:
            return True
        
        membership = ChatRoomMembership(
            room_id=room_id,
            user_id=user_id,
            role="member"
        )
        
        self.db.add(membership)
        self.db.commit()
        
        return True
    
    def create_room(self, name: str, room_type: str = "public", description: str = None, created_by: int = None, max_users: int = 100) -> Dict:
        """Create a new chat room"""
        
        room = ChatRoom(
            name=name,
            room_type=room_type,
            description=description,
            created_by=created_by,
            max_users=max_users
        )
        
        self.db.add(room)
        self.db.commit()
        self.db.refresh(room)
        
        # If creator specified, add them as admin
        if created_by:
            self.add_user_to_room(room.id, created_by, role="admin")
        
        return {
            "id": room.id,
            "name": room.name,
            "room_type": room.room_type,
            "description": room.description,
            "created_by": room.created_by,
            "max_users": room.max_users,
            "created_at": room.created_at.isoformat()
        }
    
    def add_user_to_room(self, room_id: int, user_id: int, role: str = "member") -> bool:
        """Add user to room (alias for join_room with role support)"""
        
        # Check if already member
        existing = self.db.query(ChatRoomMembership).filter(
            and_(ChatRoomMembership.room_id == room_id, ChatRoomMembership.user_id == user_id)
        ).first()
        
        if existing:
            # Update role if different
            if existing.role != role:
                existing.role = role
                self.db.commit()
            return True
        
        membership = ChatRoomMembership(
            room_id=room_id,
            user_id=user_id,
            role=role
        )
        
        self.db.add(membership)
        self.db.commit()
        
        return True
    
    def send_message(self, room_id: int, user_id: int, message: str, message_type: str = "text") -> Dict:
        """Send a message (alias for save_message)"""
        return self.save_message(room_id, user_id, message, message_type)
    
    def get_or_create_global_room(self) -> Dict:
        """Get or create the global chat room"""
        
        global_room = self.db.query(ChatRoom).filter(
            ChatRoom.name == "Global Chat",
            ChatRoom.room_type == "public"
        ).first()
        
        if not global_room:
            return self.create_room(
                name="Global Chat",
                room_type="public", 
                description="Main chat room for all users"
            )
        
        return {
            "id": global_room.id,
            "name": global_room.name,
            "room_type": global_room.room_type,
            "description": global_room.description,
            "created_by": global_room.created_by,
            "max_users": global_room.max_users,
            "created_at": global_room.created_at.isoformat()
        }
    
    def ensure_user_in_global_room(self, user_id: int) -> bool:
        """Ensure user is member of global chat room"""
        
        global_room = self.get_or_create_global_room()
        return self.add_user_to_room(global_room["id"], user_id)