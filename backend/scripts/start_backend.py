#!/usr/bin/env python3
"""
LFA Legacy GO Backend Startup Script
This script properly starts the backend with weather integration using uvicorn.
"""

import sys
import os
import subprocess

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Change to the backend directory
os.chdir(current_dir)

if __name__ == "__main__":
    print("🚀 Starting LFA Legacy GO Backend with Weather Integration...")
    
    # Use uvicorn to run the app with proper module resolution
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start backend: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Backend stopped by user")
        sys.exit(0)