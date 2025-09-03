#!/usr/bin/env python3
"""
Lokális admin user létrehozó script.
Csak development környezetben használandó.
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

def create_admin_user():
    """Létrehozza az admin user-t lokális development-hez"""
    
    session = SessionLocal()
    
    # Check if admin already exists
    existing_admin = session.query(User).filter(User.username == "admin").first()
    if existing_admin:
        print("Admin user already exists")
        return True
        
    # Create admin user
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash("admin123")
    
    admin_user = User(
        username="admin",
        email="admin@localhost.com", 
        hashed_password=hashed_password,
        full_name="Local Admin User",
        user_type="admin",
        is_active=True
    )
    
    session.add(admin_user)
    session.commit()
    print("Admin user created successfully")
    print("Credentials: admin / admin123")
    session.close()
    return True

if __name__ == "__main__":
    create_admin_user()