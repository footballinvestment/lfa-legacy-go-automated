"""
Test configuration and fixtures for LFA Legacy GO backend
"""

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Import the app and database
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.main import app

# Import test database setup - create a separate test configuration
try:
    from app.core.database_production import get_db
except ImportError:
    from app.database import get_db

# For tests, we'll use SQLite
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def test_db():
    """Create test database."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_db):
    """Create a database session for testing."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "testpassword123",
    }


@pytest.fixture
def test_tournament_data():
    """Sample tournament data for testing."""
    return {
        "name": "Test Tournament",
        "description": "A test tournament",
        "max_participants": 16,
        "entry_fee": 10,
        "prize_pool": 100,
        "start_date": "2025-08-25T10:00:00",
        "location_id": 1,
    }


@pytest.fixture
def authenticated_headers(client, test_user_data):
    """Get authentication headers for testing."""
    # Create user
    client.post("/api/auth/register", json=test_user_data)

    # Login
    login_response = client.post(
        "/api/auth/login",
        data={
            "username": test_user_data["username"],
            "password": test_user_data["password"],
        },
    )

    if login_response.status_code == 200:
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return {}
