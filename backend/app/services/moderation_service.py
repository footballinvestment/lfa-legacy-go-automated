# backend/app/services/moderation_service.py
# Business logic for moderation operations

import logging
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime

from ..models.moderation import UserViolation, ModerationLog, UserReport
from ..schemas.moderation import (
    ViolationCreate,
    ViolationUpdate,
    ViolationResponse,
    ModerationLogCreate,
    BulkUserOperation,
    BulkOperationResult,
    UserReportCreate,
    UserReportUpdate,
    AdminUserResponse,
    AdminUserUpdate,
)


class ModerationService:
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)

    # Violation management
    def create_violation(
        self, user_id: int, violation_data: ViolationCreate
    ) -> ViolationResponse:
        """Create a new user violation"""
        try:
            self.logger.info(
                f"Creating violation for user {user_id}, type: {violation_data.type.value}"
            )

            violation = UserViolation(
                user_id=user_id,
                type=violation_data.type.value,
                reason=violation_data.reason,
                notes=violation_data.notes,
                created_by=violation_data.created_by,
            )

            self.db.add(violation)
            self.db.commit()
            self.db.refresh(violation)

            # Log the moderation action
            self._log_action(
                actor_id=violation_data.created_by,
                target_user_id=user_id,
                action="violation_created",
                details={
                    "violation_id": violation.id,
                    "violation_type": violation.type,
                    "reason": violation.reason,
                },
            )

            self.logger.info(
                f"Successfully created violation {violation.id} for user {user_id}"
            )
            return ViolationResponse.model_validate(violation)

        except Exception as e:
            self.logger.error(
                f"Failed to create violation for user {user_id}: {str(e)}"
            )
            self.db.rollback()
            raise

    def get_user_violations(
        self, user_id: int, status: Optional[str] = None, page: int = 1, limit: int = 25
    ) -> Tuple[List[ViolationResponse], int]:
        """Get violations for a specific user"""
        query = self.db.query(UserViolation).filter(UserViolation.user_id == user_id)

        if status:
            query = query.filter(UserViolation.status == status)

        total = query.count()
        violations = (
            query.order_by(desc(UserViolation.created_at))
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        return [ViolationResponse.model_validate(v) for v in violations], total

    def update_violation(
        self,
        user_id: int,
        violation_id: int,
        violation_data: ViolationUpdate,
        actor_id: int,
    ) -> Optional[ViolationResponse]:
        """Update a violation"""
        violation = (
            self.db.query(UserViolation)
            .filter(
                and_(UserViolation.id == violation_id, UserViolation.user_id == user_id)
            )
            .first()
        )

        if not violation:
            return None

        update_data = violation_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(violation, field):
                if field == "type" and value:
                    setattr(violation, field, value.value)
                elif field == "status" and value:
                    setattr(violation, field, value.value)
                else:
                    setattr(violation, field, value)

        self.db.commit()
        self.db.refresh(violation)

        # Log the update
        self._log_action(
            actor_id=actor_id,
            target_user_id=user_id,
            action="violation_updated",
            details={
                "violation_id": violation.id,
                "updated_fields": list(update_data.keys()),
            },
        )

        return ViolationResponse.model_validate(violation)

    def delete_violation(self, user_id: int, violation_id: int, actor_id: int) -> bool:
        """Delete a violation"""
        violation = (
            self.db.query(UserViolation)
            .filter(
                and_(UserViolation.id == violation_id, UserViolation.user_id == user_id)
            )
            .first()
        )

        if not violation:
            return False

        # Log before deletion
        self._log_action(
            actor_id=actor_id,
            target_user_id=user_id,
            action="violation_deleted",
            details={"violation_id": violation.id, "violation_type": violation.type},
        )

        self.db.delete(violation)
        self.db.commit()
        return True

    # User management
    def get_user_for_admin(self, user_id: int) -> Optional[AdminUserResponse]:
        """Get user details for admin interface"""
        # This would typically query the User model
        # For now, return mock data matching the expected structure
        from datetime import datetime, timezone

        # Mock user data - in real implementation, query from Users table
        mock_user = {
            "id": user_id,
            "email": f"user{user_id}@example.com",
            "name": f"User {user_id}",
            "roles": ["player"],
            "status": "active",
            "created_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc),
            "profile": {
                "bio": "A passionate football player",
                "location": "New York, USA",
                "phone": "+1 555-123-4567",
            },
            "game_stats": {
                "tournaments_played": 15,
                "wins": 8,
                "losses": 7,
                "win_rate": 53.3,
                "total_points": 2450,
                "rank": 42,
            },
        }

        # Get user's violations
        violations, _ = self.get_user_violations(user_id)
        mock_user["violations"] = violations

        return AdminUserResponse(**mock_user)

    def update_user(
        self, user_id: int, user_data: AdminUserUpdate, actor_id: int
    ) -> Optional[AdminUserResponse]:
        """Update user information"""
        # In real implementation, this would update the Users table
        # For now, log the action and return updated mock data

        self._log_action(
            actor_id=actor_id,
            target_user_id=user_id,
            action="user_updated",
            details=user_data.model_dump(exclude_unset=True),
        )

        # Return updated user data
        return self.get_user_for_admin(user_id)

    # Bulk operations
    def perform_bulk_operation(
        self, operation: BulkUserOperation, actor_id: int
    ) -> BulkOperationResult:
        """Perform bulk operations on multiple users"""
        self.logger.info(
            f"Starting bulk operation {operation.action} on {len(operation.user_ids)} users by actor {actor_id}"
        )

        results = {}
        success_count = 0
        error_count = 0

        for user_id in operation.user_ids:
            try:
                # Simulate different operation types
                if operation.action == "suspend":
                    self._suspend_user(user_id, actor_id, operation.params)
                    results[str(user_id)] = {
                        "status": "ok",
                        "message": "User suspended successfully",
                    }
                    success_count += 1

                elif operation.action == "unsuspend":
                    self._unsuspend_user(user_id, actor_id)
                    results[str(user_id)] = {
                        "status": "ok",
                        "message": "User unsuspended successfully",
                    }
                    success_count += 1

                elif operation.action == "ban":
                    self._ban_user(user_id, actor_id, operation.params)
                    results[str(user_id)] = {
                        "status": "ok",
                        "message": "User banned successfully",
                    }
                    success_count += 1

                else:
                    error_msg = f"Unknown action: {operation.action}"
                    self.logger.warning(
                        f"Invalid bulk operation action: {operation.action} for user {user_id}"
                    )
                    results[str(user_id)] = {"status": "failed", "message": error_msg}
                    error_count += 1

            except Exception as e:
                self.logger.error(f"Bulk operation failed for user {user_id}: {str(e)}")
                results[str(user_id)] = {"status": "failed", "message": str(e)}
                error_count += 1

        self.logger.info(
            f"Bulk operation completed: {success_count} success, {error_count} failures"
        )

        return BulkOperationResult(
            results=results,
            summary={
                "total": len(operation.user_ids),
                "success_count": success_count,
                "error_count": error_count,
            },
        )

    # Moderation logs
    def get_moderation_logs(
        self,
        actor_id: Optional[int] = None,
        target_user_id: Optional[int] = None,
        page: int = 1,
        limit: int = 25,
    ) -> Tuple[List[ModerationLog], int]:
        """Get moderation logs with filtering"""
        query = self.db.query(ModerationLog)

        if actor_id:
            query = query.filter(ModerationLog.actor_id == actor_id)
        if target_user_id:
            query = query.filter(ModerationLog.target_user_id == target_user_id)

        total = query.count()
        logs = (
            query.order_by(desc(ModerationLog.created_at))
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        return logs, total

    # Reports management
    def get_reports(self, status: Optional[str] = None) -> List[UserReport]:
        """Get user reports"""
        query = self.db.query(UserReport)

        if status:
            query = query.filter(UserReport.status == status)

        return query.order_by(desc(UserReport.created_at)).all()

    def update_report(
        self,
        report_id: int,
        action: str,
        actor_id: int,
        data: Optional[Dict[str, Any]] = None,
    ) -> Optional[UserReport]:
        """Update a report based on admin action"""
        report = self.db.query(UserReport).filter(UserReport.id == report_id).first()

        if not report:
            return None

        if action == "dismiss":
            report.status = "dismissed"
            report.assigned_to = actor_id
            report.resolution_notes = (
                data.get("notes", "Report dismissed by admin")
                if data
                else "Report dismissed by admin"
            )

        elif action == "create_violation":
            # Create violation for reported user
            if data and "violation_type" in data:
                violation_data = ViolationCreate(
                    type=data["violation_type"],
                    reason=data.get("reason", "Created from user report"),
                    notes=f"Report ID: {report.id}. {data.get('notes', '')}",
                    created_by=actor_id,
                )
                self.create_violation(report.reported_user_id, violation_data)

            report.status = "resolved"
            report.assigned_to = actor_id
            report.resolution_notes = "Violation created based on report"

        elif action == "escalate":
            report.assigned_to = actor_id
            report.resolution_notes = (
                data.get("notes", "Escalated for further review")
                if data
                else "Escalated for further review"
            )

        self.db.commit()
        self.db.refresh(report)

        # Log the action
        self._log_action(
            actor_id=actor_id,
            target_user_id=report.reported_user_id,
            action=f"report_{action}",
            details={
                "report_id": report.id,
                "action": action,
                **(data if data else {}),
            },
        )

        return report

    # Private helper methods
    def _log_action(
        self,
        actor_id: int,
        action: str,
        target_user_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ):
        """Log a moderation action"""
        try:
            log_entry = ModerationLog(
                actor_id=actor_id,
                target_user_id=target_user_id,
                action=action,
                details=details or {},
                ip_address=ip_address,
                user_agent=user_agent,
            )

            self.db.add(log_entry)
            self.db.commit()

            # Also log to application logger
            self.logger.info(
                f"Moderation action: {action} by actor {actor_id} on user {target_user_id}",
                extra={
                    "actor_id": actor_id,
                    "target_user_id": target_user_id,
                    "action": action,
                    "details": details,
                },
            )

        except Exception as e:
            self.logger.error(f"Failed to log moderation action: {str(e)}")
            # Don't re-raise as logging failure shouldn't break the main operation

    def _suspend_user(
        self, user_id: int, actor_id: int, params: Optional[Dict[str, Any]]
    ):
        """Suspend a user (placeholder implementation)"""
        # In real implementation, update user status in Users table
        self._log_action(
            actor_id=actor_id,
            target_user_id=user_id,
            action="user_suspended",
            details={"reason": params.get("reason") if params else "Admin action"},
        )

    def _unsuspend_user(self, user_id: int, actor_id: int):
        """Unsuspend a user (placeholder implementation)"""
        self._log_action(
            actor_id=actor_id, target_user_id=user_id, action="user_unsuspended"
        )

    def _ban_user(self, user_id: int, actor_id: int, params: Optional[Dict[str, Any]]):
        """Ban a user (placeholder implementation)"""
        self._log_action(
            actor_id=actor_id,
            target_user_id=user_id,
            action="user_banned",
            details={"reason": params.get("reason") if params else "Admin action"},
        )
