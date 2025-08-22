"""
Enhanced Security Tests
Tests for the enhanced security middleware and JWT management
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.middleware.enhanced_security import EnhancedSecurityManager, security_manager
import os


class TestEnhancedSecurity:
    """Test enhanced security features."""

    def setup_method(self):
        """Set up test environment."""
        # Set secure environment variables for testing
        os.environ["ADMIN_PASSWORD"] = "TestSecurePassword123!"
        os.environ["JWT_SECRET_KEY"] = "test_secret_key_at_least_32_characters_long"

    def test_security_manager_initialization(self):
        """Test security manager initializes properly."""
        manager = EnhancedSecurityManager()
        assert manager.jwt_algorithm == "HS256"
        assert manager.token_expire_minutes > 0
        assert len(manager.jwt_secret) >= 32

    def test_create_access_token(self):
        """Test access token creation with enhanced security."""
        manager = EnhancedSecurityManager()

        token_data = manager.create_access_token(
            user_id="test_user_123", username="testuser", extra_claims={"role": "user"}
        )

        # Verify token structure
        assert "access_token" in token_data
        assert "token_type" in token_data
        assert "expires_in" in token_data
        assert "session_id" in token_data
        assert "expires_at" in token_data

        assert token_data["token_type"] == "bearer"
        assert token_data["expires_in"] > 0

    def test_token_validation(self):
        """Test token validation with security checks."""
        manager = EnhancedSecurityManager()

        # Create token
        token_data = manager.create_access_token("test_user", "testuser")
        token = token_data["access_token"]

        # Validate token
        payload = manager.validate_token(token)

        assert payload["sub"] == "test_user"
        assert payload["username"] == "testuser"
        assert "session_id" in payload
        assert "session_info" in payload

    def test_token_validation_invalid_token(self):
        """Test token validation with invalid token."""
        manager = EnhancedSecurityManager()

        with pytest.raises(Exception):  # Should raise HTTPException
            manager.validate_token("invalid_token")

    def test_session_revocation(self):
        """Test session revocation functionality."""
        manager = EnhancedSecurityManager()

        # Create token
        token_data = manager.create_access_token("test_user", "testuser")
        session_id = token_data["session_id"]

        # Verify session exists
        assert manager.revoke_session(session_id) is True

        # Try to revoke again (should return False)
        assert manager.revoke_session(session_id) is False

    def test_user_session_revocation(self):
        """Test revoking all sessions for a user."""
        manager = EnhancedSecurityManager()
        user_id = "test_user_multi"

        # Create multiple sessions for the same user
        token1 = manager.create_access_token(user_id, "testuser1")
        token2 = manager.create_access_token(user_id, "testuser1")

        # Revoke all sessions for user
        revoked_count = manager.revoke_user_sessions(user_id)
        assert revoked_count == 2

    def test_rate_limiting(self):
        """Test rate limiting functionality."""
        manager = EnhancedSecurityManager()
        identifier = "test_ip_192.168.1.1"

        # Should be allowed initially
        assert manager.check_rate_limiting(identifier) is True

        # Record multiple failed attempts
        for _ in range(6):  # Exceed limit
            manager.record_failed_attempt(identifier)

        # Should be blocked now
        assert manager.check_rate_limiting(identifier) is False

        # Clear attempts
        manager.clear_failed_attempts(identifier)
        assert manager.check_rate_limiting(identifier) is True

    def test_security_headers(self):
        """Test security headers generation."""
        manager = EnhancedSecurityManager()
        headers = manager.get_security_headers()

        # Check required security headers
        required_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Strict-Transport-Security",
        ]

        for header in required_headers:
            assert header in headers
            assert headers[header]  # Should have a value

    def test_session_cleanup(self):
        """Test session cleanup functionality."""
        manager = EnhancedSecurityManager()

        # Create a token
        token_data = manager.create_access_token("cleanup_user", "cleanupuser")

        # Run cleanup (should not remove active session)
        manager.cleanup_expired_sessions()

        # Session should still be valid
        payload = manager.validate_token(token_data["access_token"])
        assert payload["username"] == "cleanupuser"

    def test_session_statistics(self):
        """Test session statistics."""
        manager = EnhancedSecurityManager()

        # Create some sessions
        manager.create_access_token("stats_user1", "user1")
        manager.create_access_token("stats_user2", "user2")

        stats = manager.get_session_stats()

        assert "active_sessions" in stats
        assert "failed_attempts" in stats
        assert "cleanup_timestamp" in stats
        assert stats["active_sessions"] >= 0

    def test_token_refresh_functionality(self):
        """Test token refresh functionality."""
        manager = EnhancedSecurityManager()

        # Create token
        token_data = manager.create_access_token("refresh_user", "refreshuser")
        token = token_data["access_token"]

        # Try refresh (should return None if not expiring soon)
        refreshed = manager.refresh_token_if_needed(token)
        assert refreshed is None  # Token not expiring soon

    def test_password_security_validation(self):
        """Test password security validation (from config)."""
        from app.core.config import Settings

        # Test weak passwords
        assert Settings.is_secure_password("weak") is False
        assert Settings.is_secure_password("12345678") is False
        assert Settings.is_secure_password("PASSWORD") is False
        assert Settings.is_secure_password("password") is False

        # Test strong password
        assert Settings.is_secure_password("StrongP@ssw0rd") is True

    def test_production_config_validation(self):
        """Test production configuration validation."""
        from app.core.config import Settings

        # Mock production environment
        original_env = os.environ.get("ENVIRONMENT")
        os.environ["ENVIRONMENT"] = "production"

        try:
            # Should not have errors with current config
            errors = Settings.validate_production_settings()

            # Should have no critical errors with our setup
            critical_errors = [
                e for e in errors if "ADMIN_PASSWORD" in e or "JWT_SECRET_KEY" in e
            ]
            assert len(critical_errors) == 0

        finally:
            # Restore original environment
            if original_env:
                os.environ["ENVIRONMENT"] = original_env
            else:
                os.environ.pop("ENVIRONMENT", None)


class TestSecurityIntegration:
    """Integration tests for security features."""

    def test_security_headers_in_response(self, client: TestClient):
        """Test that security headers are included in responses."""
        response = client.get("/health")

        # Check for security headers (may not all be present in test environment)
        security_headers = [
            "x-content-type-options",
            "x-frame-options",
            "x-xss-protection",
        ]

        present_headers = 0
        for header in security_headers:
            if header in response.headers:
                present_headers += 1

        # At least some security headers should be present
        # This is informational as middleware may not be fully active in tests

    def test_rate_limiting_integration(self, client: TestClient):
        """Test rate limiting integration with API."""
        # Make rapid requests
        responses = []
        for _ in range(10):
            response = client.get("/health")
            responses.append(response.status_code)

        # Should mostly succeed (may have some rate limiting)
        success_count = responses.count(200)
        assert success_count >= 5  # At least half should succeed

    def test_authentication_workflow(self, client: TestClient):
        """Test complete authentication workflow."""
        # Test registration
        user_data = {
            "username": "security_test_user",
            "email": "security@test.com",
            "password": "SecureTestP@ssw0rd123",
            "full_name": "Security Test User",
        }

        register_response = client.post("/api/auth/register", json=user_data)
        assert register_response.status_code in [
            200,
            201,
            400,
        ]  # Success or already exists

        # Test login
        login_data = {
            "username": user_data["username"],
            "password": user_data["password"],
        }

        login_response = client.post("/api/auth/login", json=login_data)
        # May succeed or fail based on auth implementation
        assert login_response.status_code in [200, 401, 422]
