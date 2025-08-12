#!/usr/bin/env python3
"""
🔍 Final Debug - Check exact API schemas
================================================================================
"""

import requests
import json
from datetime import datetime

def final_debug():
    """Debug the remaining API issues"""
    base_url = "http://localhost:8000"
    
    print("🔍 FINAL DEBUG - API Schema Check")
    print("="*60)
    
    # Step 1: Create and authenticate a test user
    timestamp = int(datetime.now().timestamp())
    user_data = {
        "full_name": "Final Debug User",
        "username": f"finaldebug_{timestamp}",
        "email": f"finaldebug_{timestamp}@test.com",
        "password": "FinalDebug123!"
    }
    
    print("\n1. 👤 Creating test user...")
    response = requests.post(f"{base_url}/api/auth/register", json=user_data, timeout=10)
    if response.status_code in [200, 201]:
        user_info = response.json()
        print(f"   ✅ User created: ID {user_info['id']}")
        
        # Login
        login_data = {'username': user_data['username'], 'password': user_data['password']}
        login_response = requests.post(f"{base_url}/api/auth/login", data=login_data, timeout=10)
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data['access_token']
            headers = {"Authorization": f"Bearer {token}"}
            print(f"   ✅ Authenticated: {token[:20]}...")
            
            # Test individual problematic endpoints
            test_credit_purchase_schema(base_url, headers)
            test_friend_request_schema(base_url, headers, user_data['username'])
            test_leaderboard_auth(base_url, headers)
            test_locations_detailed(base_url, headers)
            
        else:
            print(f"   ❌ Login failed: {login_response.text}")
    else:
        print(f"   ❌ User creation failed: {response.text}")

def test_credit_purchase_schema(base_url, headers):
    """Test credit purchase with different schemas"""
    print("\n2. 💳 Testing Credit Purchase Schema...")
    
    # Get packages first
    packages_response = requests.get(f"{base_url}/api/credits/packages", headers=headers, timeout=10)
    if packages_response.status_code == 200:
        packages = packages_response.json()
        print(f"   📦 {len(packages)} packages available")
        
        if packages:
            package_id = packages[0].get('package_id', 'starter_pack')
            print(f"   🎯 Testing with package: {package_id}")
            
            # Try different schemas
            schemas_to_try = [
                {"package_id": package_id},
                {"package_id": package_id, "payment_method": "credit_card"},
                {"package_id": package_id, "payment_method": "mock"},
                {"package_id": package_id, "payment_method": "test"},
                {"package_id": package_id, "payment_method": "fake"},
            ]
            
            for i, schema in enumerate(schemas_to_try):
                print(f"\n   Schema {i+1}: {json.dumps(schema)}")
                response = requests.post(f"{base_url}/api/credits/purchase", 
                                       json=schema, headers=headers, timeout=10)
                print(f"      Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"      ✅ SUCCESS: {result}")
                    break
                else:
                    error_text = response.text[:300]
                    print(f"      ❌ Error: {error_text}")
    else:
        print(f"   ❌ Could not get packages: {packages_response.text}")

def test_friend_request_schema(base_url, headers, username):
    """Test friend request with different schemas"""
    print("\n3. 👫 Testing Friend Request Schema...")
    
    # Create a second user to send request to
    timestamp = int(datetime.now().timestamp())
    friend_data = {
        "full_name": "Friend Target",
        "username": f"friend_{timestamp}",
        "email": f"friend_{timestamp}@test.com",
        "password": "FriendPass123!"
    }
    
    friend_response = requests.post(f"{base_url}/api/auth/register", json=friend_data, timeout=10)
    if friend_response.status_code in [200, 201]:
        friend_username = friend_data['username']
        print(f"   👤 Friend user created: {friend_username}")
        
        # Try different schemas
        schemas_to_try = [
            {"friend_username": friend_username},
            {"receiver_username": friend_username},
            {"target_username": friend_username},
            {"username": friend_username},
            {"to_username": friend_username},
        ]
        
        for i, schema in enumerate(schemas_to_try):
            print(f"\n   Schema {i+1}: {json.dumps(schema)}")
            response = requests.post(f"{base_url}/api/social/friend-request", 
                                   json=schema, headers=headers, timeout=10)
            print(f"      Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"      ✅ SUCCESS: {result}")
                break
            else:
                error_text = response.text[:300]
                print(f"      ❌ Error: {error_text}")
    else:
        print(f"   ❌ Could not create friend user: {friend_response.text}")

def test_leaderboard_auth(base_url, headers):
    """Test leaderboard authentication"""
    print("\n4. 🏆 Testing Leaderboard Authentication...")
    
    endpoints_to_try = [
        "/api/game-results/leaderboards",
        "/api/game-results/leaderboard",
        "/game-results/leaderboards",
        "/leaderboards",
    ]
    
    for endpoint in endpoints_to_try:
        print(f"\n   Endpoint: {endpoint}")
        
        # Try without auth
        response = requests.get(f"{base_url}{endpoint}", timeout=10)
        print(f"      No auth: {response.status_code}")
        
        # Try with auth
        response = requests.get(f"{base_url}{endpoint}", headers=headers, timeout=10)
        print(f"      With auth: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"      ✅ SUCCESS: {len(result) if isinstance(result, list) else 'Got data'}")
            break
        else:
            error_text = response.text[:200]
            print(f"      ❌ Error: {error_text}")

def test_locations_detailed(base_url, headers):
    """Test locations endpoint in detail"""
    print("\n5. 📍 Testing Locations Detailed...")
    
    endpoints_to_try = [
        "/api/locations",
        "/locations",
        "/api/location",
    ]
    
    for endpoint in endpoints_to_try:
        print(f"\n   Endpoint: {endpoint}")
        
        # Try without auth
        response = requests.get(f"{base_url}{endpoint}", timeout=10)
        print(f"      No auth: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"      ✅ SUCCESS: {len(result) if isinstance(result, list) else 'Got data'}")
                
                # Show first location details
                if isinstance(result, list) and len(result) > 0:
                    first_loc = result[0]
                    print(f"         First location: {first_loc}")
                break
            except:
                print(f"      📄 Non-JSON response: {response.text[:200]}")
        else:
            error_text = response.text[:200]
            print(f"      ❌ Error: {error_text}")

def check_api_docs():
    """Check API documentation for correct schemas"""
    print("\n6. 📚 Checking API Documentation...")
    
    try:
        response = requests.get("http://localhost:8000/docs", timeout=10)
        if response.status_code == 200:
            print("   ✅ API docs available at http://localhost:8000/docs")
            print("   💡 Check the docs for exact field requirements!")
        else:
            print(f"   ❌ Docs not available: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Could not access docs: {e}")

if __name__ == "__main__":
    final_debug()
    check_api_docs()
    
    print("\n" + "="*60)
    print("🎯 FINAL DEBUG COMPLETE")
    print("="*60)
    print("💡 Next steps:")
    print("   1. Check http://localhost:8000/docs for exact schemas")
    print("   2. Update the test code with correct field names")
    print("   3. Re-run the fixed test")
    print("="*60)