"""
FORCED PostgreSQL Configuration for Cloud Run
"""
import os
import logging
from sqlalchemy import create_engine, event, pool, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine
from typing import Generator
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class ProductionDatabaseConfig:
    def __init__(self):
        # KÉNYSZERÍTETT POSTGRESQL URL
        self.database_url = "postgresql://lfa_user:NVI29jPjzKO68kJi8SMcp4cT@/lfa_legacy_go?host=/cloudsql/lfa-legacy-go:europe-west1:lfa-legacy-go-postgres"
        
        print(f"🔗 FORCED PostgreSQL: {self.database_url[:50]}...")
        
        # PostgreSQL Connection Pool Settings
        self.pool_size = 10
        self.max_overflow = 20
        self.pool_timeout = 30
        self.pool_recycle = 3600
        self.pool_pre_ping = True
        
        self.setup_database()

    def setup_database(self):
        """Setup PostgreSQL engine"""
        logger.info("🐘 Configuring FORCED PostgreSQL database")
        self.engine = create_engine(
            self.database_url,
            poolclass=pool.QueuePool,
            pool_size=self.pool_size,
            max_overflow=self.max_overflow,
            pool_timeout=self.pool_timeout,
            pool_recycle=self.pool_recycle,
            pool_pre_ping=self.pool_pre_ping,
            echo=False,
            connect_args={
                "sslmode": "disable",
                "connect_timeout": 10,
                "options": "-c timezone=utc",
            },
            execution_options={"isolation_level": "READ_COMMITTED"},
        )
        
        self.session_local = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )

    def get_session(self) -> Generator:
        """Get database session"""
        session = self.session_local()
        try:
            yield session
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()

# Global instance
db_config = ProductionDatabaseConfig()

def get_db():
    """FastAPI dependency for database session"""
    return db_config.get_session()

# For backward compatibility
engine = db_config.engine
SessionLocal = db_config.session_local
