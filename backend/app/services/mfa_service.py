import pyotp
import qrcode
import io
import base64
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from fastapi import HTTPException
import secrets
import logging

logger = logging.getLogger(__name__)

class MFAService:
    def __init__(self):
        self.app_name = "LFA Legacy GO"
        self.issuer_name = "LFA Legacy GO"
    
    def generate_totp_secret(self) -> str:
        """Generate a new TOTP secret for user"""
        return pyotp.random_base32()
    
    def generate_qr_code(self, secret: str, user_email: str) -> str:
        """Generate QR code for TOTP setup"""
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name=self.issuer_name
        )
        
        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        # Generate PNG image in memory
        img = qr.make_image(fill_color="black", back_color="white")
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Convert to base64 for frontend display
        img_base64 = base64.b64encode(img_buffer.read()).decode()
        
        return f"data:image/png;base64,{img_base64}"
    
    def verify_totp_token(self, secret: str, token: str, window: int = 1) -> bool:
        """Verify TOTP token with time window tolerance"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=window)
    
    def setup_mfa_for_user(self, user_id: str, user_email: str) -> Dict:
        """Initialize MFA setup process for user"""
        secret = self.generate_totp_secret()
        qr_code = self.generate_qr_code(secret, user_email)
        
        # Generate backup codes
        backup_codes = [secrets.token_hex(4).upper() for _ in range(8)]
        
        setup_data = {
            "secret": secret,
            "qr_code": qr_code,
            "backup_codes": backup_codes,
            "setup_token": secrets.token_urlsafe(32),
            "expires_at": (datetime.utcnow() + timedelta(minutes=15)).isoformat(),
            "app_name": self.app_name
        }
        
        logger.info(f"🔐 MFA setup initiated for user {user_id}")
        
        return setup_data
    
    def verify_mfa_setup(self, secret: str, user_token: str) -> bool:
        """Verify user has correctly configured their authenticator app"""
        return self.verify_totp_token(secret, user_token)
    
    def validate_backup_code(self, backup_codes: List[str], provided_code: str) -> tuple:
        """Validate backup code and return updated code list"""
        provided_code = provided_code.upper().strip()
        
        if provided_code in backup_codes:
            # Remove used backup code
            updated_codes = [code for code in backup_codes if code != provided_code]
            logger.info(f"✅ Backup code used successfully. Remaining: {len(updated_codes)}")
            return True, updated_codes
        
        return False, backup_codes
    
    def authenticate_user_mfa(
        self, 
        totp_secret: str, 
        backup_codes: List[str], 
        provided_code: str
    ) -> Dict:
        """Authenticate user with MFA (TOTP or backup code)"""
        
        # Try TOTP first
        if len(provided_code) == 6 and provided_code.isdigit():
            if self.verify_totp_token(totp_secret, provided_code):
                return {
                    "success": True,
                    "method": "totp",
                    "backup_codes": backup_codes  # Unchanged
                }
        
        # Try backup code
        if len(provided_code) == 8 and provided_code.replace('-', '').isalnum():
            backup_valid, updated_codes = self.validate_backup_code(backup_codes, provided_code)
            if backup_valid:
                return {
                    "success": True,
                    "method": "backup_code",
                    "backup_codes": updated_codes  # Updated list
                }
        
        return {
            "success": False,
            "error": "Invalid MFA code"
        }
    
    def generate_new_backup_codes(self, user_id: str) -> List[str]:
        """Generate new set of backup codes for user"""
        new_codes = [secrets.token_hex(4).upper() for _ in range(8)]
        logger.info(f"🔑 Generated new backup codes for user {user_id}")
        return new_codes


class WebAuthnService:
    def __init__(self):
        self.rp_id = "lfa-legacy-go.netlify.app"
        self.rp_name = "LFA Legacy GO"
        self.origin = "https://lfa-legacy-go.netlify.app"
    
    def generate_registration_options(self, user_id: str, username: str, email: str) -> Dict:
        """Generate WebAuthn registration options for new authenticator"""
        
        # Generate challenge
        challenge = secrets.token_bytes(32)
        challenge_b64 = base64.b64encode(challenge).decode()
        
        registration_options = {
            "challenge": challenge_b64,
            "rp": {
                "name": self.rp_name,
                "id": self.rp_id
            },
            "user": {
                "id": base64.b64encode(user_id.encode()).decode(),
                "name": email,
                "displayName": username
            },
            "pubKeyCredParams": [
                {"alg": -7, "type": "public-key"},   # ES256
                {"alg": -257, "type": "public-key"}  # RS256
            ],
            "authenticatorSelection": {
                "authenticatorAttachment": "platform",  # Prefer platform authenticators
                "userVerification": "preferred",
                "residentKey": "preferred"
            },
            "timeout": 60000,  # 60 seconds
            "attestation": "direct"
        }
        
        logger.info(f"🔐 WebAuthn registration options generated for user {user_id}")
        
        return registration_options
    
    def generate_authentication_options(self, user_id: str) -> Dict:
        """Generate WebAuthn authentication options"""
        
        challenge = secrets.token_bytes(32)
        challenge_b64 = base64.b64encode(challenge).decode()
        
        auth_options = {
            "challenge": challenge_b64,
            "timeout": 60000,
            "rpId": self.rp_id,
            "userVerification": "preferred"
        }
        
        logger.info(f"🔐 WebAuthn authentication options generated for user {user_id}")
        
        return auth_options