# MFA Router with Database Support
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, MFACodeRequest
from ..services.mfa_service import MFAService
from ..services.auth_enhanced import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def get_mfa_service_with_db(db: Session = Depends(get_db)):
    """Get MFA service with database session"""
    return MFAService(db=db)

@router.post("/setup")
async def setup_mfa_new(
    current_user: User = Depends(get_current_user),
    mfa_service: MFAService = Depends(get_mfa_service_with_db)
):
    """🔐 Setup MFA using new database structure"""
    try:
        result = await mfa_service.setup_totp_db(current_user.id, current_user.email)
        return {
            "success": True,
            "message": "MFA setup initiated",
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ MFA setup error: {str(e)}")
        raise HTTPException(status_code=500, detail="MFA setup failed")

@router.post("/verify-setup")
async def verify_mfa_setup_new(
    request: MFACodeRequest,
    current_user: User = Depends(get_current_user),
    mfa_service: MFAService = Depends(get_mfa_service_with_db)
):
    """✅ Verify and activate MFA setup"""
    try:
        success = await mfa_service.verify_setup_db(current_user.id, request.code)
        if success:
            return {
                "success": True,
                "message": "MFA enabled successfully"
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid verification code")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ MFA verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="MFA verification failed")

@router.post("/verify-login")
async def verify_mfa_login_new(
    request: MFACodeRequest,
    current_user: User = Depends(get_current_user),
    mfa_service: MFAService = Depends(get_mfa_service_with_db)
):
    """🔐 Verify MFA code for login"""
    try:
        success = await mfa_service.verify_login_db(current_user.id, request.code)
        if success:
            return {
                "success": True,
                "message": "MFA verification successful"
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid MFA code")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ MFA login verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="MFA verification failed")