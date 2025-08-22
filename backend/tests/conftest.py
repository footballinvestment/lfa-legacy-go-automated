"""
Test configuration and fixtures for LFA Legacy GO backend - Updated for Production
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

# Create a test-specific database configuration
TEST_DATABASE_URL = "sqlite:///./test_lfa_legacy_go.db"

# Test engine for SQLite (isolated from production)
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False  # Disable SQL logging during tests
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Setup test database with proper models"""
    try:
        # Import all models to ensure they're registered
        from app.models import (
            User, UserSession, Location, GameDefinition, GameSession,
            Tournament, TournamentParticipant, GameResult, Friendship,
            FriendRequest, Challenge, UserBlock, Coupon, CouponUsage
        )
        
        # Get the Base from the actual models
        from app.models.user import Base
        
        # Create all tables
        Base.metadata.create_all(bind=test_engine)
        print("✅ Test database tables created successfully")
        
        yield
        
        # Cleanup after tests
        Base.metadata.drop_all(bind=test_engine)
        print("✅ Test database cleaned up")
        
    except Exception as e:
        print(f"❌ Test database setup failed: {e}")
        # Create empty tables as fallback
        yield

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with mocked database"""
    
    def mock_get_db():
        """Override database dependency for testing"""
        try:
            yield db_session
        finally:
            pass
    
    # Override the database dependency
    try:
        from app.database import get_db
        app.dependency_overrides[get_db] = mock_get_db
        print("✅ Database dependency override successful (app.database)")
    except ImportError:
        try:
            from app.core.database_production import get_db
            app.dependency_overrides[get_db] = mock_get_db
            print("✅ Database dependency override successful (database_production)")
        except ImportError:
            print("❌ Could not override database dependency - tests may use production DB")
    
    # Create test client
    with TestClient(app) as test_client:
        yield test_client
    
    # Clear overrides
    app.dependency_overrides.clear()

@pytest.fixture
def test_user_data():
    """Sample user data for testing"""
    return {
        "username": "testuser_" + os.urandom(4).hex(),  # Make unique
        "email": f"test_{os.urandom(4).hex()}@example.com",  # Make unique
        "full_name": "Test User",
        "password": "TestPassword123!",  # Strong password
    }

@pytest.fixture
def test_tournament_data():
    """Sample tournament data for testing"""
    return {
        "name": f"Test Tournament {os.urandom(4).hex()}",
        "description": "A test tournament for automated testing",
        "max_participants": 16,
        "entry_fee": 10,
        "prize_pool": 100,
        "start_date": "2025-12-31T10:00:00Z",  # Future date
        "location_id": 1,
    }

@pytest.fixture
def test_location_data():
    """Sample location data for testing"""
    return {
        "name": f"Test Location {os.urandom(4).hex()}",
        "address": "123 Test Street, Test City",
        "city": "Test City",
        "postal_code": "12345",
        "capacity": 50,
        "facilities": ["parking", "restrooms", "wifi"]
    }

@pytest.fixture
def authenticated_headers(client, test_user_data):
    """Get authentication headers for testing"""
    try:
        # Register user
        register_response = client.post("/api/auth/register", json=test_user_data)
        
        if register_response.status_code not in [200, 201, 400]:
            print(f"Registration failed: {register_response.status_code} - {register_response.text}")
            return {}
        
        # Login - try different formats
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        
        # Try JSON login first
        login_response = client.post("/api/auth/login", json=login_data)
        
        if login_response.status_code != 200:
            # Try form data login
            login_response = client.post("/api/auth/login", data=login_data)
        
        if login_response.status_code == 200:
            response_data = login_response.json()
            # Handle different response formats
            if "access_token" in response_data:
                token = response_data["access_token"]
            elif "data" in response_data and "access_token" in response_data["data"]:
                token = response_data["data"]["access_token"]
            else:
                print(f"Unexpected login response format: {response_data}")
                return {}
            
            return {"Authorization": f"Bearer {token}"}
        
        print(f"Login failed: {login_response.status_code} - {login_response.text}")
        return {}
        
    except Exception as e:
        print(f"Authentication fixture failed: {e}")
        return {}

@pytest.fixture
def mock_redis():
    """Mock Redis for testing cache functionality"""
    class MockRedis:
        def __init__(self):
            self._storage = {}
        
        def get(self, key):
            return self._storage.get(key)
        
        def set(self, key, value, ex=None):
            self._storage[key] = value
            return True
        
        def delete(self, key):
            return self._storage.pop(key, None) is not None
        
        def flushall(self):
            self._storage.clear()
            return True
        
        def keys(self, pattern="*"):
            return list(self._storage.keys())
    
    return MockRedis()

@pytest.fixture(autouse=True)
def clean_test_files():
    """Clean up test files after each test"""
    yield
    
    # Clean up test database files
    test_files = ["test_lfa_legacy_go.db", "test.db"]
    for file in test_files:
        if os.path.exists(file):
            try:
                os.remove(file)
            except:
                pass  # Ignore cleanup errors

# Environment variable overrides for testing
@pytest.fixture(autouse=True)
def test_environment():
    """Set test environment variables"""
    os.environ["TESTING"] = "true"
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    os.environ["REDIS_URL"] = "redis://localhost:6379/1"  # Use different Redis DB for tests
    
    yield
    
    # Clean up environment
    for key in ["TESTING", "DATABASE_URL", "REDIS_URL"]:
        os.environ.pop(key, None)