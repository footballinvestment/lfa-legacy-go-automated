# chat.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
import logging
from ..database import get_db
from ..services.chat_service import ChatService
from ..routers.auth import get_current_user
from ..models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Pydantic models for request validation
class ChatRoomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    room_type: str = Field(default="public")
    description: Optional[str] = None
    max_users: Optional[int] = Field(default=100)

class MessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    message_type: str = Field(default="text")

@router.get("/rooms")
async def get_chat_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all chat rooms with real data"""
    try:
        service = ChatService(db)
        
        # Get rooms user is already a member of
        user_rooms = service.get_user_rooms(current_user.id)
        
        # Also get all public rooms available to join
        from sqlalchemy import text
        public_rooms_sql = text("""
            SELECT cr.id, cr.name, cr.room_type, cr.description, cr.is_active,
                   cr.max_users, cr.created_by, cr.created_at,
                   u.username as creator_username,
                   COUNT(crm.id) as member_count
            FROM chat_rooms cr
            LEFT JOIN users u ON cr.created_by = u.id
            LEFT JOIN chat_room_memberships crm ON cr.id = crm.room_id
            WHERE cr.is_active = 1 AND cr.room_type = 'public'
            GROUP BY cr.id, cr.name, cr.room_type, cr.description, cr.is_active,
                     cr.max_users, cr.created_by, cr.created_at, u.username
            ORDER BY cr.created_at DESC
        """)
        
        result = db.execute(public_rooms_sql).fetchall()
        
        public_rooms = []
        user_room_ids = [room["id"] for room in user_rooms]
        
        for row in result:
            room_data = {
                "id": row.id,
                "name": row.name,
                "room_type": row.room_type,
                "description": row.description,
                "member_count": row.member_count,
                "creator_username": row.creator_username,
                "created_at": row.created_at if row.created_at else None,
                "is_member": row.id in user_room_ids
            }
            public_rooms.append(room_data)
        
        # Combine user rooms and public rooms, avoiding duplicates
        all_rooms = user_rooms.copy()
        for pub_room in public_rooms:
            if pub_room["id"] not in user_room_ids:
                all_rooms.append(pub_room)
        
        return {"success": True, "data": all_rooms}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chat rooms: {str(e)}")

@router.get("/rooms/{room_id}/messages")
async def get_room_messages(
    room_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages from a room"""
    
    try:
        service = ChatService(db)
        messages = service.get_room_messages(room_id, current_user.id, limit, offset)
        
        return {
            "success": True,
            "data": messages,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "count": len(messages)
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/rooms/{room_id}/join")
async def join_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Join a chat room"""
    
    try:
        service = ChatService(db)
        success = service.join_room(room_id, current_user.id)
        
        if success:
            return {
                "success": True,
                "message": "Successfully joined room"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to join room")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/rooms", response_model=Dict)
async def create_chat_room(
    room_data: ChatRoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new chat room"""
    try:
        service = ChatService(db)
        room = service.create_room(
            name=room_data.name,
            room_type=room_data.room_type,
            description=room_data.description,
            created_by=current_user.id,
            max_users=room_data.max_users or 100
        )
        
        return {
            "success": True,
            "message": "Chat room created successfully",
            "room_id": room["id"],
            "room_name": room["name"],
            "data": room
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create chat room: {str(e)}")

@router.post("/rooms/{room_id}/messages", response_model=Dict)
async def send_message(
    room_id: int,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message to a chat room"""
    try:
        service = ChatService(db)
        
        # Check if user is member of the room
        try:
            service.get_room_messages(room_id, current_user.id, limit=1)
        except ValueError:
            # User is not a member, try to join them automatically
            service.join_room(room_id, current_user.id)
        
        message = service.send_message(
            room_id=room_id,
            user_id=current_user.id,
            message=message_data.message,
            message_type=message_data.message_type
        )
        
        # Broadcast message via WebSocket
        try:
            from ..websocket.chat_events import broadcaster
            await broadcaster.broadcast_new_message(room_id, message, db)
        except Exception as e:
            logger.error(f"Failed to broadcast message: {e}")
            # Don't fail the API call if broadcast fails
        
        return {
            "success": True,
            "message": "Message sent successfully",
            "message_id": message["id"],
            "data": message
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

@router.get("/status")
async def chat_status():
    """Get chat system status"""
    
    return {
        "success": True,
        "data": {
            "websocket_url": "/ws/socket.io/",
            "api_version": "1.0",
            "features": ["real_time_messaging", "room_management", "message_history"]
        }
    }