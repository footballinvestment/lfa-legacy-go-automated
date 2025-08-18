#!/usr/bin/env python3
# === API Compatibility Test Suite ===
# Comprehensive frontend-backend integration testing

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
import sys
import os

# Base configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

class CompatibilityTester:
    def __init__(self):
        self.test_results = {}
        self.user_token = None
        self.admin_token = None
        self.critical_issues = []
        self.api_mismatches = []
        
    def log_result(self, test_name: str, success: bool, details: str, response_code: int = None):
        """Log test result with details"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_code:
            print(f"    HTTP {response_code}")
        
        self.test_results[test_name] = {
            "success": success,
            "details": details,
            "response_code": response_code,
            "timestamp": datetime.now().isoformat()
        }
        
        if not success:
            self.critical_issues.append(f"{test_name}: {details}")
    
    def setup_test_user(self) -> bool:
        """Create test user and get authentication token"""
        try:
            # Try to register test user
            register_data = {
                "username": "compattest",
                "email": "compattest@example.com", 
                "password": "testpass123",
                "full_name": "Compatibility Test User"
            }
            
            response = requests.post(f"{API_BASE}/auth/register", json=register_data)
            if response.status_code == 200:
                self.user_token = response.json()["access_token"]
                self.log_result("User Registration", True, "Test user created successfully", 200)
                return True
            elif response.status_code == 400 and "already exists" in response.text:
                # User exists, try to login
                login_data = {"username": "compattest", "password": "testpass123"}
                response = requests.post(f"{API_BASE}/auth/login", json=login_data)
                if response.status_code == 200:
                    self.user_token = response.json()["access_token"]
                    self.log_result("User Login", True, "Existing test user login successful", 200)
                    return True
                    
            self.log_result("User Setup", False, f"Failed to setup test user: {response.text}", response.status_code)
            return False
            
        except Exception as e:
            self.log_result("User Setup", False, f"Exception during user setup: {str(e)}")
            return False
    
    def test_auth_endpoints(self) -> Dict[str, bool]:
        """Test all authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        results = {}
        
        # Test /api/auth/me
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = requests.get(f"{API_BASE}/auth/me", headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                required_fields = ["id", "username", "email", "credits"]
                missing_fields = [f for f in required_fields if f not in user_data]
                
                if not missing_fields:
                    self.log_result("GET /api/auth/me", True, "User profile retrieved successfully", 200)
                    results["auth_me"] = True
                else:
                    self.log_result("GET /api/auth/me", False, f"Missing fields: {missing_fields}", 200)
                    results["auth_me"] = False
            else:
                self.log_result("GET /api/auth/me", False, f"Unexpected response: {response.text}", response.status_code)
                results["auth_me"] = False
                
        except Exception as e:
            self.log_result("GET /api/auth/me", False, f"Exception: {str(e)}")
            results["auth_me"] = False
        
        return results
    
    def test_tournaments_endpoints(self) -> Dict[str, bool]:
        """Test tournament endpoints and debug 400 errors"""
        print("\n🏆 Testing Tournament Endpoints...")
        results = {}
        
        # Test GET /api/tournaments/ (with slash)
        try:
            response = requests.get(f"{API_BASE}/tournaments/")
            if response.status_code == 200:
                tournaments = response.json()
                self.log_result("GET /api/tournaments/", True, f"Retrieved {len(tournaments)} tournaments", 200)
                results["tournaments_list_slash"] = True
            else:
                self.log_result("GET /api/tournaments/", False, f"Failed: {response.text}", response.status_code)
                results["tournaments_list_slash"] = False
                self.api_mismatches.append("GET /api/tournaments/ returns non-200")
        except Exception as e:
            self.log_result("GET /api/tournaments/", False, f"Exception: {str(e)}")
            results["tournaments_list_slash"] = False
        
        # Test GET /api/tournaments (without slash)  
        try:
            response = requests.get(f"{API_BASE}/tournaments")
            if response.status_code == 200:
                tournaments = response.json()
                self.log_result("GET /api/tournaments", True, f"Retrieved {len(tournaments)} tournaments", 200)
                results["tournaments_list_no_slash"] = True
            else:
                self.log_result("GET /api/tournaments", False, f"Failed: {response.text}", response.status_code)
                results["tournaments_list_no_slash"] = False
        except Exception as e:
            self.log_result("GET /api/tournaments", False, f"Exception: {str(e)}")
            results["tournaments_list_no_slash"] = False
        
        # Test tournament registration (the problematic 400 error)
        headers = {"Authorization": f"Bearer {self.user_token}", "Content-Type": "application/json"}
        
        # First, try to get a tournament ID
        tournament_id = 1  # Default assumption
        try:
            response = requests.get(f"{API_BASE}/tournaments/")
            if response.status_code == 200:
                tournaments = response.json()
                if tournaments and len(tournaments) > 0:
                    tournament_id = tournaments[0].get("id", 1)
        except:
            pass
        
        # Test different registration payload formats
        registration_payloads = [
            {"user_id": 1},  # Simple user_id
            {},  # Empty payload
            {"tournament_id": tournament_id},  # Tournament ID
            {"credits_required": 5},  # Credits info
        ]
        
        for i, payload in enumerate(registration_payloads):
            try:
                response = requests.post(
                    f"{API_BASE}/tournaments/{tournament_id}/register", 
                    headers=headers, 
                    json=payload
                )
                
                test_name = f"POST /api/tournaments/{tournament_id}/register (payload {i+1})"
                if response.status_code == 200:
                    self.log_result(test_name, True, f"Registration successful with payload: {payload}", 200)
                    results[f"tournament_registration_{i+1}"] = True
                    break  # Stop testing once we find working payload
                else:
                    error_detail = response.json().get("detail", response.text) if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_result(test_name, False, f"Registration failed: {error_detail}", response.status_code)
                    results[f"tournament_registration_{i+1}"] = False
                    
                    if response.status_code == 400:
                        self.critical_issues.append(f"Tournament registration 400 error with payload {payload}: {error_detail}")
                        
            except Exception as e:
                self.log_result(f"POST /api/tournaments/{tournament_id}/register (payload {i+1})", False, f"Exception: {str(e)}")
                results[f"tournament_registration_{i+1}"] = False
        
        return results
    
    def test_credits_endpoints(self) -> Dict[str, bool]:
        """Test credits system endpoints"""
        print("\n💰 Testing Credits Endpoints...")
        results = {}
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Test GET /api/credits/packages (frontend might expect this)
        try:
            response = requests.get(f"{API_BASE}/credits/packages", headers=headers)
            if response.status_code == 200:
                packages = response.json()
                self.log_result("GET /api/credits/packages", True, f"Retrieved {len(packages)} credit packages", 200)
                results["credits_packages"] = True
            else:
                self.log_result("GET /api/credits/packages", False, f"Failed: {response.text}", response.status_code)
                results["credits_packages"] = False
                self.api_mismatches.append("GET /api/credits/packages missing or broken")
        except Exception as e:
            self.log_result("GET /api/credits/packages", False, f"Exception: {str(e)}")
            results["credits_packages"] = False
        
        # Test GET /api/credits/balance
        try:
            response = requests.get(f"{API_BASE}/credits/balance", headers=headers)
            if response.status_code == 200:
                balance = response.json()
                required_fields = ["credits"]
                missing_fields = [f for f in required_fields if f not in balance]
                
                if not missing_fields:
                    self.log_result("GET /api/credits/balance", True, f"Balance: {balance['credits']} credits", 200)
                    results["credits_balance"] = True
                else:
                    self.log_result("GET /api/credits/balance", False, f"Missing fields: {missing_fields}", 200)
                    results["credits_balance"] = False
            else:
                self.log_result("GET /api/credits/balance", False, f"Failed: {response.text}", response.status_code)
                results["credits_balance"] = False
        except Exception as e:
            self.log_result("GET /api/credits/balance", False, f"Exception: {str(e)}")
            results["credits_balance"] = False
        
        # Test POST /api/credits/redeem-coupon (new coupon system)
        try:
            coupon_payload = {"coupon_code": "FOOTBALL25"}
            response = requests.post(f"{API_BASE}/credits/redeem-coupon", headers=headers, json=coupon_payload)
            
            if response.status_code == 200:
                result = response.json()
                self.log_result("POST /api/credits/redeem-coupon", True, f"Coupon redeemed: +{result.get('credits_added', 0)} credits", 200)
                results["credits_redeem_coupon"] = True
            elif response.status_code == 400 and "already redeemed" in response.text:
                self.log_result("POST /api/credits/redeem-coupon", True, "Coupon already redeemed (expected)", 400)
                results["credits_redeem_coupon"] = True
            else:
                self.log_result("POST /api/credits/redeem-coupon", False, f"Failed: {response.text}", response.status_code)
                results["credits_redeem_coupon"] = False
        except Exception as e:
            self.log_result("POST /api/credits/redeem-coupon", False, f"Exception: {str(e)}")
            results["credits_redeem_coupon"] = False
        
        # Test potential missing endpoint: POST /api/credits/purchase
        try:
            purchase_payload = {"package_id": "starter_10", "payment_method": "card"}
            response = requests.post(f"{API_BASE}/credits/purchase", headers=headers, json=purchase_payload)
            
            if response.status_code == 200:
                self.log_result("POST /api/credits/purchase", True, "Credit purchase endpoint exists", 200)
                results["credits_purchase"] = True
            else:
                self.log_result("POST /api/credits/purchase", False, f"Purchase endpoint: {response.text}", response.status_code)
                results["credits_purchase"] = False
                if response.status_code == 404:
                    self.api_mismatches.append("Frontend might expect /api/credits/purchase endpoint")
        except Exception as e:
            self.log_result("POST /api/credits/purchase", False, f"Exception: {str(e)}")
            results["credits_purchase"] = False
        
        return results
    
    def test_frontend_expected_endpoints(self) -> Dict[str, bool]:
        """Test endpoints that frontend specifically expects"""
        print("\n🌐 Testing Frontend Expected Endpoints...")
        results = {}
        
        # Test health endpoint
        try:
            response = requests.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                self.log_result("GET /health", True, "Health endpoint accessible", 200)
                results["health"] = True
            else:
                self.log_result("GET /health", False, f"Health endpoint failed: {response.text}", response.status_code)
                results["health"] = False
        except Exception as e:
            self.log_result("GET /health", False, f"Exception: {str(e)}")
            results["health"] = False
        
        # Test API health
        try:
            response = requests.get(f"{API_BASE}/health")
            if response.status_code == 200:
                self.log_result("GET /api/health", True, "API health endpoint accessible", 200)
                results["api_health"] = True
            else:
                self.log_result("GET /api/health", False, f"API health failed: {response.text}", response.status_code)
                results["api_health"] = False
        except Exception as e:
            self.log_result("GET /api/health", False, f"Exception: {str(e)}")
            results["api_health"] = False
        
        return results
    
    def test_frontend_user_journey(self) -> bool:
        """Simulate complete frontend user journey"""
        print("\n🚀 Testing Complete User Journey...")
        
        journey_steps = [
            ("Load Dashboard", lambda: requests.get(f"{API_BASE}/auth/me", headers={"Authorization": f"Bearer {self.user_token}"})),
            ("View Tournaments", lambda: requests.get(f"{API_BASE}/tournaments/")),
            ("Check Credits", lambda: requests.get(f"{API_BASE}/credits/balance", headers={"Authorization": f"Bearer {self.user_token}"})),
            ("View Credit Packages", lambda: requests.get(f"{API_BASE}/credits/packages", headers={"Authorization": f"Bearer {self.user_token}"})),
        ]
        
        journey_success = True
        for step_name, step_func in journey_steps:
            try:
                response = step_func()
                if response.status_code == 200:
                    self.log_result(f"Journey: {step_name}", True, "Step completed successfully", 200)
                else:
                    self.log_result(f"Journey: {step_name}", False, f"Step failed: {response.text}", response.status_code)
                    journey_success = False
            except Exception as e:
                self.log_result(f"Journey: {step_name}", False, f"Step exception: {str(e)}")
                journey_success = False
        
        return journey_success
    
    def generate_compatibility_report(self) -> Dict[str, Any]:
        """Generate comprehensive compatibility report"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result["success"])
        compatibility_percentage = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": total_tests - passed_tests,
            "compatibility_percentage": round(compatibility_percentage, 1),
            "critical_issues": self.critical_issues,
            "api_mismatches": self.api_mismatches,
            "test_results": self.test_results,
            "recommendations": []
        }
        
        # Generate recommendations
        if compatibility_percentage < 100:
            if any("tournament registration" in issue.lower() for issue in self.critical_issues):
                report["recommendations"].append("Fix tournament registration 400 error - check required fields and validation")
            
            if any("credits/packages" in issue.lower() for issue in self.api_mismatches):
                report["recommendations"].append("Frontend expects /api/credits/packages endpoint - verify availability")
            
            if any("credits/purchase" in issue.lower() for issue in self.api_mismatches):
                report["recommendations"].append("Frontend might expect /api/credits/purchase endpoint - implement if needed")
        
        return report
    
    def run_full_compatibility_test(self) -> Dict[str, Any]:
        """Run complete compatibility test suite"""
        print("🔍 Starting Frontend-Backend Compatibility Test Suite...")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_user():
            print("❌ CRITICAL: Cannot proceed without test user")
            return self.generate_compatibility_report()
        
        # Run all test categories
        auth_results = self.test_auth_endpoints()
        tournament_results = self.test_tournaments_endpoints()
        credits_results = self.test_credits_endpoints()
        frontend_results = self.test_frontend_expected_endpoints()
        
        # Run user journey test
        journey_success = self.test_frontend_user_journey()
        
        # Generate final report
        report = self.generate_compatibility_report()
        
        print("\n" + "=" * 60)
        print("🎯 COMPATIBILITY TEST SUMMARY")
        print("=" * 60)
        print(f"Overall Compatibility: {report['compatibility_percentage']}%")
        print(f"Tests Passed: {report['passed_tests']}/{report['total_tests']}")
        
        if report['critical_issues']:
            print(f"\n❌ Critical Issues ({len(report['critical_issues'])}):")
            for issue in report['critical_issues']:
                print(f"  • {issue}")
        
        if report['api_mismatches']:
            print(f"\n⚠️ API Mismatches ({len(report['api_mismatches'])}):")
            for mismatch in report['api_mismatches']:
                print(f"  • {mismatch}")
        
        if report['recommendations']:
            print(f"\n💡 Recommendations:")
            for rec in report['recommendations']:
                print(f"  • {rec}")
        
        print("\n" + "=" * 60)
        
        return report

def main():
    """Main execution function"""
    tester = CompatibilityTester()
    report = tester.run_full_compatibility_test()
    
    # Save report to file
    report_file = "compatibility_report.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"📄 Full report saved to: {report_file}")
    
    # Return appropriate exit code
    if report['compatibility_percentage'] < 80:
        print("❌ COMPATIBILITY TEST FAILED - Critical issues found")
        sys.exit(1)
    elif report['compatibility_percentage'] < 100:
        print("⚠️ COMPATIBILITY TEST PARTIAL - Some issues found")
        sys.exit(2)
    else:
        print("✅ COMPATIBILITY TEST PASSED - All systems compatible")
        sys.exit(0)

if __name__ == "__main__":
    main()