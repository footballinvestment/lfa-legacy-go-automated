# === backend/app/models/friends.py ===
# LFA Legacy GO - Friend System Models - JAVÍTOTT VERZIÓ
# Comprehensive friendship and social interaction models with Pydantic schemas and utility functions

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
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_friend_requests")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_friend_requests")
    
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
    
    # Relationships
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    
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
    challenge_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Challenge participants
    challenger_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    challenged_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Challenge details
    game_type = Column(String(20), nullable=False)  # "GAME1", "GAME2", "GAME3"
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    
    # Challenge terms
    stakes = Column(Integer, default=0)  # Credits at stake
    challenge_message = Column(Text, nullable=True)
    special_rules = Column(Text, nullable=True)
    
    # Status and timing
    status = Column(String(20), default="pending")  # "pending", "accepted", "declined", "completed", "expired"
    expires_at = Column(DateTime, nullable=False)
    accepted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Results
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    challenger_score = Column(Integer, nullable=True)
    challenged_score = Column(Integer, nullable=True)
    
    # Game session link
    game_session_id = Column(String(50), ForeignKey("game_sessions.session_id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    challenger = relationship("User", foreign_keys=[challenger_id], back_populates="sent_challenges")
    challenged = relationship("User", foreign_keys=[challenged_id], back_populates="received_challenges")
    winner = relationship("User", foreign_keys=[winner_id])
    location = relationship("Location")
    game_session = relationship("GameSession", foreign_keys=[game_session_id])
    
    def __repr__(self):
        return f"<Challenge(id='{self.challenge_id}', challenger={self.challenger_id}, challenged={self.challenged_id}, status='{self.status}')>"
    
    @property
    def is_pending(self) -> bool:
        """Check if challenge is pending"""
        return self.status == "pending" and datetime.now() < self.expires_at
    
    @property
    def is_expired(self) -> bool:
        """Check if challenge has expired"""
        return datetime.now() > self.expires_at and self.status == "pending"
    
    @property
    def is_completed(self) -> bool:
        """Check if challenge is completed"""
        return self.status == "completed"
    
    def accept(self):
        """Accept the challenge"""
        if self.is_pending:
            self.status = "accepted"
            self.accepted_at = datetime.now()
    
    def decline(self):
        """Decline the challenge"""
        if self.is_pending:
            self.status = "declined"
    
    def complete(self, challenger_score: int, challenged_score: int):
        """Complete the challenge with scores"""
        self.challenger_score = challenger_score
        self.challenged_score = challenged_score
        
        # Determine winner
        if challenger_score > challenged_score:
            self.winner_id = self.challenger_id
        elif challenged_score > challenger_score:
            self.winner_id = self.challenged_id
        # If tied, winner_id remains None
        
        self.status = "completed"
        self.completed_at = datetime.now()
    
    def generate_challenge_id(self) -> str:
        """Generate unique challenge ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"CHALL_{self.challenger_id}_{self.challenged_id}_{timestamp}"
    
    @classmethod
    def get_pending_challenges_for_user(cls, db: Session, user_id: int) -> List['Challenge']:
        """Get pending challenges for a user"""
        return db.query(cls).filter(
            cls.challenged_id == user_id,
            cls.status == "pending",
            cls.expires_at > datetime.now()
        ).all()
    
    @classmethod
    def get_sent_challenges_by_user(cls, db: Session, user_id: int) -> List['Challenge']:
        """Get challenges sent by a user"""
        return db.query(cls).filter(
            cls.challenger_id == user_id,
            cls.status.in_(["pending", "accepted"])
        ).all()

class UserBlock(Base):
    """
    User blocking model - represents blocked users
    """
    __tablename__ = "user_blocks"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Blocking relationship
    blocker_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    blocked_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Block details
    reason = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Block type
    block_type = Column(String(20), default="full")  # "full", "challenges_only", "messages_only"
    
    # Timestamps
    blocked_at = Column(DateTime(timezone=True), server_default=func.now())
    unblocked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    blocker = relationship("User", foreign_keys=[blocker_id])
    blocked = relationship("User", foreign_keys=[blocked_id])
    
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

# === UTILITY FUNCTIONS ===

def create_friendship_from_request(db: Session, friend_request: FriendRequest) -> Friendship:
    """Create a friendship from an accepted friend request"""
    friendship = Friendship.create_friendship(
        db=db,
        user1_id=friend_request.sender_id,
        user2_id=friend_request.receiver_id
    )
    
    # Update friend counts (would need to implement in User model)
    # This is a placeholder - you'd update the User model's friend_count
    
    return friendship

def create_friendship(db: Session, user1_id: int, user2_id: int) -> Friendship:
    """Create a friendship between two users"""
    return Friendship.create_friendship(db, user1_id, user2_id)

def is_user_blocked(db: Session, blocker_id: int, blocked_id: int) -> bool:
    """Check if a user is blocked by another user - alias for UserBlock.is_blocked"""
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

def get_user_by_username(db: Session, username: str):
    """Get user by username - utility function"""
    from .user import User
    return db.query(User).filter(User.username == username).first()

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
        # Also create a block entry
        block = UserBlock(
            blocker_id=user_id,
            blocked_id=request.sender_id,
            reason="Blocked via friend request",
            block_type="full"
        )
        db.add(block)
        db.commit()
        return {"status": "blocked"}
    
    else:
        raise ValueError("Invalid action")

def create_challenge(db: Session, challenger_id: int, challenged_id: int, game_type: str, **kwargs) -> Challenge:
    """Create a new challenge"""
    from datetime import timedelta
    
    challenge = Challenge(
        challenge_id=f"CHALL_{challenger_id}_{challenged_id}_{int(time.time())}",
        challenger_id=challenger_id,
        challenged_id=challenged_id,
        game_type=game_type,
        expires_at=datetime.now() + timedelta(days=7),  # 7 days to respond
        **kwargs
    )
    
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    
    return challenge

def respond_to_challenge(db: Session, challenge_id: int, action: str, user_id: int) -> dict:
    """Respond to a challenge"""
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    
    if not challenge:
        raise ValueError("Challenge not found")
    
    if challenge.challenged_id != user_id:
        raise ValueError("You can only respond to your own challenges")
    
    if not challenge.is_pending:
        raise ValueError("This challenge is no longer pending")
    
    if action == "accept":
        challenge.accept()
        db.commit()
        return {"status": "accepted", "challenge": challenge}
    
    elif action == "decline":
        challenge.decline()
        db.commit()
        return {"status": "declined"}
    
    else:
        raise ValueError("Invalid action")

def block_user(db: Session, blocker_id: int, blocked_username: str, reason: str = None, block_type: str = "full") -> UserBlock:
    """Block a user"""
    from .user import User
    
    blocked_user = db.query(User).filter(User.username == blocked_username).first()
    if not blocked_user:
        raise ValueError("User not found")
    
    if blocked_user.id == blocker_id:
        raise ValueError("You cannot block yourself")
    
    # Check if already blocked
    if UserBlock.is_blocked(db, blocker_id, blocked_user.id):
        raise ValueError("User is already blocked")
    
    block = UserBlock(
        blocker_id=blocker_id,
        blocked_id=blocked_user.id,
        reason=reason,
        block_type=block_type
    )
    
    db.add(block)
    db.commit()
    db.refresh(block)
    
    return block

def unblock_user(db: Session, blocker_id: int, blocked_username: str) -> bool:
    """Unblock a user"""
    from .user import User
    
    blocked_user = db.query(User).filter(User.username == blocked_username).first()
    if not blocked_user:
        raise ValueError("User not found")
    
    block = db.query(UserBlock).filter(
        UserBlock.blocker_id == blocker_id,
        UserBlock.blocked_id == blocked_user.id,
        UserBlock.is_active == True
    ).first()
    
    if not block:
        raise ValueError("User is not blocked")
    
    block.unblock()
    db.commit()
    
    return True

# Extra import for time module
import time

# === PYDANTIC SCHEMAS ===

class FriendSearchQuery(BaseModel):
    """Schema for friend search query"""
    search_term: str = Field(..., min_length=1, max_length=50)
    limit: int = Field(default=20, ge=1, le=100)

class FriendRequestCreate(BaseModel):
    """Schema for creating a friend request"""
    receiver_username: str
    message: Optional[str] = None

class FriendRequestResponse(BaseModel):
    """Schema for friend request response"""
    request_id: int
    action: str  # "accept", "decline", "block"
    
    @validator('action')
    def validate_action(cls, v):
        if v not in ['accept', 'decline', 'block']:
            raise ValueError('Action must be accept, decline, or block')
        return v

class FriendRequestInfo(BaseModel):
    """Schema for friend request information"""
    id: int
    sender_id: int
    sender_username: str
    sender_level: int
    message: Optional[str]
    created_at: datetime
    status: str
    
    class Config:
        from_attributes = True

class FriendInfo(BaseModel):
    """Schema for friend information"""
    user_id: int
    username: str
    full_name: str
    level: int
    is_online: bool
    last_activity: Optional[datetime]
    games_played_together: int
    friendship_since: datetime
    
    class Config:
        from_attributes = True

class ChallengeCreate(BaseModel):
    """Schema for creating a challenge"""
    challenged_username: str
    game_type: str
    stakes: int = 0
    challenge_message: Optional[str] = None
    location_id: Optional[int] = None
    
    @validator('game_type')
    def validate_game_type(cls, v):
        if v not in ['GAME1', 'GAME2', 'GAME3']:
            raise ValueError('Invalid game type')
        return v
    
    @validator('stakes')
    def validate_stakes(cls, v):
        if v < 0:
            raise ValueError('Stakes cannot be negative')
        return v

class ChallengeInfo(BaseModel):
    """Schema for challenge information"""
    id: int
    challenge_id: str
    challenger_username: str
    challenged_username: str
    game_type: str
    stakes: int
    status: str
    challenge_message: Optional[str]
    created_at: datetime
    expires_at: datetime
    winner_username: Optional[str] = None
    
    class Config:
        from_attributes = True

class ChallengeResponse(BaseModel):
    """Schema for challenge response"""
    challenge_id: int
    action: str  # "accept", "decline"
    
    @validator('action')
    def validate_action(cls, v):
        if v not in ['accept', 'decline']:
            raise ValueError('Action must be accept or decline')
        return v

class UserBlockCreate(BaseModel):
    """Schema for creating a user block"""
    blocked_username: str
    reason: Optional[str] = None
    block_type: str = "full"  # "full", "challenges_only", "messages_only"
    notes: Optional[str] = None
    
    @validator('block_type')
    def validate_block_type(cls, v):
        if v not in ['full', 'challenges_only', 'messages_only']:
            raise ValueError('Invalid block type')
        return v

class UserBlockResponse(BaseModel):
    """Schema for user block response"""
    id: int
    blocker_id: int
    blocked_id: int
    blocked_username: str
    reason: Optional[str]
    block_type: str
    is_active: bool
    blocked_at: datetime
    
    class Config:
        from_attributes = True

class SocialStatsResponse(BaseModel):
    """Schema for social statistics response"""
    total_friends: int
    pending_friend_requests: int
    sent_friend_requests: int
    active_challenges: int
    completed_challenges: int
    challenge_wins: int
    challenge_losses: int
    blocked_users: int
    
    class Config:
        from_attributes = True

class BlockUserRequest(BaseModel):
    """Schema for blocking a user"""
    blocked_username: str
    reason: Optional[str] = None
    block_type: str = "full"  # "full", "challenges_only", "messages_only"
    
    @validator('block_type')
    def validate_block_type(cls, v):
        if v not in ['full', 'challenges_only', 'messages_only']:
            raise ValueError('Invalid block type')
        return v

class UnblockUserRequest(BaseModel):
    """Schema for unblocking a user"""
    blocked_username: str