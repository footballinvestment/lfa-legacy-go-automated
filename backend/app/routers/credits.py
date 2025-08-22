# === backend/app/routers/credits.py ===
# TELJES JAVÍTOTT CREDITS ROUTER - List import hozzáadva

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Dict, Any, Optional  # ✅ List import hozzáadva
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import time
import uuid
import logging
import redis
from collections import defaultdict

from ..database import get_db, redis_client
from ..models.user import User
from ..models.coupon import (
    Coupon,
    CouponUsage,
    CouponCreate,
    CouponRedeem,
    CouponInfo,
    CouponResponse,
    CouponUsageHistory,
    CouponUsageRecord,
    CouponStats,
    CouponAuditLog,
    CouponHealthStatus,
)
from ..routers.auth import get_current_user

# Configure logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(tags=["Credits"])

# === PYDANTIC SCHEMAS ===


class CreditPackage(BaseModel):
    id: str
    name: str
    credits: int
    bonus_credits: int
    price_huf: int
    price_usd: float
    discount_percentage: Optional[int] = None
    popular: bool = False
    description: str


class CreditTransaction(BaseModel):
    id: str
    transaction_id: str
    user_id: int
    package_id: str
    credits_purchased: int
    bonus_credits: int
    total_credits: int
    price_paid: float
    currency: str
    payment_method: str
    status: str
    created_at: datetime
    stripe_payment_intent_id: Optional[str] = None


class PurchaseRequest(BaseModel):
    package_id: str
    payment_method: str = Field(
        ..., description="Payment method: card, paypal, bank_transfer"
    )


class PurchaseResponse(BaseModel):
    success: bool
    message: str
    transaction: Optional[CreditTransaction] = None
    new_balance: Optional[int] = None


class BalanceResponse(BaseModel):
    credits: int
    last_purchase: Optional[datetime] = None
    total_purchased: Optional[int] = None


# === CREDIT PACKAGES DATA ===

CREDIT_PACKAGES = [
    CreditPackage(
        id="starter_10",
        name="Starter Pack",
        credits=10,
        bonus_credits=2,
        price_huf=2500,
        price_usd=6.99,
        discount_percentage=0,
        popular=False,
        description="Perfect for getting started with your football training",
    ),
    CreditPackage(
        id="popular_25",
        name="Popular Pack",
        credits=25,
        bonus_credits=7,
        price_huf=5500,
        price_usd=14.99,
        discount_percentage=15,
        popular=True,
        description="Most popular choice for regular players",
    ),
    CreditPackage(
        id="value_50",
        name="Value Pack",
        credits=50,
        bonus_credits=18,
        price_huf=9500,
        price_usd=25.99,
        discount_percentage=25,
        popular=False,
        description="Great value for dedicated athletes",
    ),
    CreditPackage(
        id="premium_100",
        name="Premium Pack",
        credits=100,
        bonus_credits=40,
        price_huf=16500,
        price_usd=44.99,
        discount_percentage=35,
        popular=False,
        description="Maximum value for serious competitors",
    ),
]

# === COUPON SECURITY & HELPER FUNCTIONS ===


def get_client_ip(request: Request) -> str:
    """Get client IP address with proper forwarded header handling"""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    return request.client.host if request.client else "unknown"


def check_rate_limit(user_id: int, ip: str, db: Session) -> tuple[bool, str]:
    """Rate limiting: max 5 coupon attempts per hour per user"""
    try:
        if not redis_client:
            # Fallback to database-based rate limiting
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            recent_attempts = (
                db.query(CouponUsage)
                .filter(
                    and_(
                        CouponUsage.user_id == user_id,
                        CouponUsage.redeemed_at >= one_hour_ago,
                    )
                )
                .count()
            )

            if recent_attempts >= 5:
                return (
                    False,
                    f"Rate limit exceeded. {recent_attempts} attempts in last hour.",
                )
            return True, "OK"

        # Redis-based rate limiting (preferred)
        key = f"coupon_rate_limit:{user_id}:{ip}"
        current_count = redis_client.get(key)

        if current_count and int(current_count) >= 5:
            ttl = redis_client.ttl(key)
            return False, f"Rate limit exceeded. Try again in {ttl} seconds."

        # Increment counter
        redis_client.incr(key)
        redis_client.expire(key, 3600)  # 1 hour

        return True, "OK"

    except Exception as e:
        logger.error(f"Rate limit check error: {e}")
        return True, "Rate limit check failed, allowing request"


