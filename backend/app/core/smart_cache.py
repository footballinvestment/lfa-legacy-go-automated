"""
Smart Caching Layer for LFA Legacy GO
Implements intelligent caching with automatic invalidation
"""

import json
import pickle
import hashlib
from datetime import datetime, timedelta
from typing import Any, Optional, Dict, List, Callable, Union
from functools import wraps
import asyncio
import logging

from app.core.database_production import get_redis
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SmartCache:
    """Intelligent caching layer with automatic invalidation"""
    
    def __init__(self):
        self.redis_client = get_redis()
        self.default_ttl = 300  # 5 minutes default
        self.key_prefix = "lfa_cache:"
        
    def _generate_key(self, key: str, prefix: str = None) -> str:
        """Generate cache key with prefix"""
        prefix = prefix or self.key_prefix
        return f"{prefix}{key}"
    
    def _serialize_data(self, data: Any) -> bytes:
        """Serialize data for Redis storage"""
        if isinstance(data, (dict, list)):
            return json.dumps(data, default=str).encode('utf-8')
        elif isinstance(data, str):
            return data.encode('utf-8')
        else:
            return pickle.dumps(data)
    
    def _deserialize_data(self, data: Union[bytes, str]) -> Any:
        """Deserialize data from Redis"""
        if isinstance(data, str):
            # Redis sometimes returns strings directly  
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                return data
        
        try:
            return json.loads(data.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            try:
                return pickle.loads(data)
            except:
                return data.decode('utf-8') if isinstance(data, bytes) else data
    
    def set(self, key: str, value: Any, ttl: int = None, prefix: str = None) -> bool:
        """Set cache value with TTL"""
        if not self.redis_client:
            return False
            
        try:
            cache_key = self._generate_key(key, prefix)
            serialized_data = self._serialize_data(value)
            ttl = ttl or self.default_ttl
            
            self.redis_client.setex(cache_key, ttl, serialized_data)
            
            # Store metadata
            metadata = {
                "created_at": datetime.utcnow().isoformat(),
                "ttl": ttl,
                "data_type": type(value).__name__
            }
            
            meta_key = f"{cache_key}:meta"
            self.redis_client.setex(meta_key, ttl + 60, json.dumps(metadata))
            
            logger.debug(f"Cache SET: {cache_key} (TTL: {ttl}s)")
            return True
            
        except Exception as e:
            logger.error(f"Cache SET failed for key {key}: {e}")
            return False
    
    def get(self, key: str, prefix: str = None) -> Optional[Any]:
        """Get cache value"""
        if not self.redis_client:
            return None
            
        try:
            cache_key = self._generate_key(key, prefix)
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data is None:
                logger.debug(f"Cache MISS: {cache_key}")
                return None
            
            logger.debug(f"Cache HIT: {cache_key}")
            return self._deserialize_data(cached_data)
            
        except Exception as e:
            logger.error(f"Cache GET failed for key {key}: {e}")
            return None
    
    def delete(self, key: str, prefix: str = None) -> bool:
        """Delete cache key"""
        if not self.redis_client:
            return False
            
        try:
            cache_key = self._generate_key(key, prefix)
            deleted = self.redis_client.delete(cache_key)
            
            # Also delete metadata
            meta_key = f"{cache_key}:meta"
            self.redis_client.delete(meta_key)
            
            logger.debug(f"Cache DELETE: {cache_key}")
            return bool(deleted)
            
        except Exception as e:
            logger.error(f"Cache DELETE failed for key {key}: {e}")
            return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""
        if not self.redis_client:
            return 0
            
        try:
            pattern_key = self._generate_key(pattern)
            keys = self.redis_client.keys(pattern_key)
            
            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(f"Cache INVALIDATE pattern {pattern}: {deleted} keys deleted")
                return deleted
            
            return 0
            
        except Exception as e:
            logger.error(f"Cache INVALIDATE pattern failed for {pattern}: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if not self.redis_client:
            return {"status": "disabled"}
            
        try:
            info = self.redis_client.info()
            
            # Get cache keys count
            cache_keys = self.redis_client.keys(f"{self.key_prefix}*")
            
            return {
                "status": "active",
                "total_keys": len(cache_keys),
                "memory_used": info.get("used_memory_human", "unknown"),
                "hit_rate": info.get("keyspace_hits", 0) / max(1, 
                    info.get("keyspace_hits", 0) + info.get("keyspace_misses", 0)),
                "connected_clients": info.get("connected_clients", 0),
                "uptime_seconds": info.get("uptime_in_seconds", 0)
            }
            
        except Exception as e:
            logger.error(f"Cache stats failed: {e}")
            return {"status": "error", "error": str(e)}


# Global cache instance
smart_cache = SmartCache()


def cached(ttl: int = 300, key_func: Callable = None, invalidate_on: List[str] = None):
    """
    Decorator for caching function results
    
    Args:
        ttl: Time to live in seconds
        key_func: Function to generate cache key 
        invalidate_on: List of patterns that invalidate this cache
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Default key generation
                key_parts = [func.__name__]
                
                # Add positional args (except 'self' and 'cls')
                for arg in args:
                    if not (hasattr(arg, '__dict__') and 
                           (arg.__class__.__name__ in ['Session', 'Connection'])):
                        key_parts.append(str(arg))
                
                # Add keyword args
                for k, v in sorted(kwargs.items()):
                    key_parts.append(f"{k}:{v}")
                
                cache_key = hashlib.md5(":".join(key_parts).encode()).hexdigest()
            
            # Try to get from cache
            cached_result = smart_cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            smart_cache.set(cache_key, result, ttl)
            
            return result
        
        # Add cache management methods to function
        wrapper.cache_invalidate = lambda: smart_cache.delete(cache_key)
        wrapper.cache_key = lambda *args, **kwargs: cache_key
        
        return wrapper
    return decorator


class UserCache:
    """Specialized caching for user data"""
    
    @staticmethod
    def get_user(user_id: int) -> Optional[Dict]:
        """Get cached user data"""
        return smart_cache.get(f"user:{user_id}", prefix="users:")
    
    @staticmethod  
    def set_user(user_id: int, user_data: Dict, ttl: int = 600):
        """Cache user data for 10 minutes"""
        return smart_cache.set(f"user:{user_id}", user_data, ttl, prefix="users:")
    
    @staticmethod
    def invalidate_user(user_id: int):
        """Invalidate specific user cache"""
        return smart_cache.delete(f"user:{user_id}", prefix="users:")
    
    @staticmethod
    def invalidate_all_users():
        """Invalidate all user caches"""
        return smart_cache.invalidate_pattern("users:*")


class GameCache:
    """Specialized caching for game data"""
    
    @staticmethod
    def get_game_session(session_id: str) -> Optional[Dict]:
        """Get cached game session"""
        return smart_cache.get(f"session:{session_id}", prefix="games:")
    
    @staticmethod
    def set_game_session(session_id: str, session_data: Dict, ttl: int = 300):
        """Cache game session for 5 minutes"""
        return smart_cache.set(f"session:{session_id}", session_data, ttl, prefix="games:")
    
    @staticmethod
    def get_tournament(tournament_id: int) -> Optional[Dict]:
        """Get cached tournament data"""
        return smart_cache.get(f"tournament:{tournament_id}", prefix="tournaments:")
    
    @staticmethod
    def set_tournament(tournament_id: int, tournament_data: Dict, ttl: int = 900):
        """Cache tournament for 15 minutes"""
        return smart_cache.set(f"tournament:{tournament_id}", tournament_data, ttl, prefix="tournaments:")


class LocationCache:
    """Specialized caching for location data"""
    
    @staticmethod
    def get_locations() -> Optional[List[Dict]]:
        """Get all cached locations"""
        return smart_cache.get("all_locations", prefix="locations:")
    
    @staticmethod
    def set_locations(locations_data: List[Dict], ttl: int = 1800):
        """Cache all locations for 30 minutes"""
        return smart_cache.set("all_locations", locations_data, ttl, prefix="locations:")
    
    @staticmethod
    def get_location(location_id: int) -> Optional[Dict]:
        """Get specific cached location"""
        return smart_cache.get(f"location:{location_id}", prefix="locations:")
    
    @staticmethod
    def set_location(location_id: int, location_data: Dict, ttl: int = 1800):
        """Cache specific location for 30 minutes"""
        return smart_cache.set(f"location:{location_id}", location_data, ttl, prefix="locations:")


# Cache warming functions
def warm_essential_caches(db):
    """Warm up essential caches with frequently accessed data"""
    from sqlalchemy import text
    
    logger.info("🔥 Warming essential caches...")
    
    try:
        # Warm user cache with active users
        users_query = text("SELECT * FROM users WHERE is_active = true LIMIT 100")
        result = db.execute(users_query)
        users = [dict(row._mapping) for row in result]
        
        for user in users:
            UserCache.set_user(user['id'], user, ttl=1800)  # 30 min
        
        logger.info(f"✅ Warmed {len(users)} user caches")
        
        # Warm location cache
        locations_query = text("SELECT * FROM locations")
        result = db.execute(locations_query)
        locations = [dict(row._mapping) for row in result]
        
        LocationCache.set_locations(locations, ttl=3600)  # 1 hour
        logger.info(f"✅ Warmed {len(locations)} location caches")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Cache warming failed: {e}")
        return False


# Performance monitoring
def monitor_cache_performance():
    """Monitor and log cache performance metrics"""
    stats = smart_cache.get_stats()
    
    logger.info("📊 Cache Performance:")
    logger.info(f"  Status: {stats.get('status', 'unknown')}")
    logger.info(f"  Total keys: {stats.get('total_keys', 0)}")
    logger.info(f"  Memory used: {stats.get('memory_used', 'unknown')}")
    logger.info(f"  Hit rate: {stats.get('hit_rate', 0):.2%}")
    
    return stats