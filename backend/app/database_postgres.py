# app/database_postgres.py
import os
from sqlalchemy import create_engine, MetaData, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import logging

# Production PostgreSQL connection
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://lfa_user:lfa_password@localhost:5432/lfa_production"
)

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    echo=False  # Set to True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logging.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# Database health check
def check_database_health():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        return {
            "status": "healthy",
            "connection": True,
            "tables_count": len(tables)
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "connection": False,
            "error": str(e)
        }