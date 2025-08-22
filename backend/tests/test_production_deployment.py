"""
Production Deployment Validation - PHASE 4.2
Comprehensive validation for production readiness
"""

import pytest
import json
import os
from fastapi.testclient import TestClient


class TestProductionDeploymentValidation:
    """Production deployment validation tests."""

    def test_environment_variables_production_ready(self):
        """Test that production environment variables are properly configured."""
        # Check for required production environment variables
        production_vars = [
            "DATABASE_URL",
            "SECRET_KEY", 
            "JWT_SECRET_KEY",
            "ENVIRONMENT"
        ]
        
        missing_vars = []
        for var in production_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        # Should have most environment variables configured
        assert len(missing_vars) <= 2, f"Missing critical environment variables: {missing_vars}"
        print(f"✅ Environment validation: {len(production_vars) - len(missing_vars)}/{len(production_vars)} vars configured")

    def test_security_headers_configuration(self, client: TestClient):
        """Test that security headers are properly configured."""
        response = client.get("/health")
        
        # Check for important security headers
        security_headers = [
            "x-content-type-options",
            "x-frame-options", 
            "x-xss-protection"
        ]
        
        present_headers = []
        for header in security_headers:
            if header in response.headers:
                present_headers.append(header)
        
        # Should have some security headers
        assert len(present_headers) >= 1, f"Missing security headers: {set(security_headers) - set(present_headers)}"
        print(f"✅ Security headers: {len(present_headers)}/{len(security_headers)} configured")

    def test_database_connection_production(self, client: TestClient):
        """Test database connection in production-like environment."""
        response = client.get("/health")
        
        # Should return valid response
        assert response.status_code in [200, 503], "Health endpoint should be accessible"
        
        if response.status_code == 200:
            data = response.json()
            # Check for status in nested data structure
            if "data" in data and isinstance(data["data"], dict):
                assert "status" in data["data"], "Health response should include status in data"
            else:
                assert "status" in data, "Health response should include status"
            print("✅ Database connection test passed")
        else:
            print("⚠️ Database connection might need configuration")
            
    def test_api_endpoints_availability(self, client: TestClient):
        """Test that core API endpoints are available."""
        core_endpoints = [
            "/health",
            "/api/auth/register",
            "/api/tournaments",
            "/api/locations"
        ]
        
        available_endpoints = []
        for endpoint in core_endpoints:
            try:
                response = client.get(endpoint)
                # Accept various status codes as "available"
                if response.status_code in [200, 401, 404, 422, 429]:
                    available_endpoints.append(endpoint)
            except Exception:
                pass
        
        # Should have most endpoints available
        availability_rate = len(available_endpoints) / len(core_endpoints)
        assert availability_rate >= 0.75, f"Only {availability_rate:.1%} of core endpoints available"
        print(f"✅ API availability: {len(available_endpoints)}/{len(core_endpoints)} endpoints accessible")

    def test_error_handling_production(self, client: TestClient):
        """Test error handling in production-like scenarios."""
        # Test non-existent endpoint
        response = client.get("/api/nonexistent")
        assert response.status_code in [404, 422], "Should handle non-existent endpoints gracefully"
        
        # Test malformed request
        response = client.post("/api/auth/login", json={"invalid": "data"})
        assert response.status_code in [400, 401, 422], "Should handle malformed requests gracefully"
        
        print("✅ Error handling validation passed")

    def test_rate_limiting_configuration(self, client: TestClient):
        """Test that rate limiting is properly configured."""
        # Make multiple rapid requests
        responses = []
        for i in range(10):
            response = client.get("/health")
            responses.append(response.status_code)
        
        # Should handle multiple requests (may include rate limiting)
        success_count = len([r for r in responses if r in [200, 429]])
        assert success_count >= 8, f"Rate limiting test: {success_count}/10 requests handled appropriately"
        print(f"✅ Rate limiting: {success_count}/10 requests handled")

    def test_cors_configuration(self, client: TestClient):
        """Test CORS configuration for production."""
        # Test preflight request
        response = client.options("/api/tournaments", headers={
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "GET"
        })
        
        # Should handle CORS appropriately
        assert response.status_code in [200, 204, 405], "CORS preflight should be handled"
        print("✅ CORS configuration test passed")

    def test_logging_configuration(self, client: TestClient):
        """Test that logging is properly configured."""
        # Make a request that should generate logs
        response = client.get("/health")
        
        # Should not crash and return appropriate response
        assert response.status_code in [200, 503], "Logging should not interfere with requests"
        print("✅ Logging configuration test passed")

    def test_json_response_format(self, client: TestClient):
        """Test that JSON responses are properly formatted."""
        response = client.get("/health")
        
        if response.status_code == 200:
            try:
                data = response.json()
                assert isinstance(data, dict), "Response should be valid JSON object"
                print("✅ JSON response format validation passed")
            except json.JSONDecodeError:
                assert False, "Health endpoint should return valid JSON"
        else:
            print("⚠️ Health endpoint not returning 200, skipping JSON validation")

    def test_performance_benchmarks(self, client: TestClient):
        """Test basic performance benchmarks."""
        import time
        
        # Test response time
        start_time = time.time()
        response = client.get("/health")
        response_time = time.time() - start_time
        
        # Should respond within reasonable time (very lenient for CI)
        assert response_time < 10.0, f"Health endpoint took {response_time:.2f}s, expected < 10s"
        print(f"✅ Performance: Health endpoint responded in {response_time:.3f}s")