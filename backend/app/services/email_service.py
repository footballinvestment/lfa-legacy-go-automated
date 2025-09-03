import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import json
from datetime import datetime, timedelta
from fastapi import HTTPException
from typing import Dict, Optional, List
import logging
from jinja2 import Template
import os

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)
        
    def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """Send email to recipients"""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.from_email
            message["To"] = ", ".join(to_emails)
            
            # Add text version
            if text_body:
                text_part = MIMEText(text_body, "plain")
                message.attach(text_part)
            
            # Add HTML version
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)
            
            # Send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.smtp_username, self.smtp_password)
                server.sendmail(self.from_email, to_emails, message.as_string())
            
            logger.info(f"Email sent successfully to {to_emails}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_emails}: {e}")
            return False
    
    def send_password_reset_email(self, email: str, reset_token: str, username: str) -> bool:
        """Send password reset email"""
        reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}"
        
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Password Reset - LFA Legacy GO</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
                <h1>LFA Legacy GO</h1>
                <h2>Password Reset Request</h2>
            </div>
            
            <div style="padding: 20px;">
                <p>Hi {{ username }},</p>
                
                <p>We received a request to reset your password for your LFA Legacy GO account.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{ reset_url }}" 
                       style="background-color: #10b981; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #666;">{{ reset_url }}</p>
                
                <p><strong>This link will expire in 1 hour.</strong></p>
                
                <p>If you didn't request this password reset, please ignore this email.</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                
                <p style="color: #666; font-size: 12px;">
                    This email was sent by LFA Legacy GO. 
                    If you have any questions, contact our support team.
                </p>
            </div>
        </body>
        </html>
        """
        
        template = Template(html_template)
        html_body = template.render(username=username, reset_url=reset_url)
        
        text_body = f"""
        Hi {username},
        
        We received a request to reset your password for your LFA Legacy GO account.
        
        Please click the following link to reset your password:
        {reset_url}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        LFA Legacy GO Team
        """
        
        return self.send_email(
            to_emails=[email],
            subject="Reset your LFA Legacy GO password",
            html_body=html_body,
            text_body=text_body
        )
    
    def send_welcome_email(self, email: str, username: str) -> bool:
        """Send welcome email to new user"""
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Welcome to LFA Legacy GO</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
                <h1>Welcome to LFA Legacy GO! ⚽</h1>
            </div>
            
            <div style="padding: 20px;">
                <p>Hi {{ username }},</p>
                
                <p>Welcome to the LFA Legacy GO community! We're excited to have you join us.</p>
                
                <h3>What you can do now:</h3>
                <ul>
                    <li>🏆 Join tournaments and compete with other players</li>
                    <li>👥 Connect with friends and challenge them</li>
                    <li>📈 Track your progress and climb the leaderboards</li>
                    <li>💰 Earn credits and unlock achievements</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{ app_url }}" 
                       style="background-color: #10b981; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Start Playing Now
                    </a>
                </div>
                
                <p>Need help getting started? Check out our guides or contact our support team.</p>
                
                <p>Game on!</p>
                <p>The LFA Legacy GO Team</p>
            </div>
        </body>
        </html>
        """
        
        template = Template(html_template)
        html_body = template.render(
            username=username, 
            app_url=os.getenv('FRONTEND_URL', 'http://localhost:3000')
        )
        
        return self.send_email(
            to_emails=[email],
            subject="Welcome to LFA Legacy GO! ⚽",
            html_body=html_body
        )

class EnhancedEmailService:
    def __init__(self):
        # In-memory token storage for development (production uses Redis)
        self.token_storage = {}
        self.rate_limits = {}
    
    async def send_verification_email(self, user_email: str, user_id: str, username: str) -> str:
        """Send email verification with enhanced security (dev mode)"""
        
        # Rate limiting: 3 emails per hour per address
        rate_key = f"email_rate:{user_email}"
        current_count = self.rate_limits.get(rate_key, {}).get("count", 0)
        last_reset = self.rate_limits.get(rate_key, {}).get("last_reset", datetime.utcnow())
        
        # Reset counter if hour has passed
        if datetime.utcnow() - last_reset > timedelta(hours=1):
            current_count = 0
            last_reset = datetime.utcnow()
        
        if current_count >= 3:
            raise HTTPException(
                status_code=429,
                detail="Too many verification emails sent. Please wait before requesting another."
            )
        
        # Generate secure token
        token_data = {
            "user_id": user_id,
            "email": user_email,
            "type": "email_verification",
            "created_at": datetime.utcnow().isoformat()
        }
        
        token = secrets.token_urlsafe(32)
        
        # Store token with 24-hour expiration
        expiry = datetime.utcnow() + timedelta(hours=24)
        self.token_storage[token] = {
            "data": token_data,
            "expires": expiry
        }
        
        # Update rate limiting
        self.rate_limits[rate_key] = {
            "count": current_count + 1,
            "last_reset": last_reset
        }
        
        # In development: log email instead of sending
        verification_url = f"https://lfa-legacy-go.netlify.app/verify-email?token={token}"
        
        logger.info(f"""
        📧 EMAIL VERIFICATION (DEV MODE)
        To: {user_email}
        Subject: Verify Your LFA Legacy GO Account
        
        Hello {username},
        
        Please click this link to verify your email:
        {verification_url}
        
        Token: {token}
        Expires: {expiry.isoformat()}
        """)
        
        return token
    
    async def verify_email_token(self, token: str) -> Dict:
        """Verify email token and return user data"""
        
        # Check if token exists and is valid
        token_info = self.token_storage.get(token)
        
        if not token_info:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired verification token"
            )
        
        # Check expiration
        if datetime.utcnow() > token_info["expires"]:
            # Clean up expired token
            del self.token_storage[token]
            raise HTTPException(
                status_code=400,
                detail="Verification token has expired"
            )
        
        # Get token data
        token_data = token_info["data"]
        
        # Clean up used token
        del self.token_storage[token]
        
        logger.info(f"✅ Email verification successful for user {token_data['user_id']}")
        
        return token_data

email_service = EmailService()
enhanced_email_service = EnhancedEmailService()