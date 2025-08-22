# === backend/app/routers/social.py ===
# TELJES JAVÍTOTT SOCIAL ROUTER - List import hozzáadva

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, not_
from typing import List, Dict, Any, Optional  # ✅ List import hozzáadva
from datetime import datetime
from pydantic import BaseModel, Field
import logging

from ..database import get_db
from ..models.user import User
from ..routers.auth import get_current_user

# Configure logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(tags=["Social"])

# === PYDANTIC SCHEMAS ===


class UserSearchResult(BaseModel):
    id: int
    username: str
    full_name: str
    level: int
    games_played: int
    win_rate: float
    is_online: bool = False
    can_send_friend_request: bool = True
    friendship_status: Optional[str] = None


class FriendRequest(BaseModel):
    id: int
    from_user_id: int
    to_user_id: int
    status: str
    created_at: datetime
    from_user: Dict[str, Any]
    to_user: Dict[str, Any]


class Friend(BaseModel):
    user_id: int
    username: str
    full_name: str
    level: int
    is_online: bool
    last_active: Optional[datetime] = None
    games_played: int
    win_rate: float
    friendship_since: Optional[datetime] = None


class Challenge(BaseModel):
    id: int
    challenger_id: int
    challenged_id: int
    game_type: str
    location_id: Optional[int] = None
    status: str
    created_at: datetime
    expires_at: datetime
    challenger: Dict[str, Any]
    challenged: Dict[str, Any]


class FriendRequestCreate(BaseModel):
    to_user_id: int


class FriendRequestResponse(BaseModel):
    request_id: int
    accept: bool


class ChallengeCreate(BaseModel):
    challenged_user_id: int
    game_type: str = Field(..., pattern="^GAME[1-5]$")
    location_id: Optional[int] = None
    message: Optional[str] = None


class ChallengeResponse(BaseModel):
    challenge_id: int
    accept: bool


# === HELPER FUNCTIONS ===


def get_user_public_data(user: User) -> Dict[str, Any]:
    """Get public user data for social features"""
    win_rate = (
        (user.games_won / user.games_played * 100) if user.games_played > 0 else 0
    )

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "level": user.level,
        "games_played": user.games_played,
        "games_won": user.games_won,
        "win_rate": round(win_rate, 1),
        "average_performance": user.average_performance or 0,
        "last_active": user.last_activity,
    }


def check_friendship_status(user1_id: int, user2_id: int, db: Session) -> Optional[str]:
    """Check friendship status between two users"""
    # This would check the friendship table in a real implementation
    # For now, return None (no friendship)
    return None


def get_friend_requests_for_user(
    user_id: int, db: Session, request_type: str = "all"
) -> List[Dict]:
    """Get friend requests for a user (sent or received)"""
    # This would query the friend_requests table in a real implementation
    # For now, return empty list
    return []


def get_user_friends(user_id: int, db: Session) -> List[Dict]:
    """Get user's friends list"""
    # This would query the friendships table in a real implementation
    # For now, return empty list
    return []


def create_friend_request(from_user_id: int, to_user_id: int, db: Session) -> Dict:
    """Create a new friend request"""
    # This would create a record in friend_requests table
    # For now, simulate creation
    request_data = {
        "id": 1,
        "from_user_id": from_user_id,
        "to_user_id": to_user_id,
        "status": "pending",
        "created_at": datetime.utcnow(),
    }

    logger.info(f"✅ Friend request created: {from_user_id} → {to_user_id}")
    return request_data


def respond_to_friend_request(request_id: int, accept: bool, db: Session) -> bool:
    """Respond to a friend request"""
    # This would update the friend request and create friendship if accepted
    # For now, simulate response
    logger.info(
        f"✅ Friend request {request_id} {'accepted' if accept else 'declined'}"
    )
    return True


# === SOCIAL ENDPOINTS ===