def validate_coupon_security(
    coupon_code: str, user_id: int, ip: str, db: Session
) -> dict:
    """Comprehensive coupon validation with security checks"""
    result = {"valid": False, "coupon": None, "reason": "Unknown error", "credits": 0}

    try:
        # 1. Rate limiting check
        rate_ok, rate_msg = check_rate_limit(user_id, ip, db)
        if not rate_ok:
            result["reason"] = rate_msg
            return result

        # 2. Find coupon
        coupon = db.query(Coupon).filter(Coupon.code == coupon_code.upper()).first()
        if not coupon:
            result["reason"] = "Invalid coupon code"
            return result

        # 3. Coupon validity check
        is_valid, validity_reason = coupon.is_valid()
        if not is_valid:
            result["reason"] = validity_reason
            return result

        # 4. User-specific check (already used?)
        can_use, user_reason = coupon.can_be_used_by_user(user_id, db)
        if not can_use:
            result["reason"] = user_reason
            return result

        # All checks passed
        result.update(
            {
                "valid": True,
                "coupon": coupon,
                "reason": "Valid",
                "credits": coupon.credits,
            }
        )

    except Exception as e:
        logger.error(f"Coupon validation error: {e}")
        result["reason"] = "Validation failed"

    return result


def log_coupon_attempt(
    user_id: int,
    username: str,
    coupon_code: str,
    success: bool,
    reason: str,
    ip: str,
    credits: int = 0,
):
    """Audit log for all coupon attempts"""
    try:
        log_level = "INFO" if success else "WARNING"
        status_emoji = "✅" if success else "❌"

        logger.log(
            getattr(logging, log_level),
            f"{status_emoji} Coupon attempt: {username} (ID:{user_id}) tried '{coupon_code}' from {ip} - "
            f"{'SUCCESS' if success else 'FAILED'}: {reason}"
            + (f" (+{credits} credits)" if success else ""),
        )

        # Store in Redis for admin dashboard (if available)
        if redis_client:
            audit_key = "coupon_audit_log"
            audit_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "username": username,
                "coupon_code": coupon_code,
                "success": success,
                "reason": reason,
                "ip": ip,
                "credits": credits,
            }
            redis_client.lpush(audit_key, str(audit_entry))
            redis_client.ltrim(audit_key, 0, 999)  # Keep last 1000 entries

    except Exception as e:
        logger.error(f"Audit logging failed: {e}")


