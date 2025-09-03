"""
Background Cache Warming System
Proactive cache population and maintenance
"""

import asyncio
import time
import schedule
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable
from concurrent.futures import ThreadPoolExecutor, Future
import logging
from dataclasses import dataclass, field
from enum import Enum

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database_production import db_config
from app.core.smart_cache import UserCache, GameCache, LocationCache, smart_cache
from app.core.query_cache import advanced_query_cache, get_user_count, get_active_users

logger = logging.getLogger(__name__)


class WarmingPriority(Enum):
    """Cache warming priority levels"""
    CRITICAL = "critical"    # Most important caches (user auth, etc.)
    HIGH = "high"           # Frequently accessed data
    NORMAL = "normal"       # Regular background warming
    LOW = "low"             # Nice-to-have caches


@dataclass
class WarmingTask:
    """Cache warming task definition"""
    name: str
    function: Callable
    priority: WarmingPriority
    ttl: int = 300
    interval_minutes: int = 30
    max_execution_time: int = 60
    dependencies: List[str] = field(default_factory=list)
    last_run: Optional[datetime] = None
    run_count: int = 0
    success_count: int = 0
    avg_duration: float = 0.0
    
    @property
    def success_rate(self) -> float:
        return self.success_count / self.run_count if self.run_count > 0 else 0.0


