# app/validators/input_validators.py
import re
from typing import Optional
from pydantic import BaseModel, validator, Field

class StrictUserRegistration(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: str = Field(..., max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    
    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username can only contain letters, numbers, hyphens, and underscores')
        
        # Prohibited usernames
        prohibited = ['admin', 'api', 'www', 'root', 'test', 'null', 'undefined']
        if v.lower() in prohibited:
            raise ValueError('This username is not allowed')
        
        return v
    
    @validator('email')
    def validate_email(cls, v):
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, v):
            raise ValueError('Invalid email format')
        
        # Block known disposable email domains
        disposable_domains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com'
        ]
        domain = v.split('@')[1].lower()
        if domain in disposable_domains:
            raise ValueError('Disposable email addresses are not allowed')
        
        return v.lower()
    
    @validator('password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        
        # Check for common weak passwords
        weak_passwords = [
            'password', '12345678', 'qwerty123', 'abc123456', 
            'password123', '123456789', 'welcome123'
        ]
        if v.lower() in weak_passwords:
            raise ValueError('This password is too common. Please choose a stronger password.')
        
        return v
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if not re.match(r'^[a-zA-Z\s\'-]+$', v):
            raise ValueError('Full name can only contain letters, spaces, hyphens, and apostrophes')
        
        # Remove extra whitespace
        return ' '.join(v.split())

class StrictTournamentCreation(BaseModel):
    name: str = Field(..., min_length=5, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    tournament_type: str = Field(..., regex=r'^(knockout|round_robin|swiss)$')
    game_type: str = Field(..., regex=r'^(GAME1|GAME2|GAME3)$')
    max_participants: int = Field(..., ge=4, le=64)
    min_participants: int = Field(..., ge=2, le=32)
    entry_fee_credits: int = Field(..., ge=0, le=1000)
    min_level: int = Field(..., ge=1, le=100)
    max_level: Optional[int] = Field(None, ge=1, le=100)
    
    @validator('name')
    def validate_tournament_name(cls, v):
        # Remove excessive whitespace
        cleaned = ' '.join(v.split())
        
        # Check for inappropriate content
        inappropriate_words = ['hack', 'cheat', 'bot', 'spam']
        if any(word in cleaned.lower() for word in inappropriate_words):
            raise ValueError('Tournament name contains inappropriate content')
        
        return cleaned
    
    @validator('max_participants')
    def validate_max_participants(cls, v, values):
        if 'min_participants' in values and v < values['min_participants']:
            raise ValueError('Maximum participants must be greater than minimum participants')
        return v
    
    @validator('max_level')
    def validate_max_level(cls, v, values):
        if v is not None and 'min_level' in values and v < values['min_level']:
            raise ValueError('Maximum level must be greater than minimum level')
        return v

class PasswordResetRequest(BaseModel):
    email: str = Field(..., max_length=100)
    
    @validator('email')
    def validate_email(cls, v):
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, v):
            raise ValueError('Invalid email format')
        return v.lower()

class PasswordResetConfirm(BaseModel):
    token: str = Field(..., min_length=32, max_length=64)
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=50)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int