def seed_initial_coupons(db: Session) -> bool:
    """Seed initial coupons into database"""
    try:
        # Check if coupons already exist
        existing_count = db.query(Coupon).count()
        if existing_count > 0:
            logger.info(f"⚠️ Coupons already exist ({existing_count}), skipping seeding")
            return True

        initial_coupons = [
            {
                "code": "LFA-L-GO-100",
                "credits": 100,
                "description": "🎮 Legacy GO Special - Welcome bonus",
                "category": "Legacy",
                "usage_limit": 50,
            },
            {
                "code": "LFA-LEGEND-500",
                "credits": 500,
                "description": "🏆 Legend Status - Elite rewards",
                "category": "VIP",
                "usage_limit": 100,
            },
            {
                "code": "LFA-STRIKER-100",
                "credits": 100,
                "description": "⚽ Goal Scorer - Football champion bonus",
                "category": "VIP",
                "usage_limit": 500,
            },
            {
                "code": "LFA-LAUNCH-2025",
                "credits": 200,
                "description": "🚀 Launch Celebration - Grand opening special",
                "category": "Event",
                "usage_limit": 1000,
                "expires_at": datetime.utcnow() + timedelta(days=90),
            },
            {
                "code": "KICKOFF100",
                "credits": 100,
                "description": "⚡ Quick Start - Instant boost",
                "category": "Instant",
                "usage_limit": 1000,
            },
            {
                "code": "FOOTBALL25",
                "credits": 25,
                "description": "⚽ Basic Boost - Entry level bonus",
                "category": "Instant",
                "usage_limit": 5000,
            },
            {
                "code": "MESSIMAGIC",
                "credits": 300,
                "description": "🌟 Legend Tribute - Honor the GOAT",
                "category": "Special",
                "usage_limit": 100,
                "expires_at": datetime.utcnow() + timedelta(days=30),
            },
            {
                "code": "GOOOOAL",
                "credits": 75,
                "description": "🎉 Celebration - Score and earn",
                "category": "Fun",
                "usage_limit": 1000,
            },
            {
                "code": "DEV-TEST-999",
                "credits": 999,
                "description": "🔧 Developer Testing - Internal use only",
                "category": "Developer",
                "usage_limit": 10,
            },
        ]

        created_count = 0
        for coupon_data in initial_coupons:
            coupon = Coupon(**coupon_data)
            db.add(coupon)
            created_count += 1

        db.commit()
        logger.info(f"✅ Successfully seeded {created_count} initial coupons")
        return True

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to seed coupons: {e}")
        return False


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure admin access"""
    if current_user.user_type not in ["admin", "moderator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return current_user


# === HELPER FUNCTIONS ===


def get_package_by_id(package_id: str) -> Optional[CreditPackage]:
    """Get credit package by ID"""
    return next((pkg for pkg in CREDIT_PACKAGES if pkg.id == package_id), None)


def create_transaction_id() -> str:
    """Generate unique transaction ID"""
    timestamp = int(time.time())
    random_part = str(uuid.uuid4())[:8]
    return f"tx_{timestamp}_{random_part}"


def simulate_payment_processing(
    package: CreditPackage, payment_method: str
) -> tuple[bool, str]:
    """Simulate payment processing"""
    # In real implementation, this would integrate with Stripe, PayPal, etc.

    # Simulate different payment method behaviors
    if payment_method == "card":
        return True, "Payment processed successfully"
    elif payment_method == "paypal":
        return True, "PayPal payment completed"
    elif payment_method == "bank_transfer":
        return True, "Bank transfer initiated"
    else:
        return False, "Unsupported payment method"


# === CREDIT ENDPOINTS ===


@router.get("/packages", response_model=List[CreditPackage])
async def get_credit_packages():
    """📦 Get all available credit packages"""
    return CREDIT_PACKAGES


@router.get("/balance", response_model=BalanceResponse)
async def get_current_balance(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """💰 Get user's current credit balance"""
    try:
        return BalanceResponse(
            credits=current_user.credits,
            last_purchase=current_user.last_purchase_date,
            total_purchased=current_user.total_credits_purchased,
        )
    except Exception as e:
        logger.error(f"❌ Error getting balance for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve balance",
        )


