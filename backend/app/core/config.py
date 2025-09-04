"""
Configuration management for LFA Legacy GO
"""

import os
import secrets
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings and configuration."""

    # Application
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    PORT: int = int(os.getenv("PORT", 8080))

    # Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 60))

    # Admin credentials
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: Optional[str] = os.getenv("ADMIN_PASSWORD")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@lfagolegacy.com")
    ADMIN_FULL_NAME: str = os.getenv("ADMIN_FULL_NAME", "System Administrator")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./lfa_legacy_go.db")

    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))

    # Rate limiting
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"

    # CORS
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    
    # Email configuration
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@lfa-legacy-go.com")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://lfa-legacy-go.netlify.app")
    
    # Email verification settings
    EMAIL_VERIFICATION_REQUIRED: bool = os.getenv("EMAIL_VERIFICATION_REQUIRED", "true").lower() == "true"
    EMAIL_RATE_LIMIT_PER_HOUR: int = int(os.getenv("EMAIL_RATE_LIMIT_PER_HOUR", "3"))

    @classmethod
    def validate_production_settings(cls) -> list[str]:
        """Validate required settings for production."""
        errors = []

        if cls.ENVIRONMENT == "production":
            if not cls.ADMIN_PASSWORD:
                errors.append("ADMIN_PASSWORD must be set in production")
            elif cls.ADMIN_PASSWORD in ["admin123", "admin123-change-this-immediately"]:
                errors.append("ADMIN_PASSWORD must be changed from default value")

            if cls.JWT_SECRET_KEY == secrets.token_urlsafe(32):
                errors.append("JWT_SECRET_KEY should be set explicitly in production")

            if cls.DATABASE_URL.startswith("sqlite://"):
                errors.append(
                    "Consider using PostgreSQL for production instead of SQLite"
                )

        return errors

    @classmethod
    def is_secure_password(cls, password: str) -> bool:
        """Check if password meets security requirements."""
        if len(password) < 8:
            return False
        if not any(c.isupper() for c in password):
            return False
        if not any(c.islower() for c in password):
            return False
        if not any(c.isdigit() for c in password):
            return False
        return True


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings
