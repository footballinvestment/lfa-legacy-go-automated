# === backend/app/database.py ===
# TELJES JAVÍTOTT DATABASE CONFIG - DEFAULT DATA INIT KIKAPCSOLVA

import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine import Engine
import sqlite3
import logging
import redis
from typing import Dict, List

# === ENVIRONMENT VARIABLES ===
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lfa_legacy_go.db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")


# === SQLITE OPTIMIZATION ===
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in str(dbapi_connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=10000")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()


# === DATABASE SETUP ===
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}, echo=False
    )
    DB_TYPE = "sqlite"
else:
    engine = create_engine(DATABASE_URL, echo=False)
    DB_TYPE = "postgresql"

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# === REDIS CONNECTION ===
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    print("✅ Redis connection established")
except Exception as e:
    print(f"⚠️ Redis connection failed: {e}")
    redis_client = None


# === DATABASE DEPENDENCY ===
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# === MODEL IMPORTS (SAFE) ===
def import_models():
    """Import models safely with error handling"""
    models_imported = []

    try:
        print("🗄️ Database module loading from backend/app/database.py...")
        print(f"🔗 Using {DB_TYPE.upper()} from URL: {DATABASE_URL}")

        # Import User models first (they are foundation)
        try:
            from .models.user import User, UserSession

            models_imported.extend(["User", "UserSession"])
            print("✅ User models imported")
        except ImportError as e:
            print(f"❌ User models failed: {e}")
            return []

        # Import other models conditionally
        models_status = {}

        # Location models
        try:
            from .models.location import (
                Location,
                GameDefinition,
                GameSession,
                LocationType,
                GameSessionStatus,
            )

            models_imported.extend(
                [
                    "Location",
                    "GameDefinition",
                    "GameSession",
                    "LocationType",
                    "GameSessionStatus",
                ]
            )
            models_status["locations"] = True
            print("✅ Location models imported successfully")
        except ImportError as e:
            models_status["locations"] = False
            print(f"⚠️ Location models not available: {e}")

        # Tournament models
        try:
            from .models.tournament import Tournament, TournamentParticipant

            models_imported.extend(["Tournament", "TournamentParticipant"])
            models_status["tournaments"] = True
            print("✅ Tournament models imported successfully")
        except ImportError as e:
            models_status["tournaments"] = False
            print(f"⚠️ Tournament models not available: {e}")

        # Weather models - TEMPORARILY DISABLED
        models_status["weather"] = False
        print("⚠️ Weather models temporarily disabled for stability")

        # Game Results models
        try:
            from .models.game_results import GameResult

            models_imported.extend(["GameResult"])
            models_status["game_results"] = True
            print("✅ Game Results models imported successfully")
        except ImportError as e:
            models_status["game_results"] = False
            print(f"⚠️ Game Results models not available: {e}")

        # Moderation models
        try:
            from .models.moderation import UserViolation, ModerationLog, UserReport

            models_imported.extend(["UserViolation", "ModerationLog", "UserReport"])
            models_status["moderation"] = True
            print("✅ Moderation models imported successfully")
        except ImportError as e:
            models_status["moderation"] = False
            print(f"⚠️ Moderation models not available: {e}")

        # Social models
        try:
            from .models.friends import Friendship, FriendRequest, Challenge, UserBlock

            models_imported.extend(
                ["Friendship", "FriendRequest", "Challenge", "UserBlock"]
            )
            models_status["social"] = True
            print("✅ Social models imported successfully")
        except ImportError as e:
            models_status["social"] = False
            print(f"⚠️ Social models not available: {e}")

        # Status summary
        available_groups = [
            group for group, available in models_status.items() if available
        ]
        unavailable_groups = [
            group for group, available in models_status.items() if not available
        ]

        print(f"✅ Available model groups: {', '.join(available_groups)}")
        if unavailable_groups:
            print(f"⚠️ Unavailable model groups: {', '.join(unavailable_groups)}")

        print(f"✅ Total models loaded: {len(models_imported)}")
        print(f"✅ Exported models: {', '.join(models_imported)}")

        return models_imported

    except Exception as e:
        print(f"❌ Critical error importing models: {e}")
        return []


def verify_connection():
    """Verify database connection"""
    try:
        if DB_TYPE == "sqlite":
            connection = engine.raw_connection()
            cursor = connection.cursor()
            cursor.execute("SELECT sqlite_version();")
            version = cursor.fetchone()[0]
            cursor.close()
            connection.close()
            print(f"✅ SQLite connection verified - Version: {version}")
            return True
        else:
            with engine.connect() as connection:
                result = connection.execute("SELECT 1")
                print("✅ PostgreSQL connection verified")
                return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def create_tables():
    """Create database tables"""
    try:
        print("🏗️ Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False


def initialize_default_data():
    """Initialize default data if needed - TEMPORARILY DISABLED"""
    try:
        print("⚠️ Default data initialization temporarily disabled")
        print("⚠️ Reason: Database schema migration needed for 'city' column")
        print("✅ Skipping default data initialization")
        return True

    except Exception as e:
        print(f"⚠️ Default data initialization failed: {e}")
        return False


def initialize_database():
    """Initialize database with all components"""
    try:
        print("🗄️ Initializing database...")

        # Import models first
        models = import_models()
        if not models:
            print("❌ Failed to import models")
            return False

        # Create tables
        if not create_tables():
            print("❌ Failed to create tables")
            return False

        # Initialize default data - DISABLED
        initialize_default_data()

        # Verify connection
        if not verify_connection():
            print("❌ Failed to verify connection")
            return False

        print("✅ Database initialization complete")
        return True

    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False


# === DATABASE HEALTH CHECK ===
def get_database_health():
    """Get database health status"""
    try:
        if verify_connection():
            return {
                "status": "healthy",
                "type": DB_TYPE,
                "url_masked": (
                    DATABASE_URL.replace(
                        DATABASE_URL.split("@")[0].split("://")[-1], "***"
                    )
                    if "@" in DATABASE_URL
                    else "sqlite:///./lfa_legacy_go.db"
                ),
                "redis": "connected" if redis_client else "disconnected",
            }
        else:
            return {
                "status": "unhealthy",
                "type": DB_TYPE,
                "error": "Connection failed",
            }
    except Exception as e:
        return {"status": "error", "error": str(e)}


def init_database():
    """Initialize database tables - compatibility function"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables initialized")
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False


# === EXPORT CONFIGURATION ===
print(f"✅ Database configuration complete - Type: {DB_TYPE}")


# Database session factory
def get_session():
    """Get database session"""
    return SessionLocal()


# Clean shutdown
def shutdown_database():
    """Clean database shutdown"""
    try:
        if redis_client:
            redis_client.close()
        engine.dispose()
        print("✅ Database connections closed")
    except Exception as e:
        print(f"⚠️ Error during database shutdown: {e}")


# Connection pool info
def get_connection_info():
    """Get connection pool information"""
    return {
        "pool_size": engine.pool.size(),
        "checked_in": engine.pool.checkedin(),
        "checked_out": engine.pool.checkedout(),
        "overflow": engine.pool.overflow(),
        "invalid": engine.pool.invalid(),
    }
