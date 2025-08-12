# === backend/app/routers/social.py ===
# TELJES JAVÍTOTT Social System Router - FRIENDSHIP STATUS FIELD FIXED
# 🔧 JAVÍTÁS: Friendship.is_active → Friendship.status == "active"

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from ..database import get_db
from ..models.user import User
from ..models.friends import (
    FriendRequest, Friendship, Challenge, UserBlock, 
    FriendRequestStatus, FriendRequestCreate, FriendRequestResponse,
    ChallengeCreate, ChallengeResponse, UserBlockCreate, FriendSearchQuery,
    create_friendship, get_friendship_between_users, is_user_blocked
)
from ..routers.auth import get_current_user

# Initialize router and logger
router = APIRouter(prefix="/api/social", tags=["social"])
logger = logging.getLogger(__name__)

# === PROFILE ENDPOINT - JAVÍTOTT FRIENDSHIP STATUS ===

@router.get("/profile")
async def get_social_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    👤 Get current user's social profile - JAVÍTOTT: FRIENDSHIP STATUS FIXED
    """
    try:
        # Get friend statistics
        total_friends = current_user.friend_count
        
        # Get pending friend requests
        sent_requests = db.query(FriendRequest).filter(
            FriendRequest.sender_id == current_user.id,
            FriendRequest.status == FriendRequestStatus.PENDING
        ).count()
        
        received_requests = db.query(FriendRequest).filter(
            FriendRequest.receiver_id == current_user.id,
            FriendRequest.status == FriendRequestStatus.PENDING
        ).count()
        
        # 🔧 JAVÍTÁS: Friendship.is_active → Friendship.status == "active"
        recent_friendships = db.query(Friendship).filter(
            or_(Friendship.user1_id == current_user.id, Friendship.user2_id == current_user.id),
            Friendship.status == "active"  # JAVÍTOTT: is_active helyett status
        ).order_by(desc(Friendship.created_at)).limit(10).all()
        
        recent_friends = []
        for friendship in recent_friendships:
            friend_id = friendship.user2_id if friendship.user1_id == current_user.id else friendship.user1_id
            friend = db.query(User).filter(User.id == friend_id).first()
            if friend:
                recent_friends.append({
                    "id": friend.id,
                    "username": friend.username,
                    "full_name": friend.full_name,
                    "level": friend.level,
                    "became_friends": friendship.created_at.isoformat()
                })
        
        return {
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "full_name": current_user.full_name,
                "level": current_user.level,
                "xp": current_user.xp,
                "credits": current_user.credits,
                "games_played": current_user.games_played,
                "games_won": current_user.games_won
            },
            "social_stats": {
                "total_friends": total_friends,
                "pending_sent_requests": sent_requests,
                "pending_received_requests": received_requests
            },
            "recent_friends": recent_friends,
            "social_level": "Active" if total_friends >= 5 else "Beginner" if total_friends >= 1 else "New Player"
        }
        
    except Exception as e:
        logger.error(f"Error fetching social profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching social profile"
        )

# === FRIEND REQUEST ENDPOINTS ===

@router.post("/friends/request")
async def send_friend_request(
    request_data: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    👥 Barát kérelem küldése - JAVÍTOTT ENDPOINT NÉVVEL
    """
    try:
        # Find target user
        target_user = db.query(User).filter(User.username == request_data.receiver_username).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{request_data.receiver_username}' not found"
            )
        
        # Can't send friend request to yourself
        if target_user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot send friend request to yourself"
            )
        
        # Check if users are blocked
        if is_user_blocked(db, current_user.id, target_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot send friend request to this user"
            )
        
        # Check if already friends
        existing_friendship = get_friendship_between_users(db, current_user.id, target_user.id)
        if existing_friendship:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already friends with this user"
            )
        
        # Check if friend request already exists
        existing_request = db.query(FriendRequest).filter(
            FriendRequest.sender_id == current_user.id,
            FriendRequest.receiver_id == target_user.id,
            FriendRequest.status == FriendRequestStatus.PENDING
        ).first()
        
        if existing_request:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Friend request already sent to this user"
            )
        
        # Create friend request
        friend_request = FriendRequest(
            sender_id=current_user.id,
            receiver_id=target_user.id,
            message=request_data.message,
            status=FriendRequestStatus.PENDING
        )
        
        db.add(friend_request)
        db.commit()
        db.refresh(friend_request)
        
        logger.info(f"Friend request sent: {current_user.username} -> {target_user.username}")
        
        return {
            "message": f"Friend request sent to {target_user.username}",
            "id": friend_request.id,
            "request_id": friend_request.id,
            "receiver": {
                "id": target_user.id,
                "username": target_user.username,
                "full_name": target_user.full_name
            },
            "sent_at": friend_request.created_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending friend request: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error sending friend request"
        )

