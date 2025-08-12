#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IMPROVED MEGA TEST - JAVÍTOTT HIBAKEZELÉSSEL
========================================
Javítja a working_mega_test.py hibáit:
1. Helyes friend request field név (receiver_username)
2. Jobb booking session cleanup
3. Enhanced error logging
"""

import sys
import os
import json
import sqlite3
import requests
import traceback
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from urllib.parse import urljoin

# Configuration
BASE_URL = "http://localhost:8000"
DATABASE_PATH = "./lfa_legacy_go.db"

@dataclass
class TestPlayer:
    """Enhanced test player with better tracking"""
    name: str
    username: str
    email: str
    password: str
    token: Optional[str] = None
    user_id: Optional[int] = None
    credits: int = 5
    bookings: List[Dict] = field(default_factory=list)
    
    def __post_init__(self):
        # Generate unique timestamp-based identifiers
        timestamp = int(datetime.now().timestamp())
        self.username = f"{self.username.lower()}_test_{timestamp}"
        self.email = f"{self.username}@example.com"

class ImprovedMegaTestRunner:
    """JAVÍTOTT MEGA TEST RUNNER"""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.players = {}
        self.test_results = {
            "session_id": f"improved-{int(datetime.now().timestamp())}",
            "start_time": datetime.now().isoformat(),
            "end_time": None,
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "success_rate": 0.0,
            "phases": {},
            "improvements": [],
            "errors": []
        }
        
        # Create improved test players
        self.players = {
            "Káról": TestPlayer("Káról", "karol", "karol@example.com", "password123"),
            "Anna": TestPlayer("Anna", "anna", "anna@example.com", "password123"),
            "Béla": TestPlayer("Béla", "bela", "bela@example.com", "password123")
        }

    def log_success(self, phase: str, test_name: str, details: str = ""):
        """Log successful test"""
        self.test_results["total_tests"] += 1
        self.test_results["passed_tests"] += 1
        
        if phase not in self.test_results["phases"]:
            self.test_results["phases"][phase] = {"tests": [], "success_rate": 0.0}
        
        self.test_results["phases"][phase]["tests"].append({
            "name": test_name,
            "status": "passed",
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
        print(f"✅ [{phase}] {test_name}")
        if details:
            print(f"   → {details}")

    def log_error(self, phase: str, test_name: str, error_msg: str):
        """Log failed test with detailed error"""
        self.test_results["total_tests"] += 1
        self.test_results["failed_tests"] += 1
        
        if phase not in self.test_results["phases"]:
            self.test_results["phases"][phase] = {"tests": [], "success_rate": 0.0}
        
        error_info = {
            "name": test_name,
            "status": "failed",
            "error": error_msg,
            "timestamp": datetime.now().isoformat()
        }
        
        self.test_results["phases"][phase]["tests"].append(error_info)
        self.test_results["errors"].append(error_info)
        
        print(f"❌ [{phase}] {test_name}")
        print(f"   ⚠️  {error_msg}")

    def make_request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """Enhanced request with better error handling"""
        url = urljoin(self.base_url, endpoint)
        
        try:
            response = requests.request(method, url, timeout=10, **kwargs)
            
            # Handle successful responses
            if response.status_code in [200, 201]:
                try:
                    return response.json() if response.content else {}
                except json.JSONDecodeError:
                    return {"raw_response": response.text}
            
            # Handle validation errors
            elif response.status_code == 422:
                try:
                    error_data = response.json()
                    return {
                        "error": "validation_error",
                        "status_code": 422,
                        "details": error_data,
                        "message": "Validation failed"
                    }
                except:
                    return {
                        "error": "validation_error",
                        "status_code": 422,
                        "details": response.text,
                        "message": "Validation failed"
                    }
            
            # Handle other HTTP errors
            else:
                try:
                    error_data = response.json()
                    return {
                        "error": "http_error",
                        "status_code": response.status_code,
                        "details": error_data,
                        "message": error_data.get("detail", f"HTTP {response.status_code}")
                    }
                except:
                    return {
                        "error": "http_error",
                        "status_code": response.status_code,
                        "details": response.text,
                        "message": f"HTTP {response.status_code}"
                    }
                    
        except requests.exceptions.RequestException as e:
            return {
                "error": "network_error",
                "exception": str(e),
                "message": "Network connection failed"
            }

    def cleanup_test_data(self):
        """IMPROVED cleanup with better session management"""
        print("🧹 Enhanced cleanup of test data...")
        
        try:
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            
            # Get current timestamp for cleanup window
            cleanup_time = (datetime.now() - timedelta(hours=2)).isoformat()
            
            # Clean test users (broader patterns)
            test_patterns = [
                "username LIKE '%_test_%'",
                "email LIKE '%test_%@example.com'",
                f"created_at > '{cleanup_time}'",  # Recent test data
                "username LIKE 'karol%' OR username LIKE 'anna%' OR username LIKE 'bela%'"
            ]
            
            where_clause = " OR ".join([f"({pattern})" for pattern in test_patterns])
            
            # Get test user IDs first
            cursor.execute(f"SELECT id FROM users WHERE {where_clause}")
            test_user_ids = [row[0] for row in cursor.fetchall()]
            
            if test_user_ids:
                ids_str = ",".join(map(str, test_user_ids))
                
                # Clean related data first (referential integrity)
                cursor.execute(f"DELETE FROM friend_requests WHERE sender_id IN ({ids_str}) OR receiver_id IN ({ids_str})")
                cursor.execute(f"DELETE FROM friendships WHERE user1_id IN ({ids_str}) OR user2_id IN ({ids_str})")
                cursor.execute(f"DELETE FROM user_sessions WHERE user_id IN ({ids_str})")
                
                # Clean game sessions (JAVÍTOTT: proper field names)
                cursor.execute(f"DELETE FROM game_sessions WHERE booked_by_id IN ({ids_str})")
                
                # Finally clean users
                cursor.execute(f"DELETE FROM users WHERE {where_clause}")
                deleted_users = cursor.rowcount
                
                conn.commit()
                print(f"   → Cleaned up {deleted_users} test users and related data")
            else:
                print("   → No test data to clean up")
                
            conn.close()
            
        except Exception as e:
            print(f"   ⚠️  Cleanup failed: {str(e)}")

    def test_basic_system(self) -> Dict[str, Any]:
        """Test basic system health"""
        phase_name = "Basic System"
        print(f"\n🔧 PHASE 1: {phase_name.upper()}")
        print("=" * 60)
        
        # Backend health check
        response = self.make_request("GET", "/health")
        if response and not response.get("error") and response.get("status") == "healthy":
            self.log_success(phase_name, "Backend Health", f"Status: {response['status']}")
        else:
            error_msg = response.get("message", "Backend not healthy") if response else "No response"
            self.log_error(phase_name, "Backend Health", error_msg)
        
        # Locations API test
        response = self.make_request("GET", "/api/locations")
        if response:
            # Check if it's an error response (dict with error field)
            if isinstance(response, dict) and response.get("error"):
                error_msg = response.get("message", "Locations API failed")
                self.log_error(phase_name, "Locations API", error_msg)
            # Handle successful responses
            elif isinstance(response, list):
                self.log_success(phase_name, "Locations API", f"{len(response)} locations found (list format)")
            elif isinstance(response, dict) and "locations" in response:
                locations = response["locations"]
                self.log_success(phase_name, "Locations API", f"{len(locations)} locations found (dict format)")
            elif isinstance(response, dict):
                self.log_success(phase_name, "Locations API", "Locations accessible (dict response)")
            else:
                self.log_success(phase_name, "Locations API", "Locations accessible")
        else:
            self.log_error(phase_name, "Locations API", "No response received")
        
        return {"phase_name": phase_name}

    def test_user_management(self) -> Dict[str, Any]:
        """Test user creation and authentication"""
        phase_name = "User Management"
        print(f"\n👥 PHASE 2: {phase_name.upper()}")
        print("=" * 60)
        
        for player_name, player in self.players.items():
            # User creation
            user_data = {
                "username": player.username,
                "email": player.email,
                "password": player.password,
                "full_name": player.name
            }
            
            response = self.make_request("POST", "/api/auth/register", json=user_data)
            
            if response and not response.get("error"):
                if "user" in response:
                    player.user_id = response["user"]["id"]
                    self.log_success(phase_name, f"User Creation: {player.name}", f"ID: {player.user_id}")
                else:
                    self.log_success(phase_name, f"User Creation: {player.name}", "User created")
            else:
                error_msg = response.get("message", "User creation failed") if response else "No response"
                self.log_error(phase_name, f"User Creation: {player.name}", error_msg)
                continue
            
            # Authentication test
            login_data = {
                "username": player.username,
                "password": player.password
            }
            
            response = self.make_request("POST", "/api/auth/login", data=login_data)
            
            if response and not response.get("error") and "access_token" in response:
                player.token = response["access_token"]
                if "user" in response:
                    player.credits = response["user"]["credits"]
                self.log_success(phase_name, f"Authentication: {player.name}", "Token received")
            else:
                error_msg = response.get("message", "Login failed") if response else "No response"
                self.log_error(phase_name, f"Authentication: {player.name}", error_msg)
        
        return {"phase_name": phase_name}

    def test_credit_system(self) -> Dict[str, Any]:
        """Test credit system functionality"""
        phase_name = "Credit System"
        print(f"\n💳 PHASE 3: {phase_name.upper()}")
        print("=" * 60)
        
        # Test credit packages
        response = self.make_request("GET", "/api/credits/packages")
        if response:
            # Check if it's an error response (dict with error field)
            if isinstance(response, dict) and response.get("error"):
                error_msg = response.get("message", "Packages not available")
                self.log_error(phase_name, "Credit Packages", error_msg)
            # Handle successful responses
            elif isinstance(response, list):
                self.log_success(phase_name, "Credit Packages", f"{len(response)} packages available (list format)")
            elif isinstance(response, dict) and "packages" in response:
                packages = response["packages"]
                self.log_success(phase_name, "Credit Packages", f"{len(packages)} packages available (dict format)")
            elif isinstance(response, dict):
                self.log_success(phase_name, "Credit Packages", "Packages accessible (dict response)")
            else:
                self.log_success(phase_name, "Credit Packages", "Packages accessible")
        else:
            self.log_error(phase_name, "Credit Packages", "No response received")
        
        # Test with authenticated user
        authenticated_players = [p for p in self.players.values() if p.token]
        if authenticated_players:
            player = authenticated_players[0]
            headers = {"Authorization": f"Bearer {player.token}"}
            
            # Check balance
            response = self.make_request("GET", "/api/credits/balance", headers=headers)
            if response and not response.get("error"):
                balance = response.get("balance", response.get("credits", 0))
                player.credits = balance
                self.log_success(phase_name, f"Credit Balance: {player.name}", f"Balance: {balance}")
            else:
                error_msg = response.get("message", "Balance check failed") if response else "No response"
                self.log_error(phase_name, f"Credit Balance: {player.name}", error_msg)
            
            # Test credit purchase with CORRECT package_id format
            purchase_data = {
                "package_id": "starter_pack",  # CORRECT string format!
                "payment_method": "test",      # Use test payment method
                "currency": "HUF"
            }
            response = self.make_request("POST", "/api/credits/purchase", json=purchase_data, headers=headers)
            
            if response:
                # Check if it's an error response
                if isinstance(response, dict) and response.get("error"):
                    error_msg = response.get("message", "Purchase failed")
                    self.log_error(phase_name, f"Credit Purchase: {player.name}", error_msg)
                # Handle successful responses
                elif isinstance(response, dict) and ("transaction_id" in response or "status" in response):
                    self.log_success(phase_name, f"Credit Purchase: {player.name}", "Credits added")
                    player.credits += 12  # Update local tracking (starter_pack gives 12 total)
                else:
                    self.log_success(phase_name, f"Credit Purchase: {player.name}", "Purchase processed")
            else:
                self.log_error(phase_name, f"Credit Purchase: {player.name}", "No response received")
        
        return {"phase_name": phase_name}

    def test_booking_system(self) -> Dict[str, Any]:
        """Test booking system with improved cleanup"""
        phase_name = "Booking System"
        print(f"\n🎮 PHASE 4: {phase_name.upper()}")
        print("=" * 60)
        
        # JAVÍTÁS: authenticated_players definíció hozzáadva
        authenticated_players = [p for p in self.players.values() if p.token]
        
        # Test availability check WITH AUTHENTICATION
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        # Try with authenticated user first  
        if authenticated_players:
            player = authenticated_players[0]
            headers = {"Authorization": f"Bearer {player.token}"}
            response = self.make_request("GET", f"/api/booking/availability?location_id=1&date={tomorrow}", headers=headers)
        else:
            # Fallback to unauthenticated
            response = self.make_request("GET", f"/api/booking/availability?location_id=1&date={tomorrow}")
        
        if response:
            # Check if it's an error response
            if isinstance(response, dict) and response.get("error"):
                error_msg = response.get("message", "Availability check failed")
                self.log_error(phase_name, "Availability Check", error_msg)
            # Handle successful responses  
            elif isinstance(response, dict) and "slots" in response:
                slots = response["slots"]
                available_slots = [s for s in slots if s.get("available", True)]
                self.log_success(phase_name, "Availability Check", f"{len(available_slots)} slots available")
            elif isinstance(response, dict):
                self.log_success(phase_name, "Availability Check", "Availability accessible")
            elif isinstance(response, list):
                self.log_success(phase_name, "Availability Check", f"{len(response)} availability entries")
            else:
                self.log_success(phase_name, "Availability Check", "Availability accessible")
        else:
            self.log_error(phase_name, "Availability Check", "No response received")
        
        # Test booking creation with cleanup
        booking_authenticated_players = [p for p in self.players.values() if p.token and p.credits >= 5]
        
        if booking_authenticated_players:
            player = booking_authenticated_players[0]
            headers = {"Authorization": f"Bearer {player.token}"}
            
            # Create unique booking time to avoid conflicts
            booking_time = datetime.now() + timedelta(hours=2)
            booking_data = {
                "location_id": 1,
                "start_time": booking_time.isoformat(),
                "duration_minutes": 90,
                "game_type": "GAME1",
                "notes": f"Test booking by {player.name}"
            }
            
            response = self.make_request("POST", "/api/booking/sessions", json=booking_data, headers=headers)
            
            if response and not response.get("error"):
                session_id = response.get("session_id", response.get("id"))
                if session_id:
                    player.bookings.append({"session_id": session_id, "time": booking_time.isoformat()})
                    player.credits = max(0, player.credits - 5)
                    self.log_success(phase_name, f"Booking Created: {player.name}", f"Session: {session_id}")
                else:
                    self.log_success(phase_name, f"Booking Created: {player.name}", "Booking successful")
            else:
                error_msg = response.get("message", "Booking failed") if response else "No response"
                self.log_error(phase_name, f"Booking Failed: {player.name}", error_msg)
        else:
            self.log_error(phase_name, "Booking Test", "No authenticated users with sufficient credits")
        
        return {"phase_name": phase_name}

    def test_social_system(self) -> Dict[str, Any]:
        """JAVÍTOTT social system test with correct field names"""
        phase_name = "Social & Results"
        print(f"\n👫 PHASE 5: {phase_name.upper()}")
        print("=" * 60)
        
        authenticated_players = [p for p in self.players.values() if p.token]
        
        # Test friend request with CORRECT field name
        if len(authenticated_players) >= 2:
            player1, player2 = authenticated_players[0], authenticated_players[1]
            headers1 = {"Authorization": f"Bearer {player1.token}"}
            
            # JAVÍTÁS: Use receiver_username instead of username
            friend_request_data = {
                "receiver_username": player2.username,  # CORRECT field name!
                "message": f"Friend request from {player1.name} to {player2.name}"
            }
            
            response = self.make_request("POST", "/api/social/friends/request", 
                                       json=friend_request_data, headers=headers1)
            
            if response and not response.get("error"):
                self.log_success(phase_name, "Friend Request", f"{player1.name} → {player2.name}")
            else:
                error_msg = response.get("message", "Friend request failed") if response else "No response"
                # Enhanced error logging for debugging
                if response and response.get("error") == "validation_error":
                    print(f"   🔍 Validation details: {response.get('details')}")
                self.log_error(phase_name, "Friend Request", error_msg)
        
        # Test social profile access
        if authenticated_players:
            player = authenticated_players[0]
            headers = {"Authorization": f"Bearer {player.token}"}
            
            response = self.make_request("GET", "/api/social/profile", headers=headers)
            
            if response and not response.get("error"):
                self.log_success(phase_name, "Social Profile", f"Profile accessible for {player.name}")
            else:
                error_msg = response.get("message", "Profile access failed") if response else "No response"
                # Enhanced error logging
                if response:
                    print(f"   🔍 Profile error details: {response}")
                self.log_error(phase_name, "Social Profile", error_msg)
        
        # Test leaderboard access
        if authenticated_players:
            headers = {"Authorization": f"Bearer {authenticated_players[0].token}"}
            response = self.make_request("GET", "/api/game-results/leaderboards", headers=headers)
            
            if response:
                # Check if it's an error response
                if isinstance(response, dict) and response.get("error"):
                    error_msg = response.get("message", "Leaderboard access failed")
                    self.log_error(phase_name, "Leaderboard", error_msg)
                # Handle successful responses
                elif isinstance(response, dict) and "leaderboards" in response:
                    leaderboards = response["leaderboards"]
                    self.log_success(phase_name, "Leaderboard", f"{len(leaderboards)} leaderboards available")
                elif isinstance(response, list):
                    self.log_success(phase_name, "Leaderboard", f"{len(response)} entries found")
                elif isinstance(response, dict):
                    self.log_success(phase_name, "Leaderboard", "Leaderboard accessible")
                else:
                    self.log_success(phase_name, "Leaderboard", "Leaderboard accessible")
            else:
                self.log_error(phase_name, "Leaderboard", "No response received")
        
        return {"phase_name": phase_name}

    def print_final_results(self):
        """Print comprehensive test results"""
        results = self.test_results
        
        print("\n" + "=" * 60)
        print("🏆 IMPROVED MEGA TEST RESULTS")
        print("=" * 60)
        
        # Overall stats
        print("📊 OVERALL RESULTS:")
        print(f"   Total Tests: {results['total_tests']}")
        print(f"   Passed: {results['passed_tests']}")
        print(f"   Failed: {results['failed_tests']}")
        print(f"   Success Rate: {results['success_rate']:.1f}%")
        
        # Phase breakdown
        print(f"\n📋 PHASE BREAKDOWN:")
        for phase_name, phase_data in results["phases"].items():
            if phase_data["tests"]:
                passed = len([t for t in phase_data["tests"] if t["status"] == "passed"])
                total = len(phase_data["tests"])
                success_rate = (passed / total) * 100
                status_icon = "✅" if success_rate >= 70 else "⚠️" if success_rate >= 30 else "❌"
                print(f"   {status_icon} {phase_name}: {success_rate:.1f}% ({passed}/{total})")
        
        # Player summary
        print(f"\n👥 PLAYER SUMMARY:")
        for player_name, player in self.players.items():
            auth_status = "🔐" if player.token else "❌"
            print(f"   {auth_status} {player_name}: Credits={player.credits}, Bookings={len(player.bookings)}")
        
        # Error summary
        if results["errors"]:
            print(f"\n🚨 ERROR SUMMARY ({len(results['errors'])} errors):")
            for error in results["errors"][-3:]:  # Show last 3 errors
                print(f"   → {error['name']}: {error['error']}")
        
        # Final verdict
        print(f"\n🎯 FINAL VERDICT:")
        if results['success_rate'] >= 85:
            print("✅ IMPROVED MEGA TEST: EXCELLENT!")
            print("   System working perfectly with all improvements applied.")
        elif results['success_rate'] >= 70:
            print("✅ IMPROVED MEGA TEST: GOOD PERFORMANCE")
            print("   Most issues resolved, minor optimizations remain.")
        elif results['success_rate'] >= 50:
            print("⚠️ IMPROVED MEGA TEST: MODERATE ISSUES")
            print("   Some improvements successful, more work needed.")
        else:
            print("❌ IMPROVED MEGA TEST: SIGNIFICANT ISSUES")
            print("   Major problems detected, requires investigation.")

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all improved tests"""
        print("\n🚀 IMPROVED LFA Legacy GO - MEGA TESTER")
        print("=" * 60)
        print(f"🎯 Test Session ID: {self.test_results['session_id']}")
        print(f"🌐 Target URL: {self.base_url}")
        print(f"📅 Start Time: {self.test_results['start_time']}")
        print("=" * 60)
        
        # Enhanced cleanup
        self.cleanup_test_data()
        
        # Run test phases
        self.test_basic_system()
        self.test_user_management()
        self.test_credit_system()
        self.test_booking_system()
        self.test_social_system()
        
        # Finalize results
        self.test_results["end_time"] = datetime.now().isoformat()
        
        if self.test_results["total_tests"] > 0:
            self.test_results["success_rate"] = (
                self.test_results["passed_tests"] / self.test_results["total_tests"]
            ) * 100
        
        self.print_final_results()
        
        # Save report
        report_filename = f"improved_mega_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(report_filename, 'w', encoding='utf-8') as f:
                json.dump(self.test_results, f, indent=2, ensure_ascii=False)
            print(f"\n📄 Report saved: {report_filename}")
        except Exception as e:
            print(f"\n⚠️  Report save failed: {str(e)}")
        
        return self.test_results


def main():
    """Main test execution"""
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Backend not available")
            return False
    except:
        print("❌ Backend not available")
        return False
    
    print("✅ Backend is available")
    
    # Check database
    if not os.path.exists(DATABASE_PATH):
        print("❌ Database not found")
        return False
    
    print("✅ Database found")
    
    # Run improved tests
    tester = ImprovedMegaTestRunner()
    results = tester.run_all_tests()
    
    return results["success_rate"] >= 70


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)