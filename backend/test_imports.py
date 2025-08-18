#!/usr/bin/env python3
# test_imports.py
# Test script to verify all imports work

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

print("🧪 Testing imports...")

try:
    print("1️⃣ Testing app.models.user...")
    from app.models.user import User
    print("   ✅ User model imported")
    
    print("2️⃣ Testing app.database...")
    from app.database import SessionLocal, DATABASE_URL
    print("   ✅ Database session imported")
    print(f"   🔗 Database URL: {DATABASE_URL}")
    
    print("3️⃣ Testing passlib...")
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    test_hash = pwd_context.hash("test123")
    print("   ✅ Passlib context working")
    print(f"   🔒 Test hash: {test_hash[:20]}...")
    
    print("4️⃣ Testing database connection...")
    db = SessionLocal()
    try:
        # SQLAlchemy 2.0 compatible query
        from sqlalchemy import text
        result = db.execute(text("SELECT 1")).fetchone()
        print("   ✅ Database connection OK")
    except Exception as e:
        print(f"   ❌ Database connection failed: {e}")
    finally:
        db.close()
    
    print("\n🎉 All imports successful! Ready to create admin user.")
    
except ImportError as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ General error: {e}")
    sys.exit(1)