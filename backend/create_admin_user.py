#!/usr/bin/env python3
# create_admin_user.py
# Script to create an admin user for LFA Legacy GO

import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.models.user import User
from app.database import DATABASE_URL, SessionLocal
from passlib.context import CryptContext
import getpass

# Password hashing context (same as in auth.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user():
    """Create an admin user interactively"""
    
    print("🔐 LFA Legacy GO - Admin User Creator")
    print("=" * 50)
    
    # Get database URL
    database_url = get_database_url()
    
    # Use existing database configuration
    db = SessionLocal()
    
    try:
        # Get admin user details
        print("\n📝 Enter admin user details:")
        
        username = input("👤 Username: ").strip()
        if not username:
            print("❌ Username is required!")
            return False
            
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"⚠️  User '{username}' already exists!")
            if existing_user.user_type == 'admin':
                print(f"✅ User '{username}' is already an admin!")
                return True
            else:
                make_admin = input(f"❓ Make '{username}' an admin? (y/n): ").lower() == 'y'
                if make_admin:
                    existing_user.user_type = 'admin'
                    existing_user.is_admin = True
                    db.commit()
                    print(f"✅ '{username}' is now an admin!")
                    return True
                else:
                    return False
        
        email = input("📧 Email: ").strip()
        if not email:
            print("❌ Email is required!")
            return False
            
        full_name = input("👥 Full Name: ").strip()
        if not full_name:
            print("❌ Full name is required!")
            return False
            
        password = getpass.getpass("🔒 Password: ")
        if len(password) < 6:
            print("❌ Password must be at least 6 characters!")
            return False
            
        # Create new admin user
        new_admin = User(
            username=username,
            email=email,
            full_name=full_name,
            hashed_password=pwd_context.hash(password),
            user_type='admin',  # Set as admin
            is_admin=True,      # Admin flag
            is_active=True,
            level=1,
            xp=0,
            credits=1000,       # Give some initial credits
            games_played=0,
            games_won=0,
            friend_count=0,
            total_achievements=0,
            is_premium=True     # Give admin premium access
        )
        
        db.add(new_admin)
        db.commit()
        
        print(f"\n✅ Admin user '{username}' created successfully!")
        print(f"📧 Email: {email}")
        print(f"👥 Full Name: {full_name}")
        print(f"🎫 User Type: admin")
        print(f"💰 Initial Credits: 1000")
        print(f"⭐ Premium Access: Yes")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

def quick_create_admin():
    """Quickly create a default admin user for testing"""
    
    print("🚀 Quick Admin User Creation")
    print("=" * 40)
    
    # Use existing database configuration
    db = SessionLocal()
    
    try:
        # Admin credentials from environment variables
        username = os.getenv("ADMIN_USERNAME", "admin")
        email = os.getenv("ADMIN_EMAIL", "admin@lfagolegacy.com")
        full_name = os.getenv("ADMIN_FULL_NAME", "System Administrator")
        password = os.getenv("ADMIN_PASSWORD")
        
        if not password:
            print("❌ ADMIN_PASSWORD environment variable is required!")
            print("💡 Set it with: export ADMIN_PASSWORD='your_secure_password'")
            return False
        
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == username).first()
        if existing_admin:
            print(f"✅ Admin user '{username}' already exists!")
            if existing_admin.user_type != 'admin':
                existing_admin.user_type = 'admin'
                existing_admin.is_admin = True
                db.commit()
                print(f"🔧 Updated '{username}' to admin privileges!")
            return True
        
        # Create default admin
        admin_user = User(
            username=username,
            email=email,
            full_name=full_name,
            hashed_password=pwd_context.hash(password),
            user_type='admin',
            is_admin=True,
            is_active=True,
            level=1,
            xp=0,
            credits=1000,
            games_played=0,
            games_won=0,
            friend_count=0,
            total_achievements=0,
            is_premium=True
        )
        
        db.add(admin_user)
        db.commit()
        
        print(f"✅ Default admin user created!")
        print(f"👤 Username: {username}")
        print(f"🔒 Password: {password}")
        print(f"📧 Email: {email}")
        print("⚠️  Please change the password after first login!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

def list_admin_users():
    """List all existing admin users"""
    
    print("👥 Current Admin Users")
    print("=" * 30)
    
    # Use existing database configuration
    db = SessionLocal()
    
    try:
        admins = db.query(User).filter(
            (User.user_type == 'admin') | (User.is_admin == True)
        ).all()
        
        if not admins:
            print("❌ No admin users found!")
            return False
            
        for admin in admins:
            print(f"👤 {admin.username} ({admin.email})")
            print(f"   📧 {admin.email}")
            print(f"   👥 {admin.full_name}")
            print(f"   🎫 Type: {admin.user_type}")
            print(f"   ✅ Active: {admin.is_active}")
            print()
            
        return True
        
    except Exception as e:
        print(f"❌ Error listing admins: {e}")
        return False
        
    finally:
        db.close()

def main():
    """Main script function"""
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "quick":
            return quick_create_admin()
        elif command == "list":
            return list_admin_users()
        elif command == "help":
            print("🔐 LFA Legacy GO - Admin User Creator")
            print("\nUsage:")
            print("  python create_admin_user.py         # Interactive admin creation")
            print("  python create_admin_user.py quick   # Create default admin (admin/admin123)")
            print("  python create_admin_user.py list    # List existing admin users")
            print("  python create_admin_user.py help    # Show this help")
            return True
        else:
            print(f"❌ Unknown command: {command}")
            print("Use 'python create_admin_user.py help' for usage info")
            return False
    else:
        return create_admin_user()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)