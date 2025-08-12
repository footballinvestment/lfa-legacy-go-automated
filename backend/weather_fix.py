#!/usr/bin/env python3
"""
Quick Weather System Initialization Script
LFA Legacy GO - Weather API Fix
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def login_and_get_token():
    """Login and get authentication token"""
    print("🔐 Getting authentication token...")
    
    # You need to provide the correct password for p3t1k3
    username = input("Enter username (default: p3t1k3): ").strip() or "p3t1k3"
    password = input("Enter password: ").strip()
    
    if not password:
        print("❌ Password required!")
        return None
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": username,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"✅ Login successful! Token: {token[:20]}...")
            return token
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def initialize_weather_rules(token):
    """Initialize weather rules"""
    print("🎮 Initializing weather rules...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/weather/rules/initialize",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            print("✅ Weather rules initialized successfully!")
            return True
        elif response.status_code == 400:
            print("⚠️ Weather rules already exist")
            return True
        else:
            print(f"❌ Failed to initialize rules: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Rules initialization error: {e}")
        return False

def test_weather_endpoints(token):
    """Test weather endpoints"""
    print("🌤️ Testing weather endpoints...")
    
    # Test current weather
    try:
        response = requests.get(
            f"{BASE_URL}/api/weather/location/1/current",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            weather_data = response.json()
            print(f"✅ Current weather: {weather_data.get('temperature', 'N/A')}°C, {weather_data.get('description', 'N/A')}")
        else:
            print(f"⚠️ Weather endpoint: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Weather test error: {e}")

def check_weather_health():
    """Check weather system health"""
    print("🏥 Checking weather system health...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/weather/health")
        
        if response.status_code == 200:
            health = response.json()
            print(f"Weather Status: {health.get('status')}")
            print(f"API Available: {health.get('api_service_available')}")
            print(f"Rules Configured: {health.get('game_rules_configured')}")
            
            if health.get('api_service_available') and health.get('game_rules_configured', 0) > 0:
                print("✅ Weather system is fully operational!")
                return True
            else:
                print("⚠️ Weather system needs attention")
                return False
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def main():
    """Main execution"""
    print("🌤️ LFA Legacy GO - Weather System Quick Fix")
    print("=" * 50)
    
    # Step 1: Login
    token = login_and_get_token()
    if not token:
        print("❌ Cannot proceed without authentication token")
        sys.exit(1)
    
    # Step 2: Initialize rules
    rules_ok = initialize_weather_rules(token)
    if not rules_ok:
        print("⚠️ Rules initialization failed, but continuing...")
    
    # Step 3: Test endpoints
    test_weather_endpoints(token)
    
    # Step 4: Final health check
    health_ok = check_weather_health()
    
    print("\n" + "=" * 50)
    if health_ok:
        print("🎯 SUCCESS: Weather system is ready!")
        print("📱 Test frontend at: http://localhost:3000")
        print("🌤️ Weather widgets should show real data now!")
    else:
        print("⚠️ Weather system needs manual investigation")
        print("Check backend logs for more details")

if __name__ == "__main__":
    main()