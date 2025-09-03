# backend/health_check_comprehensive.py
"""
Comprehensive Production Health Check
Verifies all chat system components ready for production
"""

import requests
import json
import sys
from datetime import datetime

def health_check():
    """Run comprehensive health check"""
    
    base_url = "http://localhost:8002"
    results = {}
    
    print("🏥 COMPREHENSIVE HEALTH CHECK")
    print("=" * 50)
    
    # 1. Basic API Health
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            results['api_health'] = True
            print("✅ API Health: OK")
        else:
            results['api_health'] = False
            print(f"❌ API Health: FAILED ({response.status_code})")
    except Exception as e:
        results['api_health'] = False
        print(f"❌ API Health: ERROR ({e})")
    
    # 2. Authentication System
    try:
        auth_data = {
            "username": "admin",
            "password": "admin123"
        }
        response = requests.post(f"{base_url}/api/auth/login", 
                               json=auth_data, timeout=5)
        if response.status_code == 200:
            token = response.json().get('access_token')
            if token:
                results['auth_system'] = True
                results['jwt_token'] = token
                print("✅ Authentication: OK")
            else:
                results['auth_system'] = False
                print("❌ Authentication: No token returned")
        else:
            results['auth_system'] = False
            print(f"❌ Authentication: FAILED ({response.status_code})")
    except Exception as e:
        results['auth_system'] = False
        print(f"❌ Authentication: ERROR ({e})")
    
    # 3. Chat API Endpoints
    if results.get('jwt_token'):
        headers = {"Authorization": f"Bearer {results['jwt_token']}"}
        
        try:
            response = requests.get(f"{base_url}/api/chat/rooms", 
                                  headers=headers, timeout=5)
            if response.status_code == 200:
                results['chat_api'] = True
                print("✅ Chat API: OK")
            else:
                results['chat_api'] = False
                print(f"❌ Chat API: FAILED ({response.status_code})")
        except Exception as e:
            results['chat_api'] = False
            print(f"❌ Chat API: ERROR ({e})")
    else:
        results['chat_api'] = False
        print("❌ Chat API: Skipped (no auth token)")
    
    # 4. Social API Endpoints  
    if results.get('jwt_token'):
        headers = {"Authorization": f"Bearer {results['jwt_token']}"}
        
        try:
            response = requests.get(f"{base_url}/api/social/friends",
                                  headers=headers, timeout=5) 
            if response.status_code == 200:
                results['social_api'] = True
                print("✅ Social API: OK")
            else:
                results['social_api'] = False
                print(f"❌ Social API: FAILED ({response.status_code})")
        except Exception as e:
            results['social_api'] = False
            print(f"❌ Social API: ERROR ({e})")
    else:
        results['social_api'] = False
        print("❌ Social API: Skipped (no auth token)")
    
    # 5. WebSocket Availability
    try:
        response = requests.get(f"{base_url}/socket.io/?EIO=4&transport=polling", timeout=5)
        if response.status_code == 200:
            results['websocket'] = True
            print("✅ WebSocket: OK")
        else:
            results['websocket'] = False
            print(f"❌ WebSocket: FAILED ({response.status_code})")
    except Exception as e:
        results['websocket'] = False
        print(f"❌ WebSocket: ERROR ({e})")
    
    # 6. Database Tables
    try:
        import os
        import sys
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        from app.database import SessionLocal
        from app.models.chat import ChatRoom
        from app.models.friends import FriendRequest
        
        db = SessionLocal()
        try:
            room_count = db.query(ChatRoom).count()
            request_count = db.query(FriendRequest).count()
            results['database'] = True
            print(f"✅ Database: OK ({room_count} rooms, {request_count} requests)")
        finally:
            db.close()
            
    except Exception as e:
        results['database'] = False
        print(f"❌ Database: ERROR ({e})")
    
    # Calculate overall score
    total_checks = len([k for k in results.keys() if k != 'jwt_token'])
    passed_checks = sum(1 for k, v in results.items() if k != 'jwt_token' and v)
    score = (passed_checks / total_checks) * 100
    
    print("=" * 50)
    print(f"📊 OVERALL SCORE: {score:.1f}% ({passed_checks}/{total_checks})")
    
    if score >= 100:
        print("🏆 PRODUCTION READY")
        return True
    elif score >= 80:
        print("⚠️ MOSTLY READY - Minor issues to fix")
        return False
    else:
        print("🚨 NOT PRODUCTION READY - Major issues")
        return False

if __name__ == "__main__":
    success = health_check()
    sys.exit(0 if success else 1)