@router.post("/friend-request")  # Legacy endpoint
async def send_friend_request_legacy(
    request_data: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    👥 Barát kérelem küldése (legacy endpoint)
    """
    return await send_friend_request(request_data, current_user, db)

@router.get("/friend-requests")
async def get_friend_requests(
    request_type: str = Query("received", description="Type: sent, received, or all"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    📬 Barát kérelmek lekérése
    """
    try:
        query = db.query(FriendRequest).filter(FriendRequest.status == FriendRequestStatus.PENDING)
        
        if request_type == "sent":
            query = query.filter(FriendRequest.sender_id == current_user.id)
        elif request_type == "received":
            query = query.filter(FriendRequest.receiver_id == current_user.id)
        else:  # all
            query = query.filter(
                or_(FriendRequest.sender_id == current_user.id, FriendRequest.receiver_id == current_user.id)
            )
        
        requests_data = query.order_by(desc(FriendRequest.created_at)).all()
        
        # Format response with user details
        formatted_requests = []
        for req in requests_data:
            # Get the other user's info
            other_user = req.receiver if req.sender_id == current_user.id else req.sender
            
            formatted_requests.append({
                "id": req.id,
                "request_id": req.id,
                "type": "sent" if req.sender_id == current_user.id else "received",
                "other_user": {
                    "id": other_user.id,
                    "username": other_user.username,
                    "full_name": other_user.full_name,
                    "level": other_user.level
                },
                "message": req.message,
                "created_at": req.created_at
            })
        
        return {
            "requests": formatted_requests,
            "count": len(formatted_requests),
            "request_type": request_type
        }
        
    except Exception as e:
        logger.error(f"Error fetching friend requests: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching friend requests"
        )

@router.post("/friend-request/respond")
async def respond_to_friend_request(
    response_data: FriendRequestResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ✅ Barát kérelemre válaszolás (elfogadás/elutasítás)
    """
    try:
        # Find the friend request
        friend_request = db.query(FriendRequest).filter(
            FriendRequest.id == response_data.request_id,
            FriendRequest.receiver_id == current_user.id,
            FriendRequest.status == FriendRequestStatus.PENDING
        ).first()
        
        if not friend_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friend request not found or already processed"
            )
        
        sender = friend_request.sender
        
        if response_data.action == "accept":
            # Accept: Create friendship
            friend_request.status = FriendRequestStatus.ACCEPTED
            
            friendship = create_friendship(db, sender.id, current_user.id)
            
            # Update friend counts
            sender.friend_count += 1
            current_user.friend_count += 1
            
            response_message = f"Friend request from {sender.username} accepted"
            
        elif response_data.action == "decline":
            # Decline: Mark as declined
            friend_request.status = FriendRequestStatus.DECLINED
            response_message = f"Friend request from {sender.username} declined"
            
        elif response_data.action == "block":
            # Block: Mark as declined and block user
            friend_request.status = FriendRequestStatus.DECLINED
            
            # Create block
            user_block = UserBlock(
                blocker_id=current_user.id,
                blocked_id=sender.id,
                reason="Blocked via friend request response",
                is_active=True
            )
            db.add(user_block)
            
            response_message = f"Friend request from {sender.username} declined and user blocked"
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid action. Must be 'accept', 'decline', or 'block'"
            )
        
        db.commit()
        
        logger.info(f"Friend request response: {current_user.username} {response_data.action}ed {sender.username}")
        
        return {
            "message": response_message,
            "action": response_data.action,
            "request_id": response_data.request_id,
            "friend": {
                "id": sender.id,
                "username": sender.username,
                "full_name": sender.full_name
            } if response_data.action == "accept" else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error responding to friend request: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error responding to friend request"
        )

# === FRIENDSHIP MANAGEMENT - JAVÍTOTT FRIENDSHIP STATUS ===

@router.get("/friends")
async def get_friends(
    include_stats: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    👥 Barátok listája lekérése - JAVÍTOTT: FRIENDSHIP STATUS FIXED
    """
    try:
        # 🔧 JAVÍTÁS: Friendship.is_active → Friendship.status == "active"
        friendships = db.query(Friendship).filter(
            or_(Friendship.user1_id == current_user.id, Friendship.user2_id == current_user.id),
            Friendship.status == "active"  # JAVÍTOTT: is_active helyett status
        ).all()
        
        friends_list = []
        for friendship in friendships:
            # Get friend user
            friend_id = friendship.user2_id if friendship.user1_id == current_user.id else friendship.user1_id
            friend = db.query(User).filter(User.id == friend_id).first()
            
            if friend:
                friend_data = {
                    "id": friend.id,
                    "username": friend.username,
                    "full_name": friend.full_name,
                    "level": friend.level,
                    "games_played": friend.games_played,
                    "became_friends": friendship.created_at.isoformat(),
                    "is_online": False  # TODO: Implement online status
                }
                
                if include_stats:
                    friend_data.update({
                        "xp": friend.xp,
                        "games_won": friend.games_won,
                        "skills": friend.skills
                    })
                
                friends_list.append(friend_data)
        
        return {
            "friends": friends_list,
            "total_friends": len(friends_list),
            "mutual_friends": 0  # TODO: Implement mutual friends calculation
        }
        
    except Exception as e:
        logger.error(f"Error fetching friends: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching friends list"
        )

@router.delete("/friends/{friend_id}")
async def remove_friend(
    friend_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ❌ Barátság megszüntetése - JAVÍTOTT: FRIENDSHIP STATUS FIXED
    """
    try:
        # 🔧 JAVÍTÁS: Friendship.is_active → Friendship.status == "active"
        friendship = db.query(Friendship).filter(
            or_(
                and_(Friendship.user1_id == current_user.id, Friendship.user2_id == friend_id),
                and_(Friendship.user1_id == friend_id, Friendship.user2_id == current_user.id)
            ),
            Friendship.status == "active"  # JAVÍTOTT: is_active helyett status
        ).first()
        
        if not friendship:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friendship not found"
            )
        
        # Deactivate friendship
        friendship.status = "inactive"  # JAVÍTOTT: is_active = False helyett status = "inactive"
        
        # Update friend counts
        current_user.friend_count = max(0, current_user.friend_count - 1)
        
        # Get friend user to update their count too
        friend = db.query(User).filter(User.id == friend_id).first()
        if friend:
            friend.friend_count = max(0, friend.friend_count - 1)
        
        db.commit()
        
        logger.info(f"Friendship ended: {current_user.username} removed {friend_id}")
        
        return {
            "message": "Friend removed successfully",
            "friend_id": friend_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing friend: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error removing friend"
        )

# === USER SEARCH ===

@router.get("/search")
async def search_users(
    query: str = Query(..., min_length=1, max_length=50),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    🔍 Felhasználók keresése barát hozzáadáshoz
    """
    try:
        # Search users by username or full name
        users = db.query(User).filter(
            or_(
                User.username.contains(query),
                User.full_name.contains(query)
            ),
            User.id != current_user.id,  # Exclude current user
            User.is_active == True
        ).limit(limit).all()
        
        # Format results with relationship status
        results = []
        for user in users:
            # Check if already friends
            existing_friendship = get_friendship_between_users(db, current_user.id, user.id)
            
            # Check if friend request exists
            pending_request = db.query(FriendRequest).filter(
                or_(
                    and_(FriendRequest.sender_id == current_user.id, FriendRequest.receiver_id == user.id),
                    and_(FriendRequest.sender_id == user.id, FriendRequest.receiver_id == current_user.id)
                ),
                FriendRequest.status == FriendRequestStatus.PENDING
            ).first()
            
            # Check if blocked
            is_blocked = is_user_blocked(db, current_user.id, user.id) or is_user_blocked(db, user.id, current_user.id)
            
            # Determine relationship status
            if existing_friendship:
                relationship_status = "friends"
            elif pending_request:
                if pending_request.sender_id == current_user.id:
                    relationship_status = "request_sent"
                else:
                    relationship_status = "request_received"
            elif is_blocked:
                relationship_status = "blocked"
            else:
                relationship_status = "none"
            
            results.append({
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "level": user.level,
                "relationship_status": relationship_status
            })
        
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error searching users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching users"
        )

# === SOCIAL STATISTICS ===

@router.get("/stats")
async def get_social_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    📊 Közösségi statisztikák lekérése
    """
    try:
        # Friend statistics
        total_friends = current_user.friend_count
        
        # Friend request statistics
        sent_requests = db.query(FriendRequest).filter(
            FriendRequest.sender_id == current_user.id,
            FriendRequest.status == FriendRequestStatus.PENDING
        ).count()
        
        received_requests = db.query(FriendRequest).filter(
            FriendRequest.receiver_id == current_user.id,
            FriendRequest.status == FriendRequestStatus.PENDING
        ).count()
        
        # Challenge statistics
        sent_challenges = db.query(Challenge).filter(
            Challenge.challenger_id == current_user.id
        ).count()
        
        received_challenges = db.query(Challenge).filter(
            Challenge.challenged_id == current_user.id
        ).count()
        
        # Block statistics
        blocked_users_count = db.query(UserBlock).filter(
            UserBlock.blocker_id == current_user.id,
            UserBlock.is_active == True
        ).count()
        
        return {
            "friends": {
                "total": total_friends,
                "pending_sent_requests": sent_requests,
                "pending_received_requests": received_requests
            },
            "challenges": {
                "sent": sent_challenges,
                "received": received_challenges
            },
            "blocks": {
                "blocked_users": blocked_users_count
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching social stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching social statistics"
        )

# === CHALLENGE SYSTEM ===

@router.post("/challenges")
async def send_challenge(
    challenge_data: ChallengeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ⚔️ Kihívás küldése barátnak
    """
    try:
        # Find target user
        target_user = db.query(User).filter(User.username == challenge_data.challenged_username).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{challenge_data.challenged_username}' not found"
            )
        
        # Check if users are friends
        friendship = get_friendship_between_users(db, current_user.id, target_user.id)
        if not friendship:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You can only challenge friends"
            )
        
        # Create challenge
        challenge = Challenge(
            challenger_id=current_user.id,
            challenged_id=target_user.id,
            game_type=challenge_data.game_type,
            stakes=challenge_data.stakes,
            challenge_message=challenge_data.challenge_message,
            location_id=challenge_data.location_id,
            status="pending",
            expires_at=datetime.utcnow() + timedelta(days=7)  # 7 day expiry
        )
        
        db.add(challenge)
        db.commit()
        db.refresh(challenge)
        
        logger.info(f"Challenge sent: {current_user.username} -> {target_user.username}")
        
        return {
            "message": f"Challenge sent to {target_user.username}",
            "challenge_id": challenge.id,
            "game_type": challenge.game_type,
            "stakes": challenge.stakes,
            "expires_at": challenge.expires_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending challenge: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error sending challenge"
        )

