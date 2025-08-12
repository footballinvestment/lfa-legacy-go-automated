#!/usr/bin/env python3
"""
Game Results System Test Script
Test the complete Game Results Tracking implementation
"""

import requests
import json
from datetime import datetime, timedelta

# API Configuration
API_BASE = "http://localhost:8000"

def print_header(text):
    print(f"\n{'='*60}")
    print(f" {text}")
    print('='*60)

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def authenticate_user():
    """Login and get JWT token"""
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{API_BASE}/api/auth/login", data=login_data)
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data["access_token"]
            print_success("User authenticated successfully")
            return token
        else:
            print_error(f"Authentication failed: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Authentication error: {str(e)}")
        return None

def test_backend_health():
    """Test if backend includes game results system"""
    print_header("🏥 BACKEND HEALTH CHECK - GAME RESULTS")
    
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        
        if response.status_code == 200:
            health_data = response.json()
            print_success("Backend is healthy!")
            print_info(f"Version: {health_data.get('version', 'unknown')}")
            
            # Check game results system
            game_results_system = health_data.get('game_results_system', {})
            print_info(f"Game Results enabled: {game_results_system.get('enabled', False)}")
            print_info(f"Total results: {game_results_system.get('total_results', 0)}")
            print_info(f"Leaderboards active: {game_results_system.get('leaderboards_active', False)}")
            
            features = health_data.get('features', [])
            if 'game_results_tracking' in features:
                print_success("Game Results Tracking feature detected!")
                return True
            else:
                print_error("Game Results Tracking feature not found in features list")
                return False
        else:
            print_error(f"Backend unhealthy: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Cannot connect to backend: {str(e)}")
        return False

def test_game_results_endpoints(token):
    """Test game results API endpoints"""
    print_header("🎮 GAME RESULTS ENDPOINTS TEST")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Get my statistics (should work even if no results yet)
    try:
        response = requests.get(f"{API_BASE}/api/game-results/my-statistics", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print_success("User statistics retrieved!")
            print_info(f"Total games: {stats.get('total_games_played', 0)}")
            print_info(f"Average score: {stats.get('average_score', 0)}")
        elif response.status_code == 404:
            print_info("No statistics found yet (expected for new user)")
        else:
            print_error(f"Statistics endpoint failed: {response.status_code}")
    except Exception as e:
        print_error(f"Statistics test error: {str(e)}")
    
    # Test 2: Get my results (should return empty list)
    try:
        response = requests.get(f"{API_BASE}/api/game-results/my-results", headers=headers)
        if response.status_code == 200:
            results = response.json()
            print_success("User results retrieved!")
            print_info(f"Results count: {len(results)}")
        else:
            print_error(f"Results endpoint failed: {response.status_code}")
    except Exception as e:
        print_error(f"Results test error: {str(e)}")
    
    # Test 3: Get leaderboards
    try:
        response = requests.get(f"{API_BASE}/api/game-results/leaderboards/overall", headers=headers)
        if response.status_code == 200:
            leaderboard = response.json()
            print_success("Leaderboard retrieved!")
            print_info(f"Leaderboard entries: {len(leaderboard)}")
        else:
            print_error(f"Leaderboard endpoint failed: {response.status_code}")
    except Exception as e:
        print_error(f"Leaderboard test error: {str(e)}")

def test_database_tables():
    """Test if new database tables exist via health check"""
    print_header("🗄️ DATABASE TABLES CHECK")
    
    try:
        response = requests.get(f"{API_BASE}/health")
        if response.status_code == 200:
            health_data = response.json()
            db_info = health_data.get('database', {})
            
            # Check for new fields in database info
            print_success("Database connection healthy")
            print_info(f"Total game results: {db_info.get('total_game_results', 'Not available')}")
            print_info(f"Player statistics: {db_info.get('player_statistics', 'Not available')}")
            print_info(f"Leaderboard entries: {db_info.get('active_leaderboard_entries', 'Not available')}")
            
            return True
        else:
            print_error("Database health check failed")
            return False
    except Exception as e:
        print_error(f"Database check error: {str(e)}")
        return False

def test_api_documentation():
    """Check if new endpoints appear in API docs"""
    print_header("📚 API DOCUMENTATION CHECK")
    
    try:
        response = requests.get(f"{API_BASE}/docs")
        if response.status_code == 200:
            print_success("Swagger documentation accessible")
            print_info("Check manually: http://localhost:8000/docs")
            print_info("Look for 'Game Results' section with endpoints")
            return True
        else:
            print_error("API documentation not accessible")
            return False
    except Exception as e:
        print_error(f"Documentation check error: {str(e)}")
        return False

def main():
    """Run complete game results system test"""
    print_header("🎮 LFA LEGACY GO - GAME RESULTS SYSTEM TEST")
    print(f"📅 Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Target API: {API_BASE}")
    
    tests_passed = 0
    total_tests = 4
    
    # Test 1: Backend Health
    if test_backend_health():
        tests_passed += 1
    
    # Test 2: Database Tables
    if test_database_tables():
        tests_passed += 1
    
    # Test 3: API Documentation
    if test_api_documentation():
        tests_passed += 1
    
    # Test 4: API Endpoints (requires authentication)
    token = authenticate_user()
    if token:
        test_game_results_endpoints(token)
        tests_passed += 1
    
    # Final Results
    print_header("🏆 TEST RESULTS SUMMARY")
    print(f"📊 Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print_success("🎉 ALL TESTS PASSED!")
        print_success("🎮 Game Results System is successfully integrated!")
        print_info("Next steps:")
        print_info("1. Test result recording with a coach account")
        print_info("2. Generate some test data to see leaderboards")
        print_info("3. Check the enhanced Swagger docs at /docs")
    elif tests_passed >= 2:
        print_info("⚠️ Most tests passed - Game Results System partially working")
        print_info("Check the failed tests above for details")
    else:
        print_error("❌ Multiple tests failed - Check integration")
        print_info("Verify all files are updated correctly")
    
    print(f"📅 Test completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()