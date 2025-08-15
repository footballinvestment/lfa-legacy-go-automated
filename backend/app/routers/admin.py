# backend/app/routers/admin.py
# FastAPI router for admin and moderation endpoints

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import math
import time

from ..core.error_monitoring import ErrorMonitor, monitor_performance

from ..database import get_db
from ..services.moderation_service import ModerationService
from ..schemas.moderation import (
    ViolationCreate, ViolationUpdate, ViolationResponse,
    ViolationListResponse, ModerationLogResponse, ModerationLogListResponse,
    AdminUserResponse, AdminUserUpdate, AdminUserListResponse,
    BulkUserOperation, BulkOperationResult,
    UserReportResponse, UserReportListResponse, UserReportUpdate,
    PaginationParams
)

# Placeholder for auth dependency - replace with actual implementation
def get_current_active_admin_user():
    """Placeholder for admin user authentication dependency"""
    # In real implementation, this would:
    # 1. Verify JWT token
    # 2. Check user has admin/moderator role  
    # 3. Return current user
    return {"id": 1, "username": "admin", "roles": ["admin"]}

def track_api_call(endpoint: str, method: str = "GET"):
    """Decorator to track API call performance and errors"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            monitor = ErrorMonitor()
            success = True
            
            try:
                result = await func(*args, **kwargs) if hasattr(func, '__code__') and func.__code__.co_flags & 0x80 else func(*args, **kwargs)
                return result
            except Exception as e:
                success = False
                # Extract user info if available
                user_id = None
                try:
                    if 'current_user' in kwargs:
                        user_id = kwargs['current_user'].get('id')
                except:
                    pass
                
                monitor.record_error(e, endpoint=f"{method} {endpoint}", user_id=user_id)
                raise
            finally:
                duration_ms = (time.time() - start_time) * 1000
                monitor.record_performance(f"{method} {endpoint}", duration_ms, success)
        
        return wrapper
    return decorator

def get_client_info(request: Request) -> tuple[str, str]:
    """Extract client IP and user agent from request"""
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    return ip_address, user_agent


# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter(
    tags=["admin"]
)


# User Management Endpoints
@router.get("/users/{user_id}", response_model=AdminUserResponse)
@track_api_call("/users/{user_id}", "GET")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin_user)
):
    """Get user details for admin interface"""
    try:
        logger.info(f"Admin {current_user['id']} requesting user {user_id} details")
        service = ModerationService(db)
        user = service.get_user_for_admin(user_id)
        
        if not user:
            logger.warning(f"User {user_id} not found for admin request")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"Successfully retrieved user {user_id} details")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving user"
        )


@router.get("/users", response_model=AdminUserListResponse)
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin_user)
):
    """Get paginated list of users for admin interface"""
    # Mock implementation - in real app, query users table
    mock_users = []
    total = 150  # Mock total count
    
    for i in range(1, min(limit + 1, total + 1)):
        user_id = ((page - 1) * limit) + i
        if user_id <= total:
            service = ModerationService(db)
            user = service.get_user_for_admin(user_id)
            if user:
                mock_users.append(user)
    
    total_pages = math.ceil(total / limit)
    
    return AdminUserListResponse(
        items=mock_users,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
def update_user(
    user_id: int,
    user_data: AdminUserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin_user)
):
    """Update user information"""
    service = ModerationService(db)
    ip_address, user_agent = get_client_info(request)
    
    user = service.update_user(user_id, user_data, current_user["id"])
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


# Violation Management Endpoints
@router.get("/users/{user_id}/violations", response_model=ViolationListResponse)
def get_user_violations(
    user_id: int,
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin_user)
):
    """Get violations for a specific user"""
    service = ModerationService(db)
    violations, total = service.get_user_violations(user_id, status, page, limit)
    
    total_pages = math.ceil(total / limit) if total > 0 else 1
    
    return ViolationListResponse(
        items=violations,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.post("/users/{user_id}/violations", response_model=ViolationResponse)
@track_api_call("/users/{user_id}/violations", "POST")
def create_violation(
    user_id: int,
    violation_data: ViolationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin_user)
):
    """Create a new violation for user"""
    try:
        logger.info(f"Admin {current_user['id']} creating violation for user {user_id}, type: {violation_data.type}")
        service = ModerationService(db)
        
        # Set the actor as current admin user
        violation_data.created_by = current_user["id"]
        
        violation = service.create_violation(user_id, violation_data)
        logger.info(f"Successfully created violation {violation.id} for user {user_id}")
        return violation
        
    except Exception as e:
        logger.error(f"Failed to create violation for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create violation: {str(e)}"
        )


@router.patch("/users/{user_id}/violations/{violation_id}", response_model=ViolationResponse)
def update_violation(
    user_id: int,
    violation_id: int,
    violation_data: ViolationUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin_user)
):
    """Update a violation"""
    service = ModerationService(db)
    
    violation = service.update_violation(user_id, violation_id, violation_data, current_user["id"])
    
    if not violation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Violation not found"
        )
    
    return violation


@router.delete("/users/{user_id}/violations/{violation_id}")
def delete_violation(
    user_id: int,
    violation_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin_user)
):
    """Delete a violation"""
    service = ModerationService(db)
    
    success = service.delete_violation(user_id, violation_id, current_user["id"])
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Violation not found"
        )
    
    return {"detail": "Violation deleted successfully"}


# Bulk Operations Endpoint
@router.post("/users/bulk", response_model=BulkOperationResult)
@track_api_call("/users/bulk", "POST")
def bulk_user_operation(
    operation: BulkUserOperation,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin_user)
):
    """Perform bulk operations on multiple users"""
    try:
        logger.info(f"Admin {current_user['id']} initiating bulk {operation.action} on {len(operation.user_ids)} users")
        service = ModerationService(db)
        
        # Validate operation parameters
        if not operation.user_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No user IDs provided for bulk operation"
            )
        
        if len(operation.user_ids) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bulk operation limited to 100 users at once"
            )
        
        result = service.perform_bulk_operation(operation, current_user["id"])
        logger.info(f"Bulk operation completed: {result.summary['success_count']} success, {result.summary['error_count']} errors")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk operation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during bulk operation"
        )


# Moderation Logs Endpoint
@router.get("/moderation/logs", response_model=ModerationLogListResponse)
def get_moderation_logs(
    actor_id: Optional[int] = Query(None),
    target_user_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin_user)
):
    """Get moderation logs with filtering and pagination"""
    service = ModerationService(db)
    logs, total = service.get_moderation_logs(actor_id, target_user_id, page, limit)
    
    total_pages = math.ceil(total / limit) if total > 0 else 1
    
    log_responses = [
        ModerationLogResponse(
            id=log.id,
            actor_id=log.actor_id,
            target_user_id=log.target_user_id,
            action=log.action,
            details=log.details,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            created_at=log.created_at
        ) for log in logs
    ]
    
    return ModerationLogListResponse(
        items=log_responses,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


# Reports Management Endpoints
@router.get("/reports", response_model=List[UserReportResponse])
def get_reports(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin_user)
):
    """Get user reports"""
    service = ModerationService(db)
    reports = service.get_reports(status)
    
    return [
        UserReportResponse(
            id=report.id,
            reporter_id=report.reporter_id,
            reported_user_id=report.reported_user_id,
            type=report.type,
            description=report.description,
            evidence=report.evidence,
            status=report.status,
            assigned_to=report.assigned_to,
            resolution_notes=report.resolution_notes,
            created_at=report.created_at,
            updated_at=report.updated_at
        ) for report in reports
    ]


@router.patch("/reports/{report_id}", response_model=UserReportResponse)
def update_report(
    report_id: int,
    request: Request,
    action: str = Query(..., regex="^(dismiss|create_violation|escalate)$"),
    data: Optional[dict] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin_user)
):
    """Update report with admin action"""
    service = ModerationService(db)
    
    report = service.update_report(report_id, action, current_user["id"], data)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    return UserReportResponse(
        id=report.id,
        reporter_id=report.reporter_id,
        reported_user_id=report.reported_user_id,
        type=report.type,
        description=report.description,
        evidence=report.evidence,
        status=report.status,
        assigned_to=report.assigned_to,
        resolution_notes=report.resolution_notes,
        created_at=report.created_at,
        updated_at=report.updated_at
    )