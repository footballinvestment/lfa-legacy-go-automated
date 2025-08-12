# === backend/app/routers/credits.py ===
# TELJES JAVÍTOTT Credit Purchase System - STRIPE PAYMENT FIX + Package ID MEGOLDVA

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import logging
import random

from ..database import get_db
from ..models.user import User
from .auth import get_current_user

# Initialize router and logger
router = APIRouter(prefix="/api/credits", tags=["credits"])
logger = logging.getLogger(__name__)

# JAVÍTOTT Credit packages configuration
CREDIT_PACKAGES = {
    "starter_pack": {
        "id": "starter_pack",
        "name": "Kezdő Csomag",
        "credits": 10,
        "bonus_credits": 2,
        "total_credits": 12,
        "price_huf": 1990,
        "price_eur": 5.49,
        "description": "Tökéletes kezdéshez + 2 bónusz credit",
        "popular": False
    },
    "value_pack": {
        "id": "value_pack", 
        "name": "Érték Csomag",
        "credits": 25,
        "bonus_credits": 8,
        "total_credits": 33,
        "price_huf": 4490,
        "price_eur": 12.49,
        "description": "Legjobb ár-érték arány + 8 bónusz credit",
        "popular": True
    },
    "premium_pack": {
        "id": "premium_pack",
        "name": "Prémium Csomag", 
        "credits": 50,
        "bonus_credits": 20,
        "total_credits": 70,
        "price_huf": 7990,
        "price_eur": 22.49,
        "description": "Maximális value + 20 bónusz credit",
        "popular": False
    },
    "mega_pack": {
        "id": "mega_pack",
        "name": "Mega Csomag",
        "credits": 100,
        "bonus_credits": 50,
        "total_credits": 150,
        "price_huf": 14990,
        "price_eur": 41.99,
        "description": "Ultimate pack + 50 bónusz credit",
        "popular": False
    }
}

# JAVÍTOTT Payment methods - STRIPE TÁMOGATÁSSAL
PAYMENT_METHODS = {
    "stripe": {"name": "Stripe", "icon": "💳", "processing_fee": 0.029},  # HOZZÁADVA
    "card": {"name": "Bankkártya", "icon": "💳", "processing_fee": 0.029},
    "paypal": {"name": "PayPal", "icon": "🅿️", "processing_fee": 0.034},
    "apple_pay": {"name": "Apple Pay", "icon": "🍎", "processing_fee": 0.029},
    "google_pay": {"name": "Google Pay", "icon": "🟢", "processing_fee": 0.029},
    "bank_transfer": {"name": "Banki átutalás", "icon": "🏦", "processing_fee": 0.0},
    "test": {"name": "Test Payment", "icon": "🧪", "processing_fee": 0.0}  # TESZT MÓDHOZ
}

# Pydantic models
class CreditPackageInfo(BaseModel):
    id: str
    name: str
    credits: int
    bonus_credits: int
    total_credits: int
    price_huf: int
    price_eur: float
    description: str
    popular: bool

class PaymentMethodInfo(BaseModel):
    method: str
    name: str
    icon: str
    processing_fee: float

class PurchaseRequest(BaseModel):
    package_id: str = Field(..., description="Credit package identifier")
    payment_method: str = Field(..., description="Payment method (stripe, card, paypal, etc.)")
    currency: str = Field(default="HUF", description="Currency (HUF or EUR)")

class TransactionResponse(BaseModel):
    transaction_id: str
    package_name: str
    credits_purchased: int
    bonus_credits: int
    total_credits_added: int
    amount_paid: float
    currency: str
    payment_method: str
    status: str
    created_at: datetime
    new_credit_balance: int

class TransactionHistory(BaseModel):
    transaction_id: str
    package_name: str
    credits_purchased: int
    bonus_credits: int
    total_credits_added: int
    amount_paid: float
    currency: str
    payment_method: str
    status: str
    created_at: datetime

