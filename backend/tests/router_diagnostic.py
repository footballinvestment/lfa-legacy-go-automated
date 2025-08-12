#!/usr/bin/env python3
"""
🔧 Router Import Diagnostic Tool
=================================
Diagnosztika hogy melyik router fájlok léteznek és melyik importok hibásak

Author: Claude + Zoltan
Date: August 2025
"""

import os
import sys
import importlib.util
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def check_file_exists(file_path):
    """Check if a file exists"""
    return os.path.exists(file_path)

def try_import_module(module_name, file_path):
    """Try to import a module and catch any errors"""
    try:
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if spec is None:
            return False, "Could not load module spec"
        
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # Check if router attribute exists
        if hasattr(module, 'router'):
            return True, "OK - Router found"
        else:
            return False, "No 'router' attribute found"
            
    except Exception as e:
        return False, str(e)

def main():
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("🔧 Router Import Diagnostic Tool")
    print("=" * 50)
    print(f"{Colors.END}")
    
    # Define router files to check
    routers_to_check = [
        ("auth", "app/routers/auth.py"),
        ("credits", "app/routers/credits.py"),
        ("social", "app/routers/social.py"),
        ("locations", "app/routers/locations.py"),
        ("booking", "app/routers/booking.py"),
        ("tournaments", "app/routers/tournaments.py"),
        ("weather", "app/routers/weather.py"),
        ("game_results", "app/routers/game_results.py"),
    ]
    
    print(f"{Colors.CYAN}Checking router files...{Colors.END}\n")
    
    total_files = len(routers_to_check)
    files_exist = 0
    imports_success = 0
    
    for router_name, file_path in routers_to_check:
        print(f"{Colors.BOLD}Router: {router_name}{Colors.END}")
        
        # Check if file exists
        if check_file_exists(file_path):
            print(f"  {Colors.GREEN}✅ File exists: {file_path}{Colors.END}")
            files_exist += 1
            
            # Try to import
            success, message = try_import_module(router_name, file_path)
            if success:
                print(f"  {Colors.GREEN}✅ Import success: {message}{Colors.END}")
                imports_success += 1
            else:
                print(f"  {Colors.RED}❌ Import failed: {message}{Colors.END}")
        else:
            print(f"  {Colors.RED}❌ File missing: {file_path}{Colors.END}")
        
        print()
    
    # Summary
    print(f"{Colors.BOLD}📊 DIAGNOSTIC SUMMARY:{Colors.END}")
    print(f"Total router files: {total_files}")
    print(f"{Colors.GREEN}Files exist: {files_exist}/{total_files}{Colors.END}")
    print(f"{Colors.GREEN}Imports successful: {imports_success}/{total_files}{Colors.END}")
    
    if imports_success == total_files:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✅ All routers should work!{Colors.END}")
        print(f"{Colors.CYAN}Issue might be in main.py configuration{Colors.END}")
    elif files_exist < total_files:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ Missing router files detected!{Colors.END}")
        print(f"{Colors.YELLOW}Create missing router files first{Colors.END}")
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ Import errors detected!{Colors.END}")
        print(f"{Colors.YELLOW}Fix import errors in router files{Colors.END}")
    
    # Check main.py structure
    print(f"\n{Colors.CYAN}Checking main.py structure...{Colors.END}")
    
    main_py_path = "app/main.py"
    if check_file_exists(main_py_path):
        print(f"{Colors.GREEN}✅ main.py exists{Colors.END}")
        
        # Read main.py and check for include_router calls
        try:
            with open(main_py_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for router imports
            router_imports = []
            for router_name, _ in routers_to_check:
                if f"from .routers import {router_name}" in content or router_name in content:
                    router_imports.append(router_name)
            
            # Check for include_router calls  
            include_router_calls = []
            for router_name, _ in routers_to_check:
                if f"{router_name}.router" in content:
                    include_router_calls.append(router_name)
            
            print(f"\n{Colors.BOLD}Main.py analysis:{Colors.END}")
            print(f"Routers imported: {len(router_imports)} - {router_imports}")
            print(f"Routers included: {len(include_router_calls)} - {include_router_calls}")
            
            if len(include_router_calls) != len(routers_to_check):
                print(f"{Colors.YELLOW}⚠️  Not all routers are included in main.py{Colors.END}")
            
        except Exception as e:
            print(f"{Colors.RED}❌ Error reading main.py: {e}{Colors.END}")
    else:
        print(f"{Colors.RED}❌ main.py not found{Colors.END}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Diagnostic interrupted{Colors.END}")
    except Exception as e:
        print(f"\n{Colors.RED}Diagnostic failed: {e}{Colors.END}")