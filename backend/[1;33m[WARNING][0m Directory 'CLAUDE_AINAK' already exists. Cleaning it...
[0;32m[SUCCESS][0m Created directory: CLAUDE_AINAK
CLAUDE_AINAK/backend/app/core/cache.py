"""
Redis caching implementation for LFA Legacy GO
"""

import json
import pickle
from typing import Any, Optional, Dict, List, Union
from functools import wraps
import hashlib
import redis
from redis.connection import ConnectionPool
from app.core.config import settings
from app.core.logging import get_logger
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = get_logger("cache")


class RedisCache:
    """Redis caching service with connection pooling"""

    def __init__(self):
        self.pool: Optional[ConnectionPool] = None
        self.client: Optional[redis.Redis] = None
        self._executor = ThreadPoolExecutor(max_workers=4)
        self._connected = False

    def connect(self):
        """Initialize Redis connection with pooling"""
        try:
            self.pool = ConnectionPool(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=0,
                max_connections=20,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30,
            )

            self.client = redis.Redis(connection_pool=self.pool)

            # Test connection
            self.client.ping()
            self._connected = True
            logger.info(
                f"✅ Redis connected: {settings.REDIS_HOST}:{settings.REDIS_PORT}"
            )

        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e}")
            self._connected = False

    def is_connected(self) -> bool:
        """Check if Redis is connected and available"""
        if not self._connected or not self.client:
            return False

        try:
            self.client.ping()
            return True
        except Exception:
            self._connected = False
            return False

    def _generate_key(self, key: str, prefix: str = "lfa") -> str:
        """Generate a namespaced cache key"""
        return f"{prefix}:{key}"

    def get(self, key: str, default: Any = None) -> Any:
        """Get value from cache"""
        if not self.is_connected():
            return default

        try:
            cached_key = self._generate_key(key)
            value = self.client.get(cached_key)

            if value is None:
                return default

            # Try JSON first, fallback to pickle
            try:
                return json.loads(value.decode("utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError):
                return pickle.loads(value)

        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return default

    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set value in cache with TTL in seconds"""
        if not self.is_connected():
            return False

        try:
            cached_key = self._generate_key(key)

            # Try JSON first, fallback to pickle
            try:
                serialized = json.dumps(value, default=str)
            except (TypeError, ValueError):
                serialized = pickle.dumps(value)

            result = self.client.setex(cached_key, ttl, serialized)
            return bool(result)

        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.is_connected():
            return False

        try:
            cached_key = self._generate_key(key)
            result = self.client.delete(cached_key)
            return result > 0

        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False

    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.is_connected():
            return 0

        try:
            pattern_key = self._generate_key(pattern)
            keys = self.client.keys(pattern_key)
            if keys:
                return self.client.delete(*keys)
            return 0

        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            return 0

    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        if not self.is_connected():
            return False

        try:
            cached_key = self._generate_key(key)
            return bool(self.client.exists(cached_key))

        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if not self.is_connected():
            return {"connected": False, "error": "Not connected"}

        try:
            info = self.client.info()
            return {
                "connected": True,
                "used_memory": info.get("used_memory_human", "Unknown"),
                "connected_clients": info.get("connected_clients", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "hit_rate": self._calculate_hit_rate(
                    info.get("keyspace_hits", 0), info.get("keyspace_misses", 0)
                ),
            }

        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {"connected": False, "error": str(e)}

    def _calculate_hit_rate(self, hits: int, misses: int) -> float:
        """Calculate cache hit rate percentage"""
        total = hits + misses
        if total == 0:
            return 0.0
        return round((hits / total) * 100, 2)

    async def get_async(self, key: str, default: Any = None) -> Any:
        """Async version of get"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, self.get, key, default)

    async def set_async(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Async version of set"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, self.set, key, value, ttl)


# Global cache instance
cache = RedisCache()


def cache_key(*args, **kwargs) -> str:
    """Generate cache key from function arguments"""
    key_parts = []

    # Add positional arguments
    for arg in args:
        if hasattr(arg, "id"):
            key_parts.append(f"{type(arg).__name__}_{arg.id}")
        else:
            key_parts.append(str(arg))

    # Add keyword arguments
    for k, v in sorted(kwargs.items()):
        key_parts.append(f"{k}_{v}")

    # Hash long keys
    key_string = "_".join(key_parts)
    if len(key_string) > 200:
        return hashlib.md5(key_string.encode()).hexdigest()

    return key_string


def cached(ttl: int = 3600, key_func: Optional[callable] = None):
    """Decorator to cache function results"""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                key = key_func(*args, **kwargs)
            else:
                func_name = f"{func.__module__}.{func.__name__}"
                key = f"{func_name}_{cache_key(*args, **kwargs)}"

            # Try to get from cache
            result = cache.get(key)
            if result is not None:
                logger.debug(f"Cache hit for {func.__name__}: {key}")
                return result

            # Execute function and cache result
            logger.debug(f"Cache miss for {func.__name__}: {key}")
            result = func(*args, **kwargs)
            cache.set(key, result, ttl)

            return result

        # Add cache management methods
        wrapper._cache_clear = lambda *args, **kwargs: cache.delete(
            key_func(*args, **kwargs)
            if key_func
            else f"{func.__module__}.{func.__name__}_{cache_key(*args, **kwargs)}"
        )

        return wrapper

    return decorator


def cached_async(ttl: int = 3600, key_func: Optional[callable] = None):
    """Async version of cached decorator"""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                key = key_func(*args, **kwargs)
            else:
                func_name = f"{func.__module__}.{func.__name__}"
                key = f"{func_name}_{cache_key(*args, **kwargs)}"

            # Try to get from cache
            result = await cache.get_async(key)
            if result is not None:
                logger.debug(f"Cache hit for {func.__name__}: {key}")
                return result

            # Execute function and cache result
            logger.debug(f"Cache miss for {func.__name__}: {key}")
            result = await func(*args, **kwargs)
            await cache.set_async(key, result, ttl)

            return result

        return wrapper

    return decorator


# Cache warm-up functions
def warm_up_cache():
    """Pre-populate cache with common data"""
    logger.info("🔥 Warming up cache...")

    # This would be implemented based on your most common queries
    # For example:
    # - Popular tournaments
    # - User statistics
    # - Location data
    # - Weather data

    logger.info("✅ Cache warm-up complete")


# Initialize cache connection
def init_cache():
    """Initialize cache connection"""
    cache.connect()
    if cache.is_connected():
        warm_up_cache()
    return cache
