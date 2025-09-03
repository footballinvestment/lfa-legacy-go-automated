"""
Enhanced Security Middleware for LFA Legacy GO
Implements advanced security features including session management, JWT validation, and security headers
"""

import os
import time
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import secrets
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Security constants
MAX_SESSION_DURATION = timedelta(hours=8)  # Maximum session duration
SESSION_REFRESH_THRESHOLD = timedelta(minutes=15)  # Refresh token if expiring soon
MAX_FAILED_ATTEMPTS = 5  # Max failed login attempts
LOCKOUT_DURATION = timedelta(minutes=30)  # Account lockout duration

# In-memory session store (in production, use Redis)
active_sessions: Dict[str, Dict[str, Any]] = {}
failed_attempts: Dict[str, Dict[str, Any]] = {}


class EnhancedSecurityManager:
    """Enhanced security management with session tracking and validation."""

    def __init__(self):
        self.jwt_secret = self._get_jwt_secret()
        self.jwt_algorithm = settings.JWT_ALGORITHM
        self.token_expire_minutes = settings.JWT_EXPIRE_MINUTES

    def _get_jwt_secret(self) -> str:
        """Get or generate JWT secret key."""
        jwt_secret = os.getenv("JWT_SECRET_KEY")

        if not jwt_secret:
            # Generate a secure random key for development
            jwt_secret = secrets.token_urlsafe(64)
            logger.warning(
                "JWT_SECRET_KEY not set! Generated temporary key for development."
            )

        if settings.ENVIRONMENT == "production" and len(jwt_secret) < 32:
            raise ValueError(
                "JWT_SECRET_KEY must be at least 32 characters for production"
            )

        return jwt_secret

    def create_access_token(
        self, user_id: str, username: str, extra_claims: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Create JWT access token with enhanced security."""
        now = datetime.utcnow()
        expire = now + timedelta(minutes=self.token_expire_minutes)

        # Generate unique session ID
        session_id = secrets.token_urlsafe(32)

        # Base claims
        claims = {
            "sub": str(user_id),
            "username": username,
            "iat": now,
            "exp": expire,
            "session_id": session_id,
            "token_type": "access",
            # Add fingerprint for security
            "fp": hashlib.sha256(f"{user_id}:{username}:{now}".encode()).hexdigest()[
                :16
            ],
        }

        # Add extra claims if provided
        if extra_claims:
            claims.update(extra_claims)

        # Create JWT token
        token = jwt.encode(claims, self.jwt_secret, algorithm=self.jwt_algorithm)

        # Store session information
        active_sessions[session_id] = {
            "user_id": user_id,
            "username": username,
            "created_at": now,
            "last_activity": now,
            "expires_at": expire,
            "token_hash": hashlib.sha256(token.encode()).hexdigest(),
        }

        logger.info(
            f"Access token created for user {username} (session: {session_id[:8]}...)"
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": self.token_expire_minutes * 60,
            "session_id": session_id,
            "expires_at": expire.isoformat(),
        }

    def validate_token(self, token: str) -> Dict[str, Any]:
        """Validate JWT token with enhanced security checks."""
        try:
            # Decode token
            payload = jwt.decode(
                token, self.jwt_secret, algorithms=[self.jwt_algorithm]
            )

            # Extract session information
            session_id = payload.get("session_id")
            if not session_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token format",
                )

            # Check if session exists and is valid
            session = active_sessions.get(session_id)
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session expired or invalid",
                )

            # Check session expiration
            now = datetime.utcnow()
            if now > session["expires_at"]:
                # Clean up expired session
                self._cleanup_session(session_id)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired"
                )

            # Check maximum session duration
            if now > session["created_at"] + MAX_SESSION_DURATION:
                self._cleanup_session(session_id)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Maximum session duration exceeded",
                )

            # Update last activity
            session["last_activity"] = now

            # Token fingerprint validation
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            if token_hash != session["token_hash"]:
                logger.warning(
                    f"Token fingerprint mismatch for session {session_id[:8]}..."
                )
                self._cleanup_session(session_id)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token validation failed",
                )

            # Return validated payload with session info
            payload["session_info"] = session
            return payload

        except JWTError as e:
            logger.warning(f"JWT validation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )

    def refresh_token_if_needed(self, token: str) -> Optional[Dict[str, Any]]:
        """Refresh token if it's expiring soon."""
        try:
            payload = self.validate_token(token)
            session_info = payload.get("session_info", {})

            # Check if token needs refresh
            now = datetime.utcnow()
            expires_at = session_info.get("expires_at")

            if expires_at and (expires_at - now) < SESSION_REFRESH_THRESHOLD:
                # Create new token
                user_id = payload.get("sub")
                username = payload.get("username")

                if user_id and username:
                    # Cleanup old session
                    old_session_id = payload.get("session_id")
                    if old_session_id:
                        self._cleanup_session(old_session_id)

                    # Create new token
                    return self.create_access_token(user_id, username)

            return None

        except HTTPException:
            return None

    def revoke_session(self, session_id: str) -> bool:
        """Revoke a specific session."""
        if session_id in active_sessions:
            del active_sessions[session_id]
            logger.info(f"Session revoked: {session_id[:8]}...")
            return True
        return False

    def revoke_user_sessions(self, user_id: str) -> int:
        """Revoke all sessions for a specific user."""
        revoked = 0
        sessions_to_remove = []

        for session_id, session in active_sessions.items():
            if session["user_id"] == user_id:
                sessions_to_remove.append(session_id)

        for session_id in sessions_to_remove:
            del active_sessions[session_id]
            revoked += 1

        logger.info(f"Revoked {revoked} sessions for user {user_id}")
        return revoked

    def check_rate_limiting(
        self, identifier: str, max_attempts: int = MAX_FAILED_ATTEMPTS
    ) -> bool:
        """Check if identifier is rate limited."""
        now = datetime.utcnow()

        if identifier in failed_attempts:
            attempt_info = failed_attempts[identifier]

            # Clean up old attempts
            if now > attempt_info["lockout_until"]:
                del failed_attempts[identifier]
                return True

            # Check if still locked out
            if attempt_info["count"] >= max_attempts:
                return False

        return True

    def record_failed_attempt(self, identifier: str):
        """Record a failed authentication attempt."""
        now = datetime.utcnow()

        if identifier not in failed_attempts:
            failed_attempts[identifier] = {"count": 0, "first_attempt": now}

        failed_attempts[identifier]["count"] += 1
        failed_attempts[identifier]["last_attempt"] = now
        failed_attempts[identifier]["lockout_until"] = now + LOCKOUT_DURATION

        logger.warning(
            f"Failed attempt recorded for {identifier}. Count: {failed_attempts[identifier]['count']}"
        )

    def clear_failed_attempts(self, identifier: str):
        """Clear failed attempts for identifier."""
        if identifier in failed_attempts:
            del failed_attempts[identifier]

    def get_security_headers(self) -> Dict[str, str]:
        """Get security headers to add to responses."""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        }

    def cleanup_expired_sessions(self):
        """Clean up expired sessions - should be called periodically."""
        now = datetime.utcnow()
        expired_sessions = []

        for session_id, session in active_sessions.items():
            if (
                now > session["expires_at"]
                or now > session["created_at"] + MAX_SESSION_DURATION
            ):
                expired_sessions.append(session_id)

        for session_id in expired_sessions:
            self._cleanup_session(session_id)

        if expired_sessions:
            logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")

    def _cleanup_session(self, session_id: str):
        """Internal method to clean up a session."""
        if session_id in active_sessions:
            del active_sessions[session_id]

    def get_session_stats(self) -> Dict[str, Any]:
        """Get statistics about active sessions."""
        now = datetime.utcnow()

        return {
            "active_sessions": len(active_sessions),
            "failed_attempts": len(failed_attempts),
            "cleanup_timestamp": now.isoformat(),
        }


# Global security manager instance
security_manager = EnhancedSecurityManager()


class EnhancedHTTPBearer(HTTPBearer):
    """Enhanced HTTP Bearer authentication with additional security checks."""

    async def __call__(self, request) -> Dict[str, Any]:
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)

        if credentials.scheme != "Bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
            )

        # Validate token and return payload
        payload = security_manager.validate_token(credentials.credentials)
        return payload


# Create authentication dependency
authenticate = EnhancedHTTPBearer()
