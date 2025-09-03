#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LFA Legacy GO - Production & Local API Teszt
==========================================
Teszteli a backend-et lokálisan és production környezetben
"""

import requests
import json
import time
import random
from datetime import datetime

def generate_test_user():
    timestamp = int(time.time())
    random_suffix = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz', k=4))
    return {
        'username': f'apitest_{timestamp}_{random_suffix}',
        'email': f'apitest_{timestamp}_{random_suffix}@lfa-test.com',
        'password': 'TestPass123!',
        'first_name': 'API',
        'last_name': 'Tester'
    }

def log_test(test_name, success, details=""):
    """Teszt eredmény logolása"""
    status = "✅" if success else "❌"
    print(f"{status} {test_name}")
    if details:
        print(f"   📝 {details}")

def test_api_backend(backend_url, environment_name):
    """Backend API teljes tesztelése"""
    print("🏈" * 30)
    print(f"🏈 LFA LEGACY GO - {environment_name.upper()} API TESZT 🏈")
    print("🏈" * 30)
    print(f"🌍 Backend URL: {backend_url}")
    print(f"⏰ Teszt idő: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("")
    
    success_count = 0
    total_tests = 0
    user_data = generate_test_user()
    token = None
    
    # 1. Health Check
    print("🧪 TESZT 1: Health Check")
    total_tests += 1
    try:
        response = requests.get(f"{backend_url}/health", timeout=15)
        if response.status_code == 200:
            health_data = response.json()
            log_test("Health Check", True, f"Status: {health_data.get('status', 'OK')}")
            success_count += 1
        else:
            log_test("Health Check", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Health Check", False, f"Error: {str(e)}")
    
    # 2. API Root
    print("\n🧪 TESZT 2: API Root Endpoint")
    total_tests += 1
    try:
        response = requests.get(f"{backend_url}/", timeout=15)
        if response.status_code == 200:
            root_data = response.json()
            log_test("API Root", True, f"Version: {root_data.get('version', 'N/A')}")
            log_test("Environment", True, f"Env: {root_data.get('environment', 'Unknown')}")
            success_count += 1
        else:
            log_test("API Root", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("API Root", False, f"Error: {str(e)}")
    
    # 3. API Documentation
    print("\n🧪 TESZT 3: API Documentation")
    total_tests += 1
    try:
        response = requests.get(f"{backend_url}/docs", timeout=15)
        if response.status_code == 200:
            log_test("API Docs", True, "Swagger UI elérhető")
            success_count += 1
        else:
            log_test("API Docs", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("API Docs", False, f"Error: {str(e)}")
    
    # 4. Credit System
    print("\n🧪 TESZT 4: Credit System")
    total_tests += 1
    try:
        response = requests.get(f"{backend_url}/api/credits/packages", timeout=15)
        if response.status_code == 200:
            packages = response.json()
            log_test("Credit Packages", True, f"{len(packages)} csomag elérhető")
            if packages:
                sample_package = packages[0]
                log_test("Sample Package", True, f"{sample_package.get('name')}: {sample_package.get('price')}€")
            success_count += 1
        else:
            log_test("Credit Packages", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Credit Packages", False, f"Error: {str(e)}")
    
    # 5. User Registration
    print("\n🧪 TESZT 5: User Registration")
    total_tests += 1
    try:
        response = requests.post(
            f"{backend_url}/api/auth/register",
            json=user_data,
            timeout=15
        )
        if response.status_code == 200:
            reg_data = response.json()
            log_test("User Registration", True, f"User ID: {reg_data.get('id')}")
            success_count += 1
            
            # 6. User Login
            print("\n🧪 TESZT 6: User Login")
            total_tests += 1
            try:
                login_data = {
                    'username': user_data['username'],
                    'password': user_data['password']
                }
                login_response = requests.post(
                    f"{backend_url}/api/auth/login",
                    json=login_data,
                    timeout=15
                )
                
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    token = login_result.get('access_token')
                    log_test("User Login", True, f"Token: {token[:20]}...")
                    success_count += 1
                    
                    # 7. Protected Endpoint
                    print("\n🧪 TESZT 7: Protected Endpoint")
                    total_tests += 1
                    try:
                        profile_response = requests.get(
                            f"{backend_url}/api/auth/me",
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=15
                        )
                        
                        if profile_response.status_code == 200:
                            profile_data = profile_response.json()
                            log_test("Profile Access", True, f"Username: {profile_data.get('username')}")
                            log_test("User Credits", True, f"Credits: {profile_data.get('credits', 0)}")
                            success_count += 1
                        else:
                            log_test("Profile Access", False, f"HTTP {profile_response.status_code}")
                    except Exception as e:
                        log_test("Profile Access", False, f"Error: {str(e)}")
                        
                else:
                    log_test("User Login", False, f"HTTP {login_response.status_code}")
            except Exception as e:
                log_test("User Login", False, f"Error: {str(e)}")
                
        else:
            log_test("User Registration", False, f"HTTP {response.status_code}")
            print(f"   📄 Response: {response.text[:200]}...")
    except Exception as e:
        log_test("User Registration", False, f"Error: {str(e)}")
    
    # Eredmények
    print("\n" + "🏆" * 50)
    print(f"🏆 {environment_name.upper()} API TESZT EREDMÉNYEK 🏆")
    print("🏆" * 50)
    
    success_rate = (success_count / total_tests * 100) if total_tests > 0 else 0
    
    print(f"\n📊 STATISZTIKÁK:")
    print(f"   Összes teszt: {total_tests}")
    print(f"   Sikeres: {success_count}")
    print(f"   Sikertelen: {total_tests - success_count}")
    print(f"   Sikerességi arány: {success_rate:.1f}%")
    
    print(f"\n🎯 ÉRTÉKELÉS:")
    if success_rate >= 90:
        print("   🎊 TÖKÉLETES! API 100% működőképes!")
        print("   ✅ Összes funkció működik")
        print("   ✅ Authentication rendszer perfect")
        print("   ✅ Credit system operational")
        if environment_name == "LOCAL":
            print("   🚀 KÉSZEN ÁLL a Railway deployment-re!")
        else:
            print("   🚀 PRODUCTION READY!")
    elif success_rate >= 80:
        print("   ✅ KIVÁLÓ! API majdnem tökéletes!")
        print("   🔧 Kisebb finomhangolás szükséges")
    elif success_rate >= 60:
        print("   ⚠️ JÓ! Működik, de vannak problémák")
        print("   🔧 Néhány funkció javítást igényel")
    else:
        print("   ❌ PROBLÉMÁS! Jelentős hibák vannak")
        print("   🔧 Backend újraindítás vagy konfiguráció szükséges")
    
    print(f"\n👤 TESZT USER ADATOK:")
    print(f"   Username: {user_data['username']}")
    print(f"   Email: {user_data['email']}")
    print(f"   Password: {user_data['password']}")
    if token:
        print(f"   JWT Token: {token[:30]}...")
    
    print(f"\n🌐 API LINKEK:")
    print(f"   Backend API: {backend_url}")
    print(f"   API Docs: {backend_url}/docs")
    print(f"   Health Check: {backend_url}/health")
    
    print("")
    print("=" * 60)
    print(f"🏁 {environment_name.upper()} API TESZT BEFEJEZVE!")
    print("=" * 60)
    
    return success_rate >= 80

def main():
    print("🚀 LFA Legacy GO - Comprehensive API Tester")
    print("=" * 50)
    print("Lokális és production backend tesztelése")
    print("")
    
    # Választás
    print("🎯 TESZT OPCIÓK:")
    print("1. Lokális backend teszt (localhost:8000)")
    print("2. Production backend teszt (Railway URL)")
    print("3. Mindkettő tesztelése")
    print("")
    
    choice = input("Válassz opciót (1/2/3): ").strip()
    
    results = []
    
    if choice in ["1", "3"]:
        # Lokális teszt
        local_url = "http://localhost:8000"
        print(f"\n🏠 LOKÁLIS BACKEND TESZTELÉSE: {local_url}")
        input("Nyomj ENTER-t a lokális teszt indításához...")
        
        try:
            local_result = test_api_backend(local_url, "LOCAL")
            results.append(("LOCAL", local_result))
        except KeyboardInterrupt:
            print("\n⚡ Lokális teszt megszakítva!")
        except Exception as e:
            print(f"\n💥 Lokális teszt hiba: {e}")
            results.append(("LOCAL", False))
    
    if choice in ["2", "3"]:
        # Production teszt
        print(f"\n🌍 PRODUCTION BACKEND TESZTELÉSE")
        railway_url = input("Add meg a Railway backend URL-t (pl. https://your-app.railway.app): ").strip()
        
        if railway_url:
            input("Nyomj ENTER-t a production teszt indításához...")
            
            try:
                prod_result = test_api_backend(railway_url, "PRODUCTION")
                results.append(("PRODUCTION", prod_result))
            except KeyboardInterrupt:
                print("\n⚡ Production teszt megszakítva!")
            except Exception as e:
                print(f"\n💥 Production teszt hiba: {e}")
                results.append(("PRODUCTION", False))
        else:
            print("⚠️ Nincs Railway URL megadva, production teszt kihagyva.")
    
    # Összesítő
    if results:
        print("\n" + "🎊" * 60)
        print("🎊 TELJES TESZT ÖSSZESÍTŐ 🎊")
        print("🎊" * 60)
        
        for env, success in results:
            status = "✅ SIKER" if success else "❌ HIBA"
            print(f"   {env}: {status}")
        
        all_success = all(result[1] for result in results)
        
        if all_success:
            print("\n🏆 MINDEN TESZT SIKERES!")
            print("   ✅ Backend API tökéletesen működik")
            print("   ✅ Készen áll a production launch-ra")
        else:
            print("\n⚠️ VAN JAVÍTANIVALÓ")
            print("   🔧 Néhány környezetben problémák vannak")
    
    print("\n🚀 KÖVETKEZŐ LÉPÉSEK:")
    if choice in ["1", "3"] and any(r[0] == "LOCAL" and r[1] for r in results):
        print("   1. ✅ Lokális backend működik → Railway deployment")
        print("   2. 🚂 Railway CLI: railway login && railway up")
        print("   3. 🔄 Frontend environment variable update")
    
    if choice in ["2", "3"] and any(r[0] == "PRODUCTION" and r[1] for r in results):
        print("   1. ✅ Production backend működik → Launch ready!")
        print("   2. 🌐 Netlify frontend tesztelés")
        print("   3. 👥 User acceptance testing")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚡ Teszt megszakítva!")
    except Exception as e:
        print(f"\n\n💥 Váratlan hiba: {e}")