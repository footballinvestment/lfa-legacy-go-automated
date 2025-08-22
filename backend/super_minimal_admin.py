#!/usr/bin/env python3
# super_minimal_admin.py
# SUPER minimális admin creator - datetime problémák elkerülése

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

try:
    from app.models.user import User
    from app.database import SessionLocal
    from passlib.context import CryptContext
    from sqlalchemy import text
    
    # Password hashing
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def create_admin_raw_sql():
        """Create admin using raw SQL to avoid datetime issues"""
        
        print("🔐 Creating admin user with raw SQL...")
        
        # Database session
        db = SessionLocal()
        
        try:
            # Check if admin already exists
            result = db.execute(text("SELECT id, username, user_type FROM users WHERE username = 'admin'")).fetchone()
            
            if result:
                if result[2] == 'admin':  # user_type
                    print(f"✅ Admin user 'admin' already exists (ID: {result[0]})!")
                    return True
                else:
                    # Update existing user to admin
                    db.execute(text("UPDATE users SET user_type = 'admin' WHERE username = 'admin'"))
                    db.commit()
                    print(f"✅ Updated 'admin' to admin user type!")
                    return True
            
            # Create admin with environment password
            import os
            admin_password = os.getenv("ADMIN_PASSWORD")
            if not admin_password:
                print("❌ ADMIN_PASSWORD environment variable is required!")
                print("💡 Set it with: export ADMIN_PASSWORD='your_secure_password'")
                return False
                
            password_hash = pwd_context.hash(admin_password)
            
            sql = """
            INSERT INTO users (username, email, full_name, hashed_password, user_type) 
            VALUES (:username, :email, :full_name, :password_hash, :user_type)
            """
            
            db.execute(text(sql), {
                'username': 'admin',
                'email': 'admin@lfagolegacy.com',
                'full_name': 'System Administrator', 
                'password_hash': password_hash,
                'user_type': 'admin'
            })
            
            db.commit()
            
            print("✅ Admin user created successfully with raw SQL!")
            print("👤 Username: admin")
            print("🔒 Password: admin123")
            print("📧 Email: admin@lfagolegacy.com")
            print("🎫 User Type: admin")
            print("⚠️  Change password after first login!")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating admin: {e}")
            print(f"❌ Error type: {type(e)}")
            db.rollback()
            return False
            
        finally:
            db.close()
    
    def create_admin_minimal_orm():
        """Create admin with minimal ORM approach"""
        
        print("🔐 Creating admin user (minimal ORM)...")
        
        db = SessionLocal()
        
        try:
            # Check if admin exists
            existing_admin = db.query(User).filter(User.username == 'admin').first()
            if existing_admin:
                if existing_admin.user_type == 'admin':
                    print(f"✅ Admin user 'admin' already exists!")
                    return True
                else:
                    existing_admin.user_type = 'admin'
                    db.commit()
                    print(f"✅ Updated 'admin' to admin!")
                    return True
            
            # Create minimal admin with environment password
            admin_password = os.getenv("ADMIN_PASSWORD")
            if not admin_password:
                print("❌ ADMIN_PASSWORD environment variable is required!")
                return False
                
            password_hash = pwd_context.hash(admin_password)
            
            # Create user object with ONLY the essential fields
            admin_user = User()
            admin_user.username = 'admin'
            admin_user.email = 'admin@lfagolegacy.com'  
            admin_user.full_name = 'System Administrator'
            admin_user.hashed_password = password_hash
            admin_user.user_type = 'admin'
            
            # Add and commit
            db.add(admin_user)
            db.commit()
            
            print("✅ Admin user created successfully!")
            print("👤 Username: admin")
            print("🔒 Password: admin123")
            print("🎫 User Type: admin")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating admin: {e}")
            db.rollback()
            return False
            
        finally:
            db.close()
    
    if __name__ == "__main__":
        print("🚀 Trying multiple approaches...")
        
        # Try raw SQL first (most reliable)
        print("\n1️⃣ Attempting raw SQL approach...")
        success = create_admin_raw_sql()
        
        if not success:
            print("\n2️⃣ Attempting minimal ORM approach...")
            success = create_admin_minimal_orm()
        
        if success:
            print("\n🎉 Admin user creation successful!")
        else:
            print("\n❌ All approaches failed!")
        
        sys.exit(0 if success else 1)
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)