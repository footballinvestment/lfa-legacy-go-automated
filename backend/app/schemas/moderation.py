# backend/app/schemas/moderation.py
# Pydantic models for moderation system

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ViolationType(str, Enum):
    WARNING = "warning"
    SUSPENSION = "suspension"
    INAPPROPRIATE_CONDUCT = "inappropriate_conduct"
    CHEATING = "cheating"
    HARASSMENT = "harassment"
    SPAM = "spam"
    TERMS_VIOLATION = "terms_violation"
    OTHER = "other"


class ViolationStatus(str, Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class UserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"
    PENDING = "pending"


class ReportStatus(str, Enum):
    OPEN = "open"
    DISMISSED = "dismissed"
    RESOLVED = "resolved"


# Violation schemas
class ViolationCreate(BaseModel):
    type: ViolationType
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_by: int

    model_config = ConfigDict(from_attributes=True)


class ViolationUpdate(BaseModel):
    type: Optional[ViolationType] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[ViolationStatus] = None

    model_config = ConfigDict(from_attributes=True)


class ViolationResponse(BaseModel):
    id: int
    user_id: int
    type: ViolationType
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: datetime
    status: ViolationStatus

    model_config = ConfigDict(from_attributes=True)


# User schemas for admin operations
class AdminUserProfile(BaseModel):
    bio: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserGameStats(BaseModel):
    tournaments_played: int = 0
    wins: int = 0
    losses: int = 0
    win_rate: float = 0.0
    total_points: int = 0
    rank: int = 0

    model_config = ConfigDict(from_attributes=True)


class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    status: Optional[UserStatus] = None
    roles: Optional[List[str]] = None
    profile: Optional[AdminUserProfile] = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserResponse(BaseModel):
    id: int
    email: str
    name: str
    roles: List[str]
    status: UserStatus
    created_at: datetime
    last_login: Optional[datetime] = None
    profile: Optional[AdminUserProfile] = None
    game_stats: Optional[AdminUserGameStats] = None
    violations: Optional[List[ViolationResponse]] = None

    model_config = ConfigDict(from_attributes=True)


# Bulk operations
class BulkUserOperation(BaseModel):
    action: str = Field(
        ..., pattern=r"^(suspend|unsuspend|add_role|remove_role|ban|unban)$"
    )
    user_ids: List[int] = Field(..., min_items=1, max_items=1000)
    params: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class BulkOperationResult(BaseModel):
    results: Dict[str, Dict[str, str]]  # user_id -> {status, message}
    summary: Dict[str, int]  # success_count, error_count, etc.

    model_config = ConfigDict(from_attributes=True)


# Moderation logs
class ModerationLogCreate(BaseModel):
    actor_id: int
    target_user_id: Optional[int] = None
    action: str
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ModerationLogResponse(BaseModel):
    id: int
    actor_id: int
    target_user_id: Optional[int] = None
    action: str
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# User reports
class UserReportCreate(BaseModel):
    reported_user_id: int
    type: str
    description: str
    evidence: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    assigned_to: Optional[int] = None
    resolution_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserReportResponse(BaseModel):
    id: int
    reporter_id: int
    reported_user_id: int
    type: str
    description: str
    evidence: Optional[str] = None
    status: ReportStatus
    assigned_to: Optional[int] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Pagination
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(25, ge=1, le=100)


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    limit: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)


# API Response wrappers
class ViolationListResponse(PaginatedResponse):
    items: List[ViolationResponse]


class ModerationLogListResponse(PaginatedResponse):
    items: List[ModerationLogResponse]


class UserReportListResponse(PaginatedResponse):
    items: List[UserReportResponse]


class AdminUserListResponse(PaginatedResponse):
    items: List[AdminUserResponse]
