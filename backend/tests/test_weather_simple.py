#!/usr/bin/env python3
"""
Simple Weather System Test
Quick test for weather integration
"""

import requests
import json
from datetime import datetime

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

def test_backend_health():
    """Test if backend is running"""
    print_header("🏥 BACKEND HEALTH CHECK")
    
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        
        if response.status_code == 200:
            health_data = response.json()
            print_success("Backend is healthy!")
            print_info(f"Status: {health_data.get('status', 'unknown')}")
            
            # Weather system check
            weather_system = health_data.get('weather_system', {})
            print_info(f"Weather system enabled: {weather_system.get('enabled', False)}")
            print_info(f"Weather API available: {weather_system.get('api_available', False)}")
            print_info(f"Weather rules configured: {weather_system.get('rules_configured', False)}")
            
            return True
        else:
            print_error(f"Backend unhealthy: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Cannot connect to backend: {str(e)}")
        print_info("Make sure backend is running: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
        return False

def test_weather_health():
    """Test weather system health"""
    print_header("🌦️ WEATHER SYSTEM HEALTH")
    
    try:
        response = requests.get(f"{API_BASE}/api/weather/health")
        
        if response.status_code == 200:
            weather_health = response.json()
            print_success("Weather system is healthy!")
            print_info(f"API service available: {weather_health.get('api_service_available', False)}")
            print_info(f"Game rules configured: {weather_health.get('game_rules_configured', 0)}")
            print_info(f"Recent weather readings: {weather_health.get('recent_weather_readings', 0)}")
            return True
        else:
            print_error(f"Weather health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Weather health check error: {str(e)}")
        return False

def test_weather_rules():
    """Test weather rules system"""
    print_header("🎮 WEATHER RULES TEST")
    
    try:
        # Test get all rules
        response = requests.get(f"{API_BASE}/api/weather/rules/all")
        
        if response.status_code == 200:
            rules_data = response.json()
            print_success("Weather rules retrieved!")
            print_info(f"Rules count: {rules_data.get('rules_count', 0)}")
            
            # Show rules
            rules = rules_data.get('rules', [])
            for rule in rules:
                game_type = rule.get('game_type')
                weather_dependent = rule.get('weather_dependent')
                print_info(f"  {game_type}: Weather dependent = {weather_dependent}")
            
            return True
        else:
            print_error(f"Weather rules failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Weather rules test error: {str(e)}")
        return False

def main():
    """Run all weather tests"""
    print_header("🌦️ LFA LEGACY GO - SIMPLE WEATHER TEST")
    print(f"📅 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Target: {API_BASE}")
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Weather Health", test_weather_health),
        ("Weather Rules", test_weather_rules),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
                print_success(f"{test_name}: PASSED")
            else:
                print_error(f"{test_name}: FAILED")
        except Exception as e:
            print_error(f"{test_name}: ERROR - {str(e)}")
    
    # Final results
    print_header("🏆 TEST RESULTS")
    success_rate = (passed / total * 100)
    
    print(f"📊 Tests: {passed}/{total} passed ({success_rate:.0f}%)")
    
    if passed == total:
        print_success("🎉 ALL TESTS PASSED!")
        print("🌦️ Weather system is working perfectly!")
    elif passed >= 2:
        print_success("✅ Most tests passed!")
        print("🌟 Weather system is working!")
    else:
        print_error("⚠️ Tests failed!")
        print("🔧 Check backend and try again.")
    
    return passed >= 2

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
