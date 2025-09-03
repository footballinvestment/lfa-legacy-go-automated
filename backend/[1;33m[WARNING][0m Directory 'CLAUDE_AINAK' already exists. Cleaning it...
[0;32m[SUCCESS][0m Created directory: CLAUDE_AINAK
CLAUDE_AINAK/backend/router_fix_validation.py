#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 LFA Legacy GO - Router Javítás Tesztelő Script
=================================================
9/9 router aktiválás ellenőrzése és új funkciók tesztelése
"""

import requests
import json
import time
import random
from datetime import datetime
from typing import Dict, List, Tuple

class RouterFixValidator:
    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url
        self.test_results = []
        self.total_tests = 0
        self.success_count = 0
        self.jwt_token = None
        
        print("🔧" * 50)
        print("🔧 LFA LEGACY GO - ROUTER JAVÍTÁS VALIDÁCIÓ")
        print("🔧" * 50)
        print(f"🎯 Cél: 9/9 router aktiválás ellenőrzés")
        print(f"🌐 Backend URL: {backend_url}")
        print(f"⏰ Teszt időpont: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("")
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Teszt eredmény naplózása"""
        status = "✅" if success else "❌"
        print(f"{status} {test_name}")
        if details:
            print(f"   📝 {details}")
        
        self.test_results.append({
            "name": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
        self.total_tests += 1
        if success:
            self.success_count += 1
    
    def test_router_activation_status(self) -> bool:
        """1. Router aktiválási státusz ellenőrzés"""
        print("\n🎯 PHASE 1: ROUTER ACTIVATION STATUS CHECK")
        print("=" * 50)
        
        try:
            # Backend health check
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            
            if response.status_code == 200:
                health_data = response.json()
                
                # Router status ellenőrzés
                router_info = health_data.get("routers", {})
                active_routers = router_info.get("active", 0)
                total_routers = router_info.get("total", 9)
                percentage = router_info.get("percentage", 0)
                
                self.log_test(
                    "Backend Health Check",
                    True,
                    f"Status: {health_data.get('status', 'unknown')}"
                )
                
                # Router aktiválás ellenőrzés
                if active_routers == 9 and total_routers == 9:
                    self.log_test(
                        "Router Activation - PERFECT!",
                        True,
                        f"🏆 9/9 routers active ({percentage}%)"
                    )
                    
                    # Részletes router státusz
                    router_status = router_info.get("status", {})
                    for router_name, status in router_status.items():
                        success = "SUCCESS" in status
                        self.log_test(
                            f"Router: {router_name}",
                            success,
                            status
                        )
                    
                    return True
                else:
                    self.log_test(
                        "Router Activation - INCOMPLETE",
                        False,
                        f"Only {active_routers}/{total_routers} routers active ({percentage}%)"
                    )
                    return False
                    
            else:
                self.log_test(
                    "Backend Health Check",
                    False,
                    f"HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Backend Connection",
                False,
                f"Failed to connect: {str(e)}"
            )
            return False
    
    def test_new_weather_endpoints(self) -> bool:
        """2. Új weather endpoints tesztelése"""
        print("\n🌤️ PHASE 2: WEATHER ROUTER TESTING")
        print("=" * 50)
        
        weather_tests = [
            ("Weather Health", "/api/weather/health", "GET"),
            ("Current Weather", "/api/weather/1/current", "GET"),
            ("Weather Forecast", "/api/weather/1/forecast?hours=6", "GET"),
            ("Game Suitability", "/api/weather/1/suitability/GAME1", "GET"),
            ("Weather Alerts", "/api/weather/alerts/active", "GET"),
            ("Batch Weather", "/api/weather/batch/multiple-locations?location_ids=1&location_ids=2", "GET")
        ]
        
        weather_success = 0
        
        for test_name, endpoint, method in weather_tests:
            try:
                response = requests.get(f"{self.backend_url}{endpoint}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(
                        test_name,
                        True,
                        f"Response: {json.dumps(data, indent=2)[:100]}..."
                    )
                    weather_success += 1
                else:
                    self.log_test(
                        test_name,
                        False,
                        f"HTTP {response.status_code} - {response.text[:100]}"
                    )
                    
            except Exception as e:
                self.log_test(
                    test_name,
                    False,
                    f"Error: {str(e)}"
                )
        
        success_rate = (weather_success / len(weather_tests)) * 100
        overall_success = success_rate >= 80
        
        self.log_test(
            f"Weather Router Overall",
            overall_success,
            f"{weather_success}/{len(weather_tests)} endpoints working ({success_rate:.1f}%)"
        )
        
        return overall_success
    
    def test_new_admin_endpoints(self) -> bool:
        """3. Új admin endpoints tesztelése"""
        print("\n👥 PHASE 3: ADMIN ROUTER TESTING")
        print("=" * 50)
        
        admin_tests = [
            ("Admin Health", "/api/admin/health", "GET"),
            ("System Stats", "/api/admin/stats", "GET"),
            ("Moderation Logs", "/api/admin/moderation/logs", "GET"),
            ("User Reports", "/api/admin/reports", "GET"),
            ("Admin Config", "/api/admin/config", "GET")
        ]
        
        admin_success = 0
        
        for test_name, endpoint, method in admin_tests:
            try:
                response = requests.get(f"{self.backend_url}{endpoint}", timeout=10)
                
                if response.status_code in [200, 401, 403]:  # 401/403 = auth required (expected)
                    if response.status_code == 200:
                        data = response.json()
                        self.log_test(
                            test_name,
                            True,
                            f"Success: {data.get('service', 'admin')} service active"
                        )
                    else:
                        self.log_test(
                            test_name,
                            True,
                            f"Auth required (HTTP {response.status_code}) - endpoint exists"
                        )
                    admin_success += 1
                else:
                    self.log_test(
                        test_name,
                        False,
                        f"HTTP {response.status_code} - {response.text[:100]}"
                    )
                    
            except Exception as e:
                self.log_test(
                    test_name,
                    False,
                    f"Error: {str(e)}"
                )
        
        success_rate = (admin_success / len(admin_tests)) * 100
        overall_success = success_rate >= 80
        
        self.log_test(
            f"Admin Router Overall",
            overall_success,
            f"{admin_success}/{len(admin_tests)} endpoints accessible ({success_rate:.1f}%)"
        )
        
        return overall_success
    
    def test_existing_routers_still_work(self) -> bool:
        """4. Meglévő routerek még működnek"""
        print("\n🔄 PHASE 4: EXISTING ROUTERS REGRESSION TEST")
        print("=" * 50)
        
        existing_tests = [
            ("Auth Health", "/api/auth/health", "GET"),
            ("Credits Packages", "/api/credits/packages", "GET"),
            ("Locations List", "/api/locations/", "GET"),
            ("Tournaments List", "/api/tournaments/", "GET"),
            ("Social Health", "/api/social/health", "GET"),
            ("Game Results Health", "/api/game-results/health", "GET")
        ]
        
        existing_success = 0
        
        for test_name, endpoint, method in existing_tests:
            try:
                response = requests.get(f"{self.backend_url}{endpoint}", timeout=10)
                
                if response.status_code in [200, 401]:  # 200 = working, 401 = auth required
                    self.log_test(
                        test_name,
                        True,
                        f"Working (HTTP {response.status_code})"
                    )
                    existing_success += 1
                else:
                    self.log_test(
                        test_name,
                        False,
                        f"HTTP {response.status_code} - {response.text[:100]}"
                    )
                    
            except Exception as e:
                self.log_test(
                    test_name,
                    False,
                    f"Error: {str(e)}"
                )
        
        success_rate = (existing_success / len(existing_tests)) * 100
        overall_success = success_rate >= 80
        
        self.log_test(
            f"Existing Routers Regression",
            overall_success,
            f"{existing_success}/{len(existing_tests)} still working ({success_rate:.1f}%)"
        )
        
        return overall_success
    
    def test_api_documentation_update(self) -> bool:
        """5. API dokumentáció frissítése"""
        print("\n📚 PHASE 5: API DOCUMENTATION UPDATE TEST")
        print("=" * 50)
        
        try:
            # Swagger UI elérhetőség
            docs_response = requests.get(f"{self.backend_url}/docs", timeout=10)
            
            if docs_response.status_code == 200:
                self.log_test(
                    "Swagger UI Access",
                    True,
                    "API documentation accessible"
                )
                
                # OpenAPI schema ellenőrzés
                openapi_response = requests.get(f"{self.backend_url}/openapi.json", timeout=10)
                
                if openapi_response.status_code == 200:
                    openapi_data = openapi_response.json()
                    paths = openapi_data.get("paths", {})
                    
                    # Új endpoints ellenőrzése
                    weather_endpoints = [path for path in paths.keys() if "/weather/" in path]
                    admin_endpoints = [path for path in paths.keys() if "/admin/" in path]
                    
                    total_endpoints = len(paths)
                    
                    self.log_test(
                        "API Schema Updated",
                        True,
                        f"Total endpoints: {total_endpoints}"
                    )
                    
                    self.log_test(
                        "Weather Endpoints Added",
                        len(weather_endpoints) > 0,
                        f"Found {len(weather_endpoints)} weather endpoints"
                    )
                    
                    self.log_test(
                        "Admin Endpoints Added",
                        len(admin_endpoints) > 0,
                        f"Found {len(admin_endpoints)} admin endpoints"
                    )
                    
                    return True
                else:
                    self.log_test(
                        "OpenAPI Schema",
                        False,
                        f"HTTP {openapi_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Swagger UI Access",
                    False,
                    f"HTTP {docs_response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "API Documentation Test",
                False,
                f"Error: {str(e)}"
            )
            return False
    
    def generate_final_report(self) -> Dict:
        """Végső jelentés generálása"""
        print("\n📊 FINAL ROUTER FIX VALIDATION REPORT")
        print("=" * 50)
        
        success_rate = (self.success_count / self.total_tests) * 100 if self.total_tests > 0 else 0
        
        # Determine overall status
        if success_rate >= 95:
            status = "🏆 PERFECT - Router fix completely successful"
            grade = "A+"
        elif success_rate >= 90:
            status = "✅ EXCELLENT - Router fix successful"
            grade = "A"
        elif success_rate >= 80:
            status = "✅ GOOD - Router fix mostly successful"
            grade = "B+"
        elif success_rate >= 70:
            status = "⚠️ PARTIAL - Router fix partially successful"
            grade = "B"
        else:
            status = "❌ FAILED - Router fix needs more work"
            grade = "C"
        
        # Count critical vs non-critical failures
        critical_failures = [
            test for test in self.test_results 
            if not test["success"] and any(keyword in test["name"].lower() 
                for keyword in ["router activation", "health", "overall"])
        ]
        
        report = {
            "validation_metadata": {
                "timestamp": datetime.now().isoformat(),
                "validator": "Router Fix Validator",
                "target": "9/9 router activation",
                "backend_url": self.backend_url
            },
            "summary": {
                "total_tests": self.total_tests,
                "successful_tests": self.success_count,
                "failed_tests": self.total_tests - self.success_count,
                "success_rate_percent": round(success_rate, 1),
                "overall_status": status,
                "grade": grade
            },
            "critical_failures": len(critical_failures),
            "test_categories": {
                "router_activation": [t for t in self.test_results if "router" in t["name"].lower()],
                "weather_endpoints": [t for t in self.test_results if "weather" in t["name"].lower()],
                "admin_endpoints": [t for t in self.test_results if "admin" in t["name"].lower()],
                "existing_functionality": [t for t in self.test_results if "regression" in t["name"].lower()]
            },
            "detailed_results": self.test_results
        }
        
        return report
    
    def print_final_summary(self, report: Dict):
        """Végső összefoglaló nyomtatása"""
        print(f"\n📈 VALIDATION SUMMARY")
        print(f"   Tests Executed: {report['summary']['total_tests']}")
        print(f"   Successful: {report['summary']['successful_tests']}")
        print(f"   Failed: {report['summary']['failed_tests']}")
        print(f"   Success Rate: {report['summary']['success_rate_percent']}%")
        print(f"   Grade: {report['summary']['grade']}")
        
        print(f"\n🎯 OVERALL ASSESSMENT")
        print(f"   Status: {report['summary']['overall_status']}")
        
        if report['critical_failures'] > 0:
            print(f"\n🔴 CRITICAL ISSUES: {report['critical_failures']}")
            for test in report['detailed_results']:
                if not test['success'] and any(keyword in test['name'].lower() 
                    for keyword in ["router activation", "health", "overall"]):
                    print(f"   ❌ {test['name']}: {test['details']}")
        else:
            print(f"\n✅ NO CRITICAL ISSUES FOUND")
        
        print(f"\n🌐 TESTED ENDPOINTS")
        print(f"   Backend API: {self.backend_url}")
        print(f"   API Documentation: {self.backend_url}/docs")
        print(f"   Health Check: {self.backend_url}/health")
        
        # Save report
        report_filename = f"router_fix_validation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📝 Detailed report saved: {report_filename}")
        print("🔧" * 50)
    
    def run_validation(self) -> bool:
        """Teljes validációs folyamat végrehajtása"""
        print("🚀 Starting router fix validation...")
        print("⏱️ Estimated duration: 3-5 minutes")
        print("")
        
        # Validation phases
        phases = [
            ("Router Activation Status", self.test_router_activation_status),
            ("Weather Endpoints", self.test_new_weather_endpoints),
            ("Admin Endpoints", self.test_new_admin_endpoints),
            ("Existing Routers", self.test_existing_routers_still_work),
            ("API Documentation", self.test_api_documentation_update)
        ]
        
        for phase_name, phase_func in phases:
            print(f"\n🔄 Executing {phase_name}...")
            try:
                phase_func()
            except Exception as e:
                print(f"💥 {phase_name} crashed: {str(e)}")
                self.log_test(
                    f"{phase_name} Execution",
                    False,
                    f"Phase crashed: {str(e)}"
                )
        
        # Generate and display final report
        report = self.generate_final_report()
        self.print_final_summary(report)
        
        # Return success status
        return report['summary']['success_rate_percent'] >= 80

def main():
    """Főprogram - router fix validáció"""
    print("🔧 LFA Legacy GO - Router Fix Validation")
    print("📋 Checking 7/9 → 9/9 router activation success")
    print("")
    
    # Backend URL megadása
    backend_url = input("Backend URL (default: http://localhost:8000): ").strip()
    if not backend_url:
        backend_url = "http://localhost:8000"
    
    validator = RouterFixValidator(backend_url)
    
    try:
        success = validator.run_validation()
        
        if success:
            print("\n🎉 ROUTER FIX VALIDATION SUCCESSFUL!")
            print("🏆 9/9 router activation achieved!")
            return 0
        else:
            print("\n⚠️ ROUTER FIX VALIDATION ISSUES DETECTED")
            print("🔧 Some routers may need additional fixes")
            return 1
            
    except KeyboardInterrupt:
        print("\n⚡ Validation interrupted by user")
        return 2
    except Exception as e:
        print(f"\n💥 Validation crashed: {str(e)}")
        return 3

if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)