@router.post("/purchase", response_model=PurchaseResponse)
async def purchase_credits(
    purchase_data: PurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """💳 Purchase credit packages"""
    try:
        # Validate package
        package = get_package_by_id(purchase_data.package_id)
        if not package:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Credit package not found"
            )

        # Process payment
        payment_success, payment_message = simulate_payment_processing(
            package, purchase_data.payment_method
        )

        if not payment_success:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=payment_message
            )

        # Create transaction record
        transaction_id = create_transaction_id()
        total_credits = package.credits + package.bonus_credits

        transaction = CreditTransaction(
            id=str(uuid.uuid4()),
            transaction_id=transaction_id,
            user_id=current_user.id,
            package_id=package.id,
            credits_purchased=package.credits,
            bonus_credits=package.bonus_credits,
            total_credits=total_credits,
            price_paid=package.price_huf,
            currency="HUF",
            payment_method=purchase_data.payment_method,
            status="completed",
            created_at=datetime.utcnow(),
        )

        # Update user credits
        current_user.credits += total_credits
        current_user.total_credits_purchased = (
            current_user.total_credits_purchased or 0
        ) + total_credits
        current_user.last_purchase_date = datetime.utcnow()

        # Add to transaction history
        if not current_user.transaction_history:
            current_user.transaction_history = []
        current_user.transaction_history.append(transaction.dict())

        db.commit()
        db.refresh(current_user)

        logger.info(
            f"✅ Credit purchase successful: User {current_user.id} bought {total_credits} credits"
        )

        return PurchaseResponse(
            success=True,
            message=f"Successfully purchased {total_credits} credits ({package.credits} + {package.bonus_credits} bonus)",
            transaction=transaction,
            new_balance=current_user.credits,
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Credit purchase error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Purchase failed. Please try again.",
        )


@router.get("/history", response_model=List[Dict[str, Any]])
async def get_transaction_history(
    limit: int = 50, current_user: User = Depends(get_current_user)
):
    """📋 Get user's credit purchase history"""
    try:
        if not current_user.transaction_history:
            return []

        # Return most recent transactions
        transactions = current_user.transaction_history[-limit:]
        transactions.reverse()  # Most recent first

        return transactions

    except Exception as e:
        logger.error(
            f"❌ Error getting transaction history for user {current_user.id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transaction history",
        )


@router.get("/stats")
async def get_credit_stats(current_user: User = Depends(get_current_user)):
    """📊 Get user's credit statistics"""
    try:
        transaction_count = (
            len(current_user.transaction_history)
            if current_user.transaction_history
            else 0
        )

        return {
            "current_balance": current_user.credits,
            "total_purchased": current_user.total_credits_purchased or 0,
            "transaction_count": transaction_count,
            "last_purchase": current_user.last_purchase_date,
            "average_purchase": (
                (current_user.total_credits_purchased or 0) / transaction_count
                if transaction_count > 0
                else 0
            ),
        }

    except Exception as e:
        logger.error(f"❌ Error getting credit stats for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve credit statistics",
        )


# === ADMIN ENDPOINTS ===


