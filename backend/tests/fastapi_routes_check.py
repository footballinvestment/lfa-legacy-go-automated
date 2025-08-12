#!/usr/bin/env python3
"""
🔍 FastAPI Routes Inspection
============================
Ellenőrzi milyen routes vannak ténylegesen regisztrálva a FastAPI app-ban

Author: Claude + Zoltan
Date: August 2025
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

async def get_openapi_spec():
    """Get the OpenAPI specification from the FastAPI app"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/openapi.json") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    print(f"{Colors.RED}❌ Could not fetch OpenAPI spec: {response.status}{Colors.END}")
                    return None
    except Exception as e:
        print(f"{Colors.RED}❌ Error fetching OpenAPI spec: {e}{Colors.END}")
        return None

def analyze_routes(openapi_spec: Dict[Any, Any]):
    """Analyze the routes from OpenAPI specification"""
    if not openapi_spec or 'paths' not in openapi_spec:
        print(f"{Colors.RED}❌ Invalid OpenAPI specification{Colors.END}")
        return
    
    paths = openapi_spec['paths']
    
    # Group routes by prefix
    route_groups = {
        'auth': [],
        'credits': [], 
        'social': [],
        'locations': [],
        'booking': [],
        'tournaments': [],
        'weather': [],
        'game_results': [],
        'other': []
    }
    
    # Categorize routes
    for path, methods in paths.items():
        categorized = False
        for prefix in ['auth', 'credits', 'social', 'locations', 'booking', 'tournaments', 'weather', 'game_results']:
            if f'/api/{prefix}' in path or (prefix == 'game_results' and '/api/game-results' in path):
                for method in methods.keys():
                    route_groups[prefix].append((method.upper(), path))
                categorized = True
                break
        
        if not categorized:
            for method in methods.keys():
                route_groups['other'].append((method.upper(), path))
    
    return route_groups

async def main():
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("🔍 FastAPI Routes Inspection")
    print("=" * 50)
    print(f"{Colors.END}")
    
    # Get OpenAPI spec
    print(f"{Colors.CYAN}Fetching OpenAPI specification...{Colors.END}")
    openapi_spec = await get_openapi_spec()
    
    if not openapi_spec:
        print(f"{Colors.RED}Cannot proceed without OpenAPI spec{Colors.END}")
        return
    
    # Analyze routes
    print(f"\n{Colors.CYAN}Analyzing registered routes...{Colors.END}\n")
    route_groups = analyze_routes(openapi_spec)
    
    if not route_groups:
        return
    
    # Display results
    total_routes = 0
    working_systems = 0
    
    for system, routes in route_groups.items():
        if not routes:
            print(f"{Colors.RED}❌ {system.upper():<12} - No routes registered{Colors.END}")
        else:
            total_routes += len(routes)
            working_systems += 1
            print(f"{Colors.GREEN}✅ {system.upper():<12} - {len(routes)} routes registered{Colors.END}")
            
            # Show first few routes as examples
            for i, (method, path) in enumerate(routes[:3]):
                print(f"   {Colors.YELLOW}{method:<6}{Colors.END} {path}")
            
            if len(routes) > 3:
                print(f"   {Colors.CYAN}... and {len(routes) - 3} more{Colors.END}")
        
        print()
    
    # Summary
    print(f"{Colors.BOLD}📊 SUMMARY:{Colors.END}")
    print(f"Total routes registered: {total_routes}")
    print(f"Working systems: {working_systems}/8")
    
    if working_systems == 8:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✅ All systems have routes registered!{Colors.END}")
        print(f"{Colors.CYAN}The 404 errors might be due to incorrect endpoint paths in tests{Colors.END}")
    elif working_systems == 1:  # Only auth works
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  Only AUTH system working{Colors.END}")
        print(f"{Colors.RED}Other routers are not being loaded properly{Colors.END}")
    else:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  Partial system loading{Colors.END}")
        print(f"{Colors.RED}Some routers have issues{Colors.END}")
    
    # Additional info
    if 'info' in openapi_spec:
        info = openapi_spec['info']
        print(f"\n{Colors.CYAN}App Info:{Colors.END}")
        print(f"Title: {info.get('title', 'Unknown')}")
        print(f"Version: {info.get('version', 'Unknown')}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Inspection interrupted{Colors.END}")
    except Exception as e:
        print(f"\n{Colors.RED}Inspection failed: {e}{Colors.END}")