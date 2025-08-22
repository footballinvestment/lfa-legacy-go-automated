#!/usr/bin/env python3
# test_password.py - Test password verification

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
    
    # Password hashing context (same as in auth.py)
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def test_admin_password():
        """Test admin password verification"""
        
        print("🔐 Testing admin password verification...")
        
        # Database session
        db = SessionLocal()
        
        try:
            # Get admin user from database
            result = db.execute(text("SELECT username, hashed_password FROM users WHERE username = 'admin'")).fetchone()
            
            if not result:
                print("❌ Admin user not found!")
                return False
            
            username, hash_from_db = result
            print(f"👤 Username: {username}")
            print(f"🔒 Hash from DB: {hash_from_db}")
            
            # Test different passwords
            test_passwords = ['admin123', 'admin', 'Admin123', 'ADMIN123', 'password']
            
            for password in test_passwords:
                print(f"\n🧪 Testing password: '{password}'")
                try:
                    is_valid = pwd_context.verify(password, hash_from_db)
                    print(f"   Result: {'✅ VALID' if is_valid else '❌ INVALID'}")
                    
                    if is_valid:
                        print(f"🎉 CORRECT PASSWORD FOUND: '{password}'")
                        return True
                        
                except Exception as e:
                    print(f"   Error: {e}")
            
            print("\n❌ No valid password found!")
            
            # Generate new hash for admin123
            print("\n🔧 Generating new hash for 'admin123'...")
            new_hash = pwd_context.hash('admin123')
            print(f"New hash: {new_hash}")
            
            # Test the new hash
            test_result = pwd_context.verify('admin123', new_hash)
            print(f"New hash verification: {'✅ VALID' if test_result else '❌ INVALID'}")
            
            if test_result:
                print(f"\n🔄 Would you like to update the database with the new hash?")
                print(f"SQL: UPDATE users SET hashed_password = '{new_hash}' WHERE username = 'admin';")
            
            return False
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
            
        finally:
            db.close()
    
    def update_admin_password():
        """Update admin password hash in database"""
        
        print("🔧 Updating admin password hash...")
        
        db = SessionLocal()
        
        try:
            # Generate new hash
            new_hash = pwd_context.hash('admin123')
            print(f"New hash: {new_hash}")
            
            # Update database
            db.execute(text("UPDATE users SET hashed_password = :new_hash WHERE username = 'admin'"), {
                'new_hash': new_hash
            })
            
            db.commit()
            
            print("✅ Admin password hash updated successfully!")
            
            # Verify the update
            result = db.execute(text("SELECT hashed_password FROM users WHERE username = 'admin'")).fetchone()
            if result:
                updated_hash = result[0]
                test_result = pwd_context.verify('admin123', updated_hash)
                print(f"Verification test: {'✅ SUCCESS' if test_result else '❌ FAILED'}")
                return test_result
            
            return False
            
        except Exception as e:
            print(f"❌ Update error: {e}")
            db.rollback()
            return False
            
        finally:
            db.close()
    
    if __name__ == "__main__":
        if len(sys.argv) > 1 and sys.argv[1] == "update":
            success = update_admin_password()
        else:
            success = test_admin_password()
            
        sys.exit(0 if success else 1)
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Make sure you're running this from the backend directory with proper dependencies installed")
    sys.exit(1)