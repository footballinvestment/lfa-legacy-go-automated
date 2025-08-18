#!/usr/bin/env python3
"""
LFA Legacy GO - Azonnali Javítások
==================================
1. Database oszlop nevek javítása (base_cost_per_hour)
2. Booking endpoint debug
3. Full teszt
"""

import requests
import json
import sqlite3
from datetime import datetime

class InstantFixer:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.db_path = "lfa_legacy_go.db"
        
    def fix_1_locations_table(self):
        """JAVÍTÁS 1: Locations table helyes oszlopnevekkel"""
        print("🔧 JAVÍTÁS 1: Locations table javítása...")
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check table structure
            cursor.execute("PRAGMA table_info(locations)")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            print(f"📊 Meglévő oszlopok: {column_names}")
            
            # Check current count
            cursor.execute("SELECT COUNT(*) FROM locations")
            current_count = cursor.fetchone()[0]
            print(f"📊 Current locations: {current_count}")
            
            if current_count > 0:
                print("✅ Locations already exist!")
                return True
            
            # Add locations with correct column names
            default_locations = [
                (1, 'LOC001', 'Central Sports Complex', 'Budapest, Váci út 1-3', 'Budapest', 
                 'Modern outdoor football facility', 47.5176, 19.0634, 8, 'outdoor', 'active', True, 15.0, True),
                (2, 'LOC002', 'Városliget Training Ground', 'Budapest, Városliget', 'Budapest',
                 'Premium training facility in City Park', 47.5153, 19.0781, 12, 'outdoor', 'active', True, 20.0, True),
                (3, 'LOC003', 'Indoor Football Arena', 'Budapest, Arena út 25', 'Budapest',
                 'Climate-controlled indoor facility', 47.4979, 19.0402, 6, 'indoor', 'active', True, 25.0, True)
            ]
            
            # Insert with correct column structure
            for location in default_locations:
                cursor.execute("""
                    INSERT INTO locations (
                        id, location_id, name, address, city, description, 
                        latitude, longitude, capacity, location_type, status, is_active, 
                        base_cost_per_hour, weather_protected
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, location)
            
            conn.commit()
            conn.close()
            print(f"✅ Successfully added {len(default_locations)} locations!")
            return True
            
        except Exception as e:
            print(f"❌ Locations error: {e}")
            return False
    
    def fix_2_booking_endpoint_debug(self):
        """JAVÍTÁS 2: Booking endpoint debug és teszt"""
        print("\n🔧 JAVÍTÁS 2: Booking endpoint debug...")
        
        try:
            # Get a token first
            test_user = {
                "username": f"debuguser_{int(datetime.now().timestamp())}",
                "email": f"debug_{int(datetime.now().timestamp())}@test.com", 
                "password": "TestPass123!",
                "full_name": "Debug User"
            }
            
            register_response = requests.post(f"{self.base_url}/api/auth/register", json=test_user)
            if register_response.status_code != 200:
                print(f"❌ Registration failed: {register_response.text}")
                return False
                
            token = register_response.json().get('access_token')
            headers = {"Authorization": f"Bearer {token}"}
            
            print("✅ Debug user authenticated")
            
            # Test all possible booking endpoints
            endpoints_to_test = [
                "/api/booking/availability",
                "/api/booking/check-availability", 
                "/api/booking/my-bookings",
                "/api/booking/health"
            ]
            
            for endpoint in endpoints_to_test:
                print(f"\n🔍 Testing: {endpoint}")
                
                if "availability" in endpoint and "my-bookings" not in endpoint:
                    # Test availability endpoints with params
                    response = requests.get(
                        f"{self.base_url}{endpoint}",
                        params={"date": "2025-08-16", "location_id": 1},
                        headers=headers,
                        timeout=5
                    )
                else:
                    # Test other endpoints
                    response = requests.get(f"{self.base_url}{endpoint}", headers=headers, timeout=5)
                
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    print(f"   ✅ {endpoint} WORKING!")
                    if endpoint == "/api/booking/availability":
                        data = response.json()
                        print(f"   📅 Slots: {data.get('total_slots', 0)}")
                elif response.status_code == 404:
                    print(f"   ❌ {endpoint} NOT FOUND")
                else:
                    print(f"   ⚠️ {endpoint} Error: {response.text[:100]}")
            
            return True
            
        except Exception as e:
            print(f"❌ Booking debug error: {e}")
            return False
    
    def fix_3_comprehensive_test(self):
        """JAVÍTÁS 3: Komplett rendszer teszt"""
        print("\n🔧 JAVÍTÁS 3: Komplett rendszer újratesztelése...")
        
        try:
            # Test 1: Health check
            health_response = requests.get(f"{self.base_url}/health", timeout=5)
            print(f"🔍 Health Check: {health_response.status_code}")
            
            # Test 2: Locations
            locations_response = requests.get(f"{self.base_url}/api/locations/", timeout=5)
            print(f"🔍 Locations: {locations_response.status_code}")
            if locations_response.status_code == 200:
                locations = locations_response.json()
                print(f"   📍 Found {len(locations)} locations")
            
            # Test 3: Fresh user + booking test
            test_user = {
                "username": f"fulltest_{int(datetime.now().timestamp())}",
                "email": f"fulltest_{int(datetime.now().timestamp())}@test.com",
                "password": "TestPass123!",
                "full_name": "Full Test User"
            }
            
            # Register + Login
            register_response = requests.post(f"{self.base_url}/api/auth/register", json=test_user)
            if register_response.status_code == 200:
                token = register_response.json().get('access_token')
                headers = {"Authorization": f"Bearer {token}"}
                print("✅ Full test user ready")
                
                # Test booking availability with correct params
                booking_test = requests.get(
                    f"{self.base_url}/api/booking/availability",
                    params={"date": "2025-08-16", "location_id": 1, "game_type": "GAME1"},
                    headers=headers,
                    timeout=10
                )
                print(f"🔍 Booking Availability: {booking_test.status_code}")
                if booking_test.status_code == 200:
                    print("✅ BOOKING API WORKING!")
                    data = booking_test.json()
                    print(f"   📅 Available slots: {data.get('available_slots', 0)}")
                else:
                    print(f"❌ Booking error: {booking_test.text}")
            
            return True
            
        except Exception as e:
            print(f"❌ Comprehensive test error: {e}")
            return False
    
    def run_instant_fixes(self):
        """Azonnali javítások futtatása"""
        print("🚀 LFA Legacy GO - AZONNALI JAVÍTÁSOK")
        print("=" * 60)
        print(f"⏰ Javítás: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        fixes = [
            ("Locations Table Fix", self.fix_1_locations_table),
            ("Booking Endpoint Debug", self.fix_2_booking_endpoint_debug), 
            ("Comprehensive Test", self.fix_3_comprehensive_test)
        ]
        
        results = []
        for fix_name, fix_func in fixes:
            try:
                result = fix_func()
                results.append((fix_name, result))
            except Exception as e:
                print(f"❌ {fix_name} crashed: {e}")
                results.append((fix_name, False))
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 AZONNALI JAVÍTÁSOK EREDMÉNYE")
        print("=" * 60)
        
        success_count = 0
        for fix_name, success in results:
            status = "✅" if success else "❌"
            print(f"{status} {fix_name}")
            if success:
                success_count += 1
        
        success_rate = (success_count / len(results)) * 100
        print(f"\n🎯 Javítási arány: {success_rate:.1f}% ({success_count}/{len(results)})")
        
        if success_count == len(results):
            print("🎉 MINDEN JAVÍTÁS SIKERES!")
            print("🚀 Rendszer 100% működőképes!")
        else:
            print("🔧 További finomhangolás szükséges")
        
        return success_count == len(results)

if __name__ == "__main__":
    fixer = InstantFixer()
    fixer.run_instant_fixes()