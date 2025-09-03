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
        
        from sqlalchemy import text
        
        # Check if user has access to room using direct SQL
        membership_sql = text("SELECT id FROM chat_room_memberships WHERE room_id = :room_id AND user_id = :user_id")
        membership = self.db.execute(membership_sql, {"room_id": room_id, "user_id": user_id}).fetchone()
        
        if not membership:
            raise ValueError("User not member of this room")
        
        # Get messages using direct SQL
        messages_sql = text("""
            SELECT cm.id, cm.user_id, cm.message, cm.message_type, cm.created_at, cm.edited_at, cm.reply_to,
                   u.username
            FROM chat_messages cm
            LEFT JOIN users u ON cm.user_id = u.id
            WHERE cm.room_id = :room_id AND cm.is_deleted = 0
            ORDER BY cm.created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        messages = self.db.execute(messages_sql, {
            "room_id": room_id,
            "limit": limit,
            "offset": offset
        }).fetchall()
        
        result = []
        for msg in messages:
            result.append({
                "id": msg.id,
                "user_id": msg.user_id,
                "username": msg.username,
                "message": msg.message,
                "message_type": msg.message_type,
                "created_at": msg.created_at,
                "edited_at": msg.edited_at,
                "reply_to": msg.reply_to
            })
        
        return list(reversed(result))  # Return in chronological order
    
    def save_message(self, room_id: int, user_id: int, message: str, message_type: str = "text") -> Dict:
        """Save a message to database"""
        
        from sqlalchemy import text
        
        # Insert message using direct SQL
        insert_sql = text("""
            INSERT INTO chat_messages (room_id, user_id, message, message_type, is_deleted, created_at)
            VALUES (:room_id, :user_id, :message, :message_type, :is_deleted, CURRENT_TIMESTAMP)
        """)
        
        result = self.db.execute(insert_sql, {
            "room_id": room_id,
            "user_id": user_id,
            "message": message,
            "message_type": message_type,
            "is_deleted": False
        })
        self.db.commit()
        
        message_id = result.lastrowid
        
        # Get user info and message data
        select_sql = text("""
            SELECT cm.*, u.username
            FROM chat_messages cm
            LEFT JOIN users u ON cm.user_id = u.id
            WHERE cm.id = :message_id
        """)
        
        message_data = self.db.execute(select_sql, {"message_id": message_id}).fetchone()
        
        return {
            "id": message_data.id,
            "room_id": message_data.room_id,
            "user_id": message_data.user_id,
            "username": message_data.username if message_data.username else f"User{user_id}",
            "message": message_data.message,
            "message_type": message_data.message_type,
            "created_at": message_data.created_at
        }
    
    def join_room(self, room_id: int, user_id: int) -> bool:
        """Add user to room"""
        
        from sqlalchemy import text
        
        # Check if already member using direct SQL
        check_sql = text("SELECT id FROM chat_room_memberships WHERE room_id = :room_id AND user_id = :user_id")
        existing = self.db.execute(check_sql, {"room_id": room_id, "user_id": user_id}).fetchone()
        
        if existing:
            return True
        
        # Insert membership using direct SQL
        insert_sql = text("""
            INSERT INTO chat_room_memberships (room_id, user_id, role, is_muted, joined_at)
            VALUES (:room_id, :user_id, :role, :is_muted, CURRENT_TIMESTAMP)
        """)
        
        self.db.execute(insert_sql, {
            "room_id": room_id,
            "user_id": user_id,
            "role": "member",
            "is_muted": False
        })
        self.db.commit()
        
        return True
    
    def create_room(self, name: str, room_type: str = "public", description: str = None, created_by: int = None, max_users: int = 100) -> Dict:
        """Create a new chat room"""
        
        from sqlalchemy import text
        
        # Use direct SQL to avoid ORM foreign key issues
        insert_sql = text("""
            INSERT INTO chat_rooms (name, room_type, description, is_active, max_users, created_by, created_at)
            VALUES (:name, :room_type, :description, :is_active, :max_users, :created_by, CURRENT_TIMESTAMP)
        """)
        
        result = self.db.execute(insert_sql, {
            "name": name,
            "room_type": room_type,
            "description": description,
            "is_active": True,
            "max_users": max_users,
            "created_by": created_by
        })
        self.db.commit()
        
        # Get the created room ID
        room_id = result.lastrowid
        
        # Get room data with a SELECT query
        select_sql = text("SELECT * FROM chat_rooms WHERE id = :room_id")
        room_data = self.db.execute(select_sql, {"room_id": room_id}).fetchone()
        
        # If creator specified, add them as admin
        if created_by:
            self.add_user_to_room(room_id, created_by, role="admin")
        
        return {
            "id": room_data.id,
            "name": room_data.name,
            "room_type": room_data.room_type,
            "description": room_data.description,
            "created_by": room_data.created_by,
            "max_users": room_data.max_users,
            "created_at": room_data.created_at
        }
    
    def add_user_to_room(self, room_id: int, user_id: int, role: str = "member") -> bool:
        """Add user to room (alias for join_room with role support)"""
        
        from sqlalchemy import text
        
        # Check if already member using direct SQL
        check_sql = text("SELECT id, role FROM chat_room_memberships WHERE room_id = :room_id AND user_id = :user_id")
        existing = self.db.execute(check_sql, {"room_id": room_id, "user_id": user_id}).fetchone()
        
        if existing:
            # Update role if different
            if existing.role != role:
                update_sql = text("UPDATE chat_room_memberships SET role = :role WHERE id = :id")
                self.db.execute(update_sql, {"role": role, "id": existing.id})
                self.db.commit()
            return True
        
        # Insert new membership
        insert_sql = text("""
            INSERT INTO chat_room_memberships (room_id, user_id, role, is_muted, joined_at)
            VALUES (:room_id, :user_id, :role, :is_muted, CURRENT_TIMESTAMP)
        """)
        
        self.db.execute(insert_sql, {
            "room_id": room_id,
            "user_id": user_id,
            "role": role,
            "is_muted": False
        })
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