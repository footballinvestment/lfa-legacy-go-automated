#!/usr/bin/env python3
# debug_user_fields.py
# User model mezők ellenőrzése és debug

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

try:
    from app.models.user import User
    from sqlalchemy import inspect
    
    def debug_user_model():
        """Debug User model fields"""
        
        print("🔍 User Model Debug Information")
        print("=" * 50)
        
        # Get SQLAlchemy inspector
        mapper = inspect(User)
        
        print("📋 All User model columns:")
        for column in mapper.columns:
            print(f"   📝 {column.name}: {column.type} (nullable={column.nullable}, default={column.default})")
        
        print(f"\n📊 Total columns: {len(mapper.columns)}")
        
        # Required vs Optional fields
        required_fields = []
        optional_fields = []
        
        for column in mapper.columns:
            if not column.nullable and column.default is None:
                required_fields.append(column.name)
            else:
                optional_fields.append(column.name)
        
        print(f"\n🔴 Required fields ({len(required_fields)}):")
        for field in required_fields:
            print(f"   ⚠️  {field}")
        
        print(f"\n🟢 Optional fields ({len(optional_fields)}):")
        for field in optional_fields[:10]:  # Show first 10
            print(f"   ✅ {field}")
        if len(optional_fields) > 10:
            print(f"   ... and {len(optional_fields) - 10} more")
        
        return required_fields
    
    if __name__ == "__main__":
        required = debug_user_model()
        print(f"\n🎯 Minimum fields needed to create User: {', '.join(required)}")
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)