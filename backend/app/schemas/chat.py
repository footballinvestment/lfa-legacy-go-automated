# backend/app/schemas/chat.py
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List
from enum import Enum

class RoomType(str, Enum):
    GROUP = "group"
    DIRECT = "direct"
    TOURNAMENT = "tournament"
    TEAM = "team"
    PUBLIC = "public"
    PRIVATE = "private"

class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    SYSTEM = "system"
    FILE = "file"

# Chat Room Schemas
class ChatRoomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    room_type: RoomType = RoomType.PUBLIC
    description: Optional[str] = Field(None, max_length=500)
    max_users: Optional[int] = Field(default=100, ge=2, le=1000)

class ChatRoomCreate(ChatRoomBase):
    pass

class ChatRoomResponse(ChatRoomBase):
    id: int
    created_at: datetime
    created_by: Optional[int]
    is_active: bool
    participant_count: Optional[int] = 0
    last_message: Optional[str] = None
    
    class Config:
        from_attributes = True

# Chat Message Schemas
class ChatMessageBase(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, alias="content")
    message_type: MessageType = MessageType.TEXT

class ChatMessageCreate(ChatMessageBase):
    @validator('message')
    def validate_content(cls, v):
        v = v.strip()
        
        # Content moderation using the content filter
        try:
            from ..utils.content_filter import content_moderator
            moderation_result = content_moderator.moderate_content(v)
            
            if not moderation_result['is_allowed']:
                raise ValueError(f"Message blocked: {', '.join(moderation_result['flags'])}")
            
            # Use filtered content if available
            if moderation_result.get('filtered_content'):
                return moderation_result['filtered_content']
                
        except ImportError:
            # Fallback to basic validation if content_filter not available
            forbidden_words = ['spam', 'hack', 'cheat']
            if any(word in v.lower() for word in forbidden_words):
                raise ValueError('Message contains inappropriate content')
        
        return v

class ChatMessageResponse(ChatMessageBase):
    id: int
    room_id: int
    user_id: int
    sent_at: datetime = Field(alias="created_at")
    is_deleted: bool = False
    edited_at: Optional[datetime] = None
    reply_to: Optional[int] = None
    
    # User info (join)
    username: Optional[str] = None
    
    class Config:
        from_attributes = True

# Chat Participant Schemas
class ChatParticipantResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    joined_at: datetime
    role: str = "member"  # member, admin, owner
    is_muted: bool = False
    username: Optional[str] = None
    
    class Config:
        from_attributes = True

# WebSocket Event Schemas
class WSMessageEvent(BaseModel):
    event: str = "new_message"
    room_id: int
    message: ChatMessageResponse

class WSUserJoinedEvent(BaseModel):
    event: str = "user_joined"
    room_id: int
    user: ChatParticipantResponse

class WSUserLeftEvent(BaseModel):
    event: str = "user_left"
    room_id: int
    user_id: int
    username: str

class WSAuthResponse(BaseModel):
    status: str
    user_id: str
    username: str
    rooms: List[int] = []

# Room Join Schema
class ChatRoomJoin(BaseModel):
    room_id: int = Field(..., gt=0)

# Room List Response
class ChatRoomListResponse(BaseModel):
    rooms: List[ChatRoomResponse]
    total_count: int
    
    class Config:
        from_attributes = True