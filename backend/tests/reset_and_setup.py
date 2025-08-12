#!/usr/bin/env python3
"""
LFA Legacy GO - Reset Database and Create Test Users with More Credits
Gyors reset script több kezdő kredittel
"""

import sys
import os

# Add the backend directory to Python path so we can import app
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.location import Location, create_default_locations, create_default_games
from passlib.context import CryptContext
from datetime import datetime

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_database():
    """Reset the entire database"""
    print("🗑️  Resetting database...")
    
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    
    # Create all tables  
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database reset completed!")

def create_test_user(db: Session, username: str, email: str, full_name: str, password: str, credits: int = 100):
    """Create a test user with specified credits"""
    
    # Hash password
    hashed_password = pwd_context.hash(password)
    
    # Create user
    user = User(
        username=username.lower(),
        email=email.lower(), 
        full_name=full_name,
        hashed_password=hashed_password,
        is_active=True,
        user_type="player",
        created_at=datetime.utcnow(),
        last_login=None,
        credits=credits,  # TÖBB KREDIT!
        level=1,
        xp=0,
        games_played=0,
        games_won=0
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    print(f"✅ Created user: {username} with {credits} credits")
    return user

def setup_default_data(db: Session):
    """Setup default locations and games"""
    print("🏟️  Setting up default locations...")
    
    # Create default locations
    create_default_locations(db)
    
    # Create default games  
    create_default_games(db)
    
    print("✅ Default data setup completed!")

def main():
    print("🎮 LFA Legacy GO - Database Reset & Setup")
    print("=" * 50)
    
    # Reset database
    reset_database()
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Setup default data first
        setup_default_data(db)
        
        # Create test users with MORE CREDITS
        test_users = [
            {
                "username": "testuser",
                "email": "test@example.com", 
                "full_name": "Test User",
                "password": "testpass123",
                "credits": 200  # BŐVEN ELÉG KREDITEK!
            },
            {
                "username": "admin",
                "email": "admin@example.com",
                "full_name": "Admin User", 
                "password": "admin123",
                "credits": 500  # ADMIN-nak még több
            },
            {
                "username": "player1",
                "email": "player1@example.com",
                "full_name": "Player One",
                "password": "player123", 
                "credits": 150
            }
        ]
        
        print("\n👤 Creating test users...")
        print("-" * 30)
        
        for user_data in test_users:
            create_test_user(db, **user_data)
        
        print("-" * 30)
        print(f"✅ Created {len(test_users)} test users!")
        
        # List created users
        print("\n📋 Created users:")
        users = db.query(User).all()
        for user in users:
            print(f"  👤 {user.username:<12} | 💰 {user.credits:>3} credits | 📧 {user.email}")
        
        print(f"\n🎯 Most használhatod ezeket a login adatokat:")
        print(f"   Username: testuser")
        print(f"   Password: testpass123") 
        print(f"   Credits:  200 💰")
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        db.rollback()
        
    finally:
        db.close()

if __name__ == "__main__":
    main()