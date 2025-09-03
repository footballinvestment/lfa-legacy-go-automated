# app/services/email_service.py
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import os
import logging
from jinja2 import Template

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

email_service = EmailService()