class CreditBalance(BaseModel):
    current_balance: int
    total_purchased: int
    total_spent: int
    total_bonus_earned: int
    favorite_package: Optional[str] = None
    last_purchase_date: Optional[datetime] = None

class RefundRequest(BaseModel):
    transaction_id: str
    reason: str = Field(..., description="Refund reason")

# Helper functions
def get_package_by_id(package_id: str) -> Optional[dict]:
    """Get package configuration by ID - JAVÍTOTT VERZIÓ"""
    # Direct lookup first (ez fogja megoldani a problémát)
    if package_id in CREDIT_PACKAGES:
        return CREDIT_PACKAGES[package_id]
    
    # Fallback: search by id field (backward compatibility)
    for pkg_data in CREDIT_PACKAGES.values():
        if pkg_data["id"] == package_id:
            return pkg_data
    
    return None

def calculate_processing_fee(amount: float, payment_method: str) -> float:
    """Calculate processing fee based on payment method"""
    if payment_method not in PAYMENT_METHODS:
        return 0.0
    
    fee_rate = PAYMENT_METHODS[payment_method]["processing_fee"]
    return round(amount * fee_rate, 2)

def simulate_payment_processing(amount: float, payment_method: str) -> tuple[bool, str]:
    """Simulate payment processing with realistic success rates - STRIPE TÁMOGATÁSSAL"""
    
    # Simulate different success rates by payment method
    success_rates = {
        "stripe": 0.96,  # HOZZÁADVA
        "card": 0.95,
        "paypal": 0.97,
        "apple_pay": 0.98,
        "google_pay": 0.98,
        "bank_transfer": 0.99,
        "test": 1.0  # Test payment always succeeds
    }
    
    success_rate = success_rates.get(payment_method, 0.95)
    is_successful = random.random() < success_rate
    
    if is_successful:
        # Generate realistic transaction reference based on payment method
        if payment_method == "stripe":
            ref = f"pi_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(100000, 999999)}"
        elif payment_method == "paypal":
            ref = f"PAY-{random.randint(10000000000000000, 99999999999999999)}"
        elif payment_method == "test":
            ref = f"TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}"
        else:
            ref = f"TX_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}"
        return True, ref
    else:
        # Simulate common payment failures
        failure_reasons = [
            "Insufficient funds",
            "Card declined", 
            "Payment timeout",
            "Authentication failed",
            "Network error"
        ]
        return False, random.choice(failure_reasons)

def create_transaction_record(user: User, package: dict, amount: float, 
                            payment_method: str, transaction_ref: str) -> dict:
    """Create transaction record for user's history"""
    transaction = {
        "transaction_id": str(uuid.uuid4()),
        "package_id": package["id"],
        "package_name": package["name"],
        "credits_purchased": package["credits"],
        "bonus_credits": package["bonus_credits"],
        "total_credits_added": package["total_credits"],
        "amount_paid": amount,
        "currency": "HUF",
        "payment_method": payment_method,
        "payment_reference": transaction_ref,
        "status": "completed",
        "created_at": datetime.utcnow().isoformat(),
        "processing_fee": calculate_processing_fee(amount, payment_method)
    }
    
    return transaction

# Credit Purchase Endpoints

@router.get("/packages", response_model=List[CreditPackageInfo])
async def get_credit_packages():
    """
    🎁 Elérhető credit csomagok lekérése
    Visszaadja az összes vásárolható credit csomagot árakkal és bónuszokkal
    """
    try:
        packages = []
        for package_data in CREDIT_PACKAGES.values():
            packages.append(CreditPackageInfo(**package_data))
        
        logger.info(f"Credit packages requested: {len(packages)} packages returned")
        return packages
        
    except Exception as e:
        logger.error(f"Error fetching credit packages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hiba történt a credit csomagok betöltésekor"
        )

