#!/usr/bin/env python3
# minimal_create_admin.py
# Minimális admin user létrehozó - csak a kötelező mezőkkel

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

try:
    from app.models.user import User
    from app.database import SessionLocal
    from passlib.context import CryptContext
    
    # Password hashing
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def create_admin():
        """Create admin user with minimal required fields only"""
        
        print("🔐 Creating admin user (minimal)...")
        
        # Database session
        db = SessionLocal()
        
        try:
            # Default admin credentials
            username = "admin"
            email = "admin@lfagolegacy.com"
            full_name = "System Administrator"
            password = "admin123"
            
            # Check if admin already exists
            existing_admin = db.query(User).filter(User.username == username).first()
            if existing_admin:
                if existing_admin.user_type == 'admin':
                    print(f"✅ Admin user '{username}' already exists!")
                    return True
                else:
                    # Make existing user admin
                    existing_admin.user_type = 'admin'
                    db.commit()
                    print(f"✅ Updated '{username}' to admin!")
                    return True
            
            # Create new admin user with ONLY required fields
            admin_user = User(
                username=username,
                email=email,
                full_name=full_name,
                hashed_password=pwd_context.hash(password),
                user_type='admin'  # ← ONLY this makes them admin!
            )
            
            # Let database handle all other defaults
            db.add(admin_user)
            db.commit()
            
            print("✅ Admin user created successfully!")
            print(f"👤 Username: {username}")
            print(f"🔒 Password: {password}")
            print(f"📧 Email: {email}")
            print(f"🎫 User Type: admin")
            print("⚠️  Change password after first login!")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating admin: {e}")
            print(f"❌ Error type: {type(e)}")
            db.rollback()
            return False
            
        finally:
            db.close()
    
    if __name__ == "__main__":
        success = create_admin()
        sys.exit(0 if success else 1)
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're in the backend directory and the virtual environment is activated")
    sys.exit(1)