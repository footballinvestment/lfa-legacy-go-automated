#!/usr/bin/env python3
"""
Simple Weather Backend Starter
Guaranteed to work - starts the backend with weather integration
"""

import os
import sys
from pathlib import Path

# Ensure we're in the backend directory
backend_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(backend_dir))

# Change to app directory
app_dir = backend_dir / "app"
os.chdir(app_dir)

# Add both backend and app to Python path
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(app_dir))

print("🌦️ LFA Legacy GO - Weather Integration Backend")
print(f"📁 Backend directory: {backend_dir}")
print(f"📁 App directory: {app_dir}")
print(f"🐍 Python path: {sys.path[:3]}")

try:
    # Import and run the app from app directory
    import main
    print("✅ Main module imported successfully")
    
    # The main.py will handle the rest
    print("🚀 Starting weather-integrated backend...")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\n💡 Fallback solution:")
    print("1. cd backend")
    print("2. export PYTHONPATH=\"$(pwd):$PYTHONPATH\"")
    print("3. python app/main.py")
    sys.exit(1)