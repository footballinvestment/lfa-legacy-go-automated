"""
PostgreSQL Database Configuration for LFA Legacy GO
Production-optimized connection pooling and performance settings
"""

import os
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

logger = logging.getLogger(__name__)

# Database URL configuration with fallback
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    # Local development fallback
    "postgresql://lfa_user:devpassword@localhost:5433/lfa_legacy_go_dev",
)

# Production Cloud SQL connection
CLOUD_SQL_CONNECTION_NAME = os.getenv("CLOUD_SQL_CONNECTION_NAME")
# Only use Cloud SQL socket in actual production deployment (not local development)
if CLOUD_SQL_CONNECTION_NAME and os.getenv("ENVIRONMENT") == "production":
    # Google Cloud SQL Unix socket connection
    DATABASE_URL = f"postgresql://lfa_user:{os.getenv('POSTGRES_PASSWORD')}@/lfa_legacy_go?host=/cloudsql/{CLOUD_SQL_CONNECTION_NAME}"

# Connection pool configuration
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "20"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "30"))
DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))
DB_POOL_PRE_PING = os.getenv("DB_POOL_PRE_PING", "true").lower() == "true"

# Create optimized PostgreSQL engine
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=DB_POOL_SIZE,
    max_overflow=DB_MAX_OVERFLOW,
    pool_timeout=DB_POOL_TIMEOUT,
    pool_recycle=DB_POOL_RECYCLE,
    pool_pre_ping=DB_POOL_PRE_PING,
    echo=False,  # Set to True for SQL debugging
    # PostgreSQL-specific optimizations
    connect_args=(
        {
            "options": "-c timezone=utc",
            "application_name": "lfa_legacy_go",
            "connect_timeout": 10,
        }
        if not CLOUD_SQL_CONNECTION_NAME
        else {}
    ),
)


# Configure connection event handlers for optimization
@event.listens_for(engine, "connect")
def set_postgres_connection_settings(dbapi_connection, connection_record):
    """Optimize PostgreSQL connection settings"""
    try:
        with dbapi_connection.cursor() as cursor:
            # Set optimal connection parameters
            cursor.execute("SET statement_timeout = '30s'")
            cursor.execute("SET lock_timeout = '10s'")
            cursor.execute("SET idle_in_transaction_session_timeout = '60s'")
            cursor.execute("SET tcp_keepalives_idle = 600")
            cursor.execute("SET tcp_keepalives_interval = 30")
            cursor.execute("SET tcp_keepalives_count = 3")
            # Optimize for read performance
            cursor.execute("SET default_statistics_target = 100")
            cursor.execute("SET random_page_cost = 1.1")  # SSD optimization
    except Exception as e:
        logger.warning(f"Failed to set PostgreSQL connection settings: {e}")


# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# Database dependency for FastAPI
def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


# Connection health check
def check_database_health():
    """Check database connection health"""
    try:
        with engine.connect() as connection:
            connection.execute("SELECT 1")
            return {"status": "healthy", "database": "postgresql"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


# Database statistics for monitoring
def get_database_stats():
    """Get database connection and performance statistics"""
    try:
        pool = engine.pool
        return {
            "pool_size": pool.size(),
            "checked_in_connections": pool.checkedin(),
            "checked_out_connections": pool.checkedout(),
            "overflow_connections": pool.overflow(),
            "total_connections": pool.checkedin() + pool.checkedout(),
        }
    except Exception as e:
        logger.error(f"Failed to get database stats: {e}")
        return {"error": str(e)}


# Performance monitoring
class DatabasePerformanceMonitor:
    """Monitor database query performance"""

    def __init__(self):
        self.slow_query_threshold = 0.1  # 100ms
        self.slow_queries = []

    def log_slow_query(self, query, duration):
        """Log queries that exceed threshold"""
        if duration > self.slow_query_threshold:
            self.slow_queries.append(
                {
                    "query": str(query)[:200],  # Truncate long queries
                    "duration": duration,
                    "timestamp": "now",
                }
            )
            logger.warning(
                f"Slow query detected: {duration*1000:.2f}ms - {str(query)[:100]}"
            )

    def get_slow_queries(self):
        """Get recent slow queries"""
        return self.slow_queries[-10:]  # Last 10 slow queries


# Initialize performance monitor
db_monitor = DatabasePerformanceMonitor()


# Query performance tracking
@event.listens_for(engine, "before_cursor_execute")
def receive_before_cursor_execute(
    conn, cursor, statement, parameters, context, executemany
):
    """Track query start time"""
    import time

    context._query_start_time = time.time()


@event.listens_for(engine, "after_cursor_execute")
def receive_after_cursor_execute(
    conn, cursor, statement, parameters, context, executemany
):
    """Track query execution time and log slow queries"""
    import time

    total = time.time() - context._query_start_time
    db_monitor.log_slow_query(statement, total)


# Migration utilities
def create_all_tables():
    """Create all tables in PostgreSQL"""
    from app.models import (
        User,
        Tournament,
        GameSession,
        GameResult,
    )  # Import your models

    Base.metadata.create_all(bind=engine)
    logger.info("All tables created in PostgreSQL")


def drop_all_tables():
    """Drop all tables (use with caution!)"""
    Base.metadata.drop_all(bind=engine)
    logger.warning("All tables dropped from PostgreSQL")


if __name__ == "__main__":
    # Test connection
    health = check_database_health()
    print(f"Database health: {health}")

    if health["status"] == "healthy":
        stats = get_database_stats()
        print(f"Database stats: {stats}")
    else:
        print("❌ Database connection failed")
