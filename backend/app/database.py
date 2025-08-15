# === LFA Legacy GO - Database Configuration ===
# Enhanced Railway deployment with SQLite fallback and PostgreSQL support
# Location: backend/app/database.py

import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, MetaData, text, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print(f"🗄️ Database module loading from backend/app/database.py...")

# === DATABASE CONFIGURATION ===

def get_database_config():
    """Get database configuration for Cloud Run with PostgreSQL priority"""
    
    database_url = os.getenv("DATABASE_URL")
    environment = os.getenv("ENVIRONMENT", "production")
    railway_env = os.getenv("RAILWAY_ENVIRONMENT")
    
    # Priority 1: PostgreSQL connection (Cloud SQL)
    if database_url and ("postgres" in database_url):
        # Handle both postgres:// and postgresql:// URLs
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        print(f"🔗 Using Cloud SQL PostgreSQL: {database_url[:60]}...")
        return database_url, "postgresql"
    
    # Priority 2: Explicit SQLite URL (local development)
    elif database_url and database_url.startswith("sqlite"):
        print(f"🔗 Using SQLite from URL: {database_url}")
        return database_url, "sqlite"
    
    # Priority 3: Cloud Run environment - PostgreSQL expected
    elif environment == "production":
        print("⚠️ Production environment detected but no PostgreSQL DATABASE_URL!")
        print("🔄 Falling back to temporary SQLite (data will be lost on restart)")
        # Temporary fallback for production
        database_url = "sqlite:////tmp/lfa_legacy_go.db"
        return database_url, "sqlite"
    
    # Priority 4: Railway SQLite fallback
    elif railway_env:
        data_dir = "/backend/data"
        os.makedirs(data_dir, exist_ok=True)
        db_path = "/backend/data/lfa_legacy_go.db"
        database_url = f"sqlite:///{db_path}"
        print(f"🔗 Railway SQLite fallback: {database_url}")
        return database_url, "sqlite"
    
    # Priority 5: Local development fallback
    else:
        # Navigate from backend/app/database.py to backend/
        current_dir = Path(__file__).parent  # app/
        backend_dir = current_dir.parent     # backend/
        db_path = backend_dir / "lfa_legacy_go.db"
        database_url = f"sqlite:///{db_path}"
        print(f"🔗 Local SQLite: {database_url}")
        return database_url, "sqlite"

# Get database configuration
DATABASE_URL, DB_TYPE = get_database_config()

# === ENGINE CONFIGURATION ===

def create_database_engine():
    """Create SQLAlchemy engine with appropriate configuration"""
    
    if DB_TYPE == "postgresql":
        # PostgreSQL configuration for Railway
        engine = create_engine(
            DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=300,
            echo=False
        )
    else:
        # SQLite configuration with performance optimizations
        engine = create_engine(
            DATABASE_URL,
            poolclass=StaticPool,
            connect_args={
                "check_same_thread": False,
                "timeout": 20
            },
            echo=False
        )
        
        # Enable WAL mode for SQLite performance
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA cache_size=1000")
            cursor.execute("PRAGMA temp_store=MEMORY")
            cursor.close()
    
    return engine

# Create engine and session
engine = create_database_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# === DATABASE FUNCTIONS ===

def get_db() -> Session:
    """Database dependency for FastAPI endpoints"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_database_connection():
    """Verify database connection is working"""
    try:
        with engine.connect() as connection:
            if DB_TYPE == "postgresql":
                result = connection.execute(text("SELECT version()"))
                version = result.scalar()
                print(f"✅ PostgreSQL connection verified - {version}")
            else:
                result = connection.execute(text("SELECT sqlite_version()"))
                version = result.scalar()
                print(f"✅ SQLite connection verified - Version: {version}")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def create_tables():
    """Create all database tables"""
    try:
        # Import all models to register them with SQLAlchemy
        import_all_models()
        
        # Create tables
        print("🏗️ Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        
        # Initialize default data if needed
        initialize_default_data()
        
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        # Don't raise - let the app continue

def import_all_models():
    """Import all model classes to register them with SQLAlchemy"""
    try:
        # Import models one by one with individual error handling
        models_imported = []
        
        try:
            from .models.user import User, UserSession
            models_imported.append("User, UserSession")
        except ImportError as e:
            print(f"⚠️ Cannot import User models: {e}")
        
        try:
            from .models.friends import Friend, FriendRequest
            models_imported.append("Friend, FriendRequest")
        except ImportError as e:
            print(f"⚠️ Cannot import Friend models: {e}")
        
        try:
            from .models.location import Location, GameDefinition
            models_imported.append("Location, GameDefinition")
        except ImportError as e:
            print(f"⚠️ Cannot import Location models: {e}")
        
        try:
            from .models.tournament import Tournament, TournamentParticipant
            models_imported.append("Tournament models")
        except ImportError as e:
            print(f"⚠️ Cannot import Tournament models: {e}")
        
        try:
            from .models.game_results import GameSession, GameResult
            models_imported.append("GameResult models")
        except ImportError as e:
            print(f"⚠️ Cannot import GameResult models: {e}")
        
        try:
            from .models.weather import WeatherData, LocationWeatherRule
            models_imported.append("Weather models")
        except ImportError as e:
            print(f"⚠️ Cannot import Weather models: {e}")
        
        try:
            from .models.moderation import UserViolation, ModerationAction
            models_imported.append("Moderation models")
        except ImportError as e:
            print(f"⚠️ Cannot import Moderation models: {e}")
        
        if models_imported:
            print(f"✅ Successfully imported: {', '.join(models_imported)}")
        else:
            print("❌ No models could be imported")
        
    except Exception as e:
        print(f"❌ Critical error importing models: {e}")
        print("⚠️ Continuing with minimal setup...")

def initialize_default_data():
    """Initialize default data if needed"""
    try:
        db = SessionLocal()
        
        # Check if we need to initialize location data
        try:
            from .models.location import Location
            location_count = db.query(Location).count()
            
            if location_count == 0:
                print("🌱 Initializing default locations...")
                create_default_locations(db)
        except ImportError:
            print("⚠️ Location model not available, skipping default data")
        
        db.close()
        print("✅ Default data initialization complete")
        
    except Exception as e:
        print(f"⚠️ Default data initialization failed: {e}")
        # Continue anyway

def create_default_locations(db: Session):
    """Create default locations"""
    try:
        from .models.location import Location
        
        default_locations = [
            {
                "name": "Central Sports Complex",
                "address": "123 Sports Avenue",
                "city": "Budapest",
                "capacity": 20,
                "price_per_hour": 15.0,
                "rating": 4.5,
                "amenities": ["Parking", "Changing Rooms", "Equipment Rental"]
            },
            {
                "name": "Riverside Football Park", 
                "address": "456 River Road",
                "city": "Budapest",
                "capacity": 30,
                "price_per_hour": 20.0,
                "rating": 4.8,
                "amenities": ["Premium Pitch", "Cafeteria", "WiFi"]
            }
        ]
        
        for loc_data in default_locations:
            location = Location(**loc_data)
            db.add(location)
        
        db.commit()
        print(f"✅ Created {len(default_locations)} default locations")
        
    except Exception as e:
        print(f"❌ Failed to create default locations: {e}")
        db.rollback()

# === INITIALIZATION ===

# Verify connection on module load (not in __main__)
print(f"✅ Database configuration complete - Type: {DB_TYPE}")