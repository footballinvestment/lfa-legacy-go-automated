# backend/app/routers/moderation.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, Field
import logging

from ..database import get_db
from ..models.user import User
from ..models.moderation import UserReport
from ..models.friends import UserBlock
from ..routers.auth import get_current_user
from ..utils.content_filter import content_moderator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/moderation", tags=["moderation"])

# Pydantic schemas
class UserReportCreate(BaseModel):
    reported_user_id: int = Field(..., gt=0)
    report_type: str = Field(..., min_length=1, max_length=50)
    description: str = Field(..., min_length=10, max_length=500)
    evidence: str = Field(None, max_length=1000)

class ChatMessageReportCreate(BaseModel):
    message_id: int = Field(..., gt=0)
    report_type: str = Field(..., min_length=1, max_length=50)
    description: str = Field(..., min_length=10, max_length=500)

class UserBlockCreate(BaseModel):
    blocked_user_id: int = Field(..., gt=0)
    reason: str = Field(None, max_length=200)

class ContentCheckRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

@router.post("/reports/user")
async def report_user(
    report_data: UserReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User bejelentése"""
    try:
        # Validation
        if report_data.reported_user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot report yourself")
        
        # Check if reported user exists
        reported_user = db.query(User).filter(User.id == report_data.reported_user_id).first()
        if not reported_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create report
        new_report = UserReport(
            reporter_id=current_user.id,
            reported_user_id=report_data.reported_user_id,
            type=report_data.report_type,
            description=report_data.description,
            evidence=report_data.evidence
        )
        
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        
        logger.info(f"User report created: {current_user.id} reported {report_data.reported_user_id}")
        
        return {
            "success": True, 
            "message": "Report submitted successfully",
            "report_id": new_report.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to submit user report: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit report: {str(e)}")

@router.post("/reports/message")
async def report_message(
    report_data: ChatMessageReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat üzenet bejelentése"""
    try:
        # Check if message exists
        from ..models.chat import ChatMessage
        message = db.query(ChatMessage).filter(ChatMessage.id == report_data.message_id).first()
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Check if user can see this message (is member of room)
        from ..models.chat import ChatRoomMembership
        membership = db.query(ChatRoomMembership).filter(
            ChatRoomMembership.room_id == message.room_id,
            ChatRoomMembership.user_id == current_user.id
        ).first()
        
        if not membership:
            raise HTTPException(status_code=403, detail="Cannot report message from room you're not in")
        
        # Create message report (using UserReport table for now, could extend later)
        new_report = UserReport(
            reporter_id=current_user.id,
            reported_user_id=message.user_id,
            type=f"message_{report_data.report_type}",
            description=f"Message ID {report_data.message_id}: {report_data.description}",
            evidence=f"Message content: {message.message[:200]}"
        )
        
        db.add(new_report)
        db.commit()
        
        logger.info(f"Message report created: message {report_data.message_id} reported by {current_user.id}")
        
        return {
            "success": True,
            "message": "Message reported successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to report message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to report message: {str(e)}")

@router.post("/content/check")
async def check_content(
    content_data: ContentCheckRequest,
    current_user: User = Depends(get_current_user)
):
    """Tartalom előzetes ellenőrzése"""
    try:
        result = content_moderator.moderate_content(content_data.content, current_user.id)
        
        return {
            "success": True,
            "data": {
                "is_allowed": result['is_allowed'],
                "flags": result['flags'],
                "severity": result['severity'],
                "action": result['action'],
                "content_score": content_moderator.get_content_score(content_data.content),
                "filtered_content": result['filtered_content'] if result['action'] == 'filter' else None
            }
        }
    except Exception as e:
        logger.error(f"Content check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Content check failed: {str(e)}")

@router.post("/users/block")
async def block_user(
    block_data: UserBlockCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User blokkolása"""
    try:
        # Validation
        if block_data.blocked_user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot block yourself")
        
        # Check if user exists
        blocked_user = db.query(User).filter(User.id == block_data.blocked_user_id).first()
        if not blocked_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if already blocked
        existing_block = db.query(UserBlock).filter(
            UserBlock.blocker_id == current_user.id,
            UserBlock.blocked_id == block_data.blocked_user_id,
            UserBlock.is_active == True
        ).first()
        
        if existing_block:
            raise HTTPException(status_code=400, detail="User already blocked")
        
        # Create block
        new_block = UserBlock(
            blocker_id=current_user.id,
            blocked_id=block_data.blocked_user_id,
            reason=block_data.reason
        )
        
        db.add(new_block)
        db.commit()
        
        logger.info(f"User blocked: {current_user.id} blocked {block_data.blocked_user_id}")
        
        return {
            "success": True,
            "message": f"User {blocked_user.username} has been blocked"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to block user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to block user: {str(e)}")

@router.get("/users/blocked")
async def get_blocked_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Blokkolt userek listája"""
    try:
        blocks = db.query(UserBlock).filter(
            UserBlock.blocker_id == current_user.id,
            UserBlock.is_active == True
        ).all()
        
        blocked_list = []
        for block in blocks:
            blocked_user = db.query(User).filter(User.id == block.blocked_id).first()
            if blocked_user:
                blocked_list.append({
                    "id": block.id,
                    "blocked_user_id": blocked_user.id,
                    "blocked_username": blocked_user.username,
                    "reason": block.reason,
                    "blocked_at": block.blocked_at.isoformat() if block.blocked_at else None
                })
        
        return {
            "success": True,
            "data": blocked_list,
            "count": len(blocked_list)
        }
        
    except Exception as e:
        logger.error(f"Failed to get blocked users: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get blocked users: {str(e)}")

@router.delete("/users/blocked/{block_id}")
async def unblock_user(
    block_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User blokkolásának feloldása"""
    try:
        # Find the block
        block = db.query(UserBlock).filter(
            UserBlock.id == block_id,
            UserBlock.blocker_id == current_user.id,
            UserBlock.is_active == True
        ).first()
        
        if not block:
            raise HTTPException(status_code=404, detail="Block not found")
        
        # Unblock
        block.unblock()
        db.commit()
        
        logger.info(f"User unblocked: {current_user.id} unblocked {block.blocked_id}")
        
        return {
            "success": True,
            "message": "User has been unblocked"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to unblock user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to unblock user: {str(e)}")

@router.get("/reports/my")
async def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Saját bejelentések listája"""
    try:
        reports = db.query(UserReport).filter(
            UserReport.reporter_id == current_user.id
        ).order_by(UserReport.created_at.desc()).all()
        
        reports_list = []
        for report in reports:
            reported_user = db.query(User).filter(User.id == report.reported_user_id).first()
            reports_list.append({
                "id": report.id,
                "reported_user": {
                    "id": reported_user.id if reported_user else None,
                    "username": reported_user.username if reported_user else "Unknown"
                },
                "type": report.type,
                "description": report.description,
                "status": report.status,
                "created_at": report.created_at.isoformat() if report.created_at else None
            })
        
        return {
            "success": True,
            "data": reports_list,
            "count": len(reports_list)
        }
        
    except Exception as e:
        logger.error(f"Failed to get user reports: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get reports: {str(e)}")

@router.get("/health")
async def moderation_health():
    """Moderation service health check"""
    return {
        "success": True,
        "data": {
            "service": "moderation",
            "status": "healthy",
            "features": {
                "content_filtering": "active",
                "user_reporting": "active", 
                "user_blocking": "active",
                "profanity_filter": "active",
                "spam_detection": "active"
            }
        }
    }