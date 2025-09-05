#!/usr/bin/env python3
"""
Comprehensive MFA Implementation Test Script
Tests the complete MFA flow from setup to login
"""
import requests
import json
import time
import sys
from datetime import datetime

# Configuration
API_URL = "https://lfa-legacy-go-backend-376491487980.us-central1.run.app"
TEST_USER = "debugadmin2"
TEST_PASSWORD = "yourpassword"  # Update this with the actual password

class MFATestRunner:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.temp_token = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_login_without_mfa(self):
        """Test 1: Login without MFA (should work normally)"""
        self.log("🔍 TEST 1: Login without MFA enabled")
        
        data = {"username": TEST_USER, "password": TEST_PASSWORD}
        response = self.session.post(f"{API_URL}/api/auth/login", json=data)
        
        if response.status_code != 200:
            self.log(f"❌ Login failed: {response.status_code} - {response.text}", "ERROR")
            return False
        
        result = response.json()
        self.token = result["access_token"]
        
        self.log(f"✅ Login successful - Token type: {result.get('token_type', 'bearer')}")
        self.log(f"✅ MFA required: {result.get('mfa_required', False)}")
        
        if result.get("mfa_required"):
            self.log("⚠️ MFA already enabled - this might affect other tests", "WARN")
        
        return True
    
    def test_mfa_setup(self):
        """Test 2: Setup MFA for the user"""
        self.log("🔍 TEST 2: Setting up MFA")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = self.session.post(f"{API_URL}/api/auth/mfa/setup-totp", headers=headers)
        
        if response.status_code != 200:
            self.log(f"❌ MFA setup failed: {response.status_code} - {response.text}", "ERROR")
            return False
        
        result = response.json()
        self.log("✅ MFA setup initiated")
        
        if "manual_entry_key" in result:
            self.log(f"📱 Manual entry key: {result['manual_entry_key'][:16]}...")
        
        if "backup_codes" in result:
            self.log(f"🔑 Backup codes generated: {len(result['backup_codes'])} codes")
        
        return True
    
    def test_mfa_verification_setup(self):
        """Test 3: Verify MFA setup (requires manual input)"""
        self.log("🔍 TEST 3: MFA Setup Verification")
        
        self.log("📱 Please scan the QR code or enter the secret in your authenticator app")
        code = input("Enter the 6-digit code from your authenticator app: ").strip()
        
        if not code or len(code) != 6:
            self.log("❌ Invalid code format", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.token}"}
        data = {"secret": "temp", "code": code}  # The existing endpoint needs these
        
        response = self.session.post(f"{API_URL}/api/auth/mfa/verify-totp-setup", headers=headers, json=data)
        
        if response.status_code != 200:
            self.log(f"❌ MFA verification failed: {response.status_code} - {response.text}", "ERROR")
            return False
        
        self.log("✅ MFA verification successful - MFA is now ENABLED!")
        return True
    
    def test_mfa_enable(self):
        """Test 4: Enable MFA for the user"""
        self.log("🔍 TEST 4: Enabling MFA")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        data = {"method": "totp"}
        
        response = self.session.post(f"{API_URL}/api/auth/mfa/enable", headers=headers, json=data)
        
        if response.status_code != 200:
            self.log(f"❌ MFA enable failed: {response.status_code} - {response.text}", "ERROR")
            return False
        
        self.log("✅ MFA enabled successfully")
        return True
    
    def test_login_with_mfa_required(self):
        """Test 5: Login should now require MFA"""
        self.log("🔍 TEST 5: Login with MFA enabled (should require MFA)")
        
        # Clear session
        self.session = requests.Session()
        
        data = {"username": TEST_USER, "password": TEST_PASSWORD}
        response = self.session.post(f"{API_URL}/api/auth/login", json=data)
        
        if response.status_code != 200:
            self.log(f"❌ Login failed: {response.status_code} - {response.text}", "ERROR")
            return False
        
        result = response.json()
        
        if not result.get("mfa_required"):
            self.log("❌ CRITICAL: MFA should be required but isn't!", "ERROR")
            return False
        
        if result.get("token_type") != "mfa_pending":
            self.log("❌ CRITICAL: Token type should be 'mfa_pending'", "ERROR")
            return False
        
        self.temp_token = result["access_token"]
        self.log("✅ MFA is properly enforced - temp token issued")
        return True
    
    def test_mfa_login_verification(self):
        """Test 6: Complete MFA login with code"""
        self.log("🔍 TEST 6: Complete MFA login verification")
        
        code = input("Enter the 6-digit MFA code: ").strip()
        
        if not code or len(code) != 6:
            self.log("❌ Invalid code format", "ERROR")
            return False
        
        # Test the existing MFA verify endpoint
        headers = {"Authorization": f"Bearer {self.temp_token}"}
        data = {"method": "totp", "code": code}
        
        response = self.session.post(f"{API_URL}/api/auth/mfa/verify", headers=headers, json=data)
        
        if response.status_code != 200:
            self.log(f"❌ MFA login verification failed: {response.status_code} - {response.text}", "ERROR")
            return False
        
        result = response.json()
        
        if result.get("success") and result.get("access_token"):
            self.log("✅ MFA login completed successfully!")
            self.token = result["access_token"]
            return True
        else:
            self.log("❌ MFA login verification response invalid", "ERROR")
            return False
    
    def test_user_profile_with_mfa(self):
        """Test 7: Check user profile shows MFA enabled"""
        self.log("🔍 TEST 7: Verify user profile shows MFA enabled")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = self.session.get(f"{API_URL}/api/auth/profile", headers=headers)
        
        if response.status_code != 200:
            self.log(f"❌ Profile fetch failed: {response.status_code} - {response.text}", "ERROR")
            return False
        
        result = response.json()
        
        if result.get("mfa_enabled"):
            self.log("✅ User profile correctly shows MFA enabled")
            return True
        else:
            self.log("❌ User profile does not show MFA enabled", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all MFA tests"""
        self.log("🚀 Starting MFA Implementation Tests")
        self.log(f"🎯 Target: {API_URL}")
        self.log(f"👤 Test user: {TEST_USER}")
        
        tests = [
            ("Initial Login", self.test_login_without_mfa),
            ("MFA Setup", self.test_mfa_setup),
            ("MFA Verification", self.test_mfa_verification_setup),
            ("MFA Enable", self.test_mfa_enable),
            ("Login with MFA", self.test_login_with_mfa_required),
            ("MFA Login Verification", self.test_mfa_login_verification),
            ("Profile Check", self.test_user_profile_with_mfa),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            self.log(f"\n{'='*50}")
            try:
                if test_func():
                    passed += 1
                    self.log(f"✅ {test_name} - PASSED")
                else:
                    self.log(f"❌ {test_name} - FAILED")
                    
                # Small delay between tests
                time.sleep(1)
                
            except Exception as e:
                self.log(f"💥 {test_name} - ERROR: {str(e)}", "ERROR")
        
        self.log(f"\n{'='*50}")
        self.log(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🏆 ALL TESTS PASSED - MFA IMPLEMENTATION WORKING!")
            return True
        else:
            self.log(f"⚠️ {total - passed} tests failed - MFA needs attention")
            return False

def main():
    """Main test runner"""
    if len(sys.argv) > 1:
        global TEST_PASSWORD
        TEST_PASSWORD = sys.argv[1]
    
    print("🔐 LFA Legacy GO - MFA Implementation Test")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    runner = MFATestRunner()
    success = runner.run_all_tests()
    
    print("\n" + "="*60)
    if success:
        print("🎉 MFA IMPLEMENTATION TEST: SUCCESS")
        print("✅ Users will be required to use MFA codes when logging in")
    else:
        print("🚨 MFA IMPLEMENTATION TEST: FAILED")
        print("❌ MFA enforcement is not working properly")
    
    print(f"⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())