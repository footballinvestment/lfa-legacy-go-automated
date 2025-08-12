#!/usr/bin/env python3
"""
Setup Weather System
Ensure all necessary directories and files exist for weather integration
"""

import os
import sys
from pathlib import Path

def create_directory_structure():
    """Create necessary directories"""
    print("📁 Creating directory structure...")
    
    directories = [
        "app/services",
        "app/models",
        "app/routers"
    ]
    
    created = []
    for directory in directories:
        dir_path = Path(directory)
        if not dir_path.exists():
            dir_path.mkdir(parents=True, exist_ok=True)
            created.append(directory)
            print(f"✅ Created directory: {directory}")
        else:
            print(f"✅ Directory exists: {directory}")
    
    return created

def create_init_files():
    """Create __init__.py files if they don't exist"""
    print("\n📄 Creating __init__.py files...")
    
    init_files = [
        "app/__init__.py",
        "app/services/__init__.py",
        "app/models/__init__.py", 
        "app/routers/__init__.py"
    ]
    
    created = []
    for init_file in init_files:
        file_path = Path(init_file)
        if not file_path.exists():
            # Create basic __init__.py content
            if "services" in init_file:
                content = '''# app/services/__init__.py
"""
LFA Legacy GO - Services Package
Business logic and external service integrations
"""

__all__ = []
'''
            elif "models" in init_file:
                content = '''# app/models/__init__.py
"""
LFA Legacy GO - Models Package
Database models and schemas
"""

__all__ = []
'''
            elif "routers" in init_file:
                content = '''# app/routers/__init__.py
"""
LFA Legacy GO - Routers Package
API route handlers
"""

__all__ = []
'''
            else:
                content = f'# {init_file}\n'
            
            with open(file_path, 'w') as f:
                f.write(content)
            created.append(init_file)
            print(f"✅ Created: {init_file}")
        else:
            print(f"✅ Exists: {init_file}")
    
    return created

def check_dependencies():
    """Check if required dependencies are installed"""
    print("\n📦 Checking dependencies...")
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "aiohttp",
        "pydantic",
        "python-jose",
        "passlib",
        "python-multipart"
    ]
    
    missing = []
    installed = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            installed.append(package)
            print(f"✅ {package}")
        except ImportError:
            missing.append(package)
            print(f"❌ {package} - MISSING")
    
    if missing:
        print(f"\n⚠️ Missing packages: {', '.join(missing)}")
        print("💡 Run: pip install -r requirements.txt")
    else:
        print("\n🎉 All dependencies are installed!")
    
    return missing

def check_environment():
    """Check environment configuration"""
    print("\n🔧 Checking environment...")
    
    # Check if .env file exists
    env_file = Path(".env")
    if env_file.exists():
        print("✅ .env file exists")
        
        # Check for weather API key
        with open(env_file, 'r') as f:
            content = f.read()
            if "OPENWEATHERMAP_API_KEY" in content:
                print("✅ OpenWeatherMap API key configured")
            else:
                print("⚠️ OpenWeatherMap API key not found in .env")
                print("💡 Add: OPENWEATHERMAP_API_KEY=your_api_key")
    else:
        print("⚠️ .env file not found")
        print("💡 Copy .env.example to .env and configure")
    
    # Check database file
    db_file = Path("lfa_legacy_go.db")
    if db_file.exists():
        print("✅ Database file exists")
    else:
        print("ℹ️ Database will be created on first startup")

def main():
    """Main setup function"""
    print("🌦️ LFA Legacy GO - Weather System Setup")
    print("=" * 50)
    
    # Ensure we're in the right directory
    if not Path("app").exists():
        print("❌ Error: Not in backend directory")
        print("💡 Run this from the backend/ directory")
        return False
    
    try:
        # Create directories
        created_dirs = create_directory_structure()
        
        # Create __init__.py files
        created_inits = create_init_files()
        
        # Check dependencies
        missing_deps = check_dependencies()
        
        # Check environment
        check_environment()
        
        print("\n" + "=" * 50)
        print("📊 SETUP SUMMARY:")
        print(f"📁 Directories created: {len(created_dirs)}")
        print(f"📄 Init files created: {len(created_inits)}")
        print(f"📦 Missing dependencies: {len(missing_deps)}")
        
        if not missing_deps:
            print("\n🎉 SETUP COMPLETE!")
            print("✅ Weather system is ready for deployment")
            print("\n🚀 Next steps:")
            print("1. Configure .env file with OpenWeatherMap API key")
            print("2. Run: python test_weather_startup.py")
            print("3. Run: python app/main.py")
            return True
        else:
            print("\n⚠️ SETUP INCOMPLETE")
            print("🔧 Install missing dependencies first")
            print("💡 Run: pip install -r requirements.txt")
            return False
            
    except Exception as e:
        print(f"\n❌ Setup failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)