@router.get("/challenges")
async def get_challenges(
    challenge_type: str = Query("received", description="Type: sent, received, or all"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ⚔️ Kihívások lekérése
    """
    try:
        query = db.query(Challenge)
        
        if challenge_type == "sent":
            query = query.filter(Challenge.challenger_id == current_user.id)
        elif challenge_type == "received":
            query = query.filter(Challenge.challenged_id == current_user.id)
        else:  # all
            query = query.filter(
                or_(Challenge.challenger_id == current_user.id, Challenge.challenged_id == current_user.id)
            )
        
        challenges = query.order_by(desc(Challenge.created_at)).all()
        
        # Format response
        formatted_challenges = []
        for challenge in challenges:
            other_user = challenge.challenged if challenge.challenger_id == current_user.id else challenge.challenger
            
            formatted_challenges.append({
                "id": challenge.id,
                "type": "sent" if challenge.challenger_id == current_user.id else "received",
                "other_user": {
                    "id": other_user.id,
                    "username": other_user.username,
                    "full_name": other_user.full_name
                },
                "game_type": challenge.game_type,
                "stakes": challenge.stakes,
                "status": challenge.status,
                "message": challenge.challenge_message,
                "created_at": challenge.created_at,
                "expires_at": challenge.expires_at
            })
        
        return {
            "challenges": formatted_challenges,
            "count": len(formatted_challenges),
            "challenge_type": challenge_type
        }
        
    except Exception as e:
        logger.error(f"Error fetching challenges: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching challenges"
        )

# === USER BLOCKING ===

@router.post("/block")
async def block_user(
    block_data: UserBlockCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    🚫 Felhasználó blokkolása
    """
    try:
        # Find target user
        target_user = db.query(User).filter(User.username == block_data.blocked_username).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{block_data.blocked_username}' not found"
            )
        
        # Can't block yourself
        if target_user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot block yourself"
            )
        
        # Check if already blocked
        existing_block = db.query(UserBlock).filter(
            UserBlock.blocker_id == current_user.id,
            UserBlock.blocked_id == target_user.id,
            UserBlock.is_active == True
        ).first()
        
        if existing_block:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already blocked"
            )
        
        # Create block
        user_block = UserBlock(
            blocker_id=current_user.id,
            blocked_id=target_user.id,
            reason=block_data.reason,
            block_type=block_data.block_type,
            notes=block_data.notes,
            is_active=True
        )
        
        db.add(user_block)
        
        # Remove friendship if exists
        friendship = get_friendship_between_users(db, current_user.id, target_user.id)
        if friendship:
            friendship.status = "blocked"  # JAVÍTOTT: is_active = False helyett status = "blocked"
            
            # Update friend counts
            current_user.friend_count = max(0, current_user.friend_count - 1)
            target_user.friend_count = max(0, target_user.friend_count - 1)
        
        db.commit()
        
        logger.info(f"User blocked: {current_user.username} blocked {target_user.username}")
        
        return {
            "message": f"User {target_user.username} has been blocked",
            "blocked_user": {
                "id": target_user.id,
                "username": target_user.username,
                "full_name": target_user.full_name
            },
            "block_type": block_data.block_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error blocking user: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error blocking user"
        )

