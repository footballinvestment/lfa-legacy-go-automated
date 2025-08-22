#!/usr/bin/env python3
"""
Test production version locally before Railway deployment
Validates all components work with production configuration
"""

import os
import sys
import requests
import time
import json
from datetime import datetime

def test_production_api():
    """Test production API locally"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Production API Locally")
    print("=" * 50)
    
    # Test endpoints
    test_cases = [
        {"name": "Root Endpoint", "path": "/", "method": "GET"},
        {"name": "Health Check", "path": "/health", "method": "GET"},
        {"name": "API Status", "path": "/api/status", "method": "GET"},
        {"name": "Performance Metrics", "path": "/api/performance", "method": "GET"},
        {"name": "Swagger Docs", "path": "/docs", "method": "GET"}
    ]
    
    results = []
    
    for test in test_cases:
        try:
            start_time = time.time()
            response = requests.get(f"{base_url}{test['path']}", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            result = {
                "name": test["name"],
                "status_code": response.status_code,
                "response_time": round(response_time, 2),
                "success": response.status_code < 400,
                "path": test["path"]
            }
            
            # Check for standardized response format on API endpoints
            if test["path"].startswith("/api/"):
                try:
                    data = response.json()
                    has_standard_format = all(key in data for key in ["success", "timestamp"])
                    result["standard_format"] = has_standard_format
                    result["has_request_id"] = "request_id" in data
                except:
                    result["standard_format"] = False
                    result["has_request_id"] = False
            
            results.append(result)
            
            status = "✅" if result["success"] else "❌"
            print(f"{status} {test['name']}: {response.status_code} ({response_time:.2f}ms)")
            
        except Exception as e:
            results.append({
                "name": test["name"],
                "error": str(e),
                "success": False,
                "path": test["path"]
            })
            print(f"❌ {test['name']}: ERROR - {str(e)}")
    
    print("\n📊 Test Results Summary:")
    print("=" * 50)
    
    total_tests = len(results)
    successful_tests = len([r for r in results if r.get("success", False)])
    
    print(f"Total Tests: {total_tests}")
    print(f"Successful: {successful_tests}")
    print(f"Failed: {total_tests - successful_tests}")
    print(f"Success Rate: {(successful_tests/total_tests)*100:.1f}%")
    
    # Check API standards compliance
    api_tests = [r for r in results if r.get("standard_format") is not None]
    if api_tests:
        standard_compliant = len([r for r in api_tests if r.get("standard_format", False)])
        print(f"API Standards Compliance: {standard_compliant}/{len(api_tests)} ({(standard_compliant/len(api_tests))*100:.1f}%)")
    
    # Response time analysis
    response_times = [r.get("response_time", 0) for r in results if "response_time" in r]
    if response_times:
        avg_response_time = sum(response_times) / len(response_times)
        max_response_time = max(response_times)
        print(f"Average Response Time: {avg_response_time:.2f}ms")
        print(f"Max Response Time: {max_response_time:.2f}ms")
    
    # Save detailed results
    report_file = f"production_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "base_url": base_url,
            "results": results,
            "summary": {
                "total_tests": total_tests,
                "successful_tests": successful_tests,
                "success_rate": (successful_tests/total_tests)*100,
                "average_response_time": avg_response_time if response_times else 0
            }
        }, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: {report_file}")
    
    if successful_tests == total_tests:
        print("\n🎉 All tests passed! Ready for Railway deployment.")
        return True
    else:
        print("\n⚠️ Some tests failed. Check the issues before deployment.")
        return False

if __name__ == "__main__":
    print("🚀 LFA Legacy GO - Production Testing")
    print("Make sure the server is running with: uvicorn app.main:app --reload")
    print()
    
    # Wait for user confirmation
    input("Press Enter to start testing...")
    
    success = test_production_api()
    sys.exit(0 if success else 1)