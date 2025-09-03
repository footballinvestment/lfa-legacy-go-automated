"""
Database performance optimizations for LFA Legacy GO
"""

import time
import asyncio
from typing import Dict, List, Any, Optional
from contextlib import contextmanager, asynccontextmanager
from sqlalchemy import event, Engine, create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from concurrent.futures import ThreadPoolExecutor
from app.core.config import settings
from app.core.logging import get_logger
from app.core.cache import cache, cached

logger = get_logger("database_performance")


class DatabasePerformanceMonitor:
    """Monitor and optimize database performance"""

    def __init__(self):
        self.query_times: List[float] = []
        self.slow_queries: List[Dict[str, Any]] = []
        self.connection_pool_stats: Dict[str, int] = {}
        self.active_connections = 0
        self.total_queries = 0
        self.slow_query_threshold = 0.050  # 50ms

    def log_query(self, query: str, duration: float, params: Any = None):
        """Log query performance"""
        self.query_times.append(duration)
        self.total_queries += 1

        # Keep only last 1000 queries
        if len(self.query_times) > 1000:
            self.query_times.pop(0)

        # Log slow queries
        if duration > self.slow_query_threshold:
            slow_query = {
                "query": query[:200] + "..." if len(query) > 200 else query,
                "duration": duration,
                "params": str(params)[:100] if params else None,
                "timestamp": time.time(),
            }
            self.slow_queries.append(slow_query)

            # Keep only last 50 slow queries
            if len(self.slow_queries) > 50:
                self.slow_queries.pop(0)

            logger.warning(f"Slow query ({duration:.3f}s): {query[:100]}...")

    def get_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        if not self.query_times:
            return {
                "total_queries": 0,
                "average_time": 0,
                "slow_queries": 0,
                "active_connections": self.active_connections,
            }

        avg_time = sum(self.query_times) / len(self.query_times)
        slow_count = len([t for t in self.query_times if t > self.slow_query_threshold])

        return {
            "total_queries": self.total_queries,
            "average_time": round(avg_time * 1000, 2),  # ms
            "slow_queries": slow_count,
            "slow_query_percentage": round(
                (slow_count / len(self.query_times)) * 100, 1
            ),
            "active_connections": self.active_connections,
            "recent_slow_queries": self.slow_queries[-10:],  # Last 10
        }


# Global performance monitor
db_monitor = DatabasePerformanceMonitor()


# SQLAlchemy event listeners for performance monitoring
@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(
    conn, cursor, statement, parameters, context, executemany
):
    """Track query start time"""
    context._query_start_time = time.time()


@event.listens_for(Engine, "after_cursor_execute")
def receive_after_cursor_execute(
    conn, cursor, statement, parameters, context, executemany
):
    """Track query completion and log performance"""
    if hasattr(context, "_query_start_time"):
        duration = time.time() - context._query_start_time
        db_monitor.log_query(statement, duration, parameters)


@event.listens_for(Engine, "connect")
def receive_connect(dbapi_connection, connection_record):
    """Track new connections"""
    db_monitor.active_connections += 1
    logger.debug(f"New DB connection: {db_monitor.active_connections} active")


@event.listens_for(Engine, "close")
def receive_close(dbapi_connection, connection_record):
    """Track connection closes"""
    db_monitor.active_connections = max(0, db_monitor.active_connections - 1)
    logger.debug(f"DB connection closed: {db_monitor.active_connections} active")


def create_optimized_engine():
    """Create SQLAlchemy engine with performance optimizations"""

    # Connection pool configuration
    if settings.DATABASE_URL.startswith("sqlite"):
        # SQLite specific optimizations
        engine = create_engine(
            settings.DATABASE_URL,
            echo=False,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={
                "check_same_thread": False,
                "timeout": 20,
                # SQLite performance optimizations
                "isolation_level": None,  # Enable autocommit mode
            },
        )
    else:
        # PostgreSQL/MySQL optimizations
        engine = create_engine(
            settings.DATABASE_URL,
            echo=False,
            poolclass=QueuePool,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_timeout=30,
            connect_args={
                "connect_timeout": 10,
            },
        )

    return engine


class OptimizedSession:
    """Session wrapper with performance optimizations"""

    def __init__(self, session: Session):
        self.session = session
        self._start_time = time.time()

    def __enter__(self):
        return self.session

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        finally:
            duration = time.time() - self._start_time
            if duration > 0.1:  # Log long sessions
                logger.warning(f"Long session duration: {duration:.3f}s")
            self.session.close()


