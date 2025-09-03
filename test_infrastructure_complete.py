# test_infrastructure_complete.py
import requests
import json
import time
import sys
import os
sys.path.append('backend')

def test_database():
    """Test PostgreSQL connection"""
    print("🔍 Testing PostgreSQL connection...")
    try:
        # Import after adding backend to path
        from app.database_postgres import check_database_health
        health = check_database_health()
        print(f"Database health: {health}")
        return health["status"] == "healthy"
    except Exception as e:
        print(f"Database test failed: {e}")
        return False

def test_redis():
    """Test Redis connection"""
    print("🔍 Testing Redis connection...")
    try:
        from app.cache_redis import redis_manager
        health = redis_manager.health_check()
        print(f"Redis health: {health}")
        return health["status"] == "healthy"
    except Exception as e:
        print(f"Redis test failed: {e}")
        return False

def test_server_startup():
    """Test if server starts and responds"""
    print("🔍 Testing server response...")
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        print(f"Server response: {response.status_code}")
        print(f"Response body: {response.json()}")
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        print(f"Server connection failed: {e}")
        return False

def test_auth_endpoints():
    """Test authentication endpoints"""
    print("🔍 Testing authentication endpoints...")
    
    # Test registration
    try:
        registration_data = {
            "username": f"testuser_{int(time.time())}",
            "email": f"test_{int(time.time())}@example.com",
            "password": "TestPassword123!",
            "full_name": "Test User Infrastructure"
        }
        
        response = requests.post(
            "http://localhost:8000/api/auth/register",
            json=registration_data,
            timeout=5
        )
        
        print(f"Registration response: {response.status_code}")
        if response.status_code == 200:
            user_data = response.json()
            print(f"User created: {user_data.get('user', {}).get('username')}")
            return True
        else:
            print(f"Registration failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"Registration test failed: {e}")
        return False

def test_rate_limiting():
    """Test rate limiting functionality"""
    print("🔍 Testing rate limiting...")
    
    # Make multiple rapid login attempts
    login_data = {"username": "nonexistent", "password": "wrong"}
    
    for i in range(6):
        try:
            response = requests.post(
                "http://localhost:8000/api/auth/login",
                data=login_data,
                timeout=5
            )
            print(f"Attempt {i+1}: {response.status_code}")
            
            if response.status_code == 429:
                print("✅ Rate limiting works - got 429 Too Many Requests")
                return True
                
        except Exception as e:
            print(f"Rate limiting test error: {e}")
    
    print("⚠️ Rate limiting test inconclusive")
    return False

def main():
    """Run all infrastructure tests"""
    print("🚀 Starting Infrastructure Testing...")
    
    tests = [
        ("PostgreSQL Database", test_database),
        ("Redis Cache", test_redis),
        ("Server Startup", test_server_startup),
        ("Authentication Endpoints", test_auth_endpoints),
        ("Rate Limiting", test_rate_limiting),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"Testing: {test_name}")
        print('='*50)
        
        try:
            result = test_func()
            results[test_name] = result
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"Result: {status}")
        except Exception as e:
            print(f"❌ FAILED with exception: {e}")
            results[test_name] = False
    
    # Summary
    print(f"\n{'='*50}")
    print("INFRASTRUCTURE TEST SUMMARY")
    print('='*50)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL INFRASTRUCTURE TESTS PASSED!")
        return 0
    else:
        print("❌ SOME TESTS FAILED - Infrastructure not ready")
        return 1

if __name__ == "__main__":
    sys.exit(main())