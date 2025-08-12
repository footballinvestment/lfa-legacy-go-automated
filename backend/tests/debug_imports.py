#!/usr/bin/env python3
"""
LFA Legacy GO - Import Debug Script
Helps diagnose import issues in the backend
"""

import os
import sys
from pathlib import Path

def debug_environment():
    """Debug the current Python environment"""
    print("🔍 LFA Legacy GO - Import Diagnostics")
    print("=" * 50)
    
    # Current working directory
    cwd = Path.cwd()
    print(f"📁 Current directory: {cwd}")
    
    # Script location
    script_dir = Path(__file__).parent.absolute()
    print(f"📁 Script directory: {script_dir}")
    
    # Python path
    print(f"🐍 Python executable: {sys.executable}")
    print(f"🐍 Python version: {sys.version}")
    
    # Python path directories
    print("\n📚 Python sys.path:")
    for i, path in enumerate(sys.path):
        print(f"  {i+1}. {path}")
    
    # Environment PYTHONPATH
    pythonpath = os.environ.get('PYTHONPATH', 'Not set')
    print(f"\n🔧 PYTHONPATH: {pythonpath}")
    
    print("\n" + "=" * 50)

def check_file_structure():
    """Check if all required files exist"""
    print("📋 Checking file structure...")
    
    # Expected files and directories
    expected_structure = {
        'app/': 'directory',
        'app/__init__.py': 'file',
        'app/main.py': 'file',
        'app/database.py': 'file',
        'app/models/': 'directory',
        'app/models/__init__.py': 'file',
        'app/models/user.py': 'file',
        'app/routers/': 'directory',
        'app/routers/__init__.py': 'file',
        'app/routers/auth.py': 'file',
        'app/routers/credits.py': 'file',
        'app/routers/social.py': 'file',
        'requirements.txt': 'file'
    }
    
    base_dir = Path.cwd()
    all_ok = True
    
    for item, item_type in expected_structure.items():
        path = base_dir / item
        
        if item_type == 'directory':
            if path.is_dir():
                print(f"✅ {item} (directory)")
            else:
                print(f"❌ {item} (directory) - MISSING")
                all_ok = False
        
        elif item_type == 'file':
            if path.is_file():
                print(f"✅ {item}")
            else:
                print(f"❌ {item} - MISSING")
                all_ok = False
    
    return all_ok

def test_imports():
    """Test importing each module individually"""
    print("\n🧪 Testing imports...")
    
    # Add current directory to path
    current_dir = str(Path.cwd())
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)
    
    # Test basic imports
    imports_to_test = [
        ('fastapi', 'FastAPI framework'),
        ('uvicorn', 'ASGI server'),
        ('sqlalchemy', 'Database ORM'),
        ('app.database', 'Database module'),
        ('app.models.user', 'User model'),
        ('app.routers.auth', 'Auth router'),
        ('app.routers.credits', 'Credits router'),
        ('app.routers.social', 'Social router'),
    ]
    
    for module_name, description in imports_to_test:
        try:
            __import__(module_name)
            print(f"✅ {module_name} - {description}")
        except ImportError as e:
            print(f"❌ {module_name} - {description}: {e}")
        except Exception as e:
            print(f"⚠️  {module_name} - {description}: {e}")

def provide_solutions():
    """Provide solutions for common issues"""
    print("\n💡 Common Solutions:")
    print("=" * 30)
    
    solutions = [
        "1. 🔄 Restart your terminal and reactivate virtual environment:",
        "   cd backend && source venv/bin/activate",
        "",
        "2. 📦 Reinstall requirements:",
        "   pip install -r requirements.txt",
        "",
        "3. 🐍 Set PYTHONPATH explicitly:",
        "   export PYTHONPATH=\"$(pwd):$PYTHONPATH\"",
        "",
        "4. 🔧 Try running from correct directory:",
        "   cd backend/app && python main.py",
        "",
        "5. 🚀 Use the startup script:",
        "   python start_server.py",
        "",
        "6. 🔍 Check Python version compatibility:",
        "   python --version (should be 3.8+)",
    ]
    
    for solution in solutions:
        print(solution)

def main():
    """Main diagnostics function"""
    debug_environment()
    print()
    
    structure_ok = check_file_structure()
    print()
    
    test_imports()
    print()
    
    if not structure_ok:
        print("⚠️  File structure issues detected!")
    
    provide_solutions()
    
    print("\n" + "=" * 50)
    print("🎯 Next steps:")
    print("1. Fix any missing files shown above")
    print("2. Try one of the suggested solutions")
    print("3. Run: python start_server.py")
    print("4. Access: http://localhost:8000/docs")

if __name__ == "__main__":
    main()