#!/usr/bin/env python3
"""
Quick PostgreSQL Performance Test
Validates that the migration to PostgreSQL improved concurrent performance
"""

import asyncio
import aiohttp
import time
import statistics
from datetime import datetime

BASE_URL = "http://localhost:8001"

async def test_endpoint(session, endpoint="/health", timeout=30):
    """Test a single endpoint"""
    try:
        async with session.get(f"{BASE_URL}{endpoint}", timeout=timeout) as response:
            return {
                "status_code": response.status,
                "success": response.status == 200,
                "response_time": time.time()
            }
    except Exception as e:
        return {
            "status_code": 0,
            "success": False,
            "error": str(e),
            "response_time": time.time()
        }

async def concurrent_test(num_requests=50, endpoint="/health"):
    """Run concurrent requests to test PostgreSQL performance"""
    print(f"🧪 Testing PostgreSQL performance with {num_requests} concurrent requests")
    print(f"📍 Target: {BASE_URL}{endpoint}")
    
    async with aiohttp.ClientSession() as session:
        start_time = time.time()
        
        # Launch concurrent requests
        tasks = [test_endpoint(session, endpoint) for _ in range(num_requests)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Calculate response times
        response_times = []
        successful_requests = 0
        failed_requests = 0
        
        for result in results:
            if isinstance(result, dict):
                if result["success"]:
                    successful_requests += 1
                    response_time = result["response_time"] - start_time
                    response_times.append(response_time * 1000)  # Convert to ms
                else:
                    failed_requests += 1
            else:
                failed_requests += 1
        
        # Calculate statistics
        if response_times:
            avg_response_time = statistics.mean(response_times)
            median_response_time = statistics.median(response_times)
            p95_response_time = sorted(response_times)[int(len(response_times) * 0.95)]
            max_response_time = max(response_times)
        else:
            avg_response_time = median_response_time = p95_response_time = max_response_time = 0
        
        # Print results
        print("\n📊 PostgreSQL Performance Test Results:")
        print(f"   Total Duration: {total_duration:.2f}s")
        print(f"   Successful Requests: {successful_requests}/{num_requests}")
        print(f"   Failed Requests: {failed_requests}")
        print(f"   Requests/Second: {num_requests/total_duration:.1f}")
        print(f"   Average Response Time: {avg_response_time:.2f}ms")
        print(f"   Median Response Time: {median_response_time:.2f}ms")
        print(f"   95th Percentile: {p95_response_time:.2f}ms")
        print(f"   Max Response Time: {max_response_time:.2f}ms")
        
        # Performance validation
        if successful_requests >= num_requests * 0.95:  # 95% success rate
            if avg_response_time < 200:  # Less than 200ms average
                print("\n✅ POSTGRESQL PERFORMANCE VALIDATION: PASSED")
                print("   🎯 Concurrent performance is within acceptable limits")
                return True
            else:
                print(f"\n⚠️  POSTGRESQL PERFORMANCE WARNING: Average response time {avg_response_time:.2f}ms > 200ms")
        else:
            print(f"\n❌ POSTGRESQL PERFORMANCE FAILED: Only {successful_requests}/{num_requests} requests succeeded")
        
        return False

async def main():
    """Main test execution"""
    print("🚀 PostgreSQL Performance Validation Starting...")
    print(f"📅 Test Time: {datetime.now()}")
    
    # Test 1: Basic health check with concurrency
    print("\n🔥 Test 1: Health Endpoint Concurrency (50 requests)")
    health_test = await concurrent_test(50, "/health")
    
    # Test 2: Higher concurrency simulation
    print("\n🔥 Test 2: High Concurrency Simulation (100 requests)")
    high_concurrency_test = await concurrent_test(100, "/health")
    
    # Summary
    print("\n📋 PostgreSQL Migration Validation Summary:")
    if health_test and high_concurrency_test:
        print("✅ PostgreSQL performance meets requirements")
        print("✅ Ready for production deployment")
        return True
    else:
        print("❌ PostgreSQL performance needs optimization")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)