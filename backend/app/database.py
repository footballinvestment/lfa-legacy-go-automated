# === backend/app/database.py (SQLAlchemy 2.0 FIXED) ===
import os
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Use SQLite by default for development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lfa_legacy_go.db")
print(f"🔗 Connecting to database: {DATABASE_URL}")

# Create SQLAlchemy engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()
metadata = MetaData()

# === Database Dependency ===
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === FIXED: SQLAlchemy 2.0 Compatible Connection Test ===
def test_db_connection():
    try:
        with engine.connect() as connection:
            # FIXED: Use text() wrapper for raw SQL in SQLAlchemy 2.0
            result = connection.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            return {"status": "connected", "test_query": "success", "result": row[0]}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# === FIXED: Create Tables Function ===
def create_tables():
    try:
        # Drop and recreate in development
        if DATABASE_URL.startswith("sqlite"):
            Base.metadata.drop_all(bind=engine)
        
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

# === FIXED: Database Health Check ===
def get_db_health():
    try:
        with engine.connect() as connection:
            # FIXED: Use text() wrapper
            connection.execute(text("SELECT 1"))
            
            return {
                "status": "healthy",
                "type": "sqlite" if DATABASE_URL.startswith("sqlite") else "postgresql",
                "connection": "active",
                "database_file": DATABASE_URL.split('///')[-1] if DATABASE_URL.startswith("sqlite") else "configured"
            }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "error": str(e),
            "connection": "failed"
        }

# === Initialize Database ===
def init_database():
    print("🚀 Initializing database...")
    
    # Test connection first
    health = get_db_health()
    if health["status"] == "unhealthy":
        print(f"❌ Database connection failed: {health['error']}")
        return False
    
    print(f"✅ Database connection successful!")
    
    # Create tables
    success = create_tables()
    if success:
        print("✅ Database initialization completed!")
        print(f"📊 Using: {health['type']} database")
    
    return success

# === Development Helper ===
def reset_database():
    if os.getenv("ENVIRONMENT") == "production":
        raise Exception("❌ Cannot reset database in production!")
    
    print("⚠️  Resetting database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Database reset completed!")

# Reduced output on import
print(f"📊 Database ready: {'SQLite' if DATABASE_URL.startswith('sqlite') else 'PostgreSQL'}")