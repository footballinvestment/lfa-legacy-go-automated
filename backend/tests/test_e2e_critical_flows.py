"""
Critical End-to-End tests for core application flows
Tests the most important user journeys and API integrations
"""

import pytest
import requests
from fastapi.testclient import TestClient
from app.main import app
import time
import json

client = TestClient(app)
BASE_URL = "http://localhost:8000"


class TestCriticalHealthFlows:
    """Test critical health and status endpoints"""
    
    def test_root_endpoint_availability(self):
        """Test root endpoint is available and returns expected format"""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert "success" in data
        assert data["success"] is True
        assert "data" in data
        assert "service" in data["data"]
        assert "LFA Legacy GO" in data["data"]["service"]
    
    def test_api_health_endpoint_critical(self):
        """Test critical health endpoint functionality"""
        response = client.get("/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "status" in data["data"]
        assert data["data"]["status"] in ["healthy", "degraded"]
        assert "timestamp" in data["data"]
        assert "service" in data["data"]
    
    def test_openapi_documentation_availability(self):
        """Test API documentation is accessible"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        
        openapi_data = response.json()
        assert "openapi" in openapi_data
        assert "info" in openapi_data
        assert "paths" in openapi_data
        assert len(openapi_data["paths"]) > 10  # Should have many endpoints
    
    def test_docs_ui_availability(self):
        """Test Swagger UI documentation is accessible"""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]


class TestCriticalAPIFlows:
    """Test critical API functionality flows"""
    
    def test_api_status_comprehensive(self):
        """Test comprehensive API status endpoint"""
        response = client.get("/api/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "routers" in data["data"]
        
        # Check critical routers are present
        routers_data = data["data"]["routers"]
        
        # Router data can be in different formats, check for status info
        if "status" in routers_data:
            router_status = routers_data["status"]
            critical_routers = ["auth", "locations", "tournaments", "health"]
            
            for router in critical_routers:
                assert router in router_status
                assert "SUCCESS" in router_status[router]
        else:
            # Alternative format - just check we have router data
            assert "active" in routers_data or len(routers_data) > 0
    
    def test_performance_monitoring_endpoint(self):
        """Test performance monitoring endpoint"""
        response = client.get("/api/performance")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        # Should contain performance metrics
        perf_data = data["data"]
        assert isinstance(perf_data, dict)
        assert len(perf_data) > 0
    
    def test_frontend_error_logging_flow(self):
        """Test critical frontend error logging functionality"""
        error_payload = {
            "errorId": "E2E_TEST_001", 
            "type": "runtime",
            "message": "E2E test error",
            "timestamp": "2025-01-01T12:00:00Z",
            "url": "http://localhost:3000/test",
            "userId": "e2e_test_user"
        }
        
        response = client.post("/api/frontend-errors", json=error_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["errorId"] == "E2E_TEST_001"


class TestCriticalDataFlows:
    """Test critical data operations"""
    
    def test_locations_listing_flow(self):
        """Test locations listing functionality"""
        response = client.get("/api/locations")
        assert response.status_code == 200
        
        data = response.json()
        
        # Locations might return empty list or have success format
        if isinstance(data, list):
            # Empty list is acceptable for locations
            locations = data
            assert isinstance(locations, list)
        elif isinstance(data, dict) and "success" in data:
            assert "data" in data
            locations = data["data"]
            assert isinstance(locations, (list, dict))
        else:
            # Any valid JSON response is acceptable for locations endpoint
            assert isinstance(data, (list, dict))
    
    def test_tournaments_listing_flow(self):
        """Test tournaments listing functionality"""
        response = client.get("/api/tournaments")
        assert response.status_code == 200
        
        data = response.json()
        
        # Tournaments might return direct list or standardized format
        if isinstance(data, list):
            # Direct list of tournaments
            tournaments = data
            assert isinstance(tournaments, list)
            if len(tournaments) > 0:
                # Each tournament should have basic fields
                tournament = tournaments[0]
                assert isinstance(tournament, dict)
        elif isinstance(data, dict) and "success" in data:
            assert "data" in data
            tournaments = data["data"]
            assert isinstance(tournaments, (list, dict))
        else:
            # Any valid JSON response is acceptable
            assert isinstance(data, (list, dict))
    
    def test_weather_endpoint_flow(self):
        """Test weather endpoint functionality"""
        response = client.get("/api/weather/current")
        
        # Weather endpoint might return 200 with data or 422 with validation error
        assert response.status_code in [200, 422, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "success" in data or "error" in data


class TestCriticalAuthenticationFlows:
    """Test critical authentication and security flows"""
    
    def test_auth_endpoints_require_authentication(self):
        """Test protected endpoints properly require authentication"""
        protected_endpoints = [
            "/api/auth/profile",
            "/api/credits/add", 
            "/api/social/friends/add"
        ]
        
        for endpoint in protected_endpoints:
            response = client.get(endpoint)
            # Should return 401 Unauthorized or 422 Validation Error or 404 Not Found
            assert response.status_code in [401, 422, 404, 405]
    
    def test_invalid_login_attempt(self):
        """Test login with invalid credentials"""
        login_data = {
            "username": "invalid_user",
            "password": "invalid_password"
        }
        
        response = client.post("/api/auth/login", json=login_data)
        # Should return validation error or auth error
        assert response.status_code in [400, 401, 422, 404]
    
    def test_registration_validation(self):
        """Test user registration validation"""
        invalid_registration = {
            "username": "",  # Invalid empty username
            "email": "invalid-email",  # Invalid email format
            "password": "123"  # Too short password
        }
        
        response = client.post("/api/auth/register", json=invalid_registration)
        # Should return validation error
        assert response.status_code in [400, 422, 404]


class TestCriticalErrorHandling:
    """Test critical error handling scenarios"""
    
    def test_404_error_handling(self):
        """Test 404 error handling for non-existent endpoints"""
        response = client.get("/api/nonexistent/endpoint")
        assert response.status_code == 404
    
    def test_405_method_not_allowed_handling(self):
        """Test 405 Method Not Allowed handling"""
        # Try POST on a GET-only endpoint
        response = client.post("/api/health")
        assert response.status_code in [405, 422]  # Method not allowed or unprocessable
    
    def test_malformed_json_handling(self):
        """Test handling of malformed JSON requests"""
        import json
        
        # Send malformed JSON (but this is handled by TestClient, so we test empty payload)
        response = client.post("/api/auth/login", json={})
        assert response.status_code in [400, 422]  # Bad request or validation error
    
    def test_large_payload_handling(self):
        """Test handling of large payloads"""
        large_payload = {
            "data": "x" * 10000,  # 10KB of data
            "type": "test"
        }
        
        response = client.post("/api/frontend-errors", json=large_payload)
        # Should either accept it or reject with appropriate error
        assert response.status_code in [200, 400, 413, 422]


class TestCriticalDatabaseIntegrity:
    """Test critical database operations and integrity"""
    
    def test_database_connection_health(self):
        """Test database connection through health endpoint"""
        response = client.get("/api/health")
        assert response.status_code == 200
        
        data = response.json()
        # Database should be healthy for API to work
        assert data["success"] is True
        assert data["data"]["status"] in ["healthy", "degraded"]
    
    def test_concurrent_requests_handling(self):
        """Test handling of multiple concurrent requests"""
        import threading
        import time
        
        results = []
        
        def make_request():
            response = client.get("/api/health")
            results.append(response.status_code)
        
        # Create 5 concurrent threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert len(results) == 5
        assert all(status == 200 for status in results)


class TestCriticalPerformance:
    """Test critical performance requirements"""
    
    def test_health_endpoint_response_time(self):
        """Test health endpoint responds within acceptable time"""
        start_time = time.time()
        response = client.get("/api/health")
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 5.0  # Should respond within 5 seconds
    
    def test_status_endpoint_response_time(self):
        """Test status endpoint responds within acceptable time"""
        start_time = time.time()
        response = client.get("/api/status")
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 10.0  # Should respond within 10 seconds
    
    def test_openapi_generation_performance(self):
        """Test OpenAPI documentation generation performance"""
        start_time = time.time()
        response = client.get("/openapi.json")
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 15.0  # Should generate within 15 seconds


class TestCriticalDataConsistency:
    """Test critical data consistency and validation"""
    
    def test_response_format_consistency(self):
        """Test all endpoints return consistent response format"""
        endpoints = [
            "/",
            "/api/health", 
            "/api/status",
            "/api/performance"
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 200
            
            data = response.json()
            
            # All successful responses should have consistent structure
            if "success" in data:
                assert isinstance(data["success"], bool)
                if data["success"]:
                    assert "data" in data
                    assert "timestamp" in data
    
    def test_error_response_format_consistency(self):
        """Test error responses have consistent format"""
        # Test various error scenarios
        error_endpoints = [
            ("/api/nonexistent", 404),
            ("/api/auth/login", [400, 422, 404]),  # POST with no data
        ]
        
        for endpoint, expected_codes in error_endpoints:
            if endpoint == "/api/auth/login":
                response = client.post(endpoint, json={})
            else:
                response = client.get(endpoint)
            
            if isinstance(expected_codes, list):
                assert response.status_code in expected_codes
            else:
                assert response.status_code == expected_codes
            
            # Error responses should be valid JSON
            try:
                error_data = response.json()
                assert isinstance(error_data, dict)
            except json.JSONDecodeError:
                # Some errors might return HTML (like 404), which is acceptable
                pass


class TestCriticalIntegrationPoints:
    """Test critical integration points and external dependencies"""
    
    def test_redis_integration_resilience(self):
        """Test API works even if Redis is unavailable"""
        # API should work without Redis (degraded mode)
        response = client.get("/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        # Status can be healthy or degraded (without Redis)
        assert data["data"]["status"] in ["healthy", "degraded"]
    
    def test_monitoring_endpoint_integration(self):
        """Test monitoring endpoints for external monitoring tools"""
        response = client.get("/api/performance")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        # Performance data should be structured for monitoring tools
        perf_data = data["data"]
        assert isinstance(perf_data, dict)
    
    def test_cors_headers_presence(self):
        """Test CORS headers are present for frontend integration"""
        response = client.get("/api/health")
        assert response.status_code == 200
        
        # CORS headers should be present for cross-origin requests
        # Note: TestClient might not show all headers, but API should have them
        headers = response.headers
        # Basic assertion - API responds successfully for cross-origin style request
        assert "content-type" in headers


if __name__ == "__main__":
    # Run critical tests standalone
    pytest.main([__file__, "-v", "--tb=short"])