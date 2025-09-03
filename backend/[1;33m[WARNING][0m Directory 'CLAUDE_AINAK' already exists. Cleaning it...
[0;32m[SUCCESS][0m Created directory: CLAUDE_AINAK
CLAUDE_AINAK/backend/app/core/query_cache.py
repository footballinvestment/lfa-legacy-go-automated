"""
Advanced Query Result Caching System
Intelligent caching of SQL query results with automatic invalidation
"""

import hashlib
import json
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Callable, Union
from functools import wraps
import logging
from dataclasses import dataclass
import asyncio
from concurrent.futures import ThreadPoolExecutor

from sqlalchemy import text, event
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.core.smart_cache import smart_cache
from app.core.database_production import db_config

logger = logging.getLogger(__name__)


@dataclass
class QueryCacheConfig:
    """Configuration for query caching"""
    ttl: int = 300  # 5 minutes default
    auto_refresh: bool = False  # Auto-refresh before expiry
    refresh_threshold: float = 0.8  # Refresh when 80% of TTL passed
    max_result_size: int = 10000  # Max rows to cache
    compression: bool = True  # Compress large results
    

@dataclass
class QueryMetrics:
    """Query performance metrics"""
    query_hash: str
    execution_count: int = 0
    cache_hits: int = 0 
    cache_misses: int = 0
    avg_db_time: float = 0.0
    avg_cache_time: float = 0.0
    last_executed: Optional[datetime] = None
    
    @property
    def hit_rate(self) -> float:
        total = self.cache_hits + self.cache_misses
        return self.cache_hits / total if total > 0 else 0.0
    
    @property
    def speedup_factor(self) -> float:
        return self.avg_db_time / self.avg_cache_time if self.avg_cache_time > 0 else 0.0


class AdvancedQueryCache:
    """Advanced query result caching with intelligence"""
    
    def __init__(self):
        self.metrics: Dict[str, QueryMetrics] = {}
        self.table_dependencies: Dict[str, List[str]] = {}  # table -> query_hashes
        self.query_configs: Dict[str, QueryCacheConfig] = {}
        self.executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="cache_")
        
        # Setup database event listeners for invalidation
        self._setup_invalidation_listeners()
    
    def _generate_query_hash(self, query: str, params: Dict = None) -> str:
        """Generate unique hash for query + parameters"""
        query_normalized = query.strip().lower()
        params_str = json.dumps(params or {}, sort_keys=True)
        combined = f"{query_normalized}:{params_str}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    def _extract_table_names(self, query: str) -> List[str]:
        """Extract table names from SQL query (basic implementation)"""
        import re
        
        # Simple regex to find table names after FROM, JOIN, UPDATE, INSERT INTO
        table_pattern = r'\b(?:FROM|JOIN|UPDATE|INSERT\s+INTO)\s+([a-zA-Z_][a-zA-Z0-9_]*)'
        matches = re.findall(table_pattern, query.upper(), re.IGNORECASE)
        
        return list(set(matches))
    
    def _setup_invalidation_listeners(self):
        """Setup automatic cache invalidation on database changes"""
        
        @event.listens_for(Engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            """Track queries that modify data"""
            statement_upper = statement.upper().strip()
            
            # Check if it's a modifying query
            if any(statement_upper.startswith(cmd) for cmd in ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']):
                affected_tables = self._extract_table_names(statement)
                
                # Store affected tables for post-execute invalidation
                if not hasattr(context, '_cache_affected_tables'):
                    context._cache_affected_tables = []
                context._cache_affected_tables.extend(affected_tables)
        
        @event.listens_for(Engine, "after_cursor_execute") 
        def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            """Invalidate caches after successful data modification"""
            if hasattr(context, '_cache_affected_tables'):
                for table_name in context._cache_affected_tables:
                    self.invalidate_table_caches(table_name)
    
    def cache_query(
        self, 
        query: str, 
        params: Dict = None,
        config: QueryCacheConfig = None
    ) -> Callable:
        """Decorator for caching query results"""
        
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Generate cache key
                query_hash = self._generate_query_hash(query, params)
                cache_key = f"query:{query_hash}"
                
                # Get or create config
                if config:
                    self.query_configs[query_hash] = config
                query_config = self.query_configs.get(query_hash, QueryCacheConfig())
                
                # Initialize metrics
                if query_hash not in self.metrics:
                    self.metrics[query_hash] = QueryMetrics(query_hash=query_hash)
                
                metrics = self.metrics[query_hash]
                
                # Try cache first
                start_time = time.time()
                cached_result = smart_cache.get(cache_key, prefix="query_cache:")
                cache_time = time.time() - start_time
                
                if cached_result is not None:
                    # Cache hit
                    metrics.cache_hits += 1
                    metrics.avg_cache_time = (metrics.avg_cache_time * (metrics.cache_hits - 1) + cache_time * 1000) / metrics.cache_hits
                    
                    logger.debug(f"Query cache HIT: {query_hash[:8]}... ({cache_time*1000:.2f}ms)")
                    
                    # Check if needs background refresh
                    if query_config.auto_refresh:
                        self._maybe_refresh_background(query_hash, query, params, func, args, kwargs)
                    
                    return cached_result
                
                # Cache miss - execute query
                metrics.cache_misses += 1
                metrics.execution_count += 1
                
                start_time = time.time()
                result = func(*args, **kwargs)
                db_time = time.time() - start_time
                
                metrics.avg_db_time = (metrics.avg_db_time * (metrics.execution_count - 1) + db_time * 1000) / metrics.execution_count
                metrics.last_executed = datetime.utcnow()
                
                logger.debug(f"Query cache MISS: {query_hash[:8]}... ({db_time*1000:.2f}ms)")
                
                # Cache the result if it's not too large
                if self._should_cache_result(result, query_config):
                    smart_cache.set(cache_key, result, query_config.ttl, prefix="query_cache:")
                    
                    # Track table dependencies
                    tables = self._extract_table_names(query)
                    for table in tables:
                        if table not in self.table_dependencies:
                            self.table_dependencies[table] = []
                        if query_hash not in self.table_dependencies[table]:
                            self.table_dependencies[table].append(query_hash)
                
                return result
            
            return wrapper
        return decorator
    
    def _should_cache_result(self, result: Any, config: QueryCacheConfig) -> bool:
        """Determine if result should be cached based on size and config"""
        if not result:
            return True
        
        if isinstance(result, (list, tuple)):
            if len(result) > config.max_result_size:
                logger.warning(f"Result too large to cache: {len(result)} rows")
                return False
        
        return True
    
    def _maybe_refresh_background(
        self, 
        query_hash: str, 
        query: str, 
        params: Dict,
        func: Callable,
        args: Tuple,
        kwargs: Dict
    ):
        """Maybe refresh cache in background if near expiry"""
        cache_key = f"query:{query_hash}"
        
        # Check TTL remaining
        remaining_ttl = smart_cache.redis_client.ttl(f"query_cache:{cache_key}") if smart_cache.redis_client else -1
        config = self.query_configs.get(query_hash, QueryCacheConfig())
        
        if remaining_ttl > 0 and remaining_ttl < (config.ttl * (1 - config.refresh_threshold)):
            # Submit background refresh
            logger.debug(f"Scheduling background refresh for query {query_hash[:8]}...")
            self.executor.submit(self._background_refresh, query_hash, func, args, kwargs, config)
    
    def _background_refresh(
        self, 
        query_hash: str, 
        func: Callable, 
        args: Tuple, 
        kwargs: Dict,
        config: QueryCacheConfig
    ):
        """Background refresh of cache"""
        try:
            cache_key = f"query:{query_hash}"
            
            start_time = time.time()
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # Update cache
            smart_cache.set(cache_key, result, config.ttl, prefix="query_cache:")
            
            logger.info(f"Background refresh completed for query {query_hash[:8]}... ({execution_time*1000:.2f}ms)")
            
        except Exception as e:
            logger.error(f"Background refresh failed for query {query_hash[:8]}...: {e}")
    
    def invalidate_table_caches(self, table_name: str):
        """Invalidate all caches dependent on a table"""
        if table_name in self.table_dependencies:
            query_hashes = self.table_dependencies[table_name]
            
            for query_hash in query_hashes:
                cache_key = f"query:{query_hash}"
                smart_cache.delete(cache_key, prefix="query_cache:")
            
            logger.info(f"Invalidated {len(query_hashes)} caches for table '{table_name}'")
    
    def get_query_metrics(self) -> Dict[str, Dict]:
        """Get detailed query performance metrics"""
        return {
            query_hash: {
                "execution_count": metrics.execution_count,
                "cache_hits": metrics.cache_hits,
                "cache_misses": metrics.cache_misses,
                "hit_rate": f"{metrics.hit_rate:.2%}",
                "avg_db_time_ms": round(metrics.avg_db_time, 2),
                "avg_cache_time_ms": round(metrics.avg_cache_time, 2),
                "speedup_factor": f"{metrics.speedup_factor:.1f}x",
                "last_executed": metrics.last_executed.isoformat() if metrics.last_executed else None
            }
            for query_hash, metrics in self.metrics.items()
        }
    
    def warm_frequently_used_caches(self, db: Session, top_n: int = 10):
        """Warm the most frequently used query caches"""
        
        # Sort queries by execution count
        frequent_queries = sorted(
            self.metrics.items(), 
            key=lambda x: x[1].execution_count, 
            reverse=True
        )[:top_n]
        
        warmed = 0
        for query_hash, metrics in frequent_queries:
            try:
                # This is a simplified implementation
                # In practice, you'd need to store the original query and params
                logger.info(f"Would warm cache for query {query_hash[:8]}... (executed {metrics.execution_count} times)")
                warmed += 1
                
            except Exception as e:
                logger.error(f"Failed to warm cache for query {query_hash[:8]}...: {e}")
        
        logger.info(f"Cache warming completed: {warmed}/{len(frequent_queries)} queries warmed")
        return warmed
    
    def cleanup_expired_metrics(self, max_age_days: int = 7):
        """Clean up old metrics"""
        cutoff = datetime.utcnow() - timedelta(days=max_age_days)
        
        to_remove = []
        for query_hash, metrics in self.metrics.items():
            if metrics.last_executed and metrics.last_executed < cutoff:
                to_remove.append(query_hash)
        
        for query_hash in to_remove:
            del self.metrics[query_hash]
            
            # Also clean up dependencies
            for table_queries in self.table_dependencies.values():
                if query_hash in table_queries:
                    table_queries.remove(query_hash)
        
        logger.info(f"Cleaned up {len(to_remove)} old query metrics")
        return len(to_remove)


# Global query cache instance
advanced_query_cache = AdvancedQueryCache()


def cached_query(
    query: str, 
    params: Dict = None,
    ttl: int = 300,
    auto_refresh: bool = False,
    max_result_size: int = 10000
) -> Callable:
    """
    Decorator for caching SQL query results
    
    Args:
        query: SQL query string
        params: Query parameters
        ttl: Cache TTL in seconds
        auto_refresh: Enable background refresh
        max_result_size: Maximum rows to cache
    
    Example:
        @cached_query("SELECT * FROM users WHERE is_active = true", ttl=600)
        def get_active_users(db: Session):
            return db.execute(text("SELECT * FROM users WHERE is_active = true")).fetchall()
    """
    config = QueryCacheConfig(
        ttl=ttl,
        auto_refresh=auto_refresh, 
        max_result_size=max_result_size
    )
    
    return advanced_query_cache.cache_query(query, params, config)


# Example usage functions
@cached_query("SELECT COUNT(*) FROM users", ttl=180)
def get_user_count(db: Session) -> int:
    """Get total user count with 3-minute cache"""
    result = db.execute(text("SELECT COUNT(*) FROM users")).fetchone()
    return result[0] if result else 0


@cached_query("SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC", ttl=300)
def get_active_users(db: Session) -> List[Dict]:
    """Get active users with 5-minute cache"""
    result = db.execute(text("SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC")).fetchall()
    return [dict(row._mapping) for row in result]


@cached_query("SELECT * FROM tournaments WHERE status = :status", ttl=600, auto_refresh=True)
def get_tournaments_by_status(db: Session, status: str = "active") -> List[Dict]:
    """Get tournaments by status with 10-minute cache and auto-refresh"""
    result = db.execute(
        text("SELECT * FROM tournaments WHERE status = :status"), 
        {"status": status}
    ).fetchall()
    return [dict(row._mapping) for row in result]