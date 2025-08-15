#!/usr/bin/env python3
"""
LFA Legacy GO - Spam Protection Test Script
Test the anti-spam system thoroughly
"""

import requests
import time
import json
from datetime import datetime

def test_spam_protection():
    """🧪 Test spam protection system"""
    
    base_url = "https://lfa-legacy-go-backend-tv6u4m3szq-uc.a.run.app"
    
    print("🛡️ LFA LEGACY GO - SPAM PROTECTION TEST")
    print("=" * 50)
    
    # Test 1: Check spam protection status
    print("\n🔍 Test 1: Spam Protection Status")
    try:
        response = requests.get(f"{base_url}/api/auth/spam-protection-status")
        if response.status_code == 200:
            status = response.json()
            print(f"✅ Spam protection: {status.get('spam_protection')}")
            print(f"✅ hCaptcha configured: {status.get('hcaptcha_configured')}")
            print(f"✅ Rate limiting: {status.get('rate_limiting', {}).get('rate_limiting')}")
        else:
            print(f"❌ Status check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Status check error: {e}")
    
    # Test 2: Normal registration (should work)
    print("\n🔍 Test 2: Normal Registration")
    try:
        normal_user = {
            "username": f"testuser_{int(time.time())}",
            "password": "testpass123",
            "email": f"test_{int(time.time())}@example.com",
            "full_name": "Test User",
            "captcha_response": "development_bypass"  # Development bypass
        }
        
        response = requests.post(
            f"{base_url}/api/auth/register",
            json=normal_user,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Normal registration successful: {result.get('user', {}).get('username')}")
        else:
            print(f"❌ Normal registration failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Normal registration error: {e}")
    
    # Test 3: Rate limiting test (rapid fire registrations)
    print("\n🔍 Test 3: Rate Limiting Test")
    success_count = 0
    blocked_count = 0
    
    for i in range(5):
        try:
            spam_user = {
                "username": f"spammer_{int(time.time())}_{i}",
                "password": "spampass123",
                "email": f"spam_{int(time.time())}_{i}@test.com",
                "full_name": f"Spammer {i}",
                "captcha_response": "development_bypass"
            }
            
            response = requests.post(
                f"{base_url}/api/auth/register",
                json=spam_user,
                timeout=10
            )
            
            if response.status_code == 200:
                success_count += 1
                print(f"  ✅ Registration {i+1}: SUCCESS")
            elif response.status_code == 429:
                blocked_count += 1
                print(f"  🚫 Registration {i+1}: BLOCKED (Rate Limited)")
            else:
                print(f"  ❌ Registration {i+1}: ERROR {response.status_code}")
                
            time.sleep(1)  # Small delay between requests
            
        except Exception as e:
            print(f"  ❌ Registration {i+1}: EXCEPTION {e}")
    
    print(f"\n📊 Rate Limiting Results:")
    print(f"   Successful: {success_count}")
    print(f"   Blocked: {blocked_count}")
    print(f"   Expected: First few should succeed, then blocked")
    
    # Test 4: Invalid captcha test
    print("\n🔍 Test 4: Invalid Captcha Test")
    try:
        invalid_captcha_user = {
            "username": f"captcha_test_{int(time.time())}",
            "password": "testpass123",
            "email": f"captcha_{int(time.time())}@test.com",
            "full_name": "Captcha Test User",
            "captcha_response": "invalid_captcha_token"
        }
        
        response = requests.post(
            f"{base_url}/api/auth/register",
            json=invalid_captcha_user,
            timeout=10
        )
        
        if response.status_code == 400:
            print("✅ Invalid captcha correctly blocked")
        elif response.status_code == 200:
            print("⚠️ Invalid captcha allowed (development mode)")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ Captcha test error: {e}")
    
    print("\n🎯 Spam Protection Test Complete!")
    print("=" * 50)

if __name__ == "__main__":
    test_spam_protection()