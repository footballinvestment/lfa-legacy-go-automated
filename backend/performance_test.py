#!/usr/bin/env python3
"""
Performance testing script for LFA Legacy GO Backend
Tests API response times, memory usage, and database performance
"""

import asyncio
import time
import statistics
import requests
import psutil
import concurrent.futures
from typing import List, Dict, Any
import json

class PerformanceTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results: Dict[str, Any] = {}
        
    def test_endpoint_performance(self, endpoint: str, num_requests: int = 100) -> Dict[str, Any]:
        """Test API endpoint performance"""
        print(f"Testing {endpoint} with {num_requests} requests...")
        
        url = f"{self.base_url}{endpoint}"
        response_times = []
        errors = 0
        status_codes = {}
        
        start_time = time.time()
        
        # Sequential requests
        for i in range(num_requests):
            try:
                request_start = time.time()
                response = requests.get(url, timeout=10)
                request_duration = (time.time() - request_start) * 1000  # ms
                
                response_times.append(request_duration)
                
                # Track status codes
                status = response.status_code
                status_codes[status] = status_codes.get(status, 0) + 1
                
                if response.status_code != 200:
                    errors += 1
                    
            except Exception as e:
                errors += 1
                print(f"Request {i+1} failed: {e}")
        
        total_time = time.time() - start_time
        
        if response_times:
            return {
                "endpoint": endpoint,
                "total_requests": num_requests,
                "successful_requests": len(response_times),
                "errors": errors,
                "total_time": round(total_time, 2),
                "requests_per_second": round(num_requests / total_time, 2),
                "response_times": {
                    "min": round(min(response_times), 2),
                    "max": round(max(response_times), 2),
                    "avg": round(statistics.mean(response_times), 2),
                    "median": round(statistics.median(response_times), 2),
                    "p95": round(sorted(response_times)[int(len(response_times) * 0.95)], 2),
                    "p99": round(sorted(response_times)[int(len(response_times) * 0.99)], 2),
                },
                "status_codes": status_codes,
                "performance_score": self._calculate_performance_score(response_times, errors, num_requests)
            }
        else:
            return {
                "endpoint": endpoint,
                "error": "No successful requests",
                "errors": errors,
                "performance_score": 0
            }
    
    def test_concurrent_performance(self, endpoint: str, concurrent_users: int = 10, requests_per_user: int = 10) -> Dict[str, Any]:
        """Test API endpoint with concurrent requests"""
        print(f"Testing {endpoint} with {concurrent_users} concurrent users, {requests_per_user} requests each...")
        
        url = f"{self.base_url}{endpoint}"
        all_response_times = []
        total_errors = 0
        
        def make_requests(user_id: int) -> List[float]:
            user_times = []
            user_errors = 0
            
            for _ in range(requests_per_user):
                try:
                    start = time.time()
                    response = requests.get(url, timeout=10)
                    duration = (time.time() - start) * 1000  # ms
                    
                    if response.status_code == 200:
                        user_times.append(duration)
                    else:
                        user_errors += 1
                        
                except Exception:
                    user_errors += 1
            
            return user_times, user_errors
        
        start_time = time.time()
        
        # Run concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = [executor.submit(make_requests, i) for i in range(concurrent_users)]
            
            for future in concurrent.futures.as_completed(futures):
                try:
                    times, errors = future.result()
                    all_response_times.extend(times)
                    total_errors += errors
                except Exception as e:
                    print(f"Concurrent request failed: {e}")
                    total_errors += requests_per_user
        
        total_time = time.time() - start_time
        total_requests = concurrent_users * requests_per_user
        
        if all_response_times:
            return {
                "endpoint": endpoint,
                "concurrent_users": concurrent_users,
                "requests_per_user": requests_per_user,
                "total_requests": total_requests,
                "successful_requests": len(all_response_times),
                "errors": total_errors,
                "total_time": round(total_time, 2),
                "requests_per_second": round(total_requests / total_time, 2),
                "response_times": {
                    "min": round(min(all_response_times), 2),
                    "max": round(max(all_response_times), 2),
                    "avg": round(statistics.mean(all_response_times), 2),
                    "median": round(statistics.median(all_response_times), 2),
                    "p95": round(sorted(all_response_times)[int(len(all_response_times) * 0.95)], 2),
                    "p99": round(sorted(all_response_times)[int(len(all_response_times) * 0.99)], 2),
                },
                "performance_score": self._calculate_performance_score(all_response_times, total_errors, total_requests)
            }
        else:
            return {
                "endpoint": endpoint,
                "error": "No successful requests",
                "errors": total_errors,
                "performance_score": 0
            }
    
    def _calculate_performance_score(self, response_times: List[float], errors: int, total_requests: int) -> int:
        """Calculate performance score (0-100)"""
        if not response_times:
            return 0
        
        score = 100
        avg_time = statistics.mean(response_times)
        error_rate = (errors / total_requests) * 100
        
        # Penalize slow response times
        if avg_time > 200:  # >200ms
            score -= min(40, (avg_time - 200) / 10)
        
        # Penalize errors
        if error_rate > 5:
            score -= min(30, error_rate * 2)
        
        # Penalize high P95
        p95 = sorted(response_times)[int(len(response_times) * 0.95)]
        if p95 > 500:  # >500ms P95
            score -= min(20, (p95 - 500) / 25)
        
        return max(0, round(score))
    
    def test_memory_usage(self, duration: int = 60) -> Dict[str, Any]:
        """Monitor memory usage over time"""
        print(f"Monitoring memory usage for {duration} seconds...")
        
        memory_samples = []
        cpu_samples = []
        
        start_time = time.time()
        while time.time() - start_time < duration:
            try:
                # Memory usage in MB
                memory = psutil.virtual_memory()
                memory_mb = memory.used / 1024 / 1024
                memory_samples.append(memory_mb)
                
                # CPU usage
                cpu = psutil.cpu_percent(interval=1)
                cpu_samples.append(cpu)
                
            except Exception as e:
                print(f"Memory monitoring error: {e}")
                time.sleep(1)
        
        if memory_samples:
            return {
                "duration": duration,
                "memory_mb": {
                    "min": round(min(memory_samples), 2),
                    "max": round(max(memory_samples), 2),
                    "avg": round(statistics.mean(memory_samples), 2),
                    "final": round(memory_samples[-1], 2)
                },
                "cpu_percent": {
                    "min": round(min(cpu_samples), 2),
                    "max": round(max(cpu_samples), 2),
                    "avg": round(statistics.mean(cpu_samples), 2)
                } if cpu_samples else {},
                "memory_stable": abs(memory_samples[0] - memory_samples[-1]) < 50,  # <50MB growth
                "performance_score": self._calculate_memory_score(memory_samples)
            }
        else:
            return {"error": "No memory samples collected", "performance_score": 0}
    
    def _calculate_memory_score(self, memory_samples: List[float]) -> int:
        """Calculate memory performance score"""
        if not memory_samples:
            return 0
        
        score = 100
        avg_memory = statistics.mean(memory_samples)
        memory_growth = memory_samples[-1] - memory_samples[0]
        
        # Penalize high memory usage
        if avg_memory > 512:  # >512MB
            score -= min(40, (avg_memory - 512) / 25)
        
        # Penalize memory growth (potential leaks)
        if memory_growth > 100:  # >100MB growth
            score -= min(30, memory_growth / 10)
        
        return max(0, round(score))
    
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run comprehensive performance test suite"""
        print("🚀 Starting comprehensive performance test...")
        
        # Test endpoints
        endpoints_to_test = [
            "/",
            "/health",
            "/api/health",
            "/api/performance/summary"
        ]
        
        results = {
            "test_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "endpoints": {},
            "concurrent_tests": {},
            "memory_test": {},
            "overall_score": 0
        }
        
        # Test individual endpoints
        endpoint_scores = []
        for endpoint in endpoints_to_test:
            try:
                result = self.test_endpoint_performance(endpoint, 50)
                results["endpoints"][endpoint] = result
                endpoint_scores.append(result.get("performance_score", 0))
            except Exception as e:
                print(f"Failed to test {endpoint}: {e}")
                results["endpoints"][endpoint] = {"error": str(e), "performance_score": 0}
                endpoint_scores.append(0)
        
        # Test concurrent performance
        try:
            concurrent_result = self.test_concurrent_performance("/health", 10, 5)
            results["concurrent_tests"]["health"] = concurrent_result
            endpoint_scores.append(concurrent_result.get("performance_score", 0))
        except Exception as e:
            print(f"Concurrent test failed: {e}")
            results["concurrent_tests"]["health"] = {"error": str(e), "performance_score": 0}
            endpoint_scores.append(0)
        
        # Test memory usage
        try:
            memory_result = self.test_memory_usage(30)
            results["memory_test"] = memory_result
            endpoint_scores.append(memory_result.get("performance_score", 0))
        except Exception as e:
            print(f"Memory test failed: {e}")
            results["memory_test"] = {"error": str(e), "performance_score": 0}
            endpoint_scores.append(0)
        
        # Calculate overall score
        if endpoint_scores:
            results["overall_score"] = round(statistics.mean(endpoint_scores))
        
        return results
    
    def generate_report(self, results: Dict[str, Any]) -> str:
        """Generate human-readable performance report"""
        report = []
        report.append("=" * 60)
        report.append("🚀 LFA Legacy GO - Performance Test Report")
        report.append("=" * 60)
        report.append(f"Test Time: {results['test_timestamp']}")
        report.append(f"Overall Score: {results['overall_score']}/100")
        report.append("")
        
        # Endpoint results
        report.append("📊 Endpoint Performance:")
        report.append("-" * 40)
        for endpoint, data in results["endpoints"].items():
            if "error" in data:
                report.append(f"{endpoint}: ERROR - {data['error']}")
            else:
                times = data["response_times"]
                report.append(f"{endpoint}:")
                report.append(f"  Score: {data['performance_score']}/100")
                report.append(f"  Avg Response: {times['avg']}ms")
                report.append(f"  P95: {times['p95']}ms")
                report.append(f"  RPS: {data['requests_per_second']}")
                report.append(f"  Errors: {data['errors']}/{data['total_requests']}")
                report.append("")
        
        # Concurrent test results
        if "health" in results["concurrent_tests"]:
            data = results["concurrent_tests"]["health"]
            report.append("⚡ Concurrent Performance (Health endpoint):")
            report.append("-" * 40)
            if "error" in data:
                report.append(f"ERROR: {data['error']}")
            else:
                times = data["response_times"]
                report.append(f"Score: {data['performance_score']}/100")
                report.append(f"Concurrent Users: {data['concurrent_users']}")
                report.append(f"Avg Response: {times['avg']}ms")
                report.append(f"P95: {times['p95']}ms")
                report.append(f"RPS: {data['requests_per_second']}")
                report.append(f"Errors: {data['errors']}/{data['total_requests']}")
            report.append("")
        
        # Memory test results
        if results["memory_test"]:
            data = results["memory_test"]
            report.append("🧠 Memory Performance:")
            report.append("-" * 40)
            if "error" in data:
                report.append(f"ERROR: {data['error']}")
            else:
                mem = data["memory_mb"]
                report.append(f"Score: {data['performance_score']}/100")
                report.append(f"Avg Memory: {mem['avg']} MB")
                report.append(f"Peak Memory: {mem['max']} MB")
                report.append(f"Memory Stable: {'✅' if data['memory_stable'] else '❌'}")
            report.append("")
        
        # Recommendations
        report.append("🔧 Recommendations:")
        report.append("-" * 40)
        score = results["overall_score"]
        if score >= 90:
            report.append("✅ Excellent performance! System is highly optimized.")
        elif score >= 70:
            report.append("👍 Good performance. Minor optimizations possible.")
        elif score >= 50:
            report.append("⚠️ Moderate performance. Consider optimizations:")
            report.append("  • Add caching for slow endpoints")
            report.append("  • Optimize database queries")
            report.append("  • Review memory usage")
        else:
            report.append("❌ Poor performance. Immediate attention required:")
            report.append("  • Investigate slow response times")
            report.append("  • Check for memory leaks")
            report.append("  • Optimize critical code paths")
            report.append("  • Consider scaling infrastructure")
        
        report.append("")
        report.append("=" * 60)
        
        return "\n".join(report)


def main():
    """Main performance testing function"""
    tester = PerformanceTester("http://localhost:8000")
    
    print("🎯 LFA Legacy GO Performance Test Suite")
    print("Make sure the backend server is running on localhost:8000")
    print("")
    
    # Run comprehensive test
    results = tester.run_comprehensive_test()
    
    # Generate and display report
    report = tester.generate_report(results)
    print(report)
    
    # Save results to file
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    results_file = f"performance_results_{timestamp}.json"
    report_file = f"performance_report_{timestamp}.txt"
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    with open(report_file, 'w') as f:
        f.write(report)
    
    print(f"\n📄 Results saved to: {results_file}")
    print(f"📄 Report saved to: {report_file}")
    
    return results["overall_score"] >= 70  # Return success if score >= 70


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)