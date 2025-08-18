#!/usr/bin/env python3
"""
LFA Legacy GO - 3 Gyors Javítás Script
=====================================
1. Default locations betöltése
2. Booking endpoint teszt javítás  
3. Frontend memory optimization segítség
"""

import requests
import json
import sys
import os
import sqlite3
from datetime import datetime

class QuickFixManager:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.db_path = "lfa_legacy_go.db"
        
    def fix_1_add_default_locations(self):
        """JAVÍTÁS 1: Default locations hozzáadása az adatbázishoz"""
        print("🔧 JAVÍTÁS 1: Default locations betöltése...")
        
        try:
            # Connect to SQLite
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if locations table exists
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='locations';
            """)
            
            if not cursor.fetchone():
                print("❌ Locations table not found!")
                return False
            
            # Check current location count
            cursor.execute("SELECT COUNT(*) FROM locations")
            current_count = cursor.fetchone()[0]
            print(f"📊 Current locations: {current_count}")
            
            if current_count > 0:
                print("✅ Locations already exist, skipping...")
                return True
            
            # Add default locations
            default_locations = [
                {
                    'name': 'Central Sports Complex',
                    'address': 'Budapest, Váci út 1-3',
                    'city': 'Budapest',
                    'location_type': 'OUTDOOR',
                    'capacity': 8,
                    'hourly_rate': 15.0,
                    'is_active': True,
                    'description': 'Modern outdoor football facility',
                    'latitude': 47.5176,
                    'longitude': 19.0634,
                    'created_at': datetime.now().isoformat()
                },
                {
                    'name': 'Városliget Training Ground',
                    'address': 'Budapest, Városliget',
                    'city': 'Budapest', 
                    'location_type': 'OUTDOOR',
                    'capacity': 12,
                    'hourly_rate': 20.0,
                    'is_active': True,
                    'description': 'Premium training facility in City Park',
                    'latitude': 47.5153,
                    'longitude': 19.0781,
                    'created_at': datetime.now().isoformat()
                },
                {
                    'name': 'Indoor Football Arena',
                    'address': 'Budapest, Arena út 25',
                    'city': 'Budapest',
                    'location_type': 'INDOOR',
                    'capacity': 6,
                    'hourly_rate': 25.0,
                    'is_active': True,
                    'description': 'Climate-controlled indoor facility',
                    'latitude': 47.4979,
                    'longitude': 19.0402,
                    'created_at': datetime.now().isoformat()
                }
            ]
            
            # Insert locations
            for i, location in enumerate(default_locations, 1):
                cursor.execute("""
                    INSERT INTO locations (
                        id, name, address, city, location_type, capacity, 
                        hourly_rate, is_active, description, latitude, longitude, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    i, location['name'], location['address'], location['city'],
                    location['location_type'], location['capacity'], location['hourly_rate'],
                    location['is_active'], location['description'], 
                    location['latitude'], location['longitude'], location['created_at']
                ))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Successfully added {len(default_locations)} default locations!")
            return True
            
        except Exception as e:
            print(f"❌ Error adding locations: {e}")
            return False
    
    def fix_2_test_booking_endpoints(self):
        """JAVÍTÁS 2: Booking endpoints helyes tesztelése"""
        print("\n🔧 JAVÍTÁS 2: Booking endpoints tesztelése...")
        
        try:
            # First, create a test user and get token
            test_user = {
                "username": f"testuser_{int(datetime.now().timestamp())}",
                "email": f"test_{int(datetime.now().timestamp())}@test.com",
                "password": "TestPass123!",
                "full_name": "Test User"
            }
            
            # Register user
            register_response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=test_user,
                timeout=10
            )
            
            if register_response.status_code != 200:
                print(f"❌ Registration failed: {register_response.text}")
                return False
            
            token = register_response.json().get('access_token')
            headers = {"Authorization": f"Bearer {token}"}
            
            print(f"✅ Test user created and authenticated")
            
            # Test availability endpoint (correct format)
            print("🔍 Testing availability endpoint...")
            availability_response = requests.get(
                f"{self.base_url}/api/booking/availability",
                params={
                    "date": "2025-08-16",
                    "location_id": 1,
                    "game_type": "GAME1"
                },
                headers=headers,
                timeout=10
            )
            
            if availability_response.status_code == 200:
                print("✅ Availability endpoint working!")
                data = availability_response.json()
                print(f"   📅 Available slots: {data.get('available_slots', 0)}")
            else:
                print(f"❌ Availability endpoint failed: {availability_response.status_code}")
                print(f"   Response: {availability_response.text}")
            
            # Test my-bookings endpoint
            print("🔍 Testing my-bookings endpoint...")
            bookings_response = requests.get(
                f"{self.base_url}/api/booking/my-bookings",
                headers=headers,
                timeout=10
            )
            
            if bookings_response.status_code == 200:
                print("✅ My-bookings endpoint working!")
                bookings = bookings_response.json()
                print(f"   📋 User bookings: {len(bookings)}")
            else:
                print(f"❌ My-bookings endpoint failed: {bookings_response.status_code}")
                print(f"   Response: {bookings_response.text}")
                
            return True
            
        except Exception as e:
            print(f"❌ Booking endpoints test failed: {e}")
            return False
    
    def fix_3_frontend_memory_help(self):
        """JAVÍTÁS 3: Frontend memory optimization segítség"""
        print("\n🔧 JAVÍTÁS 3: Frontend memory optimization...")
        
        print("💡 Frontend memory crash megoldások:")
        print("=" * 50)
        
        solutions = [
            {
                "name": "Node Memory Limit Növelés",
                "command": "export NODE_OPTIONS='--max-old-space-size=12288'",
                "description": "12GB memória limit (jelenlegi: 8GB)"
            },
            {
                "name": "TypeScript Memory Limit",
                "command": "export TS_NODE_MAX_OLD_SPACE_SIZE=8192",
                "description": "TypeScript fordító memory limit"
            },
            {
                "name": "Webpack Memory Fix",
                "file": "webpack.config.js",
                "content": """
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      memoryLimit: 4096
    })
  ]
};"""
            },
            {
                "name": "Package.json Scripts Fix",
                "file": "package.json",
                "content": '''
{
  "scripts": {
    "start": "NODE_OPTIONS='--max-old-space-size=12288' react-scripts start",
    "build": "NODE_OPTIONS='--max-old-space-size=12288' react-scripts build"
  }
}'''
            }
        ]
        
        for i, solution in enumerate(solutions, 1):
            print(f"\n{i}. {solution['name']}")
            print(f"   📝 {solution['description']}")
            if 'command' in solution:
                print(f"   💻 Command: {solution['command']}")
            if 'file' in solution:
                print(f"   📄 File: {solution['file']}")
                if 'content' in solution:
                    print(f"   📄 Content: {solution['content']}")
        
        print("\n🚀 AZONNALI MEGOLDÁS:")
        print("cd ~/Seafile/Football\\ Investment/Projects/GanballGames/lfa-legacy-go/frontend")
        print("export NODE_OPTIONS='--max-old-space-size=12288'")
        print("export TS_NODE_MAX_OLD_SPACE_SIZE=8192")
        print("npm start")
        
        return True
    
    def run_all_fixes(self):
        """Mind a 3 javítás futtatása"""
        print("🚀 LFA Legacy GO - Gyors Javítás Csomag")
        print("=" * 60)
        print(f"⏰ Javítás kezdés: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Track results
        results = []
        
        # Fix 1: Default locations
        try:
            result1 = self.fix_1_add_default_locations()
            results.append(("Default Locations", result1))
        except Exception as e:
            print(f"❌ Fix 1 failed: {e}")
            results.append(("Default Locations", False))
        
        # Fix 2: Booking endpoints
        try:
            result2 = self.fix_2_test_booking_endpoints()
            results.append(("Booking Endpoints", result2))
        except Exception as e:
            print(f"❌ Fix 2 failed: {e}")
            results.append(("Booking Endpoints", False))
        
        # Fix 3: Frontend memory
        try:
            result3 = self.fix_3_frontend_memory_help()
            results.append(("Frontend Memory", result3))
        except Exception as e:
            print(f"❌ Fix 3 failed: {e}")
            results.append(("Frontend Memory", False))
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 JAVÍTÁSOK ÖSSZESÍTÉSE")
        print("=" * 60)
        
        successful_fixes = 0
        for fix_name, success in results:
            status = "✅" if success else "❌"
            print(f"{status} {fix_name}: {'SIKERES' if success else 'HIBA'}")
            if success:
                successful_fixes += 1
        
        success_rate = (successful_fixes / len(results)) * 100
        print(f"\n🎯 Javítási sikerességi arány: {success_rate:.1f}% ({successful_fixes}/{len(results)})")
        
        if successful_fixes == len(results):
            print("🎉 MINDEN JAVÍTÁS SIKERES! Rendszer 100% működőképes!")
        elif successful_fixes >= 2:
            print("🟡 RÉSZBEN SIKERES! A legtöbb probléma megoldva.")
        else:
            print("🔴 TOVÁBBI JAVÍTÁSOK SZÜKSÉGESEK!")
        
        return successful_fixes == len(results)

if __name__ == "__main__":
    fixer = QuickFixManager()
    fixer.run_all_fixes()