#!/usr/bin/env python3
"""
LFA Legacy GO - Test User Creation Script
Creates test users for credit system testing
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8001"
TEST_USERS = [
    {
        "username": "testuser",
        "email": "testuser@test.com", 
        "password": "testpass123",
        "full_name": "Test User"
        # date_of_birth eltávolítva - nem kötelező
    },
    {
        "username": "frienduser",
        "email": "frienduser@test.com",
        "password": "testpass123", 
        "full_name": "Friend User"
        # date_of_birth eltávolítva - nem kötelező
    }
]

def create_test_user():
    """Create test user for credits testing"""
    print("👤 Creating test users...")
    
    success_count = 0
    
    for user_data in TEST_USERS:
        try:
            print(f"\n🔄 Creating user: {user_data['username']}")
            
            response = requests.post(
                f"{BASE_URL}/api/auth/register",
                json=user_data,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Response status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                result = response.json()
                print(f"✅ User '{user_data['username']}' created successfully!")
                print(f"   👤 ID: {result['user']['id']}")
                print(f"   📧 Email: {result['user']['email']}")
                print(f"   🎫 Credits: {result['user']['credits']}")
                print(f"   🎯 Level: {result['user']['level']}")
                success_count += 1
                
            elif response.status_code == 400:
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                    if 'already registered' in error_detail or 'already exists' in error_detail:
                        print(f"ℹ️  User '{user_data['username']}' already exists")
                        success_count += 1  # Count as success if already exists
                    else:
                        print(f"❌ User creation failed: {error_detail}")
                        print(f"   Full response: {response.text}")
                except:
                    print(f"❌ User creation failed: {response.text}")
                    
            else:
                print(f"❌ User creation failed: {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ User creation error for {user_data['username']}: {str(e)}")
    
    print(f"\n📊 Successfully processed {success_count}/{len(TEST_USERS)} users")
    return success_count > 0

def test_login():
    """Test login with the created user"""
    print("\n🔐 Testing login...")
    
    login_success = 0
    
    for user_data in TEST_USERS:
        try:
            print(f"\n🔄 Testing login for: {user_data['username']}")
            
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                data={
                    "username": user_data["username"],
                    "password": user_data["password"]
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            print(f"Login response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Login successful for {user_data['username']}!")
                print(f"   🔑 Token: {result['access_token'][:50]}...")
                print(f"   👤 User ID: {result['user']['id']}")
                print(f"   💰 Credits: {result['user']['credits']}")
                login_success += 1
            else:
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                    print(f"❌ Login failed for {user_data['username']}: {error_detail}")
                except:
                    print(f"❌ Login failed for {user_data['username']}: {response.text}")
                
        except Exception as e:
            print(f"❌ Login error for {user_data['username']}: {str(e)}")
    
    print(f"\n📊 Login success: {login_success}/{len(TEST_USERS)} users")
    return login_success > 0

def test_api_connection():
    """Test basic API connection"""
    print("🌐 Testing API connection...")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ API connection successful!")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to API: {str(e)}")
        print("💡 Make sure the backend is running: cd app && python main.py")
        return False

def main():
    print("🚀 LFA Legacy GO - Test User Setup")
    print("📅 Időpont:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print(f"🌐 Backend URL: {BASE_URL}")
    
    # Test API connection first
    if not test_api_connection():
        print("\n❌ Cannot continue without API connection")
        return
    
    # Create users
    users_created = create_test_user()
    
    # Test login
    login_works = test_login()
    
    print("\n" + "="*60)
    if users_created and login_works:
        print("🎉 SETUP TELJES SIKER!")
        print("✅ Test users létrehozva")
        print("✅ Login működik")
        print("\n🚀 Most futtathatod a teszteket:")
        print("   python test_credits.py")
        print("   python test_social.py")
    elif users_created:
        print("⚠️  RÉSZLEGES SIKER")
        print("✅ Test users létrehozva")
        print("❌ Login problémás")
        print("🔧 Ellenőrizd a jelszavakat és user adatokat")
    else:
        print("❌ SETUP SIKERTELEN")
        print("🔧 Ellenőrizd a backend státuszát és hibákat")

if __name__ == "__main__":
    main()