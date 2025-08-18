#!/usr/bin/env python3
"""
LFA Legacy GO - Komplett Rendszer Teszt
========================================
Teljes backend + frontend integráció tesztelése
Minden funkció átfogó ellenőrzése
"""

import requests
import json
import time
import random
import string
from datetime import datetime
from typing import Dict, List, Any
import os

class LFASystemTester:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        self.test_results = []
        self.test_user = None
        self.auth_token = None
        self.start_time = time.time()
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Test eredmény naplózása"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details}")
        
        if response_data and not success:
            print(f"   🔍 Response: {response_data}")
    
    def generate_test_user(self):
        """Egyedi test user generálása"""
        timestamp = str(int(time.time()))
        random_suffix = ''.join(random.choices(string.ascii_lowercase, k=4))
        
        return {
            "username": f"testuser_{timestamp}_{random_suffix}",
            "email": f"test_{timestamp}_{random_suffix}@lfa-test.com",
            "password": "TestPass123!",
            "full_name": f"Test User {timestamp}"
        }
    
    def test_backend_health(self):
        """Backend alapvető egészség ellenőrzése"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Backend Health Check", True, 
                             f"Status: {data.get('status', 'unknown')}")
                return True
            else:
                self.log_test("Backend Health Check", False, 
                             f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Backend Health Check", False, f"Connection failed: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Felhasználó regisztráció tesztelése"""
        self.test_user = self.generate_test_user()
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=self.test_user,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('access_token')
                user_data = data.get('user', {})
                
                self.log_test("User Registration", True, 
                             f"User created: {user_data.get('username')} "
                             f"(ID: {user_data.get('id')}, Credits: {user_data.get('credits')})")
                return True
            else:
                error_data = response.json() if response.content else {}
                self.log_test("User Registration", False, 
                             f"HTTP {response.status_code}", error_data)
                return False
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_user_login(self):
        """Felhasználó bejelentkezés tesztelése"""
        if not self.test_user:
            self.log_test("User Login", False, "No test user available")
            return False
            
        try:
            login_data = {
                "username": self.test_user["username"],
                "password": self.test_user["password"]
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('access_token')
                user_data = data.get('user', {})
                
                self.log_test("User Login", True, 
                             f"Login successful for {user_data.get('username')}")
                return True
            else:
                error_data = response.json() if response.content else {}
                self.log_test("User Login", False, 
                             f"HTTP {response.status_code}", error_data)
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False
    
    def test_protected_endpoint_access(self):
        """Védett endpoint hozzáférés tesztelése"""
        if not self.auth_token:
            self.log_test("Protected Endpoint Access", False, "No auth token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.get(
                f"{self.base_url}/api/auth/me",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                user_data = response.json()
                self.log_test("Protected Endpoint Access", True, 
                             f"Profile accessed: {user_data.get('username')} "
                             f"(Level: {user_data.get('level')}, Credits: {user_data.get('credits')})")
                return True
            else:
                error_data = response.json() if response.content else {}
                self.log_test("Protected Endpoint Access", False, 
                             f"HTTP {response.status_code}", error_data)
                return False
                
        except Exception as e:
            self.log_test("Protected Endpoint Access", False, f"Exception: {str(e)}")
            return False
    
    def test_credits_system(self):
        """Credit rendszer tesztelése"""
        try:
            # Credit packages lekérdezése
            response = requests.get(f"{self.base_url}/api/credits/packages", timeout=10)
            
            if response.status_code == 200:
                packages = response.json()
                self.log_test("Credits System - Packages", True, 
                             f"Found {len(packages)} credit packages")
                
                # User credit balance ellenőrzése
                if self.auth_token:
                    headers = {"Authorization": f"Bearer {self.auth_token}"}
                    balance_response = requests.get(
                        f"{self.base_url}/api/credits/balance",
                        headers=headers,
                        timeout=10
                    )
                    
                    if balance_response.status_code == 200:
                        balance_data = balance_response.json()
                        self.log_test("Credits System - Balance", True, 
                                     f"User balance: {balance_data.get('credits')} credits")
                        return True
                    else:
                        self.log_test("Credits System - Balance", False, 
                                     f"HTTP {balance_response.status_code}")
                        return False
                else:
                    self.log_test("Credits System - Balance", False, "No auth token")
                    return False
                    
            else:
                error_data = response.json() if response.content else {}
                self.log_test("Credits System - Packages", False, 
                             f"HTTP {response.status_code}", error_data)
                return False
                
        except Exception as e:
            self.log_test("Credits System", False, f"Exception: {str(e)}")
            return False
    
    def test_locations_system(self):
        """Helyszín rendszer tesztelése"""
        try:
            response = requests.get(f"{self.base_url}/api/locations/", timeout=10)
            
            if response.status_code == 200:
                locations = response.json()
                self.log_test("Locations System", True, 
                             f"Found {len(locations)} locations")
                
                # Első helyszín részletes adatai
                if locations:
                    first_location = locations[0]
                    location_details = f"Location: {first_location.get('name')} " \
                                     f"(Type: {first_location.get('type')}, " \
                                     f"Capacity: {first_location.get('capacity')})"
                    print(f"   📍 {location_details}")
                
                return True
            else:
                error_data = response.json() if response.content else {}
                self.log_test("Locations System", False, 
                             f"HTTP {response.status_code}", error_data)
                return False
                
        except Exception as e:
            self.log_test("Locations System", False, f"Exception: {str(e)}")
            return False
    
    def test_tournaments_system(self):
        """Verseny rendszer tesztelése"""
        try:
            # Versenyek listázása
            response = requests.get(f"{self.base_url}/api/tournaments/", timeout=10)
            
            if response.status_code == 200:
                tournaments = response.json()
                self.log_test("Tournaments System - List", True, 
                             f"Found {len(tournaments)} tournaments")
                
                # Első verseny részletei
                if tournaments:
                    first_tournament = tournaments[0]
                    tournament_details = f"Tournament: {first_tournament.get('name')} " \
                                       f"(Entry fee: {first_tournament.get('entry_fee_credits')} credits, " \
                                       f"Participants: {first_tournament.get('current_participants')}/" \
                                       f"{first_tournament.get('max_participants')})"
                    print(f"   🏆 {tournament_details}")
                    
                    # Verseny regisztráció tesztelése (ha van auth token)
                    if self.auth_token and first_tournament.get('id'):
                        self.test_tournament_registration(first_tournament.get('id'), 
                                                        first_tournament.get('entry_fee_credits', 0))
                
                return True
            else:
                error_data = response.json() if response.content else {}
                self.log_test("Tournaments System - List", False, 
                             f"HTTP {response.status_code}", error_data)
                return False
                
        except Exception as e:
            self.log_test("Tournaments System", False, f"Exception: {str(e)}")
            return False
    
    def test_tournament_registration(self, tournament_id: int, entry_fee: int):
        """Verseny regisztráció tesztelése"""
        if not self.auth_token:
            self.log_test("Tournament Registration", False, "No auth token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.post(
                f"{self.base_url}/api/tournaments/{tournament_id}/register",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test("Tournament Registration", True, 
                             f"Successfully registered for tournament {tournament_id}")
                return True
            elif response.status_code == 400:
                error_data = response.json() if response.content else {}
                error_detail = error_data.get('detail', 'Unknown error')
                
                if "Insufficient credits" in error_detail:
                    self.log_test("Tournament Registration", True, 
                                 f"Expected credit check working: {error_detail}")
                    return True
                else:
                    self.log_test("Tournament Registration", False, 
                                 f"Unexpected error: {error_detail}")
                    return False
            else:
                error_data = response.json() if response.content else {}
                self.log_test("Tournament Registration", False, 
                             f"HTTP {response.status_code}", error_data)
                return False
                
        except Exception as e:
            self.log_test("Tournament Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_booking_system(self):
        """Foglalási rendszer tesztelése"""
        if not self.auth_token:
            self.log_test("Booking System", False, "No auth token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            # Foglalási lehetőségek lekérdezése
            today = datetime.now().strftime('%Y-%m-%d')
            response = requests.get(
                f"{self.base_url}/api/booking/availability?date={today}&location_id=1",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                availability = response.json()
                self.log_test("Booking System - Availability", True, 
                             f"Found availability data for {today}")
                
                # Saját foglalások lekérdezése
                bookings_response = requests.get(
                    f"{self.base_url}/api/booking/my-bookings",
                    headers=headers,
                    timeout=10
                )
                
                if bookings_response.status_code == 200:
                    bookings = bookings_response.json()
                    self.log_test("Booking System - My Bookings", True, 
                                 f"User has {len(bookings)} bookings")
                    return True
                else:
                    self.log_test("Booking System - My Bookings", False, 
                                 f"HTTP {bookings_response.status_code}")
                    return False
                    
            else:
                error_data = response.json() if response.content else {}
                self.log_test("Booking System - Availability", False, 
                             f"HTTP {response.status_code}", error_data)
                return False
                
        except Exception as e:
            self.log_test("Booking System", False, f"Exception: {str(e)}")
            return False
    
    def test_frontend_accessibility(self):
        """Frontend hozzáférhetőség tesztelése"""
        try:
            response = requests.get(self.frontend_url, timeout=5)
            
            if response.status_code == 200:
                # HTML tartalom alapvető ellenőrzése
                content = response.text
                if "lfa-legacy-go" in content.lower() or "react" in content.lower():
                    self.log_test("Frontend Accessibility", True, 
                                 "Frontend server responding")
                    return True
                else:
                    self.log_test("Frontend Accessibility", False, 
                                 "Unexpected content")
                    return False
            else:
                self.log_test("Frontend Accessibility", False, 
                             f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Frontend Accessibility", False, f"Connection failed: {str(e)}")
            return False
    
    def test_user_logout(self):
        """Felhasználó kijelentkezés tesztelése"""
        if not self.auth_token:
            self.log_test("User Logout", False, "No auth token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.post(
                f"{self.base_url}/api/auth/logout",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test("User Logout", True, "Successfully logged out")
                self.auth_token = None  # Clear token
                return True
            else:
                error_data = response.json() if response.content else {}
                self.log_test("User Logout", False, 
                             f"HTTP {response.status_code}", error_data)
                return False
                
        except Exception as e:
            self.log_test("User Logout", False, f"Exception: {str(e)}")
            return False
    
    def run_comprehensive_test(self):
        """Komplett rendszer teszt futtatása"""
        print("🚀 LFA Legacy GO - Komplett Rendszer Teszt")
        print("=" * 60)
        print(f"⏰ Teszt kezdés: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Test sorrend - logikus függőségek szerint
        tests = [
            ("Backend Health", self.test_backend_health),
            ("Frontend Accessibility", self.test_frontend_accessibility),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Protected Endpoint Access", self.test_protected_endpoint_access),
            ("Credits System", self.test_credits_system),
            ("Locations System", self.test_locations_system),
            ("Tournaments System", self.test_tournaments_system),
            ("Booking System", self.test_booking_system),
            ("User Logout", self.test_user_logout),
        ]
        
        successful_tests = 0
        total_tests = len(tests)
        
        for test_name, test_function in tests:
            print(f"\n🔬 Running: {test_name}")
            try:
                result = test_function()
                if result:
                    successful_tests += 1
            except Exception as e:
                self.log_test(test_name, False, f"Unexpected error: {str(e)}")
            
            time.sleep(0.5)  # Kis szünet a tesztek között
        
        # Eredmények összesítése
        self.generate_test_report(successful_tests, total_tests)
    
    def generate_test_report(self, successful_tests: int, total_tests: int):
        """Teszt eredmény jelentés generálása"""
        success_rate = (successful_tests / total_tests) * 100
        total_time = time.time() - self.start_time
        
        print("\n" + "=" * 60)
        print("📊 TESZT EREDMÉNYEK ÖSSZESÍTÉSE")
        print("=" * 60)
        print(f"✅ Sikeres tesztek: {successful_tests}/{total_tests}")
        print(f"📈 Sikerességi arány: {success_rate:.1f}%")
        print(f"⏱️  Összes idő: {total_time:.2f} másodperc")
        print()
        
        # Státusz értékelés
        if success_rate >= 90:
            status = "🟢 KIVÁLÓ - Produkció kész"
        elif success_rate >= 75:
            status = "🟡 JÓ - Kisebb javítások szükségesek"
        elif success_rate >= 50:
            status = "🟠 KÖZEPES - Jelentős javítások szükségesek"
        else:
            status = "🔴 GYENGE - Major problémák vannak"
        
        print(f"🎯 Általános állapot: {status}")
        print()
        
        # Részletes eredmények
        print("📋 RÉSZLETES EREDMÉNYEK:")
        print("-" * 40)
        for result in self.test_results:
            status_icon = "✅" if result["success"] else "❌"
            print(f"{status_icon} {result['test']}: {result['details']}")
        
        print()
        print("💡 KÖVETKEZŐ LÉPÉSEK:")
        print("-" * 40)
        
        failed_tests = [r for r in self.test_results if not r["success"]]
        if not failed_tests:
            print("🎉 Minden teszt sikeres! A rendszer produkció kész.")
        else:
            print("🔧 Javítandó területek:")
            for failed in failed_tests:
                print(f"   • {failed['test']}: {failed['details']}")
        
        # Fájlba mentés
        report_file = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump({
                "summary": {
                    "successful_tests": successful_tests,
                    "total_tests": total_tests,
                    "success_rate": success_rate,
                    "total_time": total_time,
                    "status": status,
                    "timestamp": datetime.now().isoformat()
                },
                "detailed_results": self.test_results
            }, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Részletes jelentés mentve: {report_file}")

if __name__ == "__main__":
    tester = LFASystemTester()
    tester.run_comprehensive_test()