@router.delete("/block/{blocked_username}")
async def unblock_user(
    blocked_username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ✅ Felhasználó blokk feloldása
    """
    try:
        # Find target user
        target_user = db.query(User).filter(User.username == blocked_username).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{blocked_username}' not found"
            )
        
        # Find active block
        user_block = db.query(UserBlock).filter(
            UserBlock.blocker_id == current_user.id,
            UserBlock.blocked_id == target_user.id,
            UserBlock.is_active == True
        ).first()
        
        if not user_block:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User is not blocked"
            )
        
        # Remove block
        user_block.is_active = False
        user_block.unblocked_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"User unblocked: {current_user.username} unblocked {target_user.username}")
        
        return {
            "message": f"User {target_user.username} has been unblocked",
            "unblocked_user": {
                "id": target_user.id,
                "username": target_user.username,
                "full_name": target_user.full_name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unblocking user: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error unblocking user"
        )

# === HEALTH CHECK ===

@router.get("/health")
async def social_system_health():
    """🏥 Social system health check"""
    
    return {
        "status": "healthy",
        "features": [
            "friend_requests",
            "friendship_management", 
            "user_search",
            "social_profile",
            "social_statistics",
            "challenge_system",
            "user_blocking"
        ],
        "endpoints": [
            "/api/social/friends/request",
            "/api/social/profile",
            "/api/social/friends",
            "/api/social/friend-requests",
            "/api/social/search",
            "/api/social/challenges"
        ],
        "database_fixes": [
            "friendship_status_field_fixed",
            "is_active_removed_from_queries"
        ],
        "last_check": datetime.utcnow().isoformat()
    }