@router.get("/payment-methods", response_model=List[PaymentMethodInfo])
async def get_payment_methods():
    """
    💳 Elérhető fizetési módok lekérése - STRIPE TÁMOGATÁSSAL
    Visszaadja az összes támogatott fizetési módot díjakkal
    """
    try:
        methods = []
        for method_id, method_data in PAYMENT_METHODS.items():
            methods.append(PaymentMethodInfo(
                method=method_id,
                name=method_data["name"],
                icon=method_data["icon"],
                processing_fee=method_data["processing_fee"]
            ))
        
        logger.info(f"Payment methods requested: {len(methods)} methods returned (including Stripe)")
        return methods
        
    except Exception as e:
        logger.error(f"Error fetching payment methods: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hiba történt a fizetési módok betöltésekor"
        )

@router.post("/purchase", response_model=TransactionResponse)
async def purchase_credits(
    purchase_request: PurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    💰 Credit vásárlás végrehajtása - STRIPE TÁMOGATÁSSAL ÉS JAVÍTOTT VERZIÓ
    Feldolgozza a credit vásárlást és frissíti a user egyenlegét
    """
    try:
        # JAVÍTOTT: Package validation
        package = get_package_by_id(purchase_request.package_id)
        if not package:
            available_packages = list(CREDIT_PACKAGES.keys())
            logger.error(f"Invalid package ID: {purchase_request.package_id}, available: {available_packages}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Érvénytelen csomag ID: {purchase_request.package_id}. Elérhető csomagok: {', '.join(available_packages)}"
            )
        
        # JAVÍTOTT: Payment method validation - STRIPE TÁMOGATÁSSAL
        if purchase_request.payment_method not in PAYMENT_METHODS:
            available_methods = list(PAYMENT_METHODS.keys())
            logger.error(f"Invalid payment method: {purchase_request.payment_method}, available: {available_methods}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Érvénytelen fizetési mód: {purchase_request.payment_method}. Elérhető módok: {', '.join(available_methods)}"
            )
        
        # Calculate final amount (price + processing fee)
        base_price = package["price_huf"] if purchase_request.currency == "HUF" else package["price_eur"]
        processing_fee = calculate_processing_fee(base_price, purchase_request.payment_method)
        final_amount = base_price + processing_fee
        
        # Simulate payment processing - STRIPE TÁMOGATÁSSAL
        payment_success, payment_reference = simulate_payment_processing(
            final_amount, purchase_request.payment_method
        )
        
        if not payment_success:
            logger.warning(f"Payment failed for user {current_user.username}: {payment_reference}")
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Fizetés sikertelen: {payment_reference}"
            )
        
        # Create transaction record
        transaction = create_transaction_record(
            current_user, package, final_amount, 
            purchase_request.payment_method, payment_reference
        )
        
        # Update user credits
        credits_to_add = package["total_credits"]
        old_balance = current_user.credits
        current_user.credits += credits_to_add
        
        # Update user transaction history
        if not hasattr(current_user, 'transaction_history') or current_user.transaction_history is None:
            current_user.transaction_history = []
        
        current_user.transaction_history.append(transaction)
        
        # Update user statistics
        current_user.total_credits_purchased = getattr(current_user, 'total_credits_purchased', 0) + package["credits"]
        current_user.total_bonus_earned = getattr(current_user, 'total_bonus_earned', 0) + package["bonus_credits"]
        current_user.last_purchase_date = datetime.utcnow()
        
        # Commit to database
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"Credit purchase successful: User {current_user.username}, "
                   f"Package {package['name']}, Credits added: {credits_to_add}, "
                   f"New balance: {current_user.credits}, TX: {transaction['transaction_id']}, "
                   f"Payment method: {purchase_request.payment_method}")
        
        return TransactionResponse(
            transaction_id=transaction["transaction_id"],
            package_name=package["name"],
            credits_purchased=package["credits"],
            bonus_credits=package["bonus_credits"],
            total_credits_added=credits_to_add,
            amount_paid=final_amount,
            currency=purchase_request.currency,
            payment_method=purchase_request.payment_method,
            status="completed",
            created_at=datetime.fromisoformat(transaction["created_at"]),
            new_credit_balance=current_user.credits
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Credit purchase error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hiba történt a vásárlás során"
        )

@router.get("/balance", response_model=CreditBalance)
async def get_credit_balance(current_user: User = Depends(get_current_user)):
    """
    💰 Credit egyenleg és statisztikák lekérése
    """
    try:
        # Calculate statistics from transaction history
        transaction_history = getattr(current_user, 'transaction_history', []) or []
        
        total_purchased = sum(t.get("credits_purchased", 0) for t in transaction_history)
        total_bonus_earned = sum(t.get("bonus_credits", 0) for t in transaction_history)
        total_spent = sum(t.get("amount_paid", 0) for t in transaction_history)
        
        # Find favorite package
        if transaction_history:
            package_counts = {}
            for t in transaction_history:
                pkg = t.get("package_id", "unknown")
                package_counts[pkg] = package_counts.get(pkg, 0) + 1
            favorite_package = max(package_counts, key=package_counts.get)
        else:
            favorite_package = None
        
        last_purchase = getattr(current_user, 'last_purchase_date', None)
        
        return CreditBalance(
            current_balance=current_user.credits,
            total_purchased=total_purchased,
            total_spent=int(total_spent),
            total_bonus_earned=total_bonus_earned,
            favorite_package=favorite_package,
            last_purchase_date=last_purchase
        )
        
    except Exception as e:
        logger.error(f"Error fetching credit balance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hiba történt az egyenleg lekérdezésekor"
        )

@router.get("/history", response_model=List[TransactionHistory])
async def get_transaction_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """
    📜 Tranzakciós történet lekérése
    """
    try:
        transaction_history = getattr(current_user, 'transaction_history', []) or []
        
        # Sort by created_at descending and limit
        sorted_transactions = sorted(
            transaction_history, 
            key=lambda x: datetime.fromisoformat(x["created_at"]), 
            reverse=True
        )[:limit]
        
        result = []
        for t in sorted_transactions:
            result.append(TransactionHistory(
                transaction_id=t["transaction_id"],
                package_name=t["package_name"],
                credits_purchased=t["credits_purchased"],
                bonus_credits=t["bonus_credits"],
                total_credits_added=t["total_credits_added"],
                amount_paid=t["amount_paid"],
                currency=t["currency"],
                payment_method=t["payment_method"],
                status=t["status"],
                created_at=datetime.fromisoformat(t["created_at"])
            ))
        
        logger.info(f"Transaction history requested for user {current_user.username}: {len(result)} transactions returned")
        return result
        
    except Exception as e:
        logger.error(f"Error fetching transaction history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hiba történt a tranzakciós történet lekérdezésekor"
        )

@router.post("/refund")
async def request_refund(
    refund_request: RefundRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    🔄 Visszatérítés kérése
    """
    try:
        transaction_history = getattr(current_user, 'transaction_history', []) or []
        
        # Find the transaction
        transaction = None
        for t in transaction_history:
            if t["transaction_id"] == refund_request.transaction_id:
                transaction = t
                break
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tranzakció nem található"
            )
        
        # Check if refund is possible (within 30 days)
        transaction_date = datetime.fromisoformat(transaction["created_at"])
        if datetime.utcnow() - transaction_date > timedelta(days=30):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Visszatérítés csak 30 napon belül kérhető"
            )
        
        # Check if already refunded
        if transaction.get("status") == "refunded":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ez a tranzakció már visszatérítésre került"
            )
        
        # Process refund (in real implementation, this would contact payment provider)
        transaction["status"] = "refund_requested"
        transaction["refund_reason"] = refund_request.reason
        transaction["refund_requested_at"] = datetime.utcnow().isoformat()
        
        # Update user record
        db.commit()
        
        logger.info(f"Refund requested for transaction {refund_request.transaction_id} by user {current_user.username}")
        
        return {
            "message": "Visszatérítési kérelem feldolgozásra került",
            "transaction_id": refund_request.transaction_id,
            "status": "refund_requested",
            "processing_time": "1-3 munkanap"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing refund request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hiba történt a visszatérítési kérelem során"
        )