class CacheWarmingManager:
    """Advanced cache warming and maintenance system"""
    
    def __init__(self):
        self.tasks: Dict[str, WarmingTask] = {}
        self.executor = ThreadPoolExecutor(max_workers=6, thread_name_prefix="warmer_")
        self.running_tasks: Dict[str, Future] = {}
        self.is_running = False
        self.stats = {
            "total_warmings": 0,
            "successful_warmings": 0,
            "failed_warmings": 0,
            "total_duration": 0.0,
            "last_warming_cycle": None
        }
        
        # Register default warming tasks
        self._register_default_tasks()
    
    def _register_default_tasks(self):
        """Register default cache warming tasks"""
        
        # Critical: User authentication data
        self.register_task(
            "warm_active_users",
            self._warm_active_users,
            WarmingPriority.CRITICAL,
            ttl=600,  # 10 minutes
            interval_minutes=15
        )
        
        # High: Frequently accessed locations
        self.register_task(
            "warm_locations",
            self._warm_locations,
            WarmingPriority.HIGH,
            ttl=1800,  # 30 minutes  
            interval_minutes=60
        )
        
        # Normal: Tournament data
        self.register_task(
            "warm_tournaments",
            self._warm_tournaments,
            WarmingPriority.NORMAL,
            ttl=900,  # 15 minutes
            interval_minutes=45
        )
        
        # Normal: System statistics
        self.register_task(
            "warm_statistics",
            self._warm_statistics,
            WarmingPriority.NORMAL,
            ttl=300,  # 5 minutes
            interval_minutes=30
        )
        
        # Low: Game session history
        self.register_task(
            "warm_recent_games",
            self._warm_recent_games,
            WarmingPriority.LOW,
            ttl=1200,  # 20 minutes
            interval_minutes=90
        )
    
    def register_task(
        self,
        name: str,
        function: Callable,
        priority: WarmingPriority,
        ttl: int = 300,
        interval_minutes: int = 30,
        dependencies: List[str] = None
    ):
        """Register a cache warming task"""
        
        task = WarmingTask(
            name=name,
            function=function,
            priority=priority,
            ttl=ttl,
            interval_minutes=interval_minutes,
            dependencies=dependencies or []
        )
        
        self.tasks[name] = task
        logger.info(f"Registered warming task: {name} ({priority.value} priority)")
    
    async def start_background_warming(self):
        """Start background cache warming scheduler"""
        self.is_running = True
        logger.info("🔥 Starting background cache warming system")
        
        # Schedule tasks based on priority
        for task_name, task in self.tasks.items():
            if task.priority == WarmingPriority.CRITICAL:
                schedule.every(max(5, task.interval_minutes)).minutes.do(self._run_task_sync, task_name)
            elif task.priority == WarmingPriority.HIGH:
                schedule.every(task.interval_minutes).minutes.do(self._run_task_sync, task_name)
            else:
                schedule.every(task.interval_minutes).minutes.do(self._run_task_sync, task_name)
        
        # Run initial warming
        await self.run_full_warming_cycle()
        
        # Background scheduler loop
        while self.is_running:
            schedule.run_pending()
            await asyncio.sleep(30)  # Check every 30 seconds
    
    def _run_task_sync(self, task_name: str):
        """Synchronous wrapper for scheduler"""
        asyncio.create_task(self.run_task(task_name))
    
    async def run_task(self, task_name: str) -> bool:
        """Run a specific warming task"""
        if task_name not in self.tasks:
            logger.error(f"Unknown warming task: {task_name}")
            return False
        
        task = self.tasks[task_name]
        
        # Check if already running
        if task_name in self.running_tasks and not self.running_tasks[task_name].done():
            logger.debug(f"Task {task_name} already running, skipping")
            return False
        
        # Check dependencies
        for dep in task.dependencies:
            dep_task = self.tasks.get(dep)
            if dep_task and not dep_task.last_run:
                logger.debug(f"Task {task_name} waiting for dependency: {dep}")
                return False
        
        # Submit task
        future = self.executor.submit(self._execute_task, task)
        self.running_tasks[task_name] = future
        
        logger.debug(f"Started warming task: {task_name}")
        return True
    
    def _execute_task(self, task: WarmingTask) -> Dict[str, Any]:
        """Execute a warming task"""
        start_time = time.time()
        
        try:
            # Execute the warming function
            with db_config.get_session() as db:
                result = task.function(db)
            
            duration = time.time() - start_time
            
            # Update task statistics
            task.run_count += 1
            task.success_count += 1
            task.last_run = datetime.utcnow()
            task.avg_duration = (task.avg_duration * (task.run_count - 1) + duration) / task.run_count
            
            # Update global stats
            self.stats["total_warmings"] += 1
            self.stats["successful_warmings"] += 1
            self.stats["total_duration"] += duration
            
            logger.info(f"✅ Warming task '{task.name}' completed in {duration:.2f}s")
            
            return {
                "success": True,
                "duration": duration,
                "result": result
            }
            
        except Exception as e:
            duration = time.time() - start_time
            
            task.run_count += 1
            task.avg_duration = (task.avg_duration * (task.run_count - 1) + duration) / task.run_count
            
            self.stats["total_warmings"] += 1
            self.stats["failed_warmings"] += 1
            
            logger.error(f"❌ Warming task '{task.name}' failed: {e}")
            
            return {
                "success": False,
                "duration": duration,
                "error": str(e)
            }
    
    async def run_full_warming_cycle(self) -> Dict[str, Any]:
        """Run a complete warming cycle for all tasks"""
        logger.info("🔥 Starting full cache warming cycle")
        
        start_time = time.time()
        results = {}
        
        # Sort tasks by priority
        priority_order = [WarmingPriority.CRITICAL, WarmingPriority.HIGH, WarmingPriority.NORMAL, WarmingPriority.LOW]
        
        for priority in priority_order:
            priority_tasks = [name for name, task in self.tasks.items() if task.priority == priority]
            
            if priority_tasks:
                logger.info(f"Warming {priority.value} priority tasks: {', '.join(priority_tasks)}")
                
                # Run priority tasks in parallel
                futures = []
                for task_name in priority_tasks:
                    future = await self.run_task(task_name)
                    if future:
                        futures.append(task_name)
                
                # Wait for completion with timeout
                await asyncio.sleep(5)  # Brief wait for completion
        
        cycle_duration = time.time() - start_time
        self.stats["last_warming_cycle"] = datetime.utcnow().isoformat()
        
        logger.info(f"🎯 Full warming cycle completed in {cycle_duration:.2f}s")
        
        return {
            "cycle_duration": cycle_duration,
            "tasks_executed": len(results),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Warming task implementations
    def _warm_active_users(self, db: Session) -> int:
        """Warm active users cache"""
        from sqlalchemy import text
        
        users = db.execute(text("SELECT * FROM users WHERE is_active = true LIMIT 50")).fetchall()
        
        warmed = 0
        for user in users:
            user_data = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": getattr(user, "full_name", user.username),
                "is_active": user.is_active,
                "created_at": str(user.created_at) if user.created_at else None,
                "cached_at": datetime.utcnow().isoformat()
            }
            
            if UserCache.set_user(user.id, user_data, ttl=600):
                warmed += 1
        
        logger.debug(f"Warmed {warmed} active user caches")
        return warmed
    
    def _warm_locations(self, db: Session) -> int:
        """Warm locations cache"""
        from sqlalchemy import text
        
        locations = db.execute(text("SELECT * FROM locations")).fetchall()
        
        locations_data = []
        for location in locations:
            location_data = {
                "id": location.id,
                "name": location.name,
                "address": getattr(location, "address", ""),
                "latitude": getattr(location, "latitude", None),
                "longitude": getattr(location, "longitude", None),
                "created_at": str(location.created_at) if location.created_at else None
            }
            locations_data.append(location_data)
        
        LocationCache.set_locations(locations_data, ttl=1800)
        
        logger.debug(f"Warmed {len(locations_data)} location caches")
        return len(locations_data)
    
    def _warm_tournaments(self, db: Session) -> int:
        """Warm tournament caches"""
        from sqlalchemy import text
        
        tournaments = db.execute(
            text("SELECT * FROM tournaments WHERE start_time > NOW() - INTERVAL '30 days' LIMIT 20")
        ).fetchall()
        
        warmed = 0
        for tournament in tournaments:
            tournament_data = {
                "id": tournament.id,
                "name": tournament.name,
                "description": getattr(tournament, "description", ""),
                "start_time": str(tournament.start_time) if tournament.start_time else None,
                "max_participants": getattr(tournament, "max_participants", 0),
                "status": getattr(tournament, "status", "unknown")
            }
            
            if GameCache.set_tournament(tournament.id, tournament_data, ttl=900):
                warmed += 1
        
        logger.debug(f"Warmed {warmed} tournament caches")
        return warmed
    
    def _warm_statistics(self, db: Session) -> int:
        """Warm system statistics cache"""
        from sqlalchemy import text
        
        # Cache key statistics
        stats = {
            "user_count": get_user_count(db),
            "tournament_count": db.execute(text("SELECT COUNT(*) FROM tournaments")).fetchone()[0],
            "game_session_count": db.execute(text("SELECT COUNT(*) FROM game_sessions")).fetchone()[0],
            "location_count": db.execute(text("SELECT COUNT(*) FROM locations")).fetchone()[0],
            "generated_at": datetime.utcnow().isoformat()
        }
        
        smart_cache.set("system_stats", stats, ttl=300, prefix="stats:")
        
        logger.debug("Warmed system statistics cache")
        return 1
    
    def _warm_recent_games(self, db: Session) -> int:
        """Warm recent game sessions cache"""
        from sqlalchemy import text
        
        sessions = db.execute(
            text("SELECT * FROM game_sessions WHERE created_at > NOW() - INTERVAL '7 days' LIMIT 30")
        ).fetchall()
        
        warmed = 0
        for session in sessions:
            session_data = {
                "id": session.id,
                "location_id": getattr(session, "location_id", None),
                "status": getattr(session, "status", "unknown"),
                "created_at": str(session.created_at) if session.created_at else None,
                "players": getattr(session, "players", [])
            }
            
            if GameCache.set_game_session(str(session.id), session_data, ttl=1200):
                warmed += 1
        
        logger.debug(f"Warmed {warmed} recent game session caches")
        return warmed
    
    def get_warming_stats(self) -> Dict[str, Any]:
        """Get comprehensive warming statistics"""
        task_stats = {}
        
        for name, task in self.tasks.items():
            task_stats[name] = {
                "priority": task.priority.value,
                "run_count": task.run_count,
                "success_count": task.success_count,
                "success_rate": f"{task.success_rate:.2%}",
                "avg_duration": f"{task.avg_duration:.2f}s",
                "last_run": task.last_run.isoformat() if task.last_run else None,
                "interval_minutes": task.interval_minutes
            }
        
        return {
            "global_stats": self.stats,
            "task_stats": task_stats,
            "active_tasks": len([f for f in self.running_tasks.values() if not f.done()]),
            "is_running": self.is_running,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def stop(self):
        """Stop the warming manager"""
        self.is_running = False
        self.executor.shutdown(wait=True)
        schedule.clear()
        logger.info("🔥 Cache warming system stopped")


# Global warming manager
cache_warming_manager = CacheWarmingManager()


# Async startup function
async def start_cache_warming():
    """Start cache warming system"""
    try:
        await cache_warming_manager.start_background_warming()
    except Exception as e:
        logger.error(f"Failed to start cache warming: {e}")


# Manual warming functions for API endpoints
def manual_warm_critical_caches(db: Session) -> Dict[str, Any]:
    """Manually warm critical caches"""
    results = {}
    
    critical_tasks = [name for name, task in cache_warming_manager.tasks.items() 
                     if task.priority == WarmingPriority.CRITICAL]
    
    for task_name in critical_tasks:
        try:
            task = cache_warming_manager.tasks[task_name]
            result = task.function(db)
            results[task_name] = {"success": True, "count": result}
        except Exception as e:
            results[task_name] = {"success": False, "error": str(e)}
    
    return results