"""
Tests for error handling and logging system
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.exceptions import (
    LFAException,
    AuthenticationError,
    ValidationError,
    NotFoundError,
)

client = TestClient(app)


def test_custom_exceptions():
    """Test custom exception classes"""

    # Test base LFAException
    exc = LFAException("Test error", status_code=400, error_code="TEST_ERROR")
    assert exc.message == "Test error"
    assert exc.status_code == 400
    assert exc.error_code == "TEST_ERROR"

    # Test AuthenticationError
    auth_exc = AuthenticationError("Auth failed")
    assert auth_exc.status_code == 401
    assert auth_exc.error_code == "AUTH_ERROR"

    # Test ValidationError
    val_exc = ValidationError("Invalid input", field="username")
    assert val_exc.status_code == 422
    assert val_exc.error_code == "VALIDATION_ERROR"
    assert val_exc.details["field"] == "username"

    # Test NotFoundError
    not_found_exc = NotFoundError("User not found", resource="user")
    assert not_found_exc.status_code == 404
    assert not_found_exc.error_code == "NOT_FOUND"
    assert not_found_exc.details["resource"] == "user"


def test_health_endpoint():
    """Test health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    # Check standardized response format
    assert "success" in data
    assert "data" in data
    assert "timestamp" in data
    # Check health data structure
    health_data = data["data"]
    assert "status" in health_data
    assert "version" in health_data


def test_api_health_endpoint():
    """Test API health endpoint - /api/health should return 200 (fixed)"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "healthy" in data["data"]["status"] or "degraded" in data["data"]["status"]


def test_frontend_error_logging():
    """Test frontend error logging endpoint"""
    error_data = {
        "errorId": "TEST_ERROR_123",
        "type": "runtime",
        "message": "Test frontend error",
        "timestamp": "2025-01-01T00:00:00Z",
        "url": "http://localhost:3000/test",
        "userId": "test_user",
    }

    response = client.post("/api/frontend-errors", json=error_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["errorId"] == "TEST_ERROR_123"


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    # Updated message format
    assert "LFA Legacy GO" in data["message"]
    assert data["message"] == "LFA Legacy GO API is operational"
    # Updated for current version and standardized format
    assert "data" in data
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_error_response_format():
    """Test that error responses follow the correct format"""
    # This would test actual error scenarios, but for now we'll test the structure
    # In a real scenario, we'd trigger an actual error and check the response format

    # Test 404 endpoint
    response = client.get("/nonexistent-endpoint")
    assert response.status_code == 404

    # The response should be handled by our global exception handler
    # but FastAPI's built-in 404 handling might take precedence
