"""
Advanced Cache Management & Analytics Router
Enterprise-grade cache monitoring and management
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
import asyncio

from app.core.database_production import get_db
from app.core.smart_cache import smart_cache, UserCache, GameCache, LocationCache
from app.core.query_cache import AdvancedQueryCache
from app.core.cache_warming import cache_warming_manager, manual_warm_critical_caches
from app.core.api_response import ResponseBuilder
# Simple auth dependency - replace with proper authentication
def simple_auth():
    """Simple authentication placeholder"""
    pass

router = APIRouter(prefix="/api/advanced-cache", tags=["Advanced Cache Management"])
logger = logging.getLogger(__name__)

# Initialize advanced query cache
advanced_query_cache = AdvancedQueryCache()


@router.get("/analytics/overview")
async def get_cache_analytics_overview(current_user: dict = Depends(simple_auth)):
    """Get comprehensive cache analytics overview"""
    
    try:
        # Basic Redis stats
        redis_stats = smart_cache.get_stats()
        
        # Query cache metrics
        query_metrics = advanced_query_cache.get_query_metrics()
        
        # Warming system stats
        warming_stats = cache_warming_manager.get_warming_stats()
        
        # Calculate derived metrics
        total_cache_keys = redis_stats.get("total_keys", 0)
        query_cache_keys = len(query_metrics)
        
        # Performance summary
        performance_summary = {
            "total_queries_cached": sum(m.get("execution_count", 0) for m in query_metrics.values()),
            "total_cache_hits": sum(m.get("cache_hits", 0) for m in query_metrics.values()),
            "total_cache_misses": sum(m.get("cache_misses", 0) for m in query_metrics.values()),
            "average_speedup": _calculate_average_speedup(query_metrics)
        }
        
        overall_hit_rate = (
            performance_summary["total_cache_hits"] / 
            max(1, performance_summary["total_cache_hits"] + performance_summary["total_cache_misses"])
        )
        
        analytics_data = {
            "overview": {
                "status": "operational",
                "cache_engine": "Redis + Advanced Query Cache",
                "total_cache_keys": total_cache_keys,
                "query_cache_keys": query_cache_keys,
                "overall_hit_rate": f"{overall_hit_rate:.2%}",
                "memory_used": redis_stats.get("memory_used", "unknown"),
                "uptime_seconds": redis_stats.get("uptime_seconds", 0)
            },
            "performance_summary": performance_summary,
            "redis_stats": redis_stats,
            "query_metrics_summary": {
                "active_queries": len(query_metrics),
                "top_performing_queries": _get_top_queries(query_metrics, "speedup_factor", 5),
                "most_used_queries": _get_top_queries(query_metrics, "execution_count", 5)
            },
            "warming_system": {
                "is_running": warming_stats["is_running"],
                "total_warmings": warming_stats["global_stats"]["total_warmings"],
                "success_rate": (
                    warming_stats["global_stats"]["successful_warmings"] /
                    max(1, warming_stats["global_stats"]["total_warmings"])
                ),
                "active_tasks": warming_stats["active_tasks"],
                "last_cycle": warming_stats["global_stats"]["last_warming_cycle"]
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return ResponseBuilder.success(
            data=analytics_data,
            message="Cache analytics overview retrieved"
        )
        
    except Exception as e:
        logger.error(f"Failed to get cache analytics: {e}")
        return ResponseBuilder.error(
            error_code="ANALYTICS_FAILED",
            error_message=f"Failed to retrieve cache analytics: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/analytics/query-metrics")
async def get_detailed_query_metrics(current_user: dict = Depends(simple_auth)):
    """Get detailed query cache performance metrics"""
    
    query_metrics = advanced_query_cache.get_query_metrics()
    
    # Enrich with additional analysis
    enriched_metrics = {}
    for query_hash, metrics in query_metrics.items():
        enriched_metrics[query_hash] = {
            **metrics,
            "performance_grade": _grade_query_performance(metrics),
            "optimization_suggestions": _get_optimization_suggestions(metrics)
        }
    
    return ResponseBuilder.success(
        data={
            "query_metrics": enriched_metrics,
            "total_queries": len(query_metrics),
            "summary": {
                "excellent_queries": sum(1 for m in enriched_metrics.values() if m["performance_grade"] == "A"),
                "good_queries": sum(1 for m in enriched_metrics.values() if m["performance_grade"] == "B"),
                "needs_improvement": sum(1 for m in enriched_metrics.values() if m["performance_grade"] in ["C", "D"])
            }
        },
        message="Detailed query metrics retrieved"
    )


@router.get("/analytics/warming-status")
async def get_warming_system_status(current_user: dict = Depends(simple_auth)):
    """Get detailed cache warming system status"""
    
    warming_stats = cache_warming_manager.get_warming_stats()
    
    return ResponseBuilder.success(
        data=warming_stats,
        message="Cache warming system status retrieved"
    )


@router.post("/management/warm-critical")
async def manual_warm_critical(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(simple_auth)
):
    """Manually trigger critical cache warming"""
    
    try:
        # Run critical warming in background
        background_tasks.add_task(manual_warm_critical_caches, db)
        
        return ResponseBuilder.success(
            data={"status": "warming_initiated"},
            message="Critical cache warming initiated in background"
        )
        
    except Exception as e:
        logger.error(f"Manual warming failed: {e}")
        return ResponseBuilder.error(
            error_code="WARMING_FAILED",
            error_message=f"Manual warming failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.post("/management/warm-full-cycle")
async def trigger_full_warming_cycle(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(simple_auth)
):
    """Trigger a complete cache warming cycle"""
    
    # Check admin permissions
    if not current_user.get("username") == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Schedule full warming cycle in background
        background_tasks.add_task(_run_full_warming_cycle)
        
        return ResponseBuilder.success(
            data={"status": "full_warming_cycle_initiated"},
            message="Full cache warming cycle initiated in background"
        )
        
    except Exception as e:
        logger.error(f"Full warming cycle failed: {e}")
        return ResponseBuilder.error(
            error_code="FULL_WARMING_FAILED",
            error_message=f"Full warming cycle failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.delete("/management/invalidate-pattern")
async def invalidate_cache_pattern(
    pattern: str,
    current_user: dict = Depends(simple_auth)
):
    """Invalidate caches matching a pattern"""
    
    # Check admin permissions for broad invalidation
    if not current_user.get("username") == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        deleted_keys = smart_cache.invalidate_pattern(pattern)
        
        return ResponseBuilder.success(
            data={
                "pattern": pattern,
                "deleted_keys": deleted_keys
            },
            message=f"Invalidated {deleted_keys} cache keys matching pattern: {pattern}"
        )
        
    except Exception as e:
        logger.error(f"Pattern invalidation failed: {e}")
        return ResponseBuilder.error(
            error_code="INVALIDATION_FAILED",
            error_message=f"Pattern invalidation failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.delete("/management/invalidate-table")
async def invalidate_table_caches(
    table_name: str,
    current_user: dict = Depends(simple_auth)
):
    """Invalidate all caches dependent on a specific table"""
    
    try:
        advanced_query_cache.invalidate_table_caches(table_name)
        
        return ResponseBuilder.success(
            data={"table_name": table_name},
            message=f"Invalidated all caches dependent on table: {table_name}"
        )
        
    except Exception as e:
        logger.error(f"Table cache invalidation failed: {e}")
        return ResponseBuilder.error(
            error_code="TABLE_INVALIDATION_FAILED",
            error_message=f"Table cache invalidation failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/performance/benchmark")
async def run_performance_benchmark(
    iterations: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(simple_auth)
):
    """Run comprehensive cache performance benchmark"""
    
    try:
        benchmark_results = await _run_comprehensive_benchmark(db, iterations)
        
        return ResponseBuilder.success(
            data=benchmark_results,
            message=f"Performance benchmark completed ({iterations} iterations)"
        )
        
    except Exception as e:
        logger.error(f"Benchmark failed: {e}")
        return ResponseBuilder.error(
            error_code="BENCHMARK_FAILED",
            error_message=f"Performance benchmark failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/health/comprehensive")
async def comprehensive_cache_health_check(
    db: Session = Depends(get_db),
    current_user: dict = Depends(simple_auth)
):
    """Comprehensive cache system health check"""
    
    health_results = {
        "timestamp": datetime.utcnow().isoformat(),
        "overall_status": "unknown",
        "components": {}
    }
    
    try:
        # Test Redis connectivity
        redis_health = _test_redis_health()
        health_results["components"]["redis"] = redis_health
        
        # Test query cache functionality
        query_cache_health = _test_query_cache_health(db)
        health_results["components"]["query_cache"] = query_cache_health
        
        # Test warming system
        warming_health = _test_warming_system_health()
        health_results["components"]["warming_system"] = warming_health
        
        # Test cache performance
        performance_health = await _test_cache_performance_health(db)
        health_results["components"]["performance"] = performance_health
        
        # Determine overall status
        all_healthy = all(
            component["status"] == "healthy" 
            for component in health_results["components"].values()
        )
        
        health_results["overall_status"] = "healthy" if all_healthy else "degraded"
        
        return ResponseBuilder.success(
            data=health_results,
            message=f"Cache health check completed - Status: {health_results['overall_status']}"
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        health_results["overall_status"] = "unhealthy"
        health_results["error"] = str(e)
        
        return ResponseBuilder.error(
            error_code="HEALTH_CHECK_FAILED",
            error_message=f"Cache health check failed: {str(e)}",
            details=health_results,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Utility functions
def _calculate_average_speedup(query_metrics: Dict) -> float:
    """Calculate average speedup across all cached queries"""
    speedups = []
    for metrics in query_metrics.values():
        speedup_str = metrics.get("speedup_factor", "0x")
        try:
            speedup = float(speedup_str.replace("x", ""))
            if speedup > 0:
                speedups.append(speedup)
        except:
            continue
    
    return sum(speedups) / len(speedups) if speedups else 0.0


def _get_top_queries(query_metrics: Dict, sort_key: str, limit: int) -> List[Dict]:
    """Get top queries by specified metric"""
    queries = []
    
    for query_hash, metrics in query_metrics.items():
        try:
            if sort_key == "speedup_factor":
                value = float(metrics.get("speedup_factor", "0x").replace("x", ""))
            else:
                value = metrics.get(sort_key, 0)
            
            queries.append({
                "query_hash": query_hash[:8] + "...",
                "value": value,
                "hit_rate": metrics.get("hit_rate", "0%"),
                "execution_count": metrics.get("execution_count", 0)
            })
        except:
            continue
    
    queries.sort(key=lambda x: x["value"], reverse=True)
    return queries[:limit]


def _grade_query_performance(metrics: Dict) -> str:
    """Grade query performance (A-D scale)"""
    try:
        hit_rate = float(metrics.get("hit_rate", "0%").replace("%", "")) / 100
        speedup = float(metrics.get("speedup_factor", "0x").replace("x", ""))
        
        if hit_rate >= 0.9 and speedup >= 50:
            return "A"  # Excellent
        elif hit_rate >= 0.8 and speedup >= 20:
            return "B"  # Good
        elif hit_rate >= 0.6 and speedup >= 10:
            return "C"  # Fair
        else:
            return "D"  # Needs improvement
    except:
        return "N/A"


def _get_optimization_suggestions(metrics: Dict) -> List[str]:
    """Get optimization suggestions for a query"""
    suggestions = []
    
    try:
        hit_rate = float(metrics.get("hit_rate", "0%").replace("%", "")) / 100
        speedup = float(metrics.get("speedup_factor", "0x").replace("x", ""))
        execution_count = metrics.get("execution_count", 0)
        
        if hit_rate < 0.5:
            suggestions.append("Low hit rate - consider increasing TTL or optimizing invalidation")
        
        if speedup < 10:
            suggestions.append("Low speedup factor - query may be too simple to benefit from caching")
        
        if execution_count > 1000:
            suggestions.append("High execution count - consider background refresh strategy")
        
        if not suggestions:
            suggestions.append("Performance is optimal")
            
    except:
        suggestions.append("Unable to analyze - insufficient data")
    
    return suggestions


async def _run_full_warming_cycle():
    """Background task to run full warming cycle"""
    try:
        await cache_warming_manager.run_full_warming_cycle()
    except Exception as e:
        logger.error(f"Background warming cycle failed: {e}")


async def _run_comprehensive_benchmark(db: Session, iterations: int) -> Dict:
    """Run comprehensive performance benchmark"""
    import time
    
    results = {
        "iterations": iterations,
        "timestamp": datetime.utcnow().isoformat(),
        "tests": {}
    }
    
    # Test 1: Basic cache operations
    cache_times = []
    for _ in range(iterations):
        start = time.time()
        smart_cache.set("benchmark_test", {"data": "test"}, 60)
        value = smart_cache.get("benchmark_test")
        cache_times.append((time.time() - start) * 1000)
    
    results["tests"]["basic_cache"] = {
        "avg_time_ms": sum(cache_times) / len(cache_times),
        "min_time_ms": min(cache_times),
        "max_time_ms": max(cache_times)
    }
    
    # Test 2: Query cache performance
    query_times = []
    for _ in range(iterations):
        start = time.time()
        count = get_user_count(db)
        query_times.append((time.time() - start) * 1000)
    
    results["tests"]["query_cache"] = {
        "avg_time_ms": sum(query_times) / len(query_times),
        "min_time_ms": min(query_times),
        "max_time_ms": max(query_times),
        "result_sample": count
    }
    
    return results


def _test_redis_health() -> Dict:
    """Test Redis connectivity and performance"""
    try:
        start = time.time()
        smart_cache.redis_client.ping()
        ping_time = (time.time() - start) * 1000
        
        info = smart_cache.redis_client.info()
        
        return {
            "status": "healthy",
            "ping_time_ms": round(ping_time, 2),
            "memory_used": info.get("used_memory_human", "unknown"),
            "connected_clients": info.get("connected_clients", 0)
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "error": str(e)
        }


def _test_query_cache_health(db: Session) -> Dict:
    """Test query cache functionality"""
    try:
        # Test cached function
        start = time.time()
        count = get_user_count(db)
        execution_time = (time.time() - start) * 1000
        
        return {
            "status": "healthy",
            "test_execution_time_ms": round(execution_time, 2),
            "test_result": count,
            "active_cached_queries": len(advanced_query_cache.metrics)
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


def _test_warming_system_health() -> Dict:
    """Test cache warming system status"""
    try:
        stats = cache_warming_manager.get_warming_stats()
        
        return {
            "status": "healthy" if stats["is_running"] else "stopped",
            "active_tasks": stats["active_tasks"],
            "total_tasks": len(cache_warming_manager.tasks),
            "success_rate": stats["global_stats"]["successful_warmings"] / max(1, stats["global_stats"]["total_warmings"])
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


async def _test_cache_performance_health(db: Session) -> Dict:
    """Test overall cache performance"""
    try:
        import time
        
        # Measure database query time
        start = time.time()
        db.execute(text("SELECT COUNT(*) FROM users")).fetchone()
        db_time = (time.time() - start) * 1000
        
        # Measure cache time
        start = time.time()
        smart_cache.get("test_performance_key")
        cache_time = (time.time() - start) * 1000
        
        speedup = db_time / cache_time if cache_time > 0 else 0
        
        return {
            "status": "healthy" if speedup > 10 else "degraded",
            "database_time_ms": round(db_time, 2),
            "cache_time_ms": round(cache_time, 2),
            "speedup_factor": round(speedup, 1)
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }