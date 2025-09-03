# backend/create_chat_tables.py
"""
CRITICAL: Chat System Database Tables Creation
Creates missing tables: chat_rooms, chat_messages, chat_room_memberships, 
friend_requests, friendships, user_blocks
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging
from sqlalchemy import create_engine, text, inspect
from app.database import engine, SessionLocal, Base

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_chat_system_tables():
    """Create all chat system related tables"""
    try:
        logger.info("🚀 Starting chat system database migration...")
        
        # Test database connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful")
        
        # Import all required models to register them with Base
        logger.info("📦 Importing chat system models...")
        
        # Chat models
        from app.models.chat import ChatRoom, ChatMessage, ChatRoomMembership
        logger.info("✅ Chat models imported")
        
        # Friend system models  
        from app.models.friends import FriendRequest, Friendship, UserBlock
        logger.info("✅ Friend models imported")
        
        # Get current tables
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        logger.info(f"📋 Existing tables: {existing_tables}")
        
        # Create missing tables only
        logger.info("🔨 Creating missing tables...")
        
        # This will create only missing tables, not recreate existing ones
        Base.metadata.create_all(bind=engine, checkfirst=True)
        
        # Verify tables were created
        inspector = inspect(engine)
        new_tables = inspector.get_table_names()
        
        required_tables = [
            'chat_rooms', 'chat_messages', 'chat_room_memberships',
            'friend_requests', 'friendships', 'user_blocks'
        ]
        
        missing_tables = []
        for table in required_tables:
            if table not in new_tables:
                missing_tables.append(table)
        
        if missing_tables:
            logger.error(f"❌ FAILED: Missing tables: {missing_tables}")
            return False
        else:
            logger.info(f"✅ SUCCESS: All required tables exist: {required_tables}")
            return True
            
    except Exception as e:
        logger.error(f"❌ Database migration failed: {e}")
        return False

def verify_table_structure():
    """Verify table structure is correct"""
    try:
        db = SessionLocal()
        
        # Test basic operations
        from app.models.chat import ChatRoom
        
        # Count existing rooms
        room_count = db.query(ChatRoom).count()
        logger.info(f"✅ Chat rooms table functional: {room_count} rooms")
        
        # Test friend request table
        from app.models.friends import FriendRequest
        request_count = db.query(FriendRequest).count()  
        logger.info(f"✅ Friend requests table functional: {request_count} requests")
        
        db.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Table verification failed: {e}")
        return False

if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("CHAT SYSTEM DATABASE MIGRATION")
    logger.info("=" * 60)
    
    # Step 1: Create tables
    if create_chat_system_tables():
        logger.info("🎯 Step 1: Table creation SUCCESS")
        
        # Step 2: Verify functionality  
        if verify_table_structure():
            logger.info("🎯 Step 2: Table verification SUCCESS")
            logger.info("🏆 MIGRATION COMPLETE - Chat system ready!")
        else:
            logger.error("❌ Step 2: Table verification FAILED")
            sys.exit(1)
    else:
        logger.error("❌ Step 1: Table creation FAILED")
        sys.exit(1)
