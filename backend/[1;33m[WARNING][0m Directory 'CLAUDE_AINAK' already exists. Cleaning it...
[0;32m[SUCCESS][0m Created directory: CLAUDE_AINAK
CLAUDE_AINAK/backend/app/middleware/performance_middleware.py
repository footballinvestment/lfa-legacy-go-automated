"""
Performance monitoring middleware for FastAPI
"""

import time
import psutil
import asyncio
from typing import Dict, List, Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import get_logger
from app.core.cache import cache

logger = get_logger("performance")


class PerformanceMetrics:
    """Store and manage performance metrics"""

    def __init__(self):
        self.request_times: List[float] = []
        self.endpoint_stats: Dict[str, List[float]] = {}
        self.slow_requests: List[Dict[str, Any]] = []
        self.memory_snapshots: List[float] = []
        self.active_requests = 0
        self.total_requests = 0
        self.slow_request_threshold = 0.200  # 200ms

    def add_request_time(self, endpoint: str, duration: float, status_code: int):
        """Add request timing data"""
        self.request_times.append(duration)
        self.total_requests += 1

        # Track per-endpoint stats
        if endpoint not in self.endpoint_stats:
            self.endpoint_stats[endpoint] = []
        self.endpoint_stats[endpoint].append(duration)

        # Keep only last 1000 requests per endpoint
        if len(self.endpoint_stats[endpoint]) > 1000:
            self.endpoint_stats[endpoint] = self.endpoint_stats[endpoint][-1000:]

        # Keep only last 5000 total requests
        if len(self.request_times) > 5000:
            self.request_times = self.request_times[-5000:]

        # Track slow requests
        if duration > self.slow_request_threshold:
            slow_request = {
                "endpoint": endpoint,
                "duration": round(duration * 1000, 2),  # ms
                "status_code": status_code,
                "timestamp": time.time(),
            }
            self.slow_requests.append(slow_request)

            # Keep only last 100 slow requests
            if len(self.slow_requests) > 100:
                self.slow_requests = self.slow_requests[-100:]

            logger.warning(
                f"Slow request: {endpoint} took {duration*1000:.2f}ms (status: {status_code})"
            )

    def add_memory_snapshot(self):
        """Add current memory usage snapshot"""
        try:
            memory_mb = psutil.virtual_memory().used / 1024 / 1024
            self.memory_snapshots.append(memory_mb)

            # Keep only last 100 snapshots
            if len(self.memory_snapshots) > 100:
                self.memory_snapshots = self.memory_snapshots[-100:]

            # Warning for high memory usage
            if memory_mb > 512:  # 512MB threshold
                logger.warning(f"High memory usage: {memory_mb:.2f}MB")

        except Exception as e:
            logger.error(f"Memory snapshot error: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive performance statistics"""
        if not self.request_times:
            return {
                "total_requests": 0,
                "average_response_time": 0,
                "slow_requests": 0,
                "active_requests": self.active_requests,
                "memory_usage": 0,
            }

        # Calculate overall stats
        avg_time = sum(self.request_times) / len(self.request_times)
        slow_count = len(
            [t for t in self.request_times if t > self.slow_request_threshold]
        )
        p95_time = (
            sorted(self.request_times)[int(len(self.request_times) * 0.95)]
            if self.request_times
            else 0
        )

        # Calculate endpoint stats
        endpoint_stats = {}
        for endpoint, times in self.endpoint_stats.items():
            if times:
                endpoint_stats[endpoint] = {
                    "count": len(times),
                    "avg_time": round(sum(times) / len(times) * 1000, 2),  # ms
                    "max_time": round(max(times) * 1000, 2),  # ms
                    "slow_requests": len(
                        [t for t in times if t > self.slow_request_threshold]
                    ),
                }

        # Memory stats
        memory_stats = {}
        if self.memory_snapshots:
            memory_stats = {
                "current": round(self.memory_snapshots[-1], 2),
                "average": round(
                    sum(self.memory_snapshots) / len(self.memory_snapshots), 2
                ),
                "peak": round(max(self.memory_snapshots), 2),
            }

        return {
            "total_requests": self.total_requests,
            "average_response_time": round(avg_time * 1000, 2),  # ms
            "p95_response_time": round(p95_time * 1000, 2),  # ms
            "slow_requests": slow_count,
            "slow_request_percentage": round(
                (slow_count / len(self.request_times)) * 100, 1
            ),
            "active_requests": self.active_requests,
            "endpoint_stats": endpoint_stats,
            "memory": memory_stats,
            "recent_slow_requests": self.slow_requests[-10:],  # Last 10
        }

    def get_performance_score(self) -> int:
        """Calculate performance score (0-100)"""
        if not self.request_times:
            return 100

        score = 100
        avg_time = sum(self.request_times) / len(self.request_times) * 1000  # ms
        slow_percentage = (
            len([t for t in self.request_times if t > self.slow_request_threshold])
            / len(self.request_times)
            * 100
        )

        # Penalize slow average response time
        if avg_time > 200:  # >200ms
            score -= min(40, (avg_time - 200) / 10)

        # Penalize high percentage of slow requests
        if slow_percentage > 5:
            score -= min(30, slow_percentage * 2)

        # Penalize high memory usage
        if self.memory_snapshots:
            current_memory = self.memory_snapshots[-1]
            if current_memory > 512:  # >512MB
                score -= min(20, (current_memory - 512) / 25)

        # Penalize too many active requests
        if self.active_requests > 50:
            score -= min(10, (self.active_requests - 50) / 5)

        return max(0, round(score))


# Global metrics instance
metrics = PerformanceMetrics()


class PerformanceMiddleware(BaseHTTPMiddleware):
    """Middleware to track API performance metrics"""

    def __init__(self, app):
        super().__init__(app)
        self.memory_check_interval = 60  # seconds
        self.last_memory_check = time.time()

        # Start background memory monitoring
        self._setup_background_monitoring()

    def _setup_background_monitoring(self):
        """Setup background monitoring tasks"""

        async def memory_monitor():
            while True:
                try:
                    metrics.add_memory_snapshot()

                    # Cache performance metrics
                    if cache.is_connected():
                        stats = metrics.get_stats()
                        cache.set("performance_stats", stats, ttl=60)

                    await asyncio.sleep(30)  # Check every 30 seconds
                except Exception as e:
                    logger.error(f"Memory monitor error: {e}")
                    await asyncio.sleep(60)

        # Start the background task
        try:
            asyncio.create_task(memory_monitor())
        except Exception as e:
            logger.error(f"Failed to start background monitoring: {e}")

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with performance tracking"""

        # Skip monitoring for health checks and static files
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        if request.url.path.startswith("/static/"):
            return await call_next(request)

        # Track request start
        start_time = time.time()
        metrics.active_requests += 1

        try:
            # Process request
            response = await call_next(request)

            # Calculate timing
            duration = time.time() - start_time
            endpoint = f"{request.method} {request.url.path}"

            # Add performance headers
            response.headers["X-Response-Time"] = f"{duration*1000:.2f}ms"
            response.headers["X-Performance-Score"] = str(
                metrics.get_performance_score()
            )

            # Track metrics
            metrics.add_request_time(endpoint, duration, response.status_code)

            # Log slow requests with more detail
            if duration > metrics.slow_request_threshold:
                user_agent = request.headers.get("user-agent", "unknown")[:50]
                query_params = (
                    str(dict(request.query_params))[:100]
                    if request.query_params
                    else "none"
                )

                logger.warning(
                    f"Slow API request: {endpoint} - {duration*1000:.2f}ms "
                    f"(status: {response.status_code}, UA: {user_agent}, params: {query_params})"
                )

            return response

        except Exception as e:
            # Track failed requests
            duration = time.time() - start_time
            endpoint = f"{request.method} {request.url.path}"
            metrics.add_request_time(endpoint, duration, 500)

            logger.error(
                f"Request failed: {endpoint} - {duration*1000:.2f}ms - {str(e)}"
            )
            raise

        finally:
            metrics.active_requests = max(0, metrics.active_requests - 1)


# Performance analysis functions
def analyze_performance():
    """Analyze performance and provide recommendations"""
    stats = metrics.get_stats()
    score = metrics.get_performance_score()

    logger.info("🚀 API Performance Analysis:")
    logger.info(f"  Performance Score: {score}/100")
    logger.info(f"  Total Requests: {stats['total_requests']}")
    logger.info(f"  Average Response: {stats['average_response_time']}ms")
    logger.info(f"  P95 Response: {stats['p95_response_time']}ms")
    logger.info(
        f"  Slow Requests: {stats['slow_requests']} ({stats['slow_request_percentage']}%)"
    )
    logger.info(f"  Active Requests: {stats['active_requests']}")

    if stats["memory"]:
        logger.info(
            f"  Memory Usage: {stats['memory']['current']}MB (peak: {stats['memory']['peak']}MB)"
        )

    # Performance recommendations
    recommendations = []

    if stats["average_response_time"] > 200:
        recommendations.append("Optimize slow endpoints and add caching")

    if stats["slow_request_percentage"] > 10:
        recommendations.append("Review database queries and add indexes")

    if stats["memory"].get("current", 0) > 512:
        recommendations.append("Investigate memory leaks and optimize memory usage")

    if stats["active_requests"] > 20:
        recommendations.append("Consider scaling with more instances")

    # Endpoint-specific recommendations
    if stats["endpoint_stats"]:
        slowest_endpoints = sorted(
            stats["endpoint_stats"].items(),
            key=lambda x: x[1]["avg_time"],
            reverse=True,
        )[:3]

        for endpoint, endpoint_stats in slowest_endpoints:
            if endpoint_stats["avg_time"] > 200:
                recommendations.append(
                    f"Optimize endpoint: {endpoint} (avg: {endpoint_stats['avg_time']}ms)"
                )

    if recommendations:
        logger.warning("🔧 Performance Recommendations:")
        for rec in recommendations:
            logger.warning(f"  • {rec}")
    else:
        logger.info("✅ Performance looks good!")

    return stats


def get_top_slow_endpoints(limit: int = 5) -> List[Dict[str, Any]]:
    """Get the slowest API endpoints"""
    endpoint_stats = metrics.endpoint_stats

    slow_endpoints = []
    for endpoint, times in endpoint_stats.items():
        if times:
            avg_time = sum(times) / len(times) * 1000  # ms
            if avg_time > 100:  # Only include endpoints >100ms average
                slow_endpoints.append(
                    {
                        "endpoint": endpoint,
                        "avg_time": round(avg_time, 2),
                        "max_time": round(max(times) * 1000, 2),
                        "request_count": len(times),
                        "slow_count": len(
                            [t for t in times if t > metrics.slow_request_threshold]
                        ),
                    }
                )

    # Sort by average time
    slow_endpoints.sort(key=lambda x: x["avg_time"], reverse=True)

    return slow_endpoints[:limit]


def reset_metrics():
    """Reset all performance metrics"""
    global metrics
    metrics = PerformanceMetrics()
    logger.info("Performance metrics reset")


# Export stats for monitoring endpoints
def get_performance_stats() -> Dict[str, Any]:
    """Get performance stats for monitoring endpoints"""
    return metrics.get_stats()


def get_health_metrics() -> Dict[str, Any]:
    """Get health metrics for health check endpoints"""
    stats = metrics.get_stats()
    score = metrics.get_performance_score()

    return {
        "performance_score": score,
        "average_response_time": stats["average_response_time"],
        "active_requests": stats["active_requests"],
        "memory_usage": stats["memory"].get("current", 0) if stats["memory"] else 0,
        "status": (
            "healthy" if score > 70 else "degraded" if score > 40 else "unhealthy"
        ),
    }
