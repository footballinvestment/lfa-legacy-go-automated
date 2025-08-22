"""
Direct PostgreSQL table creation for LFA Legacy GO
Creates tables that match SQLite structure but with PostgreSQL data types
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging
from sqlalchemy import create_engine, text
import psycopg2

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

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_tables():
    """Create all tables directly with SQL"""
    
    # PostgreSQL connection
    postgres_url = os.getenv("DATABASE_URL", "postgresql://lfa_user:password@localhost:5433/lfa_legacy_go")
    engine = create_engine(postgres_url)
    
    tables_sql = """
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        display_name VARCHAR(100),
        bio TEXT,
        profile_picture VARCHAR(200),
        favorite_position VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        user_type VARCHAR(20) DEFAULT 'player',
        is_premium BOOLEAN DEFAULT false,
        premium_expires_at TIMESTAMP,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        credits INTEGER DEFAULT 100,
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        games_lost INTEGER DEFAULT 0,
        total_playtime_minutes INTEGER DEFAULT 0,
        best_scores JSONB,
        achievement_points INTEGER DEFAULT 0,
        total_score FLOAT DEFAULT 0.0,
        average_performance FLOAT DEFAULT 0.0,
        skill_ratings JSONB,
        skills JSONB,
        friend_count INTEGER DEFAULT 0,
        challenge_wins INTEGER DEFAULT 0,
        challenge_losses INTEGER DEFAULT 0,
        tournament_wins INTEGER DEFAULT 0,
        notification_preferences JSONB,
        privacy_settings JSONB,
        language VARCHAR(10) DEFAULT 'en',
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        last_activity TIMESTAMP,
        login_count INTEGER DEFAULT 0
    );
    
    -- User Sessions table
    CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Locations table
    CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address TEXT,
        city VARCHAR(50),
        country VARCHAR(50),
        latitude FLOAT,
        longitude FLOAT,
        description TEXT,
        facilities JSONB,
        contact_info JSONB,
        operating_hours JSONB,
        capacity INTEGER,
        surface_type VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Game Definitions table
    CREATE TABLE IF NOT EXISTS game_definitions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        rules JSONB,
        min_players INTEGER DEFAULT 2,
        max_players INTEGER DEFAULT 22,
        duration_minutes INTEGER DEFAULT 90,
        skill_level VARCHAR(20) DEFAULT 'beginner',
        category VARCHAR(50),
        equipment_needed JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Game Sessions table
    CREATE TABLE IF NOT EXISTS game_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        location_id INTEGER REFERENCES locations(id),
        game_definition_id INTEGER REFERENCES game_definitions(id),
        status VARCHAR(20) DEFAULT 'planned',
        scheduled_at TIMESTAMP,
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        max_participants INTEGER DEFAULT 10,
        current_participants INTEGER DEFAULT 0,
        description TEXT,
        rules JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Tournaments table
    CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        location_id INTEGER REFERENCES locations(id),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        registration_deadline TIMESTAMP,
        max_participants INTEGER DEFAULT 16,
        entry_fee FLOAT DEFAULT 0.0,
        prize_pool FLOAT DEFAULT 0.0,
        status VARCHAR(20) DEFAULT 'planned',
        format VARCHAR(50) DEFAULT 'single_elimination',
        rules JSONB,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Tournament Participants table
    CREATE TABLE IF NOT EXISTS tournament_participants (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_paid BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'registered',
        UNIQUE(tournament_id, user_id)
    );
    
    -- Game Results table
    CREATE TABLE IF NOT EXISTS game_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id INTEGER REFERENCES game_sessions(id),
        score INTEGER DEFAULT 0,
        performance_metrics JSONB,
        achievements JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Friendships table
    CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id)
    );
    
    -- Friend Requests table
    CREATE TABLE IF NOT EXISTS friend_requests (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP,
        UNIQUE(sender_id, receiver_id)
    );
    
    -- Challenges table
    CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        challenger_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        challenged_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        challenge_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        challenge_data JSONB,
        result_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
    );
    
    -- User Blocks table
    CREATE TABLE IF NOT EXISTS user_blocks (
        id SERIAL PRIMARY KEY,
        blocker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        blocked_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(blocker_id, blocked_id)
    );
    
    -- Coupons table
    CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        discount_type VARCHAR(20) DEFAULT 'percentage',
        discount_value FLOAT NOT NULL,
        min_purchase_amount FLOAT DEFAULT 0.0,
        max_uses INTEGER,
        current_uses INTEGER DEFAULT 0,
        valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Coupon Usage table
    CREATE TABLE IF NOT EXISTS coupon_usage (
        id SERIAL PRIMARY KEY,
        coupon_id INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        order_amount FLOAT,
        discount_applied FLOAT,
        UNIQUE(coupon_id, user_id)
    );
    
    -- Additional tables for completeness
    CREATE TABLE IF NOT EXISTS leaderboards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        score FLOAT NOT NULL,
        rank INTEGER,
        season VARCHAR(20),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS tournament_matches (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        round_number INTEGER NOT NULL,
        match_number INTEGER NOT NULL,
        player1_id INTEGER REFERENCES users(id),
        player2_id INTEGER REFERENCES users(id),
        winner_id INTEGER REFERENCES users(id),
        player1_score INTEGER DEFAULT 0,
        player2_score INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'scheduled',
        scheduled_at TIMESTAMP,
        played_at TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS game_achievements (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        criteria JSONB,
        points INTEGER DEFAULT 10,
        badge_url VARCHAR(200),
        category VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS tournament_achievements (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        criteria JSONB,
        points INTEGER DEFAULT 20,
        badge_url VARCHAR(200),
        category VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS player_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        achievement_id INTEGER REFERENCES game_achievements(id),
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
    );
    
    CREATE TABLE IF NOT EXISTS user_tournament_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        achievement_id INTEGER REFERENCES tournament_achievements(id),
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
    );
    
    CREATE TABLE IF NOT EXISTS player_statistics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        stat_name VARCHAR(50) NOT NULL,
        stat_value FLOAT NOT NULL,
        category VARCHAR(50),
        season VARCHAR(20),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    try:
        logger.info("🚀 Creating PostgreSQL tables...")
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            logger.info(f"✅ Connected to: {version[:50]}...")
        
        # Create tables
        logger.info("📦 Creating tables...")
        with engine.connect() as conn:
            conn.execute(text(tables_sql))
            conn.commit()
        
        # List created tables
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result.fetchall()]
            logger.info(f"✅ Created {len(tables)} tables: {tables}")
        
        # Create indexes for performance
        create_performance_indexes(engine)
        
        logger.info("🎉 PostgreSQL tables created successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Table creation failed: {e}")
        return False

def create_performance_indexes(engine):
    """Create performance indexes"""
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)",
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)",
        "CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions (session_token)",
        "CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id)",
        "CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments (status)",
        "CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments (start_date)",
        "CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions (user_id)",
        "CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions (status)",
        "CREATE INDEX IF NOT EXISTS idx_game_results_user_id ON game_results (user_id)",
        "CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships (user_id)",
        "CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships (friend_id)",
    ]
    
    logger.info("🔧 Creating performance indexes...")
    with engine.connect() as conn:
        for index_sql in indexes:
            try:
                conn.execute(text(index_sql))
                conn.commit()
                logger.info(f"✅ Created index: {index_sql[:50]}...")
            except Exception as e:
                logger.warning(f"⚠️  Index creation failed: {e}")

if __name__ == "__main__":
    success = create_tables()
    if success:
        logger.info("✅ Table creation completed!")
        logger.info("🔄 Next step: Run data migration from SQLite")
    else:
        logger.error("❌ Table creation failed!")
        sys.exit(1)