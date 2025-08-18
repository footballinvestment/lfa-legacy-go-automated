# === backend/app/models/moderation.py ===
# JAVÍTOTT FÁJL - back_populates referenciák eltávolítva

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from ..database import Base


class UserViolation(Base):
    __tablename__ = "user_violations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(100), nullable=False, index=True)
    reason = Column(Text)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    status = Column(String(20), default="active", index=True)

    # ✅ JAVÍTOTT: back_populates eltávolítva
    user = relationship("User", foreign_keys=[user_id], lazy="select")
    created_by_user = relationship("User", foreign_keys=[created_by], lazy="select")

    def __repr__(self):
        return f"<UserViolation(id={self.id}, user_id={self.user_id}, type='{self.type}')>"

    def to_dict(self):
        """Convert violation to dictionary for API responses"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "reason": self.reason,
            "notes": self.notes,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "status": self.status
        }


class ModerationLog(Base):
    __tablename__ = "moderation_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), index=True)
    target_user_id = Column(Integer, ForeignKey("users.id"), index=True)
    action = Column(String(100), nullable=False, index=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), default=func.now(), index=True)

    # ✅ JAVÍTOTT: back_populates eltávolítva
    actor = relationship("User", foreign_keys=[actor_id], lazy="select")
    target_user = relationship("User", foreign_keys=[target_user_id], lazy="select")

    def __repr__(self):
        return f"<ModerationLog(id={self.id}, actor_id={self.actor_id}, action='{self.action}')>"

    def to_dict(self):
        """Convert moderation log to dictionary for API responses"""
        return {
            "id": self.id,
            "actor_id": self.actor_id,
            "target_user_id": self.target_user_id,
            "action": self.action,
            "details": self.details or {},
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class UserReport(Base):
    __tablename__ = "user_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reported_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    evidence = Column(Text)
    status = Column(String(20), default="open", index=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), index=True)
    resolution_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # ✅ JAVÍTOTT: back_populates eltávolítva
    reporter = relationship("User", foreign_keys=[reporter_id], lazy="select")
    reported_user = relationship("User", foreign_keys=[reported_user_id], lazy="select")
    assigned_moderator = relationship("User", foreign_keys=[assigned_to], lazy="select")

    def __repr__(self):
        return f"<UserReport(id={self.id}, reporter_id={self.reporter_id}, status='{self.status}')>"

    def to_dict(self):
        """Convert user report to dictionary for API responses"""
        return {
            "id": self.id,
            "reporter_id": self.reporter_id,
            "reported_user_id": self.reported_user_id,
            "type": self.type,
            "description": self.description,
            "evidence": self.evidence,
            "status": self.status,
            "assigned_to": self.assigned_to,
            "resolution_notes": self.resolution_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }