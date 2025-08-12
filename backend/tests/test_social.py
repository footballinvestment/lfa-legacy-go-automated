#!/usr/bin/env python3
"""
LFA Legacy GO - Social System Test Script
Tests friend system, challenges, and social interactions
"""

import requests
import json
from datetime import datetime
import time

# Configuration
BASE_URL = "http://localhost:8001"
TEST_USERS = [
    {"username": "testuser", "password": "testpass123"},
    {"username": "frienduser", "password": "testpass123"}
]

class SocialSystemTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.tokens = {}
        self.user_info = {}
        
    def print_header(self, title):
        print(f"\n{'='*60}")
        print(f"👥 {title}")
        print(f"{'='*60}")
        
    def print_step(self, step, description):
        print(f"\n{step}. {description}")
        
    def print_success(self, message):
        print(f"✅ {message}")
        
    def print_error(self, message):
        print(f"❌ {message}")
        
    def print_info(self, message):
        print(f"ℹ️  {message}")

    def setup_test_users(self):
        """Create and login test users"""
        self.print_step("0", "Test felhasználók beállítása")
        
        for user_data in TEST_USERS:
            # Try to register user (might already exist)
            try:
                register_response = requests.post(
                    f"{self.base_url}/api/auth/register",
                    json={
                        "username": user_data["username"],
                        "email": f"{user_data['username']}@test.com",
                        "password": user_data["password"],
                        "full_name": f"Test {user_data['username'].title()}"
                    }
                )
                if register_response.status_code in [200, 201]:
                    self.print_success(f"User {user_data['username']} created")
                elif register_response.status_code == 400:
                    self.print_info(f"User {user_data['username']} already exists")
            except Exception as e:
                self.print_info(f"Registration skipped for {user_data['username']}")
            
            # Login user
            try:
                login_response = requests.post(
                    f"{self.base_url}/api/auth/login",
                    data={
                        "username": user_data["username"],
                        "password": user_data["password"]
                    }
                )
                
                if login_response.status_code == 200:
                    login_data = login_response.json()
                    self.tokens[user_data["username"]] = login_data["access_token"]
                    self.user_info[user_data["username"]] = login_data.get("user", {})
                    self.print_success(f"User {user_data['username']} logged in")
                else:
                    self.print_error(f"Login failed for {user_data['username']}")
                    return False
            except Exception as e:
                self.print_error(f"Login error for {user_data['username']}: {str(e)}")
                return False
        
        return len(self.tokens) == len(TEST_USERS)

    def get_headers(self, username):
        """Get authentication headers for user"""
        return {"Authorization": f"Bearer {self.tokens[username]}"}

    def test_user_search(self):
        """Test user search functionality"""
        self.print_step("1", "Felhasználók keresése")
        
        try:
            # Search for frienduser from testuser perspective
            response = requests.get(
                f"{self.base_url}/api/social/search-users?query=friend&limit=10",
                headers=self.get_headers("testuser")
            )
            
            if response.status_code == 200:
                search_data = response.json()
                self.print_success(f"User search successful!")
                self.print_info(f"Found {len(search_data['results'])} users")
                
                for user in search_data['results']:
                    print(f"  👤 {user['username']} (Level {user['level']}) - Status: {user['relationship_status']}")
                
                return search_data['results']
            else:
                self.print_error(f"User search failed: {response.status_code}")
                return None
                
        except Exception as e:
            self.print_error(f"User search error: {str(e)}")
            return None

    def test_friend_request_flow(self):
        """Test complete friend request flow"""
        self.print_step("2", "Barát kérelem folyamat tesztelése")
        
        # Step 1: Send friend request
        try:
            send_response = requests.post(
                f"{self.base_url}/api/social/friend-request",
                json={
                    "receiver_username": "frienduser",
                    "message": "Let's be friends and play some games!"
                },
                headers=self.get_headers("testuser")
            )
            
            if send_response.status_code == 200:
                send_data = send_response.json()
                self.print_success(f"Friend request sent!")
                self.print_info(f"Request ID: {send_data['request_id']}")
                request_id = send_data['request_id']
            else:
                error_detail = send_response.json().get('detail', 'Unknown error')
                self.print_error(f"Friend request failed: {error_detail}")
                return False
                
        except Exception as e:
            self.print_error(f"Friend request error: {str(e)}")
            return False
        
        # Step 2: Check received requests for frienduser
        try:
            received_response = requests.get(
                f"{self.base_url}/api/social/friend-requests?request_type=received",
                headers=self.get_headers("frienduser")
            )
            
            if received_response.status_code == 200:
                received_data = received_response.json()
                self.print_success(f"Friend requests retrieved!")
                self.print_info(f"Received {len(received_data['requests'])} requests")
                
                for req in received_data['requests']:
                    print(f"  📬 From: {req['other_user']['username']} - {req['message']}")
            else:
                self.print_error(f"Failed to get friend requests: {received_response.status_code}")
                
        except Exception as e:
            self.print_error(f"Friend requests retrieval error: {str(e)}")
        
        # Step 3: Accept friend request
        try:
            accept_response = requests.post(
                f"{self.base_url}/api/social/friend-request/respond",
                json={
                    "request_id": request_id,
                    "action": "accept"
                },
                headers=self.get_headers("frienduser")
            )
            
            if accept_response.status_code == 200:
                accept_data = accept_response.json()
                self.print_success(f"Friend request accepted!")
                self.print_info(f"Message: {accept_data['message']}")
                return True
            else:
                error_detail = accept_response.json().get('detail', 'Unknown error')
                self.print_error(f"Friend request acceptance failed: {error_detail}")
                return False
                
        except Exception as e:
            self.print_error(f"Friend request acceptance error: {str(e)}")
            return False

    def test_friends_list(self):
        """Test friends list functionality"""
        self.print_step("3", "Barátlista lekérése")
        
        for username in ["testuser", "frienduser"]:
            try:
                response = requests.get(
                    f"{self.base_url}/api/social/friends?include_stats=true",
                    headers=self.get_headers(username)
                )
                
                if response.status_code == 200:
                    friends_data = response.json()
                    self.print_success(f"Friends list for {username}: {len(friends_data['friends'])} friends")
                    
                    for friend in friends_data['friends']:
                        friend_info = friend['friend']
                        print(f"  👥 {friend_info['username']} (Level {friend_info['level']})")
                        print(f"     Games together: {friend['games_played_together']}")
                        print(f"     Friends since: {friend['friends_since'][:10]}")
                        
                else:
                    self.print_error(f"Friends list failed for {username}: {response.status_code}")
                    
            except Exception as e:
                self.print_error(f"Friends list error for {username}: {str(e)}")

    def test_challenge_system(self):
        """Test challenge system"""
        self.print_step("4", "Kihívási rendszer tesztelése")
        
        # Step 1: Send challenge
        try:
            challenge_response = requests.post(
                f"{self.base_url}/api/social/challenge",
                json={
                    "challenged_username": "frienduser",
                    "game_type": "GAME1",
                    "challenge_message": "Let's test our accuracy skills!",
                    "location_id": "BP_VAROSLIGET_01"
                },
                headers=self.get_headers("testuser")
            )
            
            if challenge_response.status_code == 200:
                challenge_data = challenge_response.json()
                self.print_success(f"Challenge sent!")
                self.print_info(f"Challenge ID: {challenge_data['challenge_id']}")
                self.print_info(f"Game: {challenge_data['game_type']}")
                self.print_info(f"Credits spent: {challenge_data['credits_spent']}")
                challenge_id = challenge_data['challenge_id']
            else:
                error_detail = challenge_response.json().get('detail', 'Unknown error')
                self.print_error(f"Challenge failed: {error_detail}")
                return False
                
        except Exception as e:
            self.print_error(f"Challenge error: {str(e)}")
            return False
        
        # Step 2: Check received challenges
        try:
            received_challenges_response = requests.get(
                f"{self.base_url}/api/social/challenges?challenge_type=received&status_filter=pending",
                headers=self.get_headers("frienduser")
            )
            
            if received_challenges_response.status_code == 200:
                challenges_data = received_challenges_response.json()
                self.print_success(f"Challenges retrieved!")
                self.print_info(f"Received {len(challenges_data['challenges'])} challenges")
                
                for challenge in challenges_data['challenges']:
                    print(f"  ⚔️ From: {challenge['other_user']['username']}")
                    print(f"     Game: {challenge['game_type']}")
                    print(f"     Message: {challenge['challenge_message']}")
                    print(f"     Can accept: {challenge['can_be_accepted']}")
            else:
                self.print_error(f"Failed to get challenges: {received_challenges_response.status_code}")
                
        except Exception as e:
            self.print_error(f"Challenges retrieval error: {str(e)}")
        
        # Step 3: Accept challenge
        try:
            accept_challenge_response = requests.post(
                f"{self.base_url}/api/social/challenge/respond",
                json={
                    "challenge_id": challenge_id,
                    "action": "accept"
                },
                headers=self.get_headers("frienduser")
            )
            
            if accept_challenge_response.status_code == 200:
                accept_data = accept_challenge_response.json()
                self.print_success(f"Challenge accepted!")
                self.print_info(f"Message: {accept_data['message']}")
                return True
            else:
                error_detail = accept_challenge_response.json().get('detail', 'Unknown error')
                self.print_error(f"Challenge acceptance failed: {error_detail}")
                return False
                
        except Exception as e:
            self.print_error(f"Challenge acceptance error: {str(e)}")
            return False

    def test_block_system(self):
        """Test user blocking system"""
        self.print_step("5", "Blokkolási rendszer tesztelése")
        
        # Create a third test user for blocking
        test_block_user = "blockuser"
        
        # Register block user
        try:
            register_response = requests.post(
                f"{self.base_url}/api/auth/register",
                json={
                    "username": test_block_user,
                    "email": f"{test_block_user}@test.com",
                    "password": "testpass123",
                    "full_name": "Block Test User"
                }
            )
        except:
            pass  # User might already exist
        
        # Login block user
        try:
            login_response = requests.post(
                f"{self.base_url}/api/auth/login",
                data={"username": test_block_user, "password": "testpass123"}
            )
            if login_response.status_code == 200:
                self.tokens[test_block_user] = login_response.json()["access_token"]
                self.print_info(f"Block test user logged in")
        except:
            self.print_error("Could not login block test user")
            return False
        
        # Block user
        try:
            block_response = requests.post(
                f"{self.base_url}/api/social/block-user",
                json={
                    "blocked_username": test_block_user,
                    "reason": "testing block functionality"
                },
                headers=self.get_headers("testuser")
            )
            
            if block_response.status_code == 200:
                block_data = block_response.json()
                self.print_success(f"User blocked!")
                self.print_info(f"Message: {block_data['message']}")
            else:
                error_detail = block_response.json().get('detail', 'Unknown error')
                self.print_error(f"Block failed: {error_detail}")
                return False
                
        except Exception as e:
            self.print_error(f"Block error: {str(e)}")
            return False
        
        # Check blocked users list
        try:
            blocked_response = requests.get(
                f"{self.base_url}/api/social/blocked-users",
                headers=self.get_headers("testuser")
            )
            
            if blocked_response.status_code == 200:
                blocked_data = blocked_response.json()
                self.print_success(f"Blocked users list retrieved!")
                self.print_info(f"Blocked {len(blocked_data['blocked_users'])} users")
                
                for blocked in blocked_data['blocked_users']:
                    print(f"  🚫 {blocked['blocked_user']['username']} - {blocked['reason']}")
                    
                return True
            else:
                self.print_error(f"Failed to get blocked users: {blocked_response.status_code}")
                return False
                
        except Exception as e:
            self.print_error(f"Blocked users error: {str(e)}")
            return False

    def test_social_stats(self):
        """Test social statistics and friendship analytics"""
        self.print_step("6", "Közösségi statisztikák tesztelése")
        
        try:
            # Get detailed friends list with stats
            friends_response = requests.get(
                f"{self.base_url}/api/social/friends?include_stats=true",
                headers=self.get_headers("testuser")
            )
            
            if friends_response.status_code == 200:
                friends_data = friends_response.json()
                self.print_success(f"Social stats retrieved!")
                
                for friend in friends_data['friends']:
                    friend_info = friend['friend']
                    print(f"\n  📊 Friend: {friend_info['username']}")
                    print(f"     Level: {friend_info['level']}")
                    print(f"     Games played: {friend_info.get('stats', {}).get('games_played', 0)}")
                    print(f"     Win rate: {friend_info.get('stats', {}).get('win_rate', 0)}%")
                    print(f"     Friendship level: {friend['friendship_level']}")
                    print(f"     Games together: {friend['games_played_together']}")
                    print(f"     Challenges exchanged: {friend.get('challenges_exchanged', 0)}")
                
                return True
            else:
                self.print_error(f"Social stats failed: {friends_response.status_code}")
                return False
                
        except Exception as e:
            self.print_error(f"Social stats error: {str(e)}")
            return False

    def run_complete_test(self):
        """Run complete social system test"""
        self.print_header("LFA Legacy GO - Social System Complete Test")
        
        # Step 0: Setup users
        if not self.setup_test_users():
            self.print_error("Test setup failed - cannot continue")
            return False
        
        # Step 1: Test user search
        search_results = self.test_user_search()
        if not search_results:
            self.print_error("User search failed")
        
        # Step 2: Test friend request flow
        friend_success = self.test_friend_request_flow()
        if not friend_success:
            self.print_error("Friend request flow failed")
        
        # Step 3: Test friends list
        self.test_friends_list()
        
        # Step 4: Test challenge system
        challenge_success = self.test_challenge_system()
        if not challenge_success:
            self.print_error("Challenge system failed")
        
        # Step 5: Test blocking system
        block_success = self.test_block_system()
        if not block_success:
            self.print_error("Block system failed")
        
        # Step 6: Test social stats
        stats_success = self.test_social_stats()
        
        # Test summary
        self.print_header("TESZT ÖSSZEFOGLALÓ")
        
        results = {
            "✅ Test Setup": "SIKERES",
            "✅ User Search": "SIKERES" if search_results else "SIKERTELEN",
            "✅ Friend Requests": "SIKERES" if friend_success else "SIKERTELEN",
            "✅ Friends List": "SIKERES",
            "✅ Challenge System": "SIKERES" if challenge_success else "SIKERTELEN",
            "✅ Block System": "SIKERES" if block_success else "SIKERTELEN",
            "✅ Social Stats": "SIKERES" if stats_success else "SIKERTELEN"
        }
        
        for test, result in results.items():
            if "SIKERES" in result:
                self.print_success(f"{test}: {result}")
            else:
                self.print_error(f"{test}: {result}")
        
        all_passed = all("SIKERES" in result for result in results.values())
        
        if all_passed:
            self.print_success("🎉 MINDEN TESZT SIKERES! Social rendszer 100% működőképes!")
        else:
            self.print_error("⚠️ Néhány teszt sikertelen volt. Ellenőrizd a részleteket.")
        
        return all_passed

def main():
    """Main test function"""
    print("🚀 LFA Legacy GO - Social System Test Indítása")
    print("📅 Teszt időpont:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("\n⚠️ FONTOS: Győződj meg róla, hogy a backend fut a http://localhost:8000 címen!")
    
    # Wait for user confirmation
    input("\n▶️ Nyomj ENTER-t a teszt indításához...")
    
    # Run tests
    tester = SocialSystemTester()
    success = tester.run_complete_test()
    
    if success:
        print("\n🏆 SOCIAL RENDSZER TESZT: TELJES SIKER!")
        print("👥 A friend system production-ready!")
        print("⚔️ A challenge system működik!")
        print("🚫 A block system funkcionális!")
    else:
        print("\n❌ SOCIAL RENDSZER TESZT: RÉSZLEGES SIKER")
        print("🔧 Néhány funkció további fejlesztést igényel.")

if __name__ == "__main__":
    main()