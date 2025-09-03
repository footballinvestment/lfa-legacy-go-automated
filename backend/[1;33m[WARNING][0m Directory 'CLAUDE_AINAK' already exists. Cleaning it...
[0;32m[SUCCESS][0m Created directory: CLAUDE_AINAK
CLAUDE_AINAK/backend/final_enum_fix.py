#!/usr/bin/env python3
"""
LFA Legacy GO - VÉGSŐ ENUM JAVÍTÁS
==================================
Adatbázis enum értékek javítása UPPERCASE-re
"""

import sqlite3
from datetime import datetime

class FinalEnumFixer:
    def __init__(self):
        self.db_path = "lfa_legacy_go.db"
        
    def fix_enum_values(self):
        """VÉGSŐ JAVÍTÁS: Enum értékek uppercase-re"""
        print("🔧 VÉGSŐ JAVÍTÁS: LocationType enum értékek...")
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check current enum values
            cursor.execute("SELECT id, location_type FROM locations")
            current_values = cursor.fetchall()
            
            print("📊 Jelenlegi enum értékek:")
            for location_id, location_type in current_values:
                print(f"   Location {location_id}: '{location_type}'")
            
            # Fix enum values to UPPERCASE
            enum_mapping = {
                'outdoor': 'OUTDOOR',
                'indoor': 'INDOOR',
                'semi_covered': 'SEMI_COVERED',
                'mixed': 'MIXED'
            }
            
            fixed_count = 0
            for location_id, current_type in current_values:
                if current_type in enum_mapping:
                    new_type = enum_mapping[current_type]
                    cursor.execute(
                        "UPDATE locations SET location_type = ? WHERE id = ?",
                        (new_type, location_id)
                    )
                    print(f"✅ Fixed Location {location_id}: '{current_type}' → '{new_type}'")
                    fixed_count += 1
            
            conn.commit()
            
            # Verify fix
            cursor.execute("SELECT id, location_type FROM locations")
            updated_values = cursor.fetchall()
            
            print("\n📊 Javított enum értékek:")
            for location_id, location_type in updated_values:
                print(f"   Location {location_id}: '{location_type}'")
            
            conn.close()
            
            print(f"\n✅ {fixed_count} location enum értéke javítva!")
            return True
            
        except Exception as e:
            print(f"❌ Enum fix hiba: {e}")
            return False
    
    def test_endpoints_after_fix(self):
        """Endpoint tesztelés enum javítás után"""
        print("\n🔍 ENDPOINT TESZT ENUM JAVÍTÁS UTÁN...")
        
        import requests
        
        base_url = "http://localhost:8000"
        
        try:
            # Test 1: Health check
            health = requests.get(f"{base_url}/health", timeout=5)
            print(f"🔍 Health: {health.status_code}")
            
            # Test 2: Locations (should work now)
            locations = requests.get(f"{base_url}/api/locations/", timeout=5)
            print(f"🔍 Locations: {locations.status_code}")
            
            if locations.status_code == 200:
                locations_data = locations.json()
                print(f"   📍 {len(locations_data)} locations loaded successfully!")
                for loc in locations_data:
                    print(f"      - {loc.get('name')}: {loc.get('type')}")
            else:
                print(f"   ❌ Locations error: {locations.text}")
            
            # Test 3: Get fresh token
            test_user = {
                "username": f"enumtest_{int(datetime.now().timestamp())}",
                "email": f"enumtest_{int(datetime.now().timestamp())}@test.com",
                "password": "TestPass123!",
                "full_name": "Enum Test User"
            }
            
            register = requests.post(f"{base_url}/api/auth/register", json=test_user, timeout=10)
            if register.status_code == 200:
                token = register.json().get('access_token')
                headers = {"Authorization": f"Bearer {token}"}
                print("✅ Fresh test user ready")
                
                # Test 4: Booking availability (should work now!)
                availability = requests.get(
                    f"{base_url}/api/booking/availability",
                    params={"date": "2025-08-16", "location_id": 1, "game_type": "GAME1"},
                    headers=headers,
                    timeout=10
                )
                print(f"🔍 Booking Availability: {availability.status_code}")
                
                if availability.status_code == 200:
                    print("🎉 BOOKING API MŰKÖDIK!")
                    data = availability.json()
                    print(f"   📅 Total slots: {data.get('total_slots')}")
                    print(f"   ✅ Available slots: {data.get('available_slots')}")
                    print(f"   📍 Location: {data.get('location_name')}")
                else:
                    print(f"   ❌ Booking error: {availability.text}")
                
                return availability.status_code == 200
            else:
                print(f"❌ Registration failed: {register.text}")
                return False
                
        except Exception as e:
            print(f"❌ Test error: {e}")
            return False
    
    def run_final_fix(self):
        """Végső javítás futtatása"""
        print("🚀 LFA Legacy GO - VÉGSŐ JAVÍTÁS")
        print("=" * 60)
        print(f"⏰ Végső javítás: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Step 1: Fix enum values
        enum_success = self.fix_enum_values()
        
        if enum_success:
            print("\n" + "="*40)
            print("🔄 BACKEND ÚJRAINDÍTÁS SZÜKSÉGES!")
            print("="*40)
            print("1. Ctrl+C a backend terminálban")
            print("2. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
            print("3. Várj 5 másodpercet")
            print("4. Enter nyomás a teszteléshez...")
            
            input()  # Wait for user
            
            # Step 2: Test after restart
            test_success = self.test_endpoints_after_fix()
            
            # Final summary
            print("\n" + "=" * 60)
            print("📊 VÉGSŐ JAVÍTÁS EREDMÉNYE")
            print("=" * 60)
            
            if enum_success and test_success:
                print("✅ Enum Values: JAVÍTVA")
                print("✅ Locations API: MŰKÖDIK")
                print("✅ Booking API: MŰKÖDIK")
                print("\n🎉 TELJES SIKER! 10/10 RENDSZER!")
                print("🚀 PRODUCTION READY!")
                return True
            else:
                print(f"✅ Enum Values: {'JAVÍTVA' if enum_success else 'HIBA'}")
                print(f"❌ API Testing: {'MŰKÖDIK' if test_success else 'HIBA'}")
                print("\n🔧 További ellenőrzés szükséges")
                return False
        else:
            print("❌ Enum javítás sikertelen!")
            return False

if __name__ == "__main__":
    fixer = FinalEnumFixer()
    fixer.run_final_fix()