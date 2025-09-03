# chat.py
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class ChatRoom(Base):
    __tablename__ = "chat_rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    room_type = Column(String(20), default="public")  # "public", "private", "direct"
    description = Column(Text)
    
    # Room settings
    is_active = Column(Boolean, default=True)
    max_users = Column(Integer, default=100)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    messages = relationship("ChatMessage", back_populates="room")
    memberships = relationship("ChatRoomMembership", back_populates="room")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    
    # Message content
    message = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")  # "text", "image", "system"
    
    # Message metadata
    edited_at = Column(DateTime)
    is_deleted = Column(Boolean, default=False)
    reply_to = Column(Integer, ForeignKey("chat_messages.id"))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships - Fixed circular imports with string references
    room = relationship("ChatRoom", back_populates="messages")
    user = relationship("User", foreign_keys=[user_id], back_populates="chat_messages")

class ChatRoomMembership(Base):
    __tablename__ = "chat_room_memberships"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    
    # Membership settings
    role = Column(String(20), default="member")  # "owner", "admin", "member"
    is_muted = Column(Boolean, default=False)
    last_read_message_id = Column(Integer)
    
    # Timestamps
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships - Fixed circular imports with string references
    user = relationship("User", foreign_keys=[user_id], back_populates="chat_memberships")
    room = relationship("ChatRoom", back_populates="memberships")
    
    # Unique constraint
    __table_args__ = (
        {"extend_existing": True}
    )