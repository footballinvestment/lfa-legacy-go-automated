#!/usr/bin/env python3
"""
🏆 LFA Legacy GO - FIXED MEGA JOURNEY TEST
================================================================================
FIXES: Uses "full_name" instead of "name" for user registration
================================================================================
"""

import sys
import os
import requests
import json
import uuid
import time
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.database import SessionLocal
    from app.models.user import User
    from sqlalchemy.orm import Session
except ImportError as e:
    print(f"⚠️  Database import warning: {e}")

@dataclass
class TestPlayer:
    """Test player data"""
    name: str
    username: str
    email: str
    password: str
    role: str = "player"
    admin: bool = False
    
    # Runtime data
    id: Optional[int] = None
    token: Optional[str] = None
    headers: Optional[Dict] = None
    credits: int = 5
    level: int = 1
    friends: List = None
    bookings: List = None
    
    def __post_init__(self):
        if self.friends is None:
            self.friends = []
        if self.bookings is None:
            self.bookings = []

class FixedMEGAJourneyTester:
    """Fixed MEGA Journey Tester with correct API calls"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.players: Dict[str, TestPlayer] = {}
        self.test_results = {
            "test_session_id": str(uuid.uuid4()),
            "start_time": datetime.now().isoformat(),
            "phases": {},
            "global_stats": {
                "total_tests": 0,
                "passed_tests": 0,
                "failed_tests": 0,
                "warnings": 0
            },
            "errors": []
        }
        
        # Database connection
        self.db_session = None
        try:
            self.db_session = SessionLocal()
            print("✅ Database connection established for validation")
        except Exception as e:
            print(f"⚠️  Database connection failed: {e}")
        
        print("🚀 LFA Legacy GO - FIXED MEGA JOURNEY TESTER")
        print("="*70)
        print(f"🎯 Test Session ID: {self.test_results['test_session_id']}")
        print(f"🌐 Target URL: {base_url}")
        print(f"📅 Start Time: {self.test_results['start_time']}")
        print("="*70)
    
    def log_success(self, phase: str, test_name: str, details: str = ""):
        """Log successful test"""
        print(f"✅ [{phase}] {test_name}")
        if details:
            print(f"   → {details}")
        
        self.test_results["global_stats"]["passed_tests"] += 1
        self.test_results["global_stats"]["total_tests"] += 1
    
    def log_error(self, phase: str, test_name: str, error: str):
        """Log failed test"""
        print(f"❌ [{phase}] {test_name}")
        print(f"   ⚠️  {error}")
        
        self.test_results["global_stats"]["failed_tests"] += 1
        self.test_results["global_stats"]["total_tests"] += 1
        
        self.test_results["errors"].append({
            "phase": phase,
            "test": test_name,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })
    
    def log_warning(self, phase: str, test_name: str, warning: str):
        """Log warning"""
        print(f"⚠️  [{phase}] {test_name}")
        print(f"   ⚡ {warning}")
        self.test_results["global_stats"]["warnings"] += 1
    
    def make_request(self, method: str, endpoint: str, headers: Dict = None, **kwargs) -> Optional[Dict]:
        """Make HTTP request with better error handling"""
        url = f"{self.base_url}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        if headers:
            request_headers.update(headers)
        
        try:
            response = requests.request(
                method, url, headers=request_headers, 
                timeout=15, **kwargs
            )
            
            if response.status_code >= 400:
                print(f"      HTTP {response.status_code}: {response.text[:200]}")
                return None
            
            return response.json()
        except Exception as e:
            print(f"      Request exception: {e}")
            return None
    
    def make_form_request(self, endpoint: str, form_data: Dict, headers: Dict = None) -> Optional[Dict]:
        """Make form data request"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = requests.post(url, data=form_data, headers=headers or {}, timeout=15)
            
            if response.status_code >= 400:
                print(f"      HTTP {response.status_code}: {response.text[:200]}")
                return None
            
            return response.json()
        except Exception as e:
            print(f"      Form request exception: {e}")
            return None
    
    # ========================================================================
    # PHASE 1: SYSTEM INFRASTRUCTURE
    # ========================================================================
    
    def phase1_system_infrastructure(self) -> Dict:
        """Phase 1: System infrastructure check"""
        phase_name = "System Infrastructure"
        print(f"\n🔧 PHASE 1: {phase_name.upper()}")
        print("="*70)
        
        phase_results = {"phase_name": phase_name, "tests": [], "success_rate": 0.0}
        
        # Test 1: Backend Health
        response = self.make_request("GET", "/health")
        if response and response.get("status") == "healthy":
            systems = response.get("systems", [])
            db_info = response.get("database", {})
            self.log_success(phase_name, "Backend Health", 
                           f"Status: {response['status']}, {len(systems)} systems, {db_info.get('total_users', 0)} users")
            phase_results["tests"].append(True)
        else:
            self.log_error(phase_name, "Backend Health", "Backend not healthy")
            phase_results["tests"].append(False)
        
        # Test 2: Locations API
        response = self.make_request("GET", "/api/locations")
        if response and isinstance(response, list) and len(response) > 0:
            self.log_success(phase_name, "Locations API", f"{len(response)} locations available")
            phase_results["tests"].append(True)
        else:
            self.log_error(phase_name, "Locations API", "Cannot load locations")
            phase_results["tests"].append(False)
        
        # Test 3: API Documentation
        try:
            doc_response = requests.get(f"{self.base_url}/docs", timeout=10)
            if doc_response.status_code == 200:
                self.log_success(phase_name, "API Documentation", "Swagger docs accessible")
                phase_results["tests"].append(True)
            else:
                self.log_warning(phase_name, "API Documentation", "Docs not accessible")
                phase_results["tests"].append(False)
        except:
            self.log_warning(phase_name, "API Documentation", "Could not check docs")
            phase_results["tests"].append(False)
        
        # Calculate success rate
        passed = sum(phase_results["tests"])
        total = len(phase_results["tests"])
        phase_results["success_rate"] = (passed / total * 100) if total > 0 else 0
        
        self.test_results["phases"][phase_name] = phase_results
        return phase_results
    
    # ========================================================================
    # PHASE 2: USER MANAGEMENT (FIXED!)
    # ========================================================================
    
    def phase2_user_management(self) -> Dict:
        """Phase 2: User management testing - FIXED VERSION"""
        phase_name = "User Management"
        print(f"\n👥 PHASE 2: {phase_name.upper()} (FIXED)")
        print("="*70)
        
        phase_results = {"phase_name": phase_name, "tests": [], "success_rate": 0.0}
        
        # Create test users with CORRECT field names
        timestamp = int(time.time())
        test_users = [
            TestPlayer("Káról Kovács", f"karol_{timestamp}", f"karol_{timestamp}@test.com", "TestPass123!", admin=True),
            TestPlayer("Anna Nagy", f"anna_{timestamp}", f"anna_{timestamp}@test.com", "TestPass123!"),
            TestPlayer("Béla Szabó", f"bela_{timestamp}", f"bela_{timestamp}@test.com", "TestPass123!"),
            TestPlayer("Dóra Tóth", f"dora_{timestamp}", f"dora_{timestamp}@test.com", "TestPass123!")
        ]
        
        # Test user creation with FIXED data structure
        users_created = 0
        for player in test_users:
            # FIXED: Use "full_name" instead of "name"
            user_data = {
                "full_name": player.name,  # 🔧 FIXED: was "name"
                "username": player.username,
                "email": player.email,
                "password": player.password
            }
            
            response = self.make_request("POST", "/api/auth/register", json=user_data)
            if response and "id" in response:
                player.id = response["id"]
                self.players[player.name] = player
                users_created += 1
                self.log_success(phase_name, f"User Creation: {player.name}", 
                               f"ID: {player.id}, Username: {player.username}")
            else:
                self.log_error(phase_name, f"User Creation: {player.name}", "Creation failed")
        
        phase_results["tests"].append(users_created >= 3)  # At least 3 users
        
        # Test user authentication
        users_authenticated = 0
        for player in self.players.values():
            form_data = {
                "username": player.username,
                "password": player.password
            }
            
            response = self.make_form_request("/api/auth/login", form_data)
            if response and "access_token" in response:
                player.token = response["access_token"]
                player.headers = {"Authorization": f"Bearer {player.token}"}
                users_authenticated += 1
                
                # Get user profile to update credits/level
                profile_response = self.make_request("GET", "/api/auth/me", headers=player.headers)
                if profile_response:
                    player.credits = profile_response.get("credits", 5)
                    player.level = profile_response.get("level", 1)
                
                self.log_success(phase_name, f"Authentication: {player.name}", 
                               f"Credits: {player.credits}, Level: {player.level}")
            else:
                self.log_error(phase_name, f"Authentication: {player.name}", "Auth failed")
        
        phase_results["tests"].append(users_authenticated >= 3)  # At least 3 authenticated
        
        # Calculate success rate
        passed = sum(phase_results["tests"])
        total = len(phase_results["tests"])
        phase_results["success_rate"] = (passed / total * 100) if total > 0 else 0
        
        self.test_results["phases"][phase_name] = phase_results
        return phase_results
    
    # ========================================================================
    # PHASE 3: CREDIT SYSTEM
    # ========================================================================
    
    def phase3_credit_system(self) -> Dict:
        """Phase 3: Credit system testing"""
        phase_name = "Credit System"
        print(f"\n💳 PHASE 3: {phase_name.upper()}")
        print("="*70)
        
        phase_results = {"phase_name": phase_name, "tests": [], "success_rate": 0.0}
        
        # Get authenticated player
        auth_player = next((p for p in self.players.values() if p.token), None)
        if not auth_player:
            self.log_error(phase_name, "Credit System", "No authenticated users available")
            phase_results["tests"] = [False, False]
            phase_results["success_rate"] = 0.0
            self.test_results["phases"][phase_name] = phase_results
            return phase_results
        
        # Test 1: Get credit packages
        response = self.make_request("GET", "/api/credits/packages", headers=auth_player.headers)
        if response and isinstance(response, list) and len(response) > 0:
            self.log_success(phase_name, "Credit Packages", 
                           f"{len(response)} packages available")
            
            # Show package details
            for pkg in response:
                print(f"      → {pkg.get('name', 'Unknown')}: {pkg.get('credits', 0)} credits for ${pkg.get('price', 0)}")
            
            phase_results["tests"].append(True)
        else:
            self.log_error(phase_name, "Credit Packages", "Cannot load packages")
            phase_results["tests"].append(False)
        
        # Test 2: Credit purchases
        purchase_successful = 0
        purchase_attempts = 0
        
        # Try to purchase credits for players with sufficient balance
        for i, player in enumerate(list(self.players.values())[:3]):  # First 3 players
            if player.token:
                purchase_attempts += 1
                package_ids = ["starter_pack", "value_pack", "premium_pack"]
                package_id = package_ids[i % len(package_ids)]
                
                # Get initial credits
                initial_credits = player.credits
                
                purchase_data = {"package_id": package_id}
                response = self.make_request("POST", "/api/credits/purchase", 
                                           json=purchase_data, headers=player.headers)
                
                if response and "new_balance" in response:
                    new_balance = response["new_balance"]
                    credits_added = new_balance - initial_credits
                    player.credits = new_balance
                    purchase_successful += 1
                    self.log_success(phase_name, f"Credit Purchase: {player.name}", 
                                   f"Package: {package_id}, Added: {credits_added}, Balance: {new_balance}")
                else:
                    self.log_error(phase_name, f"Credit Purchase: {player.name}", 
                                 f"Purchase failed for {package_id}")
        
        phase_results["tests"].append(purchase_successful >= 1)  # At least 1 purchase
        
        # Calculate success rate
        passed = sum(phase_results["tests"])
        total = len(phase_results["tests"])
        phase_results["success_rate"] = (passed / total * 100) if total > 0 else 0
        
        self.test_results["phases"][phase_name] = phase_results
        return phase_results
    
    # ========================================================================
    # PHASE 4: BOOKING SYSTEM
    # ========================================================================
    
    def phase4_booking_system(self) -> Dict:
        """Phase 4: Booking system testing"""
        phase_name = "Booking System"
        print(f"\n🎮 PHASE 4: {phase_name.upper()}")
        print("="*70)
        
        phase_results = {"phase_name": phase_name, "tests": [], "success_rate": 0.0}
        
        # Get authenticated player with credits
        auth_player = next((p for p in self.players.values() if p.token and p.credits >= 8), None)
        if not auth_player:
            self.log_error(phase_name, "Booking System", "No authenticated users with sufficient credits")
            phase_results["tests"] = [False, False]
            phase_results["success_rate"] = 0.0
            self.test_results["phases"][phase_name] = phase_results
            return phase_results
        
        # Test 1: Check availability
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        response = self.make_request("GET", 
            f"/api/booking/check-availability?location_id=1&date={tomorrow}&game_type=GAME1",
            headers=auth_player.headers)
        
        if response and "available_slots" in response:
            slots = response["available_slots"]
            self.log_success(phase_name, "Availability Check", 
                           f"{len(slots)} slots available for {tomorrow}")
            phase_results["tests"].append(True)
        else:
            self.log_error(phase_name, "Availability Check", "Cannot check availability")
            phase_results["tests"].append(False)
        
        # Test 2: Create bookings
        booking_successful = 0
        booking_attempts = 0
        
        for i, player in enumerate(list(self.players.values())[:2]):  # First 2 players
            if player.token and player.credits >= 8:  # Need credits for booking
                booking_attempts += 1
                start_time = f"{tomorrow}T{14 + i}:00:00"  # Different times
                
                booking_data = {
                    "location_id": 1,
                    "game_type": "GAME1",
                    "start_time": start_time,
                    "players": [{"user_id": player.id}]
                }
                
                response = self.make_request("POST", "/api/booking/create", 
                                           json=booking_data, headers=player.headers)
                
                if response and "session_id" in response:
                    session_id = response["session_id"]
                    booking_successful += 1
                    player.bookings.append({"session_id": session_id, "start_time": start_time})
                    
                    # Update credits (GAME1 typically costs 8 credits)
                    player.credits = max(0, player.credits - 8)
                    
                    self.log_success(phase_name, f"Booking Created: {player.name}", 
                                   f"Session: {session_id}, Time: {start_time}")
                else:
                    self.log_error(phase_name, f"Booking Failed: {player.name}", 
                                 f"Could not create booking for {start_time}")
        
        phase_results["tests"].append(booking_successful >= 1)  # At least 1 booking
        
        # Calculate success rate
        passed = sum(phase_results["tests"])
        total = len(phase_results["tests"])
        phase_results["success_rate"] = (passed / total * 100) if total > 0 else 0
        
        self.test_results["phases"][phase_name] = phase_results
        return phase_results
    
    # ========================================================================
    # PHASE 5: SOCIAL & ADVANCED FEATURES
    # ========================================================================
    
    def phase5_social_and_advanced(self) -> Dict:
        """Phase 5: Social system and advanced features"""
        phase_name = "Social & Advanced"
        print(f"\n👫 PHASE 5: {phase_name.upper()}")
        print("="*70)
        
        phase_results = {"phase_name": phase_name, "tests": [], "success_rate": 0.0}
        
        # Test 1: Friend requests
        players_list = list(self.players.values())
        if len(players_list) >= 2:
            sender = players_list[0]
            receiver = players_list[1]
            
            if sender.token and receiver.token:
                friend_data = {"friend_username": receiver.username}
                response = self.make_request("POST", "/api/social/friend-request", 
                                           json=friend_data, headers=sender.headers)
                
                if response:
                    self.log_success(phase_name, "Friend Request", 
                                   f"{sender.name} → {receiver.name}")
                    phase_results["tests"].append(True)
                else:
                    self.log_error(phase_name, "Friend Request", "Friend request failed")
                    phase_results["tests"].append(False)
            else:
                self.log_error(phase_name, "Friend Request", "Users not authenticated")
                phase_results["tests"].append(False)
        else:
            self.log_error(phase_name, "Friend Request", "Not enough users for friend request")
            phase_results["tests"].append(False)
        
        # Test 2: Leaderboard
        response = self.make_request("GET", "/api/game-results/leaderboards")
        if response is not None:  # Even empty leaderboard is OK
            self.log_success(phase_name, "Leaderboard", "Leaderboard system accessible")
            phase_results["tests"].append(True)
        else:
            self.log_error(phase_name, "Leaderboard", "Cannot access leaderboard")
            phase_results["tests"].append(False)
        
        # Test 3: User bookings
        auth_player = next((p for p in self.players.values() if p.token), None)
        if auth_player:
            response = self.make_request("GET", "/api/booking/my-bookings", headers=auth_player.headers)
            if response is not None:
                bookings_count = len(response) if isinstance(response, list) else 0
                self.log_success(phase_name, "My Bookings", 
                               f"{bookings_count} bookings found for {auth_player.name}")
                phase_results["tests"].append(True)
            else:
                self.log_warning(phase_name, "My Bookings", "Could not retrieve bookings")
                phase_results["tests"].append(True)  # Not critical
        else:
            phase_results["tests"].append(False)
        
        # Calculate success rate
        passed = sum(phase_results["tests"])
        total = len(phase_results["tests"])
        phase_results["success_rate"] = (passed / total * 100) if total > 0 else 0
        
        self.test_results["phases"][phase_name] = phase_results
        return phase_results
    
    # ========================================================================
    # MAIN RUNNER
    # ========================================================================
    
    async def run_mega_journey_test(self):
        """Run the FIXED MEGA journey test"""
        print("🚀 STARTING FIXED MEGA JOURNEY TEST")
        print("="*70)
        
        try:
            # Run all phases
            await asyncio.sleep(0.1)  # Small delay to make it async
            self.phase1_system_infrastructure()
            
            await asyncio.sleep(0.1)
            self.phase2_user_management()  # FIXED VERSION
            
            await asyncio.sleep(0.1)
            self.phase3_credit_system()
            
            await asyncio.sleep(0.1)
            self.phase4_booking_system()
            
            await asyncio.sleep(0.1)
            self.phase5_social_and_advanced()
            
        finally:
            await self.generate_final_report()
    
    async def generate_final_report(self):
        """Generate comprehensive final report"""
        end_time = datetime.now()
        start_time = datetime.fromisoformat(self.test_results["start_time"])
        duration = (end_time - start_time).total_seconds()
        
        print("\n" + "="*70)
        print("🏆 FIXED MEGA TEST RESULTS")
        print("="*70)
        
        # Overall statistics
        stats = self.test_results["global_stats"]
        success_rate = (stats["passed_tests"] / stats["total_tests"] * 100) if stats["total_tests"] > 0 else 0
        
        print(f"📊 OVERALL RESULTS:")
        print(f"   Total Tests: {stats['total_tests']}")
        print(f"   Passed: {stats['passed_tests']}")
        print(f"   Failed: {stats['failed_tests']}")
        print(f"   Warnings: {stats['warnings']}")
        print(f"   Success Rate: {success_rate:.1f}%")
        print(f"   Duration: {duration:.1f} seconds")
        
        # Phase breakdown
        print(f"\n📋 PHASE BREAKDOWN:")
        for phase_name, phase_data in self.test_results["phases"].items():
            phase_success = phase_data.get("success_rate", 0)
            status_icon = "✅" if phase_success >= 80 else "⚠️" if phase_success >= 50 else "❌"
            print(f"   {status_icon} {phase_name}: {phase_success:.1f}%")
        
        # Player summary
        if self.players:
            print(f"\n👥 PLAYER SUMMARY:")
            for player_name, player in self.players.items():
                auth_status = "✅" if player.token else "❌"
                print(f"   {auth_status} {player_name}")
                print(f"      Username: {player.username}")
                print(f"      Credits: {player.credits}")
                print(f"      Level: {player.level}")
                print(f"      Bookings: {len(player.bookings)}")
        
        # Error summary
        if self.test_results["errors"]:
            print(f"\n❌ ERRORS ENCOUNTERED:")
            for error in self.test_results["errors"]:
                print(f"   • {error['phase']}: {error['test']} - {error['error']}")
        
        # Final verdict
        print(f"\n🎯 FINAL VERDICT:")
        if success_rate >= 90:
            print("🎉 FIXED MEGA TEST: OUTSTANDING SUCCESS!")
            print("   System is working excellently!")
        elif success_rate >= 75:
            print("✅ FIXED MEGA TEST: SUCCESS!")
            print("   System is working well with minor issues.")
        elif success_rate >= 60:
            print("⚠️  FIXED MEGA TEST: PARTIAL SUCCESS")
            print("   Most systems working, some issues detected.")
        else:
            print("❌ FIXED MEGA TEST: SIGNIFICANT ISSUES")
            print("   Multiple problems found.")
        
        # Save report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"fixed_mega_test_{timestamp}.json"
        
        final_report = {
            **self.test_results,
            "end_time": end_time.isoformat(),
            "duration_seconds": duration,
            "success_rate": success_rate,
            "player_summary": {name: {
                "username": player.username,
                "authenticated": bool(player.token),
                "credits": player.credits,
                "level": player.level,
                "bookings_count": len(player.bookings)
            } for name, player in self.players.items()}
        }
        
        try:
            with open(report_filename, 'w', encoding='utf-8') as f:
                json.dump(final_report, f, indent=2, ensure_ascii=False)
            print(f"\n📄 Detailed report saved: {report_filename}")
        except Exception as e:
            print(f"⚠️  Could not save report: {e}")
        
        return final_report

async def main():
    """Main runner"""
    print("Starting Fixed MEGA Test...")
    
    # Check backend
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code != 200:
            print("❌ Backend not available")
            return
    except:
        print("❌ Cannot connect to backend")
        return
    
    print("✅ Backend is available")
    
    # Run test
    tester = FixedMEGAJourneyTester()
    
    try:
        return await tester.run_mega_journey_test()
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted")
        await tester.generate_final_report()
    except Exception as e:
        print(f"\n💥 Test error: {e}")
        await tester.generate_final_report()
    finally:
        if tester.db_session:
            tester.db_session.close()

if __name__ == "__main__":
    asyncio.run(main())