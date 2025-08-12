#!/usr/bin/env python3
"""
🔍 LFA Legacy GO - Debug Test
================================================================================
Shows detailed error messages to understand what's failing
================================================================================
"""

import requests
import json
from datetime import datetime

def debug_test():
    """Debug the failing endpoints"""
    base_url = "http://localhost:8000"
    
    print("🔍 LFA Legacy GO - DEBUG TEST")
    print("="*50)
    
    # Test 1: Locations API
    print("\n1. 📍 Testing Locations API...")
    try:
        response = requests.get(f"{base_url}/api/locations", timeout=10)
        print(f"   Status Code: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: {len(data)} locations")
            for i, loc in enumerate(data):
                print(f"      {i+1}. {loc.get('name', 'Unknown')} (ID: {loc.get('id', 'N/A')})")
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"   💥 Exception: {e}")
    
    # Test 2: User Registration
    print("\n2. 👤 Testing User Registration...")
    timestamp = int(datetime.now().timestamp())
    
    test_user_data = {
        "name": "Debug Test User",
        "username": f"debuguser_{timestamp}",
        "email": f"debug_{timestamp}@test.com",
        "password": "DebugPass123!"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/auth/register",
            json=test_user_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Request Data: {json.dumps(test_user_data, indent=2)}")
        
        if response.status_code == 200 or response.status_code == 201:
            data = response.json()
            print(f"   ✅ Success: User created with ID {data.get('id')}")
            return data  # Return user data for further testing
        else:
            print(f"   ❌ Error Response: {response.text}")
            
            # Try to parse error details
            try:
                error_data = response.json()
                print(f"   📋 Error Details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   📋 Raw Error: {response.text}")
                
    except Exception as e:
        print(f"   💥 Exception: {e}")
    
    return None

def test_authentication_and_profile(user_data, test_user_data, base_url):
    """Test authentication if user was created successfully"""
    # Test 3: Authentication (if user was created)
    print("\n3. 🔐 Testing Authentication...")
    if user_data:
        try:
            form_data = {
                'username': test_user_data['username'],
                'password': test_user_data['password']
            }
            
            response = requests.post(
                f"{base_url}/api/auth/login",
                data=form_data,
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                print(f"   ✅ Success: Token received ({token[:20] if token else 'None'}...)")
                
                # Test 4: Protected endpoint
                print("\n4. 🔒 Testing Protected Endpoint...")
                headers = {"Authorization": f"Bearer {token}"}
                profile_response = requests.get(f"{base_url}/api/auth/me", headers=headers, timeout=10)
                
                print(f"   Status Code: {profile_response.status_code}")
                if profile_response.status_code == 200:
                    profile = profile_response.json()
                    print(f"   ✅ Success: Profile loaded for {profile.get('username')}")
                    print(f"      Credits: {profile.get('credits', 'N/A')}")
                    print(f"      Level: {profile.get('level', 'N/A')}")
                else:
                    print(f"   ❌ Error: {profile_response.text}")
                    
            else:
                print(f"   ❌ Auth Error: {response.text}")
                
        except Exception as e:
            print(f"   💥 Auth Exception: {e}")
    else:
        print("   ⚠️  Skipped (no user created)")

def debug_test():
    """Debug the failing endpoints"""
    base_url = "http://localhost:8000"
    
    print("🔍 LFA Legacy GO - DEBUG TEST")
    print("="*50)
    
    # Test 1: Locations API
    print("\n1. 📍 Testing Locations API...")
    try:
        response = requests.get(f"{base_url}/api/locations", timeout=10)
        print(f"   Status Code: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: {len(data)} locations")
            for i, loc in enumerate(data):
                print(f"      {i+1}. {loc.get('name', 'Unknown')} (ID: {loc.get('id', 'N/A')})")
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"   💥 Exception: {e}")
    
    # Test 2: User Registration
    print("\n2. 👤 Testing User Registration...")
    timestamp = int(datetime.now().timestamp())
    
    test_user_data = {
        "name": "Debug Test User",
        "username": f"debuguser_{timestamp}",
        "email": f"debug_{timestamp}@test.com",
        "password": "DebugPass123!"
    }
    
    user_data = None
    try:
        response = requests.post(
            f"{base_url}/api/auth/register",
            json=test_user_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Request Data: {json.dumps(test_user_data, indent=2)}")
        
        if response.status_code == 200 or response.status_code == 201:
            user_data = response.json()
            print(f"   ✅ Success: User created with ID {user_data.get('id')}")
        else:
            print(f"   ❌ Error Response: {response.text}")
            
            # Try to parse error details
            try:
                error_data = response.json()
                print(f"   📋 Error Details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   📋 Raw Error: {response.text}")
                
    except Exception as e:
        print(f"   💥 Exception: {e}")
    
    # Test authentication if user was created
    test_authentication_and_profile(user_data, test_user_data, base_url)
    
    # Test 5: API Documentation
    print("\n5. 📚 Testing API Documentation...")
    try:
        response = requests.get(f"{base_url}/docs", timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"   ✅ Success: API docs available")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   💥 Exception: {e}")
    
    # Test 6: Health endpoint details
    print("\n6. 🏥 Testing Health Endpoint Details...")
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health Data:")
            print(f"      {json.dumps(data, indent=6)}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   💥 Exception: {e}")
    
    print("\n" + "="*50)
    print("🎯 DEBUG TEST COMPLETE")
    print("="*50)

if __name__ == "__main__":
    debug_test()