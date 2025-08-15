# === backend/app/models/friends.py ===
# JAVÍTOTT VERZIÓ - RELATIONSHIP FIXED

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum, ForeignKey, Text, or_, and_
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Session
from ..database import Base
import enum
from datetime import datetime
from pydantic import BaseModel, validator, Field
from typing import Optional, List

class FriendRequestStatus(enum.Enum):
    """Friend request status enum"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"

class FriendRequest(Base):
    """
    Friend request model - handles friendship requests between users
    """
    __tablename__ = "friend_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Users involved in friendship
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Request details
    status = Column(Enum(FriendRequestStatus), default=FriendRequestStatus.PENDING, nullable=False)
    message = Column(Text, nullable=True)  # Optional message with request
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # JAVÍTOTT: Relationships without back_populates (to avoid circular imports)
    # sender = relationship("User", foreign_keys=[sender_id])  # Temporarily disabled
    # receiver = relationship("User", foreign_keys=[receiver_id])  # Temporarily disabled
    
    def __repr__(self):
        return f"<FriendRequest(id={self.id}, sender={self.sender_id}, receiver={self.receiver_id}, status='{self.status.value}')>"
    
    @property
    def is_pending(self) -> bool:
        """Check if request is still pending"""
        return self.status == FriendRequestStatus.PENDING
    
    @property
    def is_accepted(self) -> bool:
        """Check if request was accepted"""
        return self.status == FriendRequestStatus.ACCEPTED
    
    def accept(self):
        """Accept the friend request"""
        self.status = FriendRequestStatus.ACCEPTED
        self.responded_at = datetime.now()
    
    def decline(self):
        """Decline the friend request"""
        self.status = FriendRequestStatus.DECLINED
        self.responded_at = datetime.now()
    
    def block(self):
        """Block the sender"""
        self.status = FriendRequestStatus.BLOCKED
        self.responded_at = datetime.now()
    
    def cancel(self):
        """Cancel the friend request (sender only)"""
        self.status = FriendRequestStatus.CANCELLED
        self.responded_at = datetime.now()
    
    @classmethod
    def get_pending_requests_for_user(cls, db: Session, user_id: int) -> List['FriendRequest']:
        """Get all pending friend requests for a user"""
        return db.query(cls).filter(
            cls.receiver_id == user_id,
            cls.status == FriendRequestStatus.PENDING
        ).all()
    
    @classmethod
    def get_sent_requests_by_user(cls, db: Session, user_id: int) -> List['FriendRequest']:
        """Get all friend requests sent by a user"""
        return db.query(cls).filter(
            cls.sender_id == user_id,
            cls.status == FriendRequestStatus.PENDING
        ).all()
    
    @classmethod
    def request_exists(cls, db: Session, sender_id: int, receiver_id: int) -> bool:
        """Check if a friend request already exists between two users"""
        return db.query(cls).filter(
            or_(
                and_(cls.sender_id == sender_id, cls.receiver_id == receiver_id),
                and_(cls.sender_id == receiver_id, cls.receiver_id == sender_id)
            ),
            cls.status.in_([FriendRequestStatus.PENDING, FriendRequestStatus.ACCEPTED])
        ).first() is not None

class Friendship(Base):
    """
    Friendship model - represents established friendships
    """
    __tablename__ = "friendships"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Friend relationship (bidirectional)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Friendship details
    status = Column(String(20), default="active")  # "active", "blocked", "inactive"
    established_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Interaction tracking
    last_interaction = Column(DateTime(timezone=True), nullable=True)
    interaction_count = Column(Integer, default=0)
    
    # Game statistics together
    games_played_together = Column(Integer, default=0)
    challenges_between = Column(Integer, default=0)
    
    # Privacy settings for this friendship
    can_see_online_status = Column(Boolean, default=True)
    can_send_challenges = Column(Boolean, default=True)
    can_see_game_history = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # JAVÍTOTT: Relationships without back_populates
    # user1 = relationship("User", foreign_keys=[user1_id])  # Temporarily disabled
    # user2 = relationship("User", foreign_keys=[user2_id])  # Temporarily disabled
    
    def __repr__(self):
        return f"<Friendship(id={self.id}, user1={self.user1_id}, user2={self.user2_id}, status='{self.status}')>"
    
    def get_friend_of(self, user_id: int) -> Optional[int]:
        """Get the friend ID of the specified user"""
        if self.user1_id == user_id:
            return self.user2_id
        elif self.user2_id == user_id:
            return self.user1_id
        return None
    
    def update_interaction(self):
        """Update interaction tracking"""
        self.last_interaction = datetime.now()
        self.interaction_count += 1
    
    @classmethod
    def get_friends_of_user(cls, db: Session, user_id: int) -> List['Friendship']:
        """Get all friendships for a user"""
        return db.query(cls).filter(
            or_(cls.user1_id == user_id, cls.user2_id == user_id),
            cls.status == "active"
        ).all()
    
    @classmethod
    def are_friends(cls, db: Session, user1_id: int, user2_id: int) -> bool:
        """Check if two users are friends"""
        return db.query(cls).filter(
            or_(
                and_(cls.user1_id == user1_id, cls.user2_id == user2_id),
                and_(cls.user1_id == user2_id, cls.user2_id == user1_id)
            ),
            cls.status == "active"
        ).first() is not None
    
    @classmethod
    def create_friendship(cls, db: Session, user1_id: int, user2_id: int) -> 'Friendship':
        """Create a new friendship"""
        # Ensure consistent ordering (smaller ID first)
        if user1_id > user2_id:
            user1_id, user2_id = user2_id, user1_id
        
        friendship = cls(
            user1_id=user1_id,
            user2_id=user2_id,
            status="active"
        )
        db.add(friendship)
        db.commit()
        return friendship

class Challenge(Base):
    """
    Challenge model - represents game challenges between friends
    """
    __tablename__ = "challenges"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Challenge participants
    challenger_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    challenged_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Challenge details
    game_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending, accepted, declined, expired
    
    # Game session info (when accepted and played)
    session_id = Column(String(36), nullable=True)
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # JAVÍTOTT: Relationships without back_populates
    # challenger = relationship("User", foreign_keys=[challenger_id])  # Temporarily disabled
    # challenged = relationship("User", foreign_keys=[challenged_id])  # Temporarily disabled
    # winner = relationship("User", foreign_keys=[winner_id])  # Temporarily disabled

class UserBlock(Base):
    """
    User blocking model - handles user blocking relationships
    """
    __tablename__ = "user_blocks"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Blocking relationship
    blocker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    blocked_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Block details
    reason = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    blocked_at = Column(DateTime(timezone=True), server_default=func.now())
    unblocked_at = Column(DateTime(timezone=True), nullable=True)
    
    # JAVÍTOTT: Relationships without back_populates
    # blocker = relationship("User", foreign_keys=[blocker_id])  # Temporarily disabled
    # blocked = relationship("User", foreign_keys=[blocked_id])  # Temporarily disabled
    
    def __repr__(self):
        return f"<UserBlock(id={self.id}, blocker={self.blocker_id}, blocked={self.blocked_id}, active={self.is_active})>"
    
    def unblock(self):
        """Unblock the user"""
        self.is_active = False
        self.unblocked_at = datetime.now()
    
    @classmethod
    def is_blocked(cls, db: Session, blocker_id: int, blocked_id: int) -> bool:
        """Check if a user is blocked by another user"""
        return db.query(cls).filter(
            cls.blocker_id == blocker_id,
            cls.blocked_id == blocked_id,
            cls.is_active == True
        ).first() is not None
    
    @classmethod
    def get_blocked_users(cls, db: Session, blocker_id: int) -> List['UserBlock']:
        """Get all users blocked by a specific user"""
        return db.query(cls).filter(
            cls.blocker_id == blocker_id,
            cls.is_active == True
        ).all()

# === PYDANTIC SCHEMAS ===

class FriendRequestCreate(BaseModel):
    receiver_username: str = Field(..., min_length=1, max_length=50)
    message: Optional[str] = Field(None, max_length=500)

class FriendRequestResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    status: str
    message: Optional[str] = None
    created_at: datetime
    responded_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ChallengeCreate(BaseModel):
    challenged_username: str = Field(..., min_length=1, max_length=50)
    game_type: str = Field(..., min_length=1, max_length=50)
    message: Optional[str] = Field(None, max_length=500)

class ChallengeResponse(BaseModel):
    id: int
    challenger_id: int
    challenged_id: int
    game_type: str
    status: str
    message: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    
    class Config:
        from_attributes = True

class UserBlockCreate(BaseModel):
    blocked_username: str = Field(..., min_length=1, max_length=50)
    reason: Optional[str] = Field(None, max_length=500)

class FriendSearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=50)
    limit: int = Field(default=20, ge=1, le=100)

# === UTILITY FUNCTIONS ===

def create_friendship_from_request(db: Session, friend_request: FriendRequest) -> Friendship:
    """Create a friendship from an accepted friend request"""
    friendship = Friendship.create_friendship(
        db=db,
        user1_id=friend_request.sender_id,
        user2_id=friend_request.receiver_id
    )
    return friendship

def create_friendship(db: Session, user1_id: int, user2_id: int) -> Friendship:
    """Create a friendship between two users"""
    return Friendship.create_friendship(db, user1_id, user2_id)

def is_user_blocked(db: Session, blocker_id: int, blocked_id: int) -> bool:
    """Check if a user is blocked by another user"""
    return UserBlock.is_blocked(db, blocker_id, blocked_id)

def get_friendship_between_users(db: Session, user1_id: int, user2_id: int) -> Optional[Friendship]:
    """Get friendship between two users if it exists"""
    return db.query(Friendship).filter(
        or_(
            and_(Friendship.user1_id == user1_id, Friendship.user2_id == user2_id),
            and_(Friendship.user1_id == user2_id, Friendship.user2_id == user1_id)
        ),
        Friendship.status == "active"
    ).first()

def get_mutual_friends(db: Session, user1_id: int, user2_id: int) -> List[int]:
    """Get mutual friends between two users"""
    user1_friends = [f.get_friend_of(user1_id) for f in Friendship.get_friends_of_user(db, user1_id)]
    user2_friends = [f.get_friend_of(user2_id) for f in Friendship.get_friends_of_user(db, user2_id)]
    
    return list(set(user1_friends) & set(user2_friends))

def can_interact(db: Session, user1_id: int, user2_id: int) -> bool:
    """Check if two users can interact (not blocked)"""
    return not (UserBlock.is_blocked(db, user1_id, user2_id) or 
                UserBlock.is_blocked(db, user2_id, user1_id))

def create_friend_request(db: Session, sender_id: int, receiver_id: int, message: str = None) -> FriendRequest:
    """Create a new friend request"""
    # Check if request already exists
    if FriendRequest.request_exists(db, sender_id, receiver_id):
        raise ValueError("Friend request already exists")
    
    friend_request = FriendRequest(
        sender_id=sender_id,
        receiver_id=receiver_id,
        message=message,
        status=FriendRequestStatus.PENDING
    )
    
    db.add(friend_request)
    db.commit()
    db.refresh(friend_request)
    
    return friend_request

def respond_to_friend_request(db: Session, request_id: int, action: str, user_id: int) -> dict:
    """Respond to a friend request"""
    request = db.query(FriendRequest).filter(FriendRequest.id == request_id).first()
    
    if not request:
        raise ValueError("Friend request not found")
    
    if request.receiver_id != user_id:
        raise ValueError("You can only respond to your own friend requests")
    
    if request.status != FriendRequestStatus.PENDING:
        raise ValueError("This friend request has already been responded to")
    
    if action == "accept":
        request.accept()
        # Create friendship
        friendship = create_friendship_from_request(db, request)
        db.commit()
        return {"status": "accepted", "friendship_id": friendship.id}
    
    elif action == "decline":
        request.decline()
        db.commit()
        return {"status": "declined"}
    
    elif action == "block":
        request.block()
        # Create block
        block = UserBlock(
            blocker_id=user_id,
            blocked_id=request.sender_id,
            reason="Blocked via friend request"
        )
        db.add(block)
        db.commit()
        return {"status": "blocked"}
    
    else:
        raise ValueError("Invalid action")