@contextmanager
def get_optimized_db():
    """Get database session with performance monitoring"""
    from app.database import SessionLocal

    session = SessionLocal()
    try:
        yield OptimizedSession(session)
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


class BatchOperationManager:
    """Manage batch database operations for better performance"""

    def __init__(self, batch_size: int = 1000):
        self.batch_size = batch_size
        self.operations: List[Any] = []

    def add_operation(self, operation: Any):
        """Add operation to batch"""
        self.operations.append(operation)

        if len(self.operations) >= self.batch_size:
            self.execute_batch()

    def execute_batch(self):
        """Execute all pending operations"""
        if not self.operations:
            return

        start_time = time.time()

        with get_optimized_db() as db:
            try:
                db.session.bulk_save_objects(self.operations)
                db.session.commit()

                duration = time.time() - start_time
                logger.info(
                    f"Batch operation completed: {len(self.operations)} items in {duration:.3f}s"
                )

            except Exception as e:
                logger.error(f"Batch operation failed: {e}")
                raise
            finally:
                self.operations.clear()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.execute_batch()


# Query optimization decorators
def optimized_query(cache_ttl: int = 300):
    """Decorator for database queries with caching and monitoring"""

    def decorator(func):
        @cached(ttl=cache_ttl)
        def wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time

                if duration > 0.1:
                    logger.warning(
                        f"Slow query function {func.__name__}: {duration:.3f}s"
                    )

                return result

            except Exception as e:
                duration = time.time() - start_time
                logger.error(
                    f"Query function {func.__name__} failed after {duration:.3f}s: {e}"
                )
                raise

        return wrapper

    return decorator


# Database maintenance functions
def analyze_query_performance():
    """Analyze query performance and suggest optimizations"""
    stats = db_monitor.get_stats()

    logger.info("📊 Database Performance Analysis:")
    logger.info(f"  Total Queries: {stats['total_queries']}")
    logger.info(f"  Average Time: {stats['average_time']}ms")
    logger.info(
        f"  Slow Queries: {stats['slow_queries']} ({stats['slow_query_percentage']}%)"
    )
    logger.info(f"  Active Connections: {stats['active_connections']}")

    # Recommendations
    recommendations = []

    if stats["average_time"] > 50:  # >50ms average
        recommendations.append("Consider adding database indexes")

    if stats["slow_query_percentage"] > 10:
        recommendations.append("Review and optimize slow queries")

    if stats["active_connections"] > 15:
        recommendations.append("Consider connection pooling optimization")

    if recommendations:
        logger.warning("🔧 Performance Recommendations:")
        for rec in recommendations:
            logger.warning(f"  • {rec}")

    return stats


async def warm_up_database():
    """Warm up database connections and cache common queries"""
    logger.info("🔥 Warming up database...")

    try:
        with get_optimized_db() as db:
            # Execute common queries to warm up connections
            db.session.execute(text("SELECT 1"))

            # Pre-load common data into cache if available
            if cache.is_connected():
                # Add your common queries here
                pass

        logger.info("✅ Database warm-up complete")

    except Exception as e:
        logger.error(f"Database warm-up failed: {e}")


# Index suggestions based on query patterns
def suggest_indexes():
    """Suggest database indexes based on slow query patterns"""
    suggestions = []

    for query_info in db_monitor.slow_queries[-10:]:
        query = query_info["query"].lower()

        # Simple pattern matching for common slow queries
        if "where" in query and "user_id" in query:
            suggestions.append("CREATE INDEX idx_user_id ON table_name(user_id)")

        if "order by created_at" in query:
            suggestions.append("CREATE INDEX idx_created_at ON table_name(created_at)")

        if "join" in query and "tournament" in query:
            suggestions.append(
                "CREATE INDEX idx_tournament_fk ON table_name(tournament_id)"
            )

    # Remove duplicates
    suggestions = list(set(suggestions))

    if suggestions:
        logger.info("💡 Index Suggestions:")
        for suggestion in suggestions[:5]:  # Top 5
            logger.info(f"  {suggestion}")

    return suggestions


# Connection pool monitoring
def monitor_connection_pool():
    """Monitor connection pool health"""
    # This would be implemented based on your database type
    # For now, return basic stats
    return {
        "active_connections": db_monitor.active_connections,
        "total_queries": db_monitor.total_queries,
        "avg_query_time": (
            sum(db_monitor.query_times) / len(db_monitor.query_times)
            if db_monitor.query_times
            else 0
        ),
    }
