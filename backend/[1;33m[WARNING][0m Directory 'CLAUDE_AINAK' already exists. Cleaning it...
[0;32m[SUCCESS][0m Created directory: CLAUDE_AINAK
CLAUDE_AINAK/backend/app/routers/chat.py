# chat.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..services.chat_service import ChatService
from ..routers.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.get("/rooms")
async def get_my_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all rooms for current user"""
    
    try:
        service = ChatService(db)
        rooms = service.get_user_rooms(current_user.id)
        
        return {
            "success": True,
            "data": rooms
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

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