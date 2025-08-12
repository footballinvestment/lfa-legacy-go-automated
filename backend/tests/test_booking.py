#!/usr/bin/env python3
# === test_booking.py ===
# Complete Game Booking Flow Test Script

import requests
import json
from datetime import datetime, timedelta

# API Configuration
API_BASE = "http://localhost:8000"
TEST_USER = {
    "username": "testuser",
    "password": "testpass123",
    "email": "test@lfago.com",
    "full_name": "Test User"
}

class LFATestClient:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
    
    def register_user(self):
        """Register test user"""
        print("🔄 Registering test user...")
        response = self.session.post(
            f"{API_BASE}/api/auth/register",
            json=TEST_USER
        )
        if response.status_code == 201:
            print("✅ User registered successfully")
            return True
        elif response.status_code == 400 and "already registered" in response.text:
            print("ℹ️  User already exists")
            return True
        else:
            print(f"❌ Registration failed: {response.status_code} - {response.text}")
            return False
    
    def login(self):
        """Login and get JWT token"""
        print("🔄 Logging in...")
        response = self.session.post(
            f"{API_BASE}/api/auth/login",
            data={
                "username": TEST_USER["username"],
                "password": TEST_USER["password"]
            }
        )
        if response.status_code == 200:
            data = response.json()
            self.token = data["access_token"]
            self.user_id = data["user"]["id"]
            self.session.headers.update({
                "Authorization": f"Bearer {self.token}"
            })
            print(f"✅ Login successful! User ID: {self.user_id}")
            return True
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
    
    def make_admin(self):
        """Make user admin"""
        print("🔄 Making user admin...")
        response = self.session.post(
            f"{API_BASE}/api/auth/make-admin",
            params={"username": TEST_USER["username"]}
        )
        if response.status_code == 200:
            print("✅ User is now admin")
            return True
        else:
            print(f"❌ Make admin failed: {response.status_code} - {response.text}")
            return False
    
    def init_data(self):
        """Initialize default locations and games"""
        print("🔄 Initializing default data...")
        response = self.session.post(f"{API_BASE}/api/locations/admin/init-data")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Data initialized!")
            print(f"   Locations: {data.get('locations_created', [])}")
            print(f"   Games: {data.get('games_created', [])}")
            return True
        else:
            print(f"❌ Data initialization failed: {response.status_code} - {response.text}")
            return False
    
    def get_credits(self):
        """Get current credit balance"""
        response = self.session.get(f"{API_BASE}/api/auth/me")
        if response.status_code == 200:
            data = response.json()
            credits = data.get("credits", 0)
            print(f"💰 Current credits: {credits}")
            return credits
        else:
            print(f"❌ Failed to get credits: {response.status_code}")
            return 0
    
    def get_locations(self):
        """Get available locations"""
        print("🔄 Getting locations...")
        response = self.session.get(f"{API_BASE}/api/locations")
        if response.status_code == 200:
            locations = response.json()
            print(f"✅ Found {len(locations)} locations:")
            for loc in locations:
                print(f"   ID: {loc['id']} - {loc['name']} ({loc['location_id']})")
            return locations
        else:
            print(f"❌ Failed to get locations: {response.status_code}")
            return []
    
    def get_games(self):
        """Get available games"""
        print("🔄 Getting game definitions...")
        response = self.session.get(f"{API_BASE}/api/locations/games/definitions")
        if response.status_code == 200:
            games = response.json()
            print(f"✅ Found {len(games)} games:")
            for game in games:
                print(f"   ID: {game['id']} - {game['name']} ({game['game_id']}) - {game['credit_cost']} credits")
            return games
        else:
            print(f"❌ Failed to get games: {response.status_code}")
            return []
    
    def check_availability(self, location_id):
        """Check availability for location"""
        print(f"🔄 Checking availability for location {location_id}...")
        today = datetime.now().strftime("%Y-%m-%d")
        response = self.session.get(
            f"{API_BASE}/api/locations/{location_id}/availability",
            params={"date": today}
        )
        if response.status_code == 200:
            data = response.json()
            slots = data.get("available_slots", [])
            print(f"✅ Found {len(slots)} available slots")
            if slots:
                print(f"   First slot: {slots[0]['start_time']}")
            return slots
        else:
            print(f"❌ Failed to check availability: {response.status_code} - {response.text}")
            return []
    
    def book_game(self, location_id, game_id, start_time=None):
        """Book a game session"""
        if not start_time:
            # Default to tomorrow 2 PM
            tomorrow = datetime.now() + timedelta(days=1)
            start_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)
        
        booking_data = {
            "game_definition_id": game_id,
            "start_time": start_time.isoformat(),
            "players": [
                {
                    "user_id": self.user_id,
                    "status": "confirmed"
                }
            ]
        }
        
        print(f"🔄 Booking game {game_id} at location {location_id}...")
        print(f"   Time: {start_time}")
        
        response = self.session.post(
            f"{API_BASE}/api/locations/{location_id}/book",
            json=booking_data
        )
        
        if response.status_code == 201:
            data = response.json()
            session_id = data.get("session_id")
            print(f"✅ Booking successful!")
            print(f"   Session ID: {session_id}")
            print(f"   Total cost: {data.get('total_cost')} credits")
            return data
        else:
            print(f"❌ Booking failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   Error: {response.text}")
            return None
    
    def get_my_sessions(self):
        """Get my booked sessions"""
        print("🔄 Getting my sessions...")
        response = self.session.get(f"{API_BASE}/api/locations/sessions/my")
        if response.status_code == 200:
            sessions = response.json()
            print(f"✅ Found {len(sessions)} sessions:")
            for session in sessions:
                print(f"   {session['session_id']} - {session['status']} - {session['start_time']}")
            return sessions
        else:
            print(f"❌ Failed to get sessions: {response.status_code}")
            return []

def main():
    """Main test flow"""
    print("🚀 LFA Legacy GO - Game Booking Test")
    print("=" * 50)
    
    client = LFATestClient()
    
    # 1. Setup user
    if not client.register_user():
        return
    
    if not client.login():
        return
    
    if not client.make_admin():
        return
    
    # 2. Initialize data
    if not client.init_data():
        return
    
    # 3. Check initial credits
    initial_credits = client.get_credits()
    
    # 4. Get locations and games
    locations = client.get_locations()
    games = client.get_games()
    
    if not locations or not games:
        print("❌ No locations or games available")
        return
    
    # 5. Test booking flow
    location_id = locations[0]["id"]  # Use first location
    game_id = games[0]["id"]  # Use first game (cheapest)
    game_cost = games[0]["credit_cost"]
    
    print(f"\n📅 Testing booking flow:")
    print(f"   Location: {locations[0]['name']} (ID: {location_id})")
    print(f"   Game: {games[0]['name']} (ID: {game_id})")
    print(f"   Cost: {game_cost} credits")
    
    # 6. Check availability
    slots = client.check_availability(location_id)
    
    # 7. Book game
    booking = client.book_game(location_id, game_id)
    
    if booking:
        # 8. Check credits after booking
        new_credits = client.get_credits()
        spent = initial_credits - new_credits
        print(f"💰 Credits spent: {spent} (expected: {game_cost})")
        
        # 9. Check my sessions
        client.get_my_sessions()
        
        print("\n🎉 BOOKING TEST SUCCESSFUL!")
    else:
        print("\n❌ BOOKING TEST FAILED!")

if __name__ == "__main__":
    main()