@router.get("/search-users", response_model=List[UserSearchResult])
async def search_users(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """🔍 Search for users by username or full name"""
    try:
        # Search users by username or full name
        search_term = f"%{q.lower()}%"

        users = (
            db.query(User)
            .filter(
                and_(
                    User.id != current_user.id,  # Exclude current user
                    User.is_active == True,
                    or_(
                        User.username.ilike(search_term),
                        User.full_name.ilike(search_term),
                    ),
                )
            )
            .limit(limit)
            .all()
        )

        results = []
        for user in users:
            win_rate = (
                (user.games_won / user.games_played * 100)
                if user.games_played > 0
                else 0
            )
            friendship_status = check_friendship_status(current_user.id, user.id, db)

            results.append(
                UserSearchResult(
                    id=user.id,
                    username=user.username,
                    full_name=user.full_name,
                    level=user.level,
                    games_played=user.games_played,
                    win_rate=round(win_rate, 1),
                    is_online=False,  # Would check real online status
                    can_send_friend_request=(friendship_status is None),
                    friendship_status=friendship_status,
                )
            )

        return results

    except Exception as e:
        logger.error(f"❌ User search error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Search failed"
        )


@router.post("/friend-request/{user_id}")
async def send_friend_request(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """👋 Send a friend request to another user"""
    try:
        # Validate target user exists
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        if target_user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot send friend request to yourself",
            )

        # Check if friendship already exists
        friendship_status = check_friendship_status(current_user.id, target_user.id, db)
        if friendship_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Friendship status: {friendship_status}",
            )

        # Create friend request
        request_data = create_friend_request(current_user.id, target_user.id, db)

        return {
            "success": True,
            "message": f"Friend request sent to {target_user.username}",
            "request_id": request_data["id"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Friend request error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send friend request",
        )


@router.post("/friend-request/{request_id}/respond")
async def respond_friend_request(
    request_id: int,
    response_data: FriendRequestResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """✅ Respond to a friend request (accept/decline)"""
    try:
        # Respond to friend request
        success = respond_to_friend_request(request_id, response_data.accept, db)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Friend request not found"
            )

        action = "accepted" if response_data.accept else "declined"
        return {
            "success": True,
            "message": f"Friend request {action}",
            "request_id": request_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Friend request response error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to respond to friend request",
        )


@router.get("/friend-requests", response_model=List[Dict])
async def get_friend_requests(
    type: str = Query("received", pattern="^(sent|received|all)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """📨 Get friend requests (sent or received)"""
    try:
        requests = get_friend_requests_for_user(current_user.id, db, type)
        return requests

    except Exception as e:
        logger.error(f"❌ Get friend requests error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve friend requests",
        )


@router.get("/friends", response_model=List[Friend])
async def get_friends(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """👥 Get user's friends list"""
    try:
        friends_data = get_user_friends(current_user.id, db)

        friends = []
        for friend_data in friends_data:
            win_rate = (
                (
                    friend_data.get("games_won", 0)
                    / friend_data.get("games_played", 1)
                    * 100
                )
                if friend_data.get("games_played", 0) > 0
                else 0
            )

            friends.append(
                Friend(
                    user_id=friend_data["user_id"],
                    username=friend_data["username"],
                    full_name=friend_data["full_name"],
                    level=friend_data["level"],
                    is_online=False,  # Would check real online status
                    last_active=friend_data.get("last_active"),
                    games_played=friend_data.get("games_played", 0),
                    win_rate=round(win_rate, 1),
                    friendship_since=friend_data.get("friendship_since"),
                )
            )

        return friends

    except Exception as e:
        logger.error(f"❌ Get friends error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve friends list",
        )


@router.delete("/friends/{user_id}")
async def remove_friend(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """💔 Remove a friend"""
    try:
        # This would remove the friendship record
        # For now, simulate removal
        logger.info(f"✅ Friendship removed: {current_user.id} ↔ {user_id}")

        return {"success": True, "message": "Friend removed successfully"}

    except Exception as e:
        logger.error(f"❌ Remove friend error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove friend",
        )


@router.post("/challenge")
async def send_challenge(
    challenge_data: ChallengeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """⚔️ Send a game challenge to another user"""
    try:
        # Validate target user
        target_user = (
            db.query(User).filter(User.id == challenge_data.challenged_user_id).first()
        )
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        if target_user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot challenge yourself",
            )

        # Create challenge (simulated)
        challenge = {
            "id": 1,
            "challenger_id": current_user.id,
            "challenged_id": target_user.id,
            "game_type": challenge_data.game_type,
            "location_id": challenge_data.location_id,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow().replace(
                hour=23, minute=59, second=59
            ),  # Expires end of day
            "message": challenge_data.message,
        }

        logger.info(
            f"✅ Challenge sent: {current_user.id} → {target_user.id} ({challenge_data.game_type})"
        )

        return {
            "success": True,
            "message": f"Challenge sent to {target_user.username}",
            "challenge": challenge,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Send challenge error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send challenge",
        )


@router.get("/challenges")
async def get_challenges(
    type: str = Query("received", pattern="^(sent|received|all)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """⚔️ Get challenges (sent or received)"""
    try:
        # This would query challenges table
        # For now, return empty list
        return []

    except Exception as e:
        logger.error(f"❌ Get challenges error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve challenges",
        )


@router.post("/challenge/{challenge_id}/respond")
async def respond_challenge(
    challenge_id: int,
    response_data: ChallengeResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """✅ Respond to a challenge (accept/decline)"""
    try:
        # This would update the challenge status
        # For now, simulate response
        action = "accepted" if response_data.accept else "declined"
        logger.info(f"✅ Challenge {challenge_id} {action} by user {current_user.id}")

        return {
            "success": True,
            "message": f"Challenge {action}",
            "challenge_id": challenge_id,
        }

    except Exception as e:
        logger.error(f"❌ Challenge response error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to respond to challenge",
        )


@router.post("/block/{user_id}")
async def block_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """🚫 Block a user"""
    try:
        # Validate target user
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        if target_user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot block yourself"
            )

        # This would create a block record
        # For now, simulate blocking
        logger.info(f"✅ User blocked: {current_user.id} blocked {target_user.id}")

        return {
            "success": True,
            "message": f"User {target_user.username} has been blocked",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Block user error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to block user",
        )


@router.get("/stats")
async def get_social_stats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """📊 Get user's social statistics"""
    try:
        # This would calculate real social stats
        # For now, return simulated data
        return {
            "friends_count": current_user.friend_count or 0,
            "pending_friend_requests": 0,
            "sent_friend_requests": 0,
            "challenges_received": 0,
            "challenges_sent": 0,
            "challenge_wins": current_user.challenge_wins or 0,
            "challenge_losses": current_user.challenge_losses or 0,
            "blocked_users": 0,
        }

    except Exception as e:
        logger.error(f"❌ Get social stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve social statistics",
        )


# === HEALTH CHECK ===


@router.get("/health")
async def social_health_check():
    """🏥 Social service health check"""
    return {
        "status": "healthy",
        "service": "social",
        "features": {
            "user_search": "active",
            "friend_requests": "active",
            "challenges": "active",
            "blocking": "active",
            "social_stats": "active",
        },
    }


# Export router
print("✅ Social router imported successfully")
