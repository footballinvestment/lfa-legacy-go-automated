#!/usr/bin/env python3
"""
🏆 LFA Legacy GO - Post-Fix Validation Test
====================================================
Comprehensive validation of Claude Code's Pydantic v2 fixes and 9/9 router activation

Test Categories:
1. Pydantic v2 Compatibility Verification  
2. Router Import & Activation Tests
3. API Endpoint Functionality Tests
4. Error Monitoring & Health Checks
5. Full System Integration Test

Author: Generated based on handoff validation requirements
Date: August 16, 2025
"""

import os
import sys
import asyncio
import aiohttp
import subprocess
import time
import json
import requests
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Test configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"
PROJECT_ROOT = Path("~/Seafile/Football Investment/Projects/GanballGames/lfa-legacy-go").expanduser()
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"

class LFAValidationTest:
    """Comprehensive validation test suite for LFA Legacy GO fixes"""
    
    def __init__(self):
        self.results = {
            "pydantic_fixes": [],
            "router_tests": [],
            "api_tests": [],
            "health_tests": [],
            "integration_tests": []
        }
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test(self, category: str, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
            
        result = {
            "test": test_name,
            "status": status,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        
        self.results[category].append(result)
        logger.info(f"{status}: {test_name} - {details}")

    # ========================================================================
    # 1. PYDANTIC V2 COMPATIBILITY TESTS
    # ========================================================================
    
    def test_pydantic_v2_compatibility(self):
        """Test 1: Verify Pydantic v2 compatibility fixes"""
        logger.info("🔧 Testing Pydantic v2 compatibility fixes...")
        
        # Test files that should have been fixed
        files_to_check = [
            BACKEND_DIR / "app" / "routers" / "admin.py",
            BACKEND_DIR / "app" / "routers" / "game_results.py",
            BACKEND_DIR / "app" / "routers" / "auth.py"
        ]
        
        for file_path in files_to_check:
            if not file_path.exists():
                self.log_test("pydantic_fixes", f"File exists: {file_path.name}", False, f"File not found: {file_path}")
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for old regex= usage (should be gone)
                regex_usage = content.count('regex=')
                self.log_test("pydantic_fixes", f"No regex= usage in {file_path.name}", 
                            regex_usage == 0, f"Found {regex_usage} regex= instances")
                
                # Check for new pattern= usage (should be present)
                pattern_usage = content.count('pattern=')
                self.log_test("pydantic_fixes", f"Pattern= usage in {file_path.name}", 
                            pattern_usage > 0, f"Found {pattern_usage} pattern= instances")
                
                # Check for Pydantic Field imports
                has_field_import = 'from pydantic import' in content and 'Field' in content
                self.log_test("pydantic_fixes", f"Pydantic Field imports in {file_path.name}", 
                            has_field_import, "Field import found" if has_field_import else "No Field import")
                
            except Exception as e:
                self.log_test("pydantic_fixes", f"Read {file_path.name}", False, f"Error: {str(e)}")

    def test_specific_pydantic_patterns(self):
        """Test 2: Check specific Pydantic pattern fixes"""
        logger.info("🎯 Testing specific Pydantic pattern fixes...")
        
        admin_file = BACKEND_DIR / "app" / "routers" / "admin.py"
        if admin_file.exists():
            try:
                with open(admin_file, 'r') as f:
                    content = f.read()
                
                # Check for specific patterns that should be fixed
                expected_patterns = [
                    'pattern="^(warning|suspension|inappropriate_conduct|cheating|harassment|spam|terms_violation|other)$"',
                    'pattern="^(active|resolved|dismissed)$"',
                    'pattern="^(suspend|activate|delete|reset_password|add_credits)$"'
                ]
                
                for pattern in expected_patterns:
                    found = pattern in content
                    self.log_test("pydantic_fixes", f"Admin pattern fix: {pattern[:30]}...", 
                                found, "Pattern found" if found else "Pattern missing")
                    
            except Exception as e:
                self.log_test("pydantic_fixes", "Admin pattern check", False, f"Error: {str(e)}")

    # ========================================================================
    # 2. ROUTER IMPORT & ACTIVATION TESTS  
    # ========================================================================
    
    def test_router_imports(self):
        """Test 3: Verify router import functionality"""
        logger.info("📦 Testing router imports...")
        
        # Check main.py router import logic
        main_file = BACKEND_DIR / "app" / "main.py"
        if main_file.exists():
            try:
                with open(main_file, 'r') as f:
                    content = f.read()
                
                # Check for safe_import_router function
                has_safe_import = 'def safe_import_router' in content
                self.log_test("router_tests", "Safe import function exists", 
                            has_safe_import, "Function found" if has_safe_import else "Function missing")
                
                # Check for all 9 router imports
                expected_routers = [
                    'auth_router = safe_import_router("auth")',
                    'admin_router = safe_import_router("admin")',
                    'credits_router = safe_import_router("credits")',
                    'social_router = safe_import_router("social")',
                    'locations_router = safe_import_router("locations")',
                    'booking_router = safe_import_router("booking")',
                    'tournaments_router = safe_import_router("tournaments")',
                    'game_results_router = safe_import_router("game_results")',
                    'weather_router = safe_import_router("weather")'
                ]
                
                for router_import in expected_routers:
                    found = router_import in content
                    router_name = router_import.split('"')[1]
                    self.log_test("router_tests", f"Router import: {router_name}", 
                                found, "Import found" if found else "Import missing")
                
                # Check for success message
                has_success_msg = 'ALL ROUTERS ACTIVE - 9/9 SUCCESS!' in content
                self.log_test("router_tests", "Success message present", 
                            has_success_msg, "Message found" if has_success_msg else "Message missing")
                
            except Exception as e:
                self.log_test("router_tests", "Main.py analysis", False, f"Error: {str(e)}")

    def test_router_files_exist(self):
        """Test 4: Verify all router files exist and are valid"""
        logger.info("📁 Testing router file existence...")
        
        router_files = [
            "auth.py", "admin.py", "credits.py", "social.py", 
            "locations.py", "booking.py", "tournaments.py", 
            "game_results.py", "weather.py"
        ]
        
        routers_dir = BACKEND_DIR / "app" / "routers"
        
        for router_file in router_files:
            file_path = routers_dir / router_file
            exists = file_path.exists()
            
            if exists:
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                    
                    # Check for APIRouter definition
                    has_router = 'APIRouter' in content or 'router = ' in content
                    self.log_test("router_tests", f"Valid router: {router_file}", 
                                has_router, f"Router definition found" if has_router else "No router definition")
                    
                except Exception as e:
                    self.log_test("router_tests", f"Read router: {router_file}", False, f"Error: {str(e)}")
            else:
                self.log_test("router_tests", f"Router exists: {router_file}", False, "File not found")

    # ========================================================================
    # 3. API ENDPOINT FUNCTIONALITY TESTS
    # ========================================================================
    
    def test_backend_startup(self):
        """Test 5: Check if backend can start without errors"""
        logger.info("🚀 Testing backend startup...")
        
        try:
            # Try to start backend process (non-blocking check)
            result = subprocess.run([
                sys.executable, "-c", 
                "import sys; sys.path.append('app'); from app.main import app; print('✅ Backend imports successful')"
            ], cwd=BACKEND_DIR, capture_output=True, text=True, timeout=30)
            
            success = result.returncode == 0 and "Backend imports successful" in result.stdout
            details = result.stdout if success else f"Error: {result.stderr}"
            
            self.log_test("api_tests", "Backend startup test", success, details)
            
        except subprocess.TimeoutExpired:
            self.log_test("api_tests", "Backend startup test", False, "Timeout after 30 seconds")
        except Exception as e:
            self.log_test("api_tests", "Backend startup test", False, f"Error: {str(e)}")

    def test_health_endpoint(self):
        """Test 6: Test health endpoint if backend is running"""
        logger.info("🏥 Testing health endpoint...")
        
        try:
            response = requests.get(f"{BACKEND_URL}/health", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check router count
                routers = data.get('routers', {})
                active_count = routers.get('active', 0)
                total_count = routers.get('total', 0)
                
                self.log_test("health_tests", "Health endpoint accessible", True, 
                            f"Status: {response.status_code}")
                            
                self.log_test("health_tests", "Router count check", 
                            active_count >= 7, f"Active: {active_count}/{total_count}")
                
                # Check for 9/9 success
                perfect_score = active_count == 9 and total_count == 9
                self.log_test("health_tests", "Perfect 9/9 router activation", 
                            perfect_score, f"Achievement: {active_count}/9 routers active")
                
            else:
                self.log_test("health_tests", "Health endpoint accessible", False, 
                            f"HTTP {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            self.log_test("health_tests", "Health endpoint accessible", False, 
                        "Backend not running - start with: uvicorn app.main:app --reload")
        except Exception as e:
            self.log_test("health_tests", "Health endpoint test", False, f"Error: {str(e)}")

    def test_router_endpoints(self):
        """Test 7: Test individual router endpoints"""
        logger.info("🎯 Testing individual router endpoints...")
        
        router_endpoints = [
            ("/api/auth/health", "Auth router"),
            ("/api/admin/health", "Admin router"),
            ("/api/credits/packages", "Credits router"),
            ("/api/weather/health", "Weather router"),
            ("/api/locations/", "Locations router"),
            ("/api/social/health", "Social router"),
            ("/docs", "API Documentation")
        ]
        
        for endpoint, router_name in router_endpoints:
            try:
                response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=5)
                success = response.status_code in [200, 307]  # 307 for redirects
                
                self.log_test("api_tests", f"{router_name} endpoint", success, 
                            f"HTTP {response.status_code}")
                
            except requests.exceptions.ConnectionError:
                self.log_test("api_tests", f"{router_name} endpoint", False, 
                            "Backend not running")
            except Exception as e:
                self.log_test("api_tests", f"{router_name} endpoint", False, f"Error: {str(e)}")

    # ========================================================================
    # 4. FRONTEND MEMORY OPTIMIZATION TESTS
    # ========================================================================
    
    def test_frontend_package_json(self):
        """Test 8: Check frontend configuration"""
        logger.info("⚛️ Testing frontend configuration...")
        
        package_json = FRONTEND_DIR / "package.json"
        if package_json.exists():
            try:
                with open(package_json, 'r') as f:
                    content = f.read()
                    
                # Check for React and dependencies
                has_react = '"react"' in content
                self.log_test("integration_tests", "Frontend React dependency", 
                            has_react, "React found" if has_react else "React missing")
                
                # Check for scripts
                has_start_script = '"start"' in content
                self.log_test("integration_tests", "Frontend start script", 
                            has_start_script, "Start script found" if has_start_script else "Start script missing")
                
            except Exception as e:
                self.log_test("integration_tests", "Frontend package.json", False, f"Error: {str(e)}")
        else:
            self.log_test("integration_tests", "Frontend package.json exists", False, "File not found")

    def test_memory_optimization_script(self):
        """Test 9: Check for memory optimization script"""
        logger.info("🧠 Testing memory optimization setup...")
        
        # Check for memory optimization script
        memory_script = FRONTEND_DIR / "start_memory_safe.sh"
        if memory_script.exists():
            self.log_test("integration_tests", "Memory optimization script", True, "Script found")
        else:
            # Check if NODE_OPTIONS is documented anywhere
            readme_file = FRONTEND_DIR / "README.md"
            if readme_file.exists():
                try:
                    with open(readme_file, 'r') as f:
                        content = f.read()
                    has_memory_config = 'NODE_OPTIONS' in content or 'memory' in content.lower()
                    self.log_test("integration_tests", "Memory optimization documented", 
                                has_memory_config, "Documentation found" if has_memory_config else "Not documented")
                except Exception as e:
                    self.log_test("integration_tests", "Memory optimization check", False, f"Error: {str(e)}")
            else:
                self.log_test("integration_tests", "Memory optimization setup", False, "No optimization found")

    # ========================================================================
    # 5. COMPREHENSIVE VALIDATION TEST
    # ========================================================================
    
    def test_comprehensive_validation(self):
        """Test 10: Run the original comprehensive test if available"""
        logger.info("🧪 Running comprehensive validation...")
        
        test_file = BACKEND_DIR / "lfa_complete_test.py"
        if test_file.exists():
            try:
                result = subprocess.run([
                    sys.executable, "lfa_complete_test.py"
                ], cwd=BACKEND_DIR, capture_output=True, text=True, timeout=60)
                
                success = result.returncode == 0
                output = result.stdout + result.stderr
                
                # Parse success rate from output
                success_rate = 0
                if "passed" in output.lower():
                    # Try to extract success rate
                    import re
                    match = re.search(r'(\d+)/(\d+)', output)
                    if match:
                        passed, total = map(int, match.groups())
                        success_rate = (passed / total) * 100 if total > 0 else 0
                
                self.log_test("integration_tests", "Comprehensive test execution", success, 
                            f"Success rate: {success_rate:.1f}%")
                
            except subprocess.TimeoutExpired:
                self.log_test("integration_tests", "Comprehensive test execution", False, 
                            "Timeout after 60 seconds")
            except Exception as e:
                self.log_test("integration_tests", "Comprehensive test execution", False, f"Error: {str(e)}")
        else:
            self.log_test("integration_tests", "Comprehensive test available", False, 
                        "lfa_complete_test.py not found")

    # ========================================================================
    # TEST EXECUTION & REPORTING
    # ========================================================================
    
    def run_all_tests(self):
        """Run all validation tests"""
        logger.info("🎯 Starting LFA Legacy GO Post-Fix Validation Tests...")
        logger.info("=" * 70)
        
        # Execute all test categories
        self.test_pydantic_v2_compatibility()
        self.test_specific_pydantic_patterns()
        self.test_router_imports()
        self.test_router_files_exist()
        self.test_backend_startup()
        self.test_health_endpoint()
        self.test_router_endpoints()
        self.test_frontend_package_json()
        self.test_memory_optimization_script()
        self.test_comprehensive_validation()
        
        # Generate final report
        self.generate_final_report()

    def generate_final_report(self):
        """Generate comprehensive test report"""
        logger.info("=" * 70)
        logger.info("🏆 LFA LEGACY GO VALIDATION REPORT")
        logger.info("=" * 70)
        
        # Overall statistics
        success_rate = (self.passed_tests / self.total_tests) * 100 if self.total_tests > 0 else 0
        
        logger.info(f"📊 OVERALL RESULTS:")
        logger.info(f"   Total Tests: {self.total_tests}")
        logger.info(f"   Passed: {self.passed_tests}")
        logger.info(f"   Failed: {self.failed_tests}")
        logger.info(f"   Success Rate: {success_rate:.1f}%")
        logger.info("")
        
        # Category breakdown
        for category, tests in self.results.items():
            if tests:
                category_passed = sum(1 for test in tests if test['passed'])
                category_total = len(tests)
                category_rate = (category_passed / category_total) * 100 if category_total > 0 else 0
                
                logger.info(f"📋 {category.upper().replace('_', ' ')}:")
                logger.info(f"   {category_passed}/{category_total} passed ({category_rate:.1f}%)")
                
                for test in tests:
                    logger.info(f"   {test['status']}: {test['test']} - {test['details']}")
                logger.info("")
        
        # Final assessment
        if success_rate >= 90:
            status = "🏆 EXCELLENT"
            message = "Claude Code fixes were highly successful!"
        elif success_rate >= 80:
            status = "✅ GOOD" 
            message = "Most fixes applied successfully."
        elif success_rate >= 70:
            status = "⚠️ PARTIAL"
            message = "Some issues remain, review failed tests."
        else:
            status = "❌ NEEDS WORK"
            message = "Significant issues detected, manual intervention required."
        
        logger.info(f"🎯 FINAL ASSESSMENT: {status}")
        logger.info(f"   {message}")
        logger.info("")
        
        # Recommendations
        logger.info("🚀 RECOMMENDATIONS:")
        
        if any(test['test'].startswith('Router') for category in self.results.values() for test in category if not test['passed']):
            logger.info("   • Check router import issues and restart backend")
            
        if any('health' in test['test'].lower() for category in self.results.values() for test in category if not test['passed']):
            logger.info("   • Start backend: cd backend && uvicorn app.main:app --reload")
            
        if any('frontend' in test['test'].lower() for category in self.results.values() for test in category if not test['passed']):
            logger.info("   • Apply memory fix: export NODE_OPTIONS='--max-old-space-size=20480'")
            
        logger.info("   • For 9/9 router activation, ensure all Pydantic issues are resolved")
        logger.info("")
        
        # Save report to file
        self.save_report_to_file()

    def save_report_to_file(self):
        """Save detailed report to JSON file"""
        try:
            report_data = {
                "validation_date": datetime.now().isoformat(),
                "total_tests": self.total_tests,
                "passed_tests": self.passed_tests,
                "failed_tests": self.failed_tests,
                "success_rate": (self.passed_tests / self.total_tests) * 100 if self.total_tests > 0 else 0,
                "results": self.results,
                "project_status": "Production Ready" if self.passed_tests >= self.total_tests * 0.9 else "Needs Work"
            }
            
            report_file = BACKEND_DIR / "validation_report.json"
            with open(report_file, 'w') as f:
                json.dump(report_data, f, indent=2)
                
            logger.info(f"💾 Detailed report saved to: {report_file}")
            
        except Exception as e:
            logger.error(f"❌ Failed to save report: {str(e)}")

def main():
    """Main test execution"""
    print("🏆 LFA Legacy GO - Post-Fix Validation Test")
    print("=" * 50)
    print("Validating Claude Code's Pydantic v2 fixes and 9/9 router activation")
    print()
    
    # Check if project directory exists
    if not PROJECT_ROOT.exists():
        print(f"❌ Project directory not found: {PROJECT_ROOT}")
        print("Please update PROJECT_ROOT path in the script")
        return
    
    # Initialize and run tests
    validator = LFAValidationTest()
    validator.run_all_tests()

if __name__ == "__main__":
    main()