@router.get("/admin/transactions")
async def get_all_transactions(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """👥 Get all credit transactions (admin only)"""
    if current_user.user_type not in ["admin", "moderator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )

    try:
        # Get all users with transaction history
        users_with_transactions = (
            db.query(User)
            .filter(User.transaction_history.isnot(None))
            .offset(skip)
            .limit(limit)
            .all()
        )

        all_transactions = []
        for user in users_with_transactions:
            if user.transaction_history:
                for transaction in user.transaction_history:
                    transaction["username"] = user.username
                    all_transactions.append(transaction)

        # Sort by created_at descending
        all_transactions.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        return {"transactions": all_transactions, "total_count": len(all_transactions)}

    except Exception as e:
        logger.error(f"❌ Error getting all transactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transactions",
        )


# === SECURE COUPON ENDPOINTS ===


@router.post("/redeem-coupon", response_model=CouponResponse)
async def redeem_coupon_secure(
    coupon_request: CouponRedeem,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """🔒 Secure coupon redemption with comprehensive validation"""
    client_ip = get_client_ip(request)
    coupon_code = coupon_request.coupon_code.strip().upper()

    try:
        # Security validation
        validation_result = validate_coupon_security(
            coupon_code, current_user.id, client_ip, db
        )

        if not validation_result["valid"]:
            # Log failed attempt
            log_coupon_attempt(
                current_user.id,
                current_user.username,
                coupon_code,
                False,
                validation_result["reason"],
                client_ip,
            )

            # Return appropriate error
            if "rate limit" in validation_result["reason"].lower():
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=validation_result["reason"],
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=validation_result["reason"],
                )

        # Successful validation - redeem coupon
        coupon = validation_result["coupon"]
        credits_to_add = coupon.credits

        # Create usage record
        usage_record = CouponUsage(
            user_id=current_user.id,
            coupon_id=coupon.id,
            coupon_code=coupon_code,
            credits_added=credits_to_add,
            user_ip=client_ip,
        )

        # Update user credits
        current_user.add_credits(credits_to_add)

        # Update coupon usage count
        coupon.increment_usage()

        # Save to database
        db.add(usage_record)
        db.commit()
        db.refresh(current_user)

        # Log successful redemption
        log_coupon_attempt(
            current_user.id,
            current_user.username,
            coupon_code,
            True,
            "Successfully redeemed",
            client_ip,
            credits_to_add,
        )

        return CouponResponse(
            success=True,
            message=f"Successfully redeemed coupon '{coupon_code}' for {credits_to_add} credits!",
            credits_added=credits_to_add,
            new_balance=current_user.credits,
            coupon_code=coupon_code,
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Coupon redemption error: {e}")
        log_coupon_attempt(
            current_user.id,
            current_user.username,
            coupon_code,
            False,
            "Internal error",
            client_ip,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Coupon redemption failed. Please try again.",
        )


@router.get("/coupons/available")
async def get_available_coupons_secure(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """📋 Get available coupons with security filtering"""
    try:
        # Base query for active coupons
        query = db.query(Coupon).filter(Coupon.is_active == True)

        # Filter by category if specified
        if category:
            query = query.filter(Coupon.category == category)

        # Get all active coupons
        coupons = query.all()

        # Filter out coupons already used by current user and format for frontend
        available_coupons = []
        for coupon in coupons:
            # Skip expired coupons
            if coupon.expires_at and coupon.expires_at < datetime.utcnow():
                continue

            # Skip fully used coupons
            if coupon.usage_limit and coupon.total_used >= coupon.usage_limit:
                continue

            # Check if user already used this coupon
            user_usage_count = (
                db.query(CouponUsage)
                .filter(
                    CouponUsage.coupon_id == coupon.id,
                    CouponUsage.user_id == current_user.id,
                )
                .count()
            )

            if user_usage_count >= 1:  # Each user can only use each coupon once
                continue

            # Return in format expected by frontend
            coupon_data = {
                "id": coupon.id,
                "code": coupon.code,
                "name": coupon.description,  # Use description as name
                "description": coupon.description,
                "coupon_type": "fixed",  # Default type
                "credits_reward": coupon.credits,
                "discount_percentage": None,  # Not used in current model
                "is_active": coupon.is_active,
                "expires_at": (
                    coupon.expires_at.isoformat() if coupon.expires_at else None
                ),
                "max_uses": coupon.usage_limit,
                "current_uses": coupon.total_used,
                "per_user_limit": 1,  # Each user can use each coupon once
                "created_at": (
                    coupon.created_at.isoformat() if coupon.created_at else None
                ),
            }
            available_coupons.append(coupon_data)

        return available_coupons

    except Exception as e:
        logger.error(f"❌ Error getting available coupons: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve available coupons",
        )


@router.get("/coupons/my-usage")
async def get_my_coupon_usage_secure(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """📊 Get user's coupon usage history"""
    try:
        # Get user's coupon usage records
        usage_records = (
            db.query(CouponUsage)
            .filter(CouponUsage.user_id == current_user.id)
            .order_by(CouponUsage.redeemed_at.desc())
            .all()
        )

        # Format for frontend compatibility
        usage_history = []
        for usage in usage_records:
            coupon = db.query(Coupon).filter(Coupon.id == usage.coupon_id).first()
            usage_data = {
                "id": usage.id,
                "coupon_id": usage.coupon_id,
                "user_id": usage.user_id,
                "credits_awarded": usage.credits_added,
                "ip_address": usage.user_ip or "unknown",
                "user_agent": "unknown",  # Not tracked in current schema
                "redeemed_at": usage.redeemed_at.isoformat(),
                "coupon": {
                    "code": usage.coupon_code,
                    "name": coupon.description if coupon else "Unknown coupon",
                    "description": coupon.description if coupon else "Unknown coupon",
                },
            }
            usage_history.append(usage_data)

        return usage_history

    except Exception as e:
        logger.error(f"❌ Error getting coupon usage history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve coupon usage history",
        )


@router.get("/coupons/stats", response_model=CouponStats)
async def get_coupon_statistics(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """📈 Get coupon system statistics"""
    try:
        # Basic stats
        active_coupons = db.query(Coupon).filter(Coupon.is_active == True).count()

        # Today's redemptions
        today_start = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        today_redemptions = (
            db.query(CouponUsage).filter(CouponUsage.redeemed_at >= today_start).count()
        )

        # Total credits distributed
        total_credits = db.query(func.sum(CouponUsage.credits_added)).scalar() or 0

        # Most popular coupon (by usage count)
        popular_coupon = (
            db.query(Coupon.code, func.count(CouponUsage.id))
            .join(CouponUsage, Coupon.id == CouponUsage.coupon_id)
            .group_by(Coupon.code)
            .order_by(func.count(CouponUsage.id).desc())
            .first()
        )

        return CouponStats(
            active_coupons=active_coupons,
            total_redemptions_today=today_redemptions,
            total_credits_distributed=int(total_credits),
            most_popular_coupon=popular_coupon[0] if popular_coupon else None,
        )

    except Exception as e:
        logger.error(f"❌ Error getting coupon statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve coupon statistics",
        )


# === ADMIN COUPON ENDPOINTS ===


@router.post("/admin/coupons/create", response_model=CouponInfo)
async def create_coupon_secure(
    coupon_data: CouponCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """🔧 Admin: Create new coupon with security validation"""
    try:
        # Check if coupon code already exists
        existing = (
            db.query(Coupon).filter(Coupon.code == coupon_data.code.upper()).first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{coupon_data.code}' already exists",
            )

        # Create new coupon
        new_coupon = Coupon(
            code=coupon_data.code.upper(),
            credits=coupon_data.credits,
            description=coupon_data.description,
            category=coupon_data.category,
            usage_limit=coupon_data.usage_limit,
            expires_at=coupon_data.expires_at,
            created_by=current_user.id,
        )

        db.add(new_coupon)
        db.commit()
        db.refresh(new_coupon)

        logger.info(
            f"✅ Admin {current_user.username} created coupon '{new_coupon.code}'"
        )

        return new_coupon

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Admin coupon creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create coupon",
        )


@router.get("/admin/coupons/audit", response_model=List[Dict[str, Any]])
async def get_coupon_audit_log(
    limit: int = 100,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """🔍 Admin: Get coupon audit log"""
    try:
        # Get recent usage records with user info
        audit_records = (
            db.query(CouponUsage)
            .join(User, CouponUsage.user_id == User.id)
            .order_by(CouponUsage.redeemed_at.desc())
            .limit(limit)
            .all()
        )

        audit_log = []
        for record in audit_records:
            audit_log.append(
                {
                    "user_id": record.user_id,
                    "username": record.user.username,
                    "coupon_code": record.coupon_code,
                    "credits_added": record.credits_added,
                    "redeemed_at": record.redeemed_at,
                    "user_ip": record.user_ip,
                    "success": True,
                    "action": "redeemed",
                }
            )

        return audit_log

    except Exception as e:
        logger.error(f"❌ Error getting audit log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve audit log",
        )


@router.get("/admin/coupons/abuse-detection")
async def detect_coupon_abuse(
    current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)
):
    """⚠️ Admin: Detect potential coupon abuse"""
    try:
        # Detect users with high coupon usage
        one_day_ago = datetime.utcnow() - timedelta(days=1)

        suspicious_users = (
            db.query(
                CouponUsage.user_id,
                User.username,
                func.count(CouponUsage.id).label("redemption_count"),
                func.sum(CouponUsage.credits_added).label("total_credits"),
            )
            .join(User, CouponUsage.user_id == User.id)
            .filter(CouponUsage.redeemed_at >= one_day_ago)
            .group_by(CouponUsage.user_id, User.username)
            .having(func.count(CouponUsage.id) > 3)  # More than 3 coupons in 24h
            .all()
        )

        # Detect IP addresses with multiple users
        suspicious_ips = (
            db.query(
                CouponUsage.user_ip,
                func.count(func.distinct(CouponUsage.user_id)).label("unique_users"),
                func.count(CouponUsage.id).label("total_redemptions"),
            )
            .filter(
                CouponUsage.redeemed_at >= one_day_ago, CouponUsage.user_ip.isnot(None)
            )
            .group_by(CouponUsage.user_ip)
            .having(
                func.count(func.distinct(CouponUsage.user_id))
                > 2  # More than 2 users per IP
            )
            .all()
        )

        return {
            "suspicious_users": [
                {
                    "user_id": user.user_id,
                    "username": user.username,
                    "redemption_count": user.redemption_count,
                    "total_credits": user.total_credits,
                }
                for user in suspicious_users
            ],
            "suspicious_ips": [
                {
                    "ip_address": ip.user_ip,
                    "unique_users": ip.unique_users,
                    "total_redemptions": ip.total_redemptions,
                }
                for ip in suspicious_ips
            ],
            "scan_period": "24 hours",
            "scan_timestamp": datetime.utcnow(),
        }

    except Exception as e:
        logger.error(f"❌ Error detecting abuse: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to detect abuse",
        )


@router.post("/admin/coupons/seed")
async def seed_coupons_endpoint(
    current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)
):
    """🌱 Admin: Seed initial coupons into database"""
    try:
        success = seed_initial_coupons(db)
        if success:
            count = db.query(Coupon).count()
            return {
                "success": True,
                "message": f"Database seeded successfully with {count} coupons",
                "admin": current_user.username,
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to seed coupons",
            )
    except Exception as e:
        logger.error(f"❌ Seeding error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Coupon seeding failed",
        )


# === HEALTH CHECK ===


@router.get("/health")
async def credits_health_check():
    """🏥 Credits service health check"""
    return {
        "status": "healthy",
        "service": "credits",
        "packages_available": len(CREDIT_PACKAGES),
        "features": {
            "purchase": "active",
            "balance_check": "active",
            "transaction_history": "active",
            "admin_panel": "active",
            "coupons": "active",
        },
    }


# === MISSING API ENDPOINTS - EMERGENCY FIXES ===


@router.get("/validate-coupon")
async def validate_coupon(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """🔍 Validate coupon without redeeming (Frontend compatibility endpoint)"""
    try:
        # Input validation
        if not code or len(code.strip()) < 3:
            return {
                "valid": False,
                "message": "Coupon code must be at least 3 characters long",
                "coupon": None,
            }

        coupon_code = code.strip().upper()

        # Find coupon
        coupon = (
            db.query(Coupon)
            .filter(Coupon.code == coupon_code, Coupon.is_active == True)
            .first()
        )

        if not coupon:
            return {"valid": False, "message": "Invalid coupon code", "coupon": None}

        # Check expiration
        if coupon.expires_at and coupon.expires_at < datetime.utcnow():
            return {"valid": False, "message": "Coupon has expired", "coupon": None}

        # Check usage limits
        if coupon.usage_limit and coupon.total_used >= coupon.usage_limit:
            return {
                "valid": False,
                "message": "Coupon usage limit reached",
                "coupon": None,
            }

        # Check per-user limit
        user_usage_count = (
            db.query(CouponUsage)
            .filter(
                CouponUsage.coupon_id == coupon.id,
                CouponUsage.user_id == current_user.id,
            )
            .count()
        )

        if user_usage_count >= 1:  # Each user can only use each coupon once
            return {
                "valid": False,
                "message": "You have already used this coupon",
                "coupon": None,
            }

        # Valid coupon
        return {
            "valid": True,
            "message": "Coupon is valid",
            "coupon": {
                "id": coupon.id,
                "code": coupon.code,
                "name": coupon.description,  # Use description as name
                "description": coupon.description,
                "credits_reward": coupon.credits,  # Use 'credits' not 'credits_reward'
                "coupon_type": "fixed",  # Default type
            },
        }

    except Exception as e:
        logger.error(f"Coupon validation error: {str(e)}")
        return {"valid": False, "message": "Validation failed", "coupon": None}


@router.get("/admin/coupons")
async def admin_get_coupons(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """🔑 Admin endpoint for coupon management (Frontend compatibility)"""
    try:
        # For compatibility with frontend, return all active coupons
        # TODO: Add proper admin role checking in production

        active_coupons = db.query(Coupon).filter(Coupon.is_active == True).all()

        coupon_list = []
        for coupon in active_coupons:
            # Skip expired coupons
            if coupon.expires_at and coupon.expires_at < datetime.utcnow():
                continue

            # Skip fully used coupons
            if coupon.usage_limit and coupon.total_used >= coupon.usage_limit:
                continue

            # Return in format expected by frontend
            coupon_data = {
                "id": coupon.id,
                "code": coupon.code,
                "name": coupon.description,  # Use description as name
                "description": coupon.description,
                "coupon_type": "fixed",  # Default type
                "credits_reward": coupon.credits,
                "discount_percentage": None,  # Not used in current model
                "is_active": coupon.is_active,
                "expires_at": (
                    coupon.expires_at.isoformat() if coupon.expires_at else None
                ),
                "max_uses": coupon.usage_limit,
                "current_uses": coupon.total_used,
                "per_user_limit": 1,  # Each user can use each coupon once
                "created_at": (
                    coupon.created_at.isoformat() if coupon.created_at else None
                ),
            }
            coupon_list.append(coupon_data)

        return coupon_list

    except Exception as e:
        logger.error(f"Admin coupons error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve admin coupons",
        )


@router.get("/coupons/health", response_model=CouponHealthStatus)
async def coupon_health_check(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """🏥 Comprehensive coupon system health check"""
    try:
        # Database connectivity
        db_status = "connected"
        try:
            db.execute("SELECT 1")
        except:
            db_status = "disconnected"

        # Basic metrics
        active_coupons = db.query(Coupon).filter(Coupon.is_active == True).count()

        today_start = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        today_redemptions = (
            db.query(CouponUsage).filter(CouponUsage.redeemed_at >= today_start).count()
        )

        total_credits = db.query(func.sum(CouponUsage.credits_added)).scalar() or 0

        # Security metrics
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        failed_attempts_query = db.query(CouponUsage).filter(
            CouponUsage.redeemed_at >= one_hour_ago
        )
        # This is a proxy - in real implementation you'd track failed attempts separately
        failed_attempts = 0  # Placeholder

        return CouponHealthStatus(
            status="healthy" if db_status == "connected" else "degraded",
            database=db_status,
            active_coupons=active_coupons,
            total_redemptions_today=today_redemptions,
            total_credits_distributed=int(total_credits),
            most_popular_coupon="FOOTBALL25",  # Placeholder
            security_status={
                "failed_attempts_today": failed_attempts,
                "rate_limited_users": 0,  # Placeholder
                "suspicious_activity": False,
            },
        )

    except Exception as e:
        logger.error(f"❌ Health check error: {e}")
        return CouponHealthStatus(
            status="unhealthy",
            database="error",
            active_coupons=0,
            total_redemptions_today=0,
            total_credits_distributed=0,
            security_status={
                "failed_attempts_today": 0,
                "rate_limited_users": 0,
                "suspicious_activity": True,
            },
        )


# Export router
print("✅ Credits router imported successfully")
