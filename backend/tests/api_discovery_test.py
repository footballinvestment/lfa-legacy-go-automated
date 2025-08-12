#!/usr/bin/env python3
"""
🔍 LFA Legacy GO - API Endpoint Discovery Test
==============================================
Quickly discover what endpoints are actually available

Author: Claude + Zoltan  
Date: August 2025
"""

import asyncio
import aiohttp
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

async def test_endpoint(session, endpoint, method="GET", token=None):
    """Test if an endpoint exists and what it returns"""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        url = f"{BASE_URL}{endpoint}"
        async with session.request(method, url, headers=headers) as response:
            status = response.status
            try:
                data = await response.json()
            except:
                data = await response.text()
            
            return {
                "endpoint": endpoint,
                "method": method,
                "status": status,
                "exists": status != 404,
                "response_preview": str(data)[:100] + "..." if len(str(data)) > 100 else str(data)
            }
    except Exception as e:
        return {
            "endpoint": endpoint,
            "method": method,
            "status": "ERROR",
            "exists": False,
            "response_preview": str(e)
        }

async def main():
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("🔍 LFA Legacy GO - API Endpoint Discovery")
    print("=" * 60)
    print(f"{Colors.END}")
    
    # Test endpoints to discover
    endpoints_to_test = [
        # Core system
        ("/health", "GET"),
        ("/", "GET"),
        ("/docs", "GET"),
        
        # Auth endpoints (should work)
        ("/api/auth/register", "POST"),
        ("/api/auth/login", "POST"), 
        ("/api/auth/me", "GET"),
        
        # Problematic endpoints
        ("/api/credits/packages", "GET"),
        ("/api/credits", "GET"),
        
        ("/api/social/friend-request", "POST"),
        ("/api/social/friends", "GET"),
        ("/api/social", "GET"),
        
        ("/api/locations", "GET"),
        ("/api/location", "GET"),
        
        ("/api/game-results", "GET"),
        ("/api/game-results/leaderboards", "GET"),
        ("/api/game-results/leaderboards/overall", "GET"),
        
        # Try some variations
        ("/credits/packages", "GET"),
        ("/social/friends", "GET"),
        ("/locations", "GET"),
    ]
    
    async with aiohttp.ClientSession() as session:
        # First, get a token for authenticated requests
        token = None
        try:
            # Login to get token
            login_data = aiohttp.FormData()
            login_data.add_field('username', 'testuser') 
            login_data.add_field('password', 'testpass123')
            
            async with session.post(f"{BASE_URL}/api/auth/login", data=login_data) as response:
                if response.status == 200:
                    login_result = await response.json()
                    token = login_result.get("access_token")
                    print(f"{Colors.GREEN}✅ Got auth token for testing{Colors.END}")
                else:
                    print(f"{Colors.YELLOW}⚠️  No auth token (will test public endpoints only){Colors.END}")
        except:
            print(f"{Colors.YELLOW}⚠️  Could not get auth token{Colors.END}")
        
        print(f"\n{Colors.CYAN}Testing endpoints...{Colors.END}\n")
        
        # Test all endpoints
        results = []
        for endpoint, method in endpoints_to_test:
            result = await test_endpoint(session, endpoint, method, token if endpoint != "/api/auth/login" else None)
            results.append(result)
            
            # Print result
            status_color = Colors.GREEN if result["exists"] else Colors.RED
            status_text = f"✅ {result['status']}" if result["exists"] else f"❌ {result['status']}"
            
            print(f"{status_color}{status_text:<8}{Colors.END} {method:<4} {endpoint:<35} {result['response_preview'][:50]}")
            
            # Small delay
            await asyncio.sleep(0.1)
    
    print(f"\n{Colors.BOLD}📊 SUMMARY:{Colors.END}")
    
    working_endpoints = [r for r in results if r["exists"]]
    missing_endpoints = [r for r in results if not r["exists"]]
    
    print(f"{Colors.GREEN}✅ Working endpoints: {len(working_endpoints)}{Colors.END}")
    for result in working_endpoints:
        print(f"   {result['method']} {result['endpoint']}")
    
    print(f"\n{Colors.RED}❌ Missing endpoints: {len(missing_endpoints)}{Colors.END}")
    for result in missing_endpoints:
        print(f"   {result['method']} {result['endpoint']}")
    
    if working_endpoints:
        print(f"\n{Colors.CYAN}💡 Next step: Check http://localhost:8000/docs for complete API documentation{Colors.END}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted{Colors.END}")
    except Exception as e:
        print(f"\n{Colors.RED}Test failed: {e}{Colors.END}")