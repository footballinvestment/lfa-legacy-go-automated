# app/cache_redis.py
import redis
import json
import pickle
import logging
from typing import Optional, Any, Union
from datetime import timedelta
import os

logger = logging.getLogger(__name__)

class RedisManager:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=int(os.getenv("REDIS_DB", 0)),
            password=os.getenv("REDIS_PASSWORD", None),
            decode_responses=False,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True
        )
    
    def set(self, key: str, value: Any, expire: Optional[int] = 3600) -> bool:
        """Set value in Redis with expiration"""
        try:
            serialized_value = pickle.dumps(value)
            return self.redis_client.set(key, serialized_value, ex=expire)
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        try:
            value = self.redis_client.get(key)
            if value is None:
                return None
            return pickle.loads(value)
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Delete key from Redis"""
        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists in Redis"""
        try:
            return bool(self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"Redis EXISTS error for key {key}: {e}")
            return False
    
    def flush_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis FLUSH_PATTERN error for {pattern}: {e}")
            return 0
    
    def health_check(self) -> dict:
        """Redis health check"""
        try:
            ping_result = self.redis_client.ping()
            memory_info = self.redis_client.info('memory')
            return {
                "status": "healthy" if ping_result else "unhealthy",
                "ping": ping_result,
                "used_memory": memory_info.get('used_memory_human'),
                "connected_clients": self.redis_client.info('clients')['connected_clients']
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

# Global instance
redis_manager = RedisManager()

# Cache decorator
def cache_result(key_prefix: str, expire: int = 3600):
    """Decorator to cache function results"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{hash(str(args) + str(kwargs))}"
            
            # Try to get cached result
            cached_result = redis_manager.get(cache_key)
            if cached_result is not None:
                logger.info(f"Cache HIT for {cache_key}")
                return cached_result
            
            # Execute function and cache result
            logger.info(f"Cache MISS for {cache_key}")
            result = func(*args, **kwargs)
            redis_manager.set(cache_key, result, expire)
            
            return result
        return wrapper
    return decorator