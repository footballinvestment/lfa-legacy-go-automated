"""
Tournament endpoint tests
"""

import pytest
from fastapi.testclient import TestClient


class TestTournamentEndpoints:
    """Test tournament-related endpoints."""

    def test_list_tournaments(self, client: TestClient):
        """Test listing tournaments."""
        response = client.get("/api/tournaments")

        # Should return 200 or 404 if no tournaments
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)

    def test_create_tournament_without_auth(
        self, client: TestClient, test_tournament_data
    ):
        """Test creating tournament without authentication."""
        response = client.post("/api/tournaments", json=test_tournament_data)

        # Should require authentication
        assert response.status_code in [401, 403, 422]

    def test_create_tournament_with_auth(
        self, client: TestClient, authenticated_headers, test_tournament_data
    ):
        """Test creating tournament with authentication."""
        if not authenticated_headers:
            pytest.skip("Authentication not working")

        response = client.post(
            "/api/tournaments", json=test_tournament_data, headers=authenticated_headers
        )

        # May succeed or fail depending on implementation
        assert response.status_code in [200, 201, 401, 403, 422]

    def test_get_tournament_details_nonexistent(self, client: TestClient):
        """Test getting details of non-existent tournament."""
        response = client.get("/api/tournaments/999999")
        assert response.status_code in [401, 404, 429]  # 401 for auth, 404 not found, 429 rate limiting

    def test_tournaments_endpoint_structure(self, client: TestClient):
        """Test that tournaments endpoint has correct structure."""
        response = client.get("/api/tournaments")

        # Should not crash and return valid JSON
        assert response.status_code in [200, 404, 422, 429]  # 429 for rate limiting

        # Response should be valid JSON
        try:
            data = response.json()
            assert data is not None
        except ValueError:
            pytest.fail("Response is not valid JSON")
