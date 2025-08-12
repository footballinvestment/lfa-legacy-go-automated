#!/usr/bin/env python3
"""
LFA Legacy GO - Server Startup Script
Simple startup script to avoid import issues
"""

import os
import sys
import subprocess
from pathlib import Path

def setup_environment():
    """Setup the Python environment for the app"""
    
    # Get the directory where this script is located
    script_dir = Path(__file__).parent.absolute()
    app_dir = script_dir / "app"
    
    # Add the backend directory to Python path
    backend_dir = str(script_dir)
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    
    # Set PYTHONPATH environment variable
    current_pythonpath = os.environ.get('PYTHONPATH', '')
    if backend_dir not in current_pythonpath:
        os.environ['PYTHONPATH'] = f"{backend_dir}:{current_pythonpath}".rstrip(':')
    
    print(f"🔧 Backend directory: {backend_dir}")
    print(f"🔧 App directory: {app_dir}")
    print(f"🔧 Python path updated: {backend_dir in sys.path}")
    
    return app_dir

def check_requirements():
    """Check if required packages are installed"""
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        print("✅ Required packages are available")
        return True
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("💡 Run: pip install -r requirements.txt")
        return False

def start_server():
    """Start the FastAPI server"""
    app_dir = setup_environment()
    
    if not check_requirements():
        sys.exit(1)
    
    print("🚀 Starting LFA Legacy GO API Server...")
    print("📱 API Documentation will be available at: http://localhost:8000/docs")
    print("🔍 Health Check will be available at: http://localhost:8000/health")
    print("🏠 Root Status will be available at: http://localhost:8000/")
    print("\n" + "="*60)
    
    # Change to app directory and start the server
    os.chdir(app_dir)
    
    try:
        # Import and run the app
        from main import app
        import uvicorn
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        print(f"💡 Try running manually: cd app && python main.py")
        sys.exit(1)

if __name__ == "__main__":
    start_server()