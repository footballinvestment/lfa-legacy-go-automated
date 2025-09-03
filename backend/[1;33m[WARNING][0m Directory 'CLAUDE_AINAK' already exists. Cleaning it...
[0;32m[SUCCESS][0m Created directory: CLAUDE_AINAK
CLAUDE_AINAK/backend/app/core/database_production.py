"""
Production Database Configuration with Connection Pooling
Optimized for PostgreSQL in production environment
"""

import os
import logging
from sqlalchemy import create_engine, event, pool, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine
from typing import Generator
import redis
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class ProductionDatabaseConfig:
    def __init__(self):
        # Load PostgreSQL credentials for local development
        self.load_postgres_credentials()

        # Environment variables
        self.database_url = os.getenv("DATABASE_URL")
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.environment = os.getenv("ENVIRONMENT", "development")

        # PostgreSQL Connection Pool Settings
        self.pool_size = int(os.getenv("DB_POOL_SIZE", "10"))
        self.max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "20"))
        self.pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "30"))
        self.pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "3600"))
        self.pool_pre_ping = os.getenv("DB_POOL_PRE_PING", "true").lower() == "true"

        # Initialize database
        self.engine = None
        self.session_local = None
        self.redis_client = None
        self.setup_database()
        self.setup_redis()

    def load_postgres_credentials(self):
        """Load PostgreSQL credentials from .env.postgres file (only in production)"""
        # Only load PostgreSQL credentials in production environment
        if os.getenv("ENVIRONMENT", "development") == "production":
            env_file = "../.env.postgres"
            if os.path.exists(env_file):
                with open(env_file, "r") as f:
                    for line in f:
                        if line.strip() and not line.startswith("#"):
                            key, value = line.strip().split("=", 1)
                            os.environ[key] = value
                logger.info("✅ PostgreSQL credentials loaded from .env.postgres")
        else:
            logger.info("📁 Development mode: Using SQLite instead of PostgreSQL")

    def setup_database(self):
        """Setup database engine with production optimizations"""
        if not self.database_url:
            # Fallback to SQLite for local development
            logger.warning("DATABASE_URL not set, using SQLite for local development")
            self.database_url = "sqlite:///./lfa_legacy_go.db"

        # Production PostgreSQL configuration
        if self.database_url.startswith("postgresql"):
            logger.info("🐘 Configuring PostgreSQL production database")

            self.engine = create_engine(
                self.database_url,
                # Connection Pool Configuration
                poolclass=pool.QueuePool,
                pool_size=self.pool_size,
                max_overflow=self.max_overflow,
                pool_timeout=self.pool_timeout,
                pool_recycle=self.pool_recycle,
                pool_pre_ping=self.pool_pre_ping,
                # PostgreSQL Specific Settings
                echo=False,  # Disable SQL logging in production
                connect_args={
                    "sslmode": (
                        "disable"
                        if "localhost" in self.database_url
                        else (
                            "require" if self.environment == "production" else "prefer"
                        )
                    ),
                    "connect_timeout": 10,
                    "options": "-c timezone=utc",
                },
                # Query optimization
                execution_options={"isolation_level": "READ_COMMITTED"},
            )

            # PostgreSQL connection event listeners
            @event.listens_for(self.engine, "connect")
            def set_postgresql_pragma(dbapi_connection, connection_record):
                with dbapi_connection.cursor() as cursor:
                    # Connection-level optimizations
                    cursor.execute("SET statement_timeout = '30s'")
                    cursor.execute("SET lock_timeout = '10s'")
                    cursor.execute("SET idle_in_transaction_session_timeout = '5min'")
                    cursor.execute("SET timezone = 'UTC'")

            logger.info(
                f"✅ PostgreSQL engine configured with pool_size={self.pool_size}"
            )

        else:
            # Fallback to SQLite for development
            logger.info("📁 Using SQLite for development")
            self.engine = create_engine(
                self.database_url, connect_args={"check_same_thread": False}, echo=False
            )

        # Create session factory
        self.session_local = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )

    def setup_redis(self):
        """Setup Redis connection for caching"""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30,
            )

            # Test connection
            self.redis_client.ping()
            logger.info("✅ Redis connection established")

        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e}")
            logger.info("📝 Running without Redis cache")
            self.redis_client = None

    def get_session(self) -> Generator:
        """Get database session with proper error handling"""
        session = self.session_local()
        try:
            yield session
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()

    @contextmanager
    def get_connection(self):
        """Get raw database connection"""
        conn = self.engine.connect()
        try:
            yield conn
        except Exception as e:
            conn.rollback()
            logger.error(f"Database connection error: {e}")
            raise
        finally:
            conn.close()

    def health_check(self) -> dict:
        """Comprehensive database health check"""
        health_status = {
            "database": {"status": "unknown", "details": {}},
            "redis": {"status": "unknown", "details": {}},
            "connection_pool": {"status": "unknown", "details": {}},
        }

        # Database health check
        try:
            with self.get_connection() as conn:
                result = conn.execute(text("SELECT 1"))
                result.fetchone()

                # Get database info
                if self.database_url.startswith("postgresql"):
                    version_result = conn.execute(text("SELECT version()"))
                    db_version = version_result.fetchone()[0]
                    health_status["database"] = {
                        "status": "healthy",
                        "details": {
                            "type": "postgresql",
                            "version": db_version.split()[1],
                            "connection_url": (
                                self.database_url.split("@")[1]
                                if "@" in self.database_url
                                else "local"
                            ),
                        },
                    }
                else:
                    health_status["database"] = {
                        "status": "healthy",
                        "details": {"type": "sqlite"},
                    }

        except Exception as e:
            health_status["database"] = {
                "status": "unhealthy",
                "details": {"error": str(e)},
            }

        # Connection pool health check
        if hasattr(self.engine, "pool") and hasattr(self.engine.pool, "status"):
            try:
                health_status["connection_pool"] = {
                    "status": "healthy",
                    "details": {
                        "size": getattr(self.engine.pool, "size", lambda: 0)(),
                        "checked_in": getattr(
                            self.engine.pool, "checkedin", lambda: 0
                        )(),
                        "checked_out": getattr(
                            self.engine.pool, "checkedout", lambda: 0
                        )(),
                        "invalid": getattr(
                            self.engine.pool, "invalidated", lambda: 0
                        )(),
                    },
                }
            except Exception as e:
                health_status["connection_pool"] = {
                    "status": "error",
                    "details": {"error": str(e)},
                }

        # Redis health check
        if self.redis_client:
            try:
                self.redis_client.ping()
                info = self.redis_client.info()
                health_status["redis"] = {
                    "status": "healthy",
                    "details": {
                        "connected_clients": info.get("connected_clients", 0),
                        "used_memory_human": info.get("used_memory_human", "unknown"),
                        "uptime_in_seconds": info.get("uptime_in_seconds", 0),
                    },
                }
            except Exception as e:
                health_status["redis"] = {
                    "status": "unhealthy",
                    "details": {"error": str(e)},
                }
        else:
            health_status["redis"] = {
                "status": "disabled",
                "details": {"message": "Redis not configured"},
            }

        return health_status

    def get_performance_metrics(self) -> dict:
        """Get database performance metrics"""
        metrics = {}

        try:
            with self.get_connection() as conn:
                if self.database_url.startswith("postgresql"):
                    # PostgreSQL specific metrics
                    stats_query = """
                    SELECT
                        schemaname,
                        relname as tablename,
                        n_tup_ins as inserts,
                        n_tup_upd as updates,
                        n_tup_del as deletes,
                        n_live_tup as live_tuples,
                        n_dead_tup as dead_tuples
                    FROM pg_stat_user_tables
                    ORDER BY n_live_tup DESC;
                    """

                    result = conn.execute(text(stats_query))
                    table_stats = []
                    for row in result.fetchall():
                        table_stats.append({
                            'schemaname': row[0],
                            'tablename': row[1], 
                            'inserts': row[2],
                            'updates': row[3],
                            'deletes': row[4],
                            'live_tuples': row[5],
                            'dead_tuples': row[6]
                        })

                    # Connection stats
                    conn_query = """
                    SELECT
                        count(*) as total_connections,
                        count(*) FILTER (WHERE state = 'active') as active_connections,
                        count(*) FILTER (WHERE state = 'idle') as idle_connections
                    FROM pg_stat_activity;
                    """

                    result = conn.execute(text(conn_query))
                    conn_row = result.fetchone()
                    conn_stats = {
                        'total_connections': conn_row[0],
                        'active_connections': conn_row[1], 
                        'idle_connections': conn_row[2]
                    }

                    metrics = {
                        "database_type": "postgresql",
                        "table_statistics": table_stats,
                        "connection_statistics": conn_stats,
                        "pool_statistics": {
                            "pool_size": self.pool_size,
                            "max_overflow": self.max_overflow,
                            "current_connections": (
                                self.engine.pool.checkedout()
                                if hasattr(self.engine, "pool")
                                else 0
                            ),
                        },
                    }

        except Exception as e:
            metrics = {"error": f"Failed to get performance metrics: {str(e)}"}

        return metrics

    def close_connections(self):
        """Clean shutdown of all connections"""
        logger.info("🔄 Closing database connections")

        if self.engine:
            self.engine.dispose()
            logger.info("✅ Database engine disposed")

        if self.redis_client:
            self.redis_client.close()
            logger.info("✅ Redis connection closed")


# Global instance
db_config = ProductionDatabaseConfig()


# Dependency injection for FastAPI
def get_db():
    """FastAPI dependency for database session"""
    return db_config.get_session()


def get_redis():
    """FastAPI dependency for Redis client"""
    return db_config.redis_client


# For backward compatibility
engine = db_config.engine
SessionLocal = db_config.session_local
redis_client = db_config.redis_client
