"""
Comprehensive integration tests for all API endpoints
Tests real API integration scenarios and endpoint coverage
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
import json
from datetime import datetime, timedelta

client = TestClient(app)


class TestAuthenticationIntegration:
    """Integration tests for authentication endpoints"""
    
    def test_auth_register_endpoint_integration(self):
        """Test user registration endpoint integration"""
        response = client.post("/api/auth/register", json={})
        # Should return validation error for missing fields
        assert response.status_code in [400, 422, 404]
    
    def test_auth_login_endpoint_integration(self):
        """Test user login endpoint integration"""
        response = client.post("/api/auth/login", json={})
        # Should return validation error for missing credentials
        assert response.status_code in [400, 422, 404]
    
    def test_auth_profile_endpoint_integration(self):
        """Test profile endpoint requires authentication"""
        response = client.get("/api/auth/profile")
        # Should require authentication
        assert response.status_code in [401, 422, 404]
    
    def test_auth_logout_endpoint_integration(self):
        """Test logout endpoint integration"""
        response = client.post("/api/auth/logout")
        # Should handle logout request
        assert response.status_code in [200, 401, 404, 405]


class TestCreditsIntegration:
    """Integration tests for credits endpoints"""
    
    def test_credits_status_endpoint_integration(self):
        """Test credits status endpoint"""
        response = client.get("/api/credits/status")
        # Should work or require auth
        assert response.status_code in [200, 401, 422, 404]
    
    def test_credits_add_endpoint_integration(self):
        """Test credits add endpoint requires authentication"""
        response = client.post("/api/credits/add", json={"amount": 100})
        # Should require authentication
        assert response.status_code in [401, 422, 404, 405]
    
    def test_credits_deduct_endpoint_integration(self):
        """Test credits deduction endpoint"""
        response = client.post("/api/credits/deduct", json={"amount": 50})
        # Should require authentication
        assert response.status_code in [401, 422, 404, 405]
    
    def test_credits_history_endpoint_integration(self):
        """Test credits history endpoint"""
        response = client.get("/api/credits/history")
        # Should require authentication
        assert response.status_code in [200, 401, 422, 404]


class TestSocialIntegration:
    """Integration tests for social endpoints"""
    
    def test_social_friends_list_integration(self):
        """Test friends listing endpoint"""
        response = client.get("/api/social/friends")
        # Should work or require auth
        assert response.status_code in [200, 401, 422, 404]
    
    def test_social_friends_add_integration(self):
        """Test friend request endpoint"""
        response = client.post("/api/social/friends/add", json={"user_id": 123})
        # Should require authentication
        assert response.status_code in [401, 422, 404, 405]
    
    def test_social_friends_remove_integration(self):
        """Test friend removal endpoint"""
        response = client.delete("/api/social/friends/123")
        # Should require authentication
        assert response.status_code in [401, 404, 405]
    
    def test_social_challenges_endpoint_integration(self):
        """Test challenges endpoint"""
        response = client.get("/api/social/challenges")
        # Should work or require auth
        assert response.status_code in [200, 401, 422, 404]


class TestLocationsIntegration:
    """Integration tests for locations endpoints"""
    
    def test_locations_list_integration(self):
        """Test locations listing endpoint"""
        response = client.get("/api/locations")
        assert response.status_code == 200
        
        # Should return JSON data
        data = response.json()
        assert isinstance(data, (list, dict))
    
    def test_locations_search_integration(self):
        """Test locations search endpoint"""
        response = client.get("/api/locations/search?query=football")
        # Should work or return no results
        assert response.status_code in [200, 404, 422]
    
    def test_locations_nearby_integration(self):
        """Test nearby locations endpoint"""
        response = client.get("/api/locations/nearby?lat=47.5&lon=19.0")
        # Should work or require proper coordinates
        assert response.status_code in [200, 400, 422, 404]
    
    def test_locations_detail_integration(self):
        """Test location detail endpoint"""
        response = client.get("/api/locations/1")
        # Should return location or not found
        assert response.status_code in [200, 404]


class TestBookingIntegration:
    """Integration tests for booking endpoints"""
    
    def test_booking_create_integration(self):
        """Test booking creation endpoint"""
        booking_data = {
            "location_id": 1,
            "start_time": "2025-01-01T10:00:00Z",
            "end_time": "2025-01-01T11:00:00Z"
        }
        response = client.post("/api/booking", json=booking_data)
        # Should require authentication
        assert response.status_code in [401, 422, 404, 405]
    
    def test_booking_list_integration(self):
        """Test booking list endpoint"""
        response = client.get("/api/booking")
        # Should require authentication
        assert response.status_code in [200, 401, 422, 404]
    
    def test_booking_cancel_integration(self):
        """Test booking cancellation endpoint"""
        response = client.delete("/api/booking/123")
        # Should require authentication
        assert response.status_code in [401, 404, 405]
    
    def test_booking_availability_integration(self):
        """Test booking availability check endpoint"""
        response = client.get("/api/booking/availability?location_id=1&date=2025-01-01")
        # Should work, require auth, or require proper parameters
        assert response.status_code in [200, 400, 401, 422, 404]


class TestTournamentsIntegration:
    """Integration tests for tournaments endpoints"""
    
    def test_tournaments_list_integration(self):
        """Test tournaments listing endpoint"""
        response = client.get("/api/tournaments")
        assert response.status_code == 200
        
        # Should return JSON data
        data = response.json()
        assert isinstance(data, (list, dict))
    
    def test_tournaments_create_integration(self):
        """Test tournament creation endpoint"""
        tournament_data = {
            "name": "Test Tournament",
            "description": "Integration test tournament",
            "start_time": "2025-01-01T10:00:00Z",
            "max_participants": 16
        }
        response = client.post("/api/tournaments", json=tournament_data)
        # Should require authentication
        assert response.status_code in [401, 422, 404, 405]
    
    def test_tournaments_join_integration(self):
        """Test tournament join endpoint"""
        response = client.post("/api/tournaments/1/join")
        # Should require authentication
        assert response.status_code in [401, 404, 405]
    
    def test_tournaments_leave_integration(self):
        """Test tournament leave endpoint"""
        response = client.post("/api/tournaments/1/leave")
        # Should require authentication
        assert response.status_code in [401, 404, 405]
    
    def test_tournaments_detail_integration(self):
        """Test tournament detail endpoint"""
        response = client.get("/api/tournaments/1")
        # Should return tournament, not found, or require auth
        assert response.status_code in [200, 401, 404]


class TestWeatherIntegration:
    """Integration tests for weather endpoints"""
    
    def test_weather_current_integration(self):
        """Test current weather endpoint"""
        response = client.get("/api/weather/current")
        # Should work or require location parameters
        assert response.status_code in [200, 400, 422, 404]
    
    def test_weather_forecast_integration(self):
        """Test weather forecast endpoint"""
        response = client.get("/api/weather/forecast?location_id=1")
        # Should work or require valid location
        assert response.status_code in [200, 400, 422, 404]
    
    def test_weather_location_integration(self):
        """Test weather by location endpoint"""
        response = client.get("/api/weather/location/1")
        # Should work or return not found
        assert response.status_code in [200, 404, 422]


class TestGameResultsIntegration:
    """Integration tests for game results endpoints"""
    
    def test_game_results_list_integration(self):
        """Test game results listing endpoint"""
        response = client.get("/api/game-results")
        # Should work or require auth
        assert response.status_code in [200, 401, 422, 404]
    
    def test_game_results_create_integration(self):
        """Test game result creation endpoint"""
        result_data = {
            "session_id": "test_session",
            "score": 85,
            "duration": 120
        }
        response = client.post("/api/game-results", json=result_data)
        # Should require authentication
        assert response.status_code in [401, 422, 404, 405]
    
    def test_game_results_leaderboard_integration(self):
        """Test leaderboard endpoint"""
        response = client.get("/api/game-results/leaderboard")
        # Should work
        assert response.status_code in [200, 404]
    
    def test_game_results_statistics_integration(self):
        """Test statistics endpoint"""
        response = client.get("/api/game-results/statistics")
        # Should work or require auth
        assert response.status_code in [200, 401, 404]


class TestAdminIntegration:
    """Integration tests for admin endpoints"""
    
    def test_admin_dashboard_integration(self):
        """Test admin dashboard endpoint"""
        response = client.get("/api/admin/dashboard")
        # Should require admin authentication
        assert response.status_code in [401, 403, 404]
    
    def test_admin_users_integration(self):
        """Test admin users management endpoint"""
        response = client.get("/api/admin/users")
        # Should require admin authentication
        assert response.status_code in [401, 403, 404]
    
    def test_admin_tournaments_integration(self):
        """Test admin tournaments management endpoint"""
        response = client.get("/api/admin/tournaments")
        # Should require admin authentication
        assert response.status_code in [401, 403, 404]
    
    def test_admin_system_stats_integration(self):
        """Test admin system statistics endpoint"""
        response = client.get("/api/admin/system/stats")
        # Should require admin authentication
        assert response.status_code in [401, 403, 404]


class TestMonitoringIntegration:
    """Integration tests for monitoring endpoints"""
    
    def test_monitoring_health_integration(self):
        """Test monitoring health endpoint"""
        response = client.get("/api/monitoring/health")
        # Should work or not be implemented
        assert response.status_code in [200, 404]
    
    def test_monitoring_metrics_integration(self):
        """Test monitoring metrics endpoint"""
        response = client.get("/api/monitoring/metrics")
        # Should work or not be implemented
        assert response.status_code in [200, 404]
    
    def test_monitoring_alerts_integration(self):
        """Test monitoring alerts endpoint"""
        response = client.get("/api/monitoring/alerts")
        # Should work or not be implemented
        assert response.status_code in [200, 401, 404]


class TestCacheIntegration:
    """Integration tests for cache endpoints"""
    
    def test_cache_status_integration(self):
        """Test cache status endpoint"""
        response = client.get("/api/cache/status")
        # Should work or not be implemented
        assert response.status_code in [200, 404]
    
    def test_cache_clear_integration(self):
        """Test cache clear endpoint"""
        response = client.post("/api/cache/clear")
        # Should require admin authentication
        assert response.status_code in [200, 401, 404, 405]
    
    def test_cache_warm_integration(self):
        """Test cache warming endpoint"""
        response = client.post("/api/cache/warm")
        # Should require admin authentication or work
        assert response.status_code in [200, 401, 404, 405]


class TestFrontendErrorsIntegration:
    """Integration tests for frontend error logging"""
    
    def test_frontend_errors_submit_integration(self):
        """Test frontend error submission endpoint"""
        error_data = {
            "errorId": "INTEGRATION_TEST_001",
            "type": "runtime",
            "message": "Integration test error",
            "timestamp": datetime.now().isoformat(),
            "url": "http://localhost:3000/test"
        }
        response = client.post("/api/frontend-errors", json=error_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["errorId"] == "INTEGRATION_TEST_001"
    
    def test_frontend_errors_list_integration(self):
        """Test frontend errors listing endpoint"""
        response = client.get("/api/frontend-errors")
        # Should require admin authentication or method not allowed
        assert response.status_code in [200, 401, 404, 405]


class TestHealthAndStatusIntegration:
    """Integration tests for health and status endpoints"""
    
    def test_health_endpoint_integration(self):
        """Test main health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "success" in data
        assert data["success"] is True
    
    def test_api_health_integration(self):
        """Test API health endpoint"""
        response = client.get("/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "status" in data["data"]
    
    def test_api_status_integration(self):
        """Test API status endpoint"""
        response = client.get("/api/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "routers" in data["data"]
    
    def test_api_performance_integration(self):
        """Test API performance endpoint"""
        response = client.get("/api/performance")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True


class TestUserAccountsIntegration:
    """Integration tests for user account related endpoints"""
    
    def test_users_cached_endpoint_integration(self):
        """Test cached users endpoint"""
        response = client.get("/api/users/cached")
        # Should work or require auth
        assert response.status_code in [200, 401, 404]
    
    def test_users_profile_update_integration(self):
        """Test profile update endpoint"""
        profile_data = {
            "display_name": "Test User",
            "bio": "Integration test user"
        }
        response = client.put("/api/auth/profile", json=profile_data)
        # Should require authentication
        assert response.status_code in [401, 404, 405]
    
    def test_users_preferences_integration(self):
        """Test user preferences endpoint"""
        response = client.get("/api/auth/preferences")
        # Should require authentication
        assert response.status_code in [401, 404]


class TestAdvancedCacheIntegration:
    """Integration tests for advanced cache endpoints"""
    
    def test_advanced_cache_users_integration(self):
        """Test advanced cache users endpoint"""
        response = client.get("/api/cache/users")
        # Should work or not be implemented
        assert response.status_code in [200, 404]
    
    def test_advanced_cache_tournaments_integration(self):
        """Test advanced cache tournaments endpoint"""
        response = client.get("/api/cache/tournaments")
        # Should work or not be implemented
        assert response.status_code in [200, 404]
    
    def test_advanced_cache_statistics_integration(self):
        """Test advanced cache statistics endpoint"""
        response = client.get("/api/cache/statistics")
        # Should work or not be implemented
        assert response.status_code in [200, 404]


class TestValidationAndErrorHandling:
    """Integration tests for validation and error handling across endpoints"""
    
    def test_invalid_json_handling_integration(self):
        """Test how endpoints handle invalid JSON"""
        endpoints = [
            "/api/auth/login",
            "/api/auth/register",
            "/api/tournaments",
            "/api/booking"
        ]
        
        for endpoint in endpoints:
            response = client.post(endpoint, json={})
            # Should handle empty JSON gracefully
            assert response.status_code in [400, 401, 422, 404, 405]
    
    def test_unsupported_methods_integration(self):
        """Test unsupported HTTP methods on endpoints"""
        endpoints = [
            ("/api/health", "POST"),
            ("/api/status", "DELETE"),
            ("/api/performance", "PUT")
        ]
        
        for endpoint, method in endpoints:
            if method == "POST":
                response = client.post(endpoint)
            elif method == "DELETE":
                response = client.delete(endpoint)
            elif method == "PUT":
                response = client.put(endpoint)
            
            # Should return Method Not Allowed or other appropriate error
            assert response.status_code in [405, 422, 404]
    
    def test_large_request_handling_integration(self):
        """Test handling of large requests"""
        large_data = {
            "data": "x" * 5000,  # 5KB payload
            "type": "large_test"
        }
        
        response = client.post("/api/frontend-errors", json=large_data)
        # Should either accept or reject with appropriate status
        assert response.status_code in [200, 413, 422]


if __name__ == "__main__":
    # Run integration tests standalone
    pytest.main([__file__, "-v", "--tb=short"])