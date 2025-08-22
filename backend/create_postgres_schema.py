"""
Create PostgreSQL Schema using existing SQLAlchemy models
This ensures PostgreSQL-compatible data types
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load environment variables
def load_postgres_credentials():
    """Load PostgreSQL credentials from .env.postgres file"""
    env_file = "../.env.postgres"
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_postgres_credentials()

# Import database configuration
from app.core.database_postgres import engine, SessionLocal, Base

# Import all available models to ensure they're registered with Base
from app.models.user import User, UserSession
from app.models.location import Location, GameDefinition, GameSession
from app.models.tournament import Tournament, TournamentParticipant
from app.models.game_results import GameResult
from app.models.friends import Friendship, FriendRequest, Challenge, UserBlock
from app.models.coupon import Coupon, CouponUsage

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_postgres_schema():
    """Create PostgreSQL schema using SQLAlchemy models"""
    try:
        logger.info("🚀 Creating PostgreSQL schema from models...")
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            logger.info(f"✅ Connected to: {version[:50]}...")
        
        # Drop existing tables (optional - comment out for safety)
        logger.info("🗑️  Dropping existing tables...")
        Base.metadata.drop_all(bind=engine)
        
        # Create all tables
        logger.info("📦 Creating tables...")
        Base.metadata.create_all(bind=engine)
        
        # List created tables
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result.fetchall()]
            logger.info(f"✅ Created tables: {tables}")
        
        # Create indexes for performance
        create_performance_indexes()
        
        logger.info("🎉 PostgreSQL schema created successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Schema creation failed: {e}")
        return False

def create_performance_indexes():
    """Create performance indexes"""
    indexes = [
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users USING btree(username)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users USING btree(email)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournaments_status ON tournaments USING btree(status)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournaments_created_at ON tournaments USING btree(created_at)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_sessions_user_id ON game_sessions USING btree(user_id)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_sessions_created_at ON game_sessions USING btree(created_at)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_results_user_id ON game_results USING btree(user_id)",
    ]
    
    logger.info("🔧 Creating performance indexes...")
    with engine.connect() as conn:
        for index_sql in indexes:
            try:
                conn.execute(text(index_sql))
                conn.commit()
                logger.info(f"✅ Created index: {index_sql[:50]}...")
            except Exception as e:
                logger.warning(f"⚠️  Index creation failed (may be normal): {e}")

if __name__ == "__main__":
    success = create_postgres_schema()
    if success:
        logger.info("✅ Schema creation completed!")
        logger.info("🔄 Next step: Run data migration")
    else:
        logger.error("❌ Schema creation failed!")
        sys.exit(1)