# === backend/app/models/coupon.py ===
# SECURE COUPON SYSTEM MODELS - PRODUCTION READY

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from ..database import Base

# Pydantic imports
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

# =============================================================================
# SQLAlchemy Models
# =============================================================================

class Coupon(Base):
    __tablename__ = "coupons"
    
    # Primary fields
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    credits = Column(Integer, nullable=False)
    description = Column(String(500), nullable=False)
    category = Column(String(50), nullable=False)
    
    # Status and limits
    is_active = Column(Boolean, default=True)
    usage_limit = Column(Integer, nullable=True)  # NULL = unlimited
    total_used = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, nullable=True)  # Admin user ID
    
    # Relationships
    usage_records = relationship("CouponUsage", back_populates="coupon")
    
    def __repr__(self):
        return f"<Coupon(id={self.id}, code='{self.code}', credits={self.credits})>"
    
    def is_valid(self) -> tuple[bool, str]:
        """Check if coupon is valid for use"""
        if not self.is_active:
            return False, "Coupon is not active"
        
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False, "Coupon has expired"
        
        if self.usage_limit and self.total_used >= self.usage_limit:
            return False, "Coupon usage limit exceeded"
        
        return True, "Valid"
    
    def can_be_used_by_user(self, user_id: int, db_session) -> tuple[bool, str]:
        """Check if coupon can be used by specific user"""
        # Check if user already used this coupon
        existing_usage = db_session.query(CouponUsage).filter(
            CouponUsage.user_id == user_id,
            CouponUsage.coupon_code == self.code
        ).first()
        
        if existing_usage:
            return False, f"Coupon already redeemed on {existing_usage.redeemed_at.strftime('%Y-%m-%d %H:%M')}"
        
        return self.is_valid()
    
    def increment_usage(self):
        """Increment usage count safely"""
        self.total_used += 1

class CouponUsage(Base):
    __tablename__ = "coupon_usage"
    
    # Primary fields
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=False)
    coupon_code = Column(String(50), nullable=False)  # Redundant but for audit
    credits_added = Column(Integer, nullable=False)
    
    # Audit and security fields
    redeemed_at = Column(DateTime, default=datetime.utcnow)
    user_ip = Column(String(45), nullable=True)  # IPv4/IPv6 logging
    
    # Relationships
    user = relationship("User")
    coupon = relationship("Coupon", back_populates="usage_records")
    
    # Unique constraint: one user can only use each coupon once
    __table_args__ = (
        UniqueConstraint('user_id', 'coupon_code', name='unique_user_coupon'),
    )
    
    def __repr__(self):
        return f"<CouponUsage(id={self.id}, user_id={self.user_id}, coupon_code='{self.coupon_code}')>"

# =============================================================================
# Pydantic Schemas
# =============================================================================

class CouponBase(BaseModel):
    """Base coupon model"""
    code: str = Field(..., min_length=1, max_length=50)
    credits: int = Field(..., gt=0)
    description: str = Field(..., min_length=1, max_length=500)
    category: str = Field(..., min_length=1, max_length=50)

class CouponCreate(CouponBase):
    """Coupon creation model (admin)"""
    usage_limit: Optional[int] = Field(None, gt=0)
    expires_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class CouponRedeem(BaseModel):
    """Coupon redemption request"""
    coupon_code: str = Field(..., min_length=1, max_length=50)
    
    model_config = ConfigDict(from_attributes=True)

class CouponInfo(BaseModel):
    """Public coupon information (limited)"""
    code: str
    credits: int
    description: str
    category: str
    is_active: bool
    expires_at: Optional[datetime] = None
    usage_limit: Optional[int] = None
    total_used: int
    
    model_config = ConfigDict(from_attributes=True)

class CouponResponse(BaseModel):
    """Coupon redemption response"""
    success: bool
    message: str
    credits_added: Optional[int] = None
    new_balance: Optional[int] = None
    coupon_code: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class CouponUsageRecord(BaseModel):
    """Coupon usage history record"""
    coupon_code: str
    credits_added: int
    redeemed_at: datetime
    coupon_description: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class CouponUsageHistory(BaseModel):
    """User's coupon usage history"""
    total_coupons_used: int
    total_credits_earned: int
    usage_history: List[CouponUsageRecord]
    
    model_config = ConfigDict(from_attributes=True)

class CouponStats(BaseModel):
    """Coupon system statistics"""
    active_coupons: int
    total_redemptions_today: int
    total_credits_distributed: int
    most_popular_coupon: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class CouponAuditLog(BaseModel):
    """Audit log entry"""
    user_id: int
    username: str
    coupon_code: str
    action: str  # "redeemed", "failed", "rate_limited"
    success: bool
    reason: str
    ip_address: Optional[str] = None
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)

class CouponHealthStatus(BaseModel):
    """Health check response"""
    status: str
    database: str
    active_coupons: int
    total_redemptions_today: int
    total_credits_distributed: int
    most_popular_coupon: Optional[str] = None
    security_status: dict
    
    model_config = ConfigDict(from_attributes=True)

print("✅ Coupon models imported successfully")