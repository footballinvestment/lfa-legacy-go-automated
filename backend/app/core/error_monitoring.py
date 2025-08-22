# === backend/app/core/error_monitoring.py ===
# Error Monitoring and Performance Tracking Module
# LFA Legacy GO - Hiányzó core modul implementáció

import functools
import logging
import time
import traceback
from typing import Any, Callable, Dict, Optional
from datetime import datetime
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class ErrorMonitor:
    """Error monitoring and tracking class"""

    def __init__(self):
        self.error_count = 0
        self.performance_stats = {}
        self.error_log = []

    def log_error(self, error: Exception, context: Optional[Dict[str, Any]] = None):
        """Log an error with context"""
        error_entry = {
            "timestamp": datetime.now().isoformat(),
            "error_type": type(error).__name__,
            "error_message": str(error),
            "traceback": traceback.format_exc(),
            "context": context or {},
        }

        self.error_log.append(error_entry)
        self.error_count += 1

        logger.error(
            f"Error logged: {error_entry['error_type']} - {error_entry['error_message']}"
        )

        # Keep only last 100 errors to prevent memory bloat
        if len(self.error_log) > 100:
            self.error_log = self.error_log[-100:]

    def log_performance(
        self, operation: str, duration: float, context: Dict[str, Any] = None
    ):
        """Log performance metrics"""
        if operation not in self.performance_stats:
            self.performance_stats[operation] = {
                "count": 0,
                "total_time": 0.0,
                "avg_time": 0.0,
                "min_time": float("inf"),
                "max_time": 0.0,
            }

        stats = self.performance_stats[operation]
        stats["count"] += 1
        stats["total_time"] += duration
        stats["avg_time"] = stats["total_time"] / stats["count"]
        stats["min_time"] = min(stats["min_time"], duration)
        stats["max_time"] = max(stats["max_time"], duration)

        logger.info(
            f"Performance: {operation} took {duration:.3f}s "
            f"(avg: {stats['avg_time']:.3f}s, count: {stats['count']})"
        )

    def get_error_summary(self) -> Dict[str, Any]:
        """Get error summary statistics"""
        error_types = {}
        recent_errors = []

        for error in self.error_log[-10:]:  # Last 10 errors
            error_type = error["error_type"]
            error_types[error_type] = error_types.get(error_type, 0) + 1
            recent_errors.append(
                {
                    "timestamp": error["timestamp"],
                    "type": error_type,
                    "message": error["error_message"][:100],  # Truncate long messages
                }
            )

        return {
            "total_errors": self.error_count,
            "error_types": error_types,
            "recent_errors": recent_errors,
            "error_rate": len(self.error_log) / max(1, len(self.performance_stats)),
        }

    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary statistics"""
        return {
            "operations": dict(self.performance_stats),
            "total_operations": sum(
                stats["count"] for stats in self.performance_stats.values()
            ),
            "average_response_time": sum(
                stats["avg_time"] for stats in self.performance_stats.values()
            )
            / max(1, len(self.performance_stats)),
        }


# Global error monitor instance
error_monitor = ErrorMonitor()


def monitor_performance(operation_name: str = None):
    """Decorator to monitor function performance"""

    def decorator(func: Callable) -> Callable:
        op_name = operation_name or f"{func.__module__}.{func.__name__}"

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                error_monitor.log_performance(op_name, duration)
                return result
            except Exception as e:
                duration = time.time() - start_time
                error_monitor.log_error(
                    e,
                    {
                        "function": op_name,
                        "args": str(args)[:100],
                        "kwargs": str(kwargs)[:100],
                        "duration": duration,
                    },
                )
                raise

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                error_monitor.log_performance(op_name, duration)
                return result
            except Exception as e:
                duration = time.time() - start_time
                error_monitor.log_error(
                    e,
                    {
                        "function": op_name,
                        "args": str(args)[:100],
                        "kwargs": str(kwargs)[:100],
                        "duration": duration,
                    },
                )
                raise

        # Return appropriate wrapper based on whether function is async
        import asyncio

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


@contextmanager
def performance_timer(operation_name: str):
    """Context manager for timing operations"""
    start_time = time.time()
    try:
        yield
    except Exception as e:
        duration = time.time() - start_time
        error_monitor.log_error(e, {"operation": operation_name, "duration": duration})
        raise
    else:
        duration = time.time() - start_time
        error_monitor.log_performance(operation_name, duration)


def log_user_action(user_id: int, action: str, details: Dict[str, Any] = None):
    """Log user action for monitoring"""
    logger.info(
        f"User action: user_id={user_id}, action={action}, "
        f"details={details}, timestamp={datetime.now().isoformat()}"
    )


def log_api_call(
    endpoint: str,
    method: str,
    user_id: Optional[int] = None,
    response_time: Optional[float] = None,
):
    """Log API call for monitoring"""
    logger.info(
        f"API call: {method} {endpoint}, user_id={user_id}, "
        f"response_time={response_time:.3f}s"
        if response_time
        else "response_time=None"
    )


def get_system_health() -> Dict[str, Any]:
    """Get overall system health metrics"""
    return {
        "timestamp": datetime.now().isoformat(),
        "error_monitor": {
            "status": "healthy" if error_monitor.error_count < 100 else "degraded",
            "total_errors": error_monitor.error_count,
            "recent_error_rate": len(error_monitor.error_log)
            / max(1, 60),  # errors per minute
        },
        "performance": {
            "monitored_operations": len(error_monitor.performance_stats),
            "total_operations": sum(
                stats["count"] for stats in error_monitor.performance_stats.values()
            ),
            "average_response_time": sum(
                stats["avg_time"] for stats in error_monitor.performance_stats.values()
            )
            / max(1, len(error_monitor.performance_stats)),
        },
    }


# Health check function for admin endpoints
def check_error_monitor_health() -> Dict[str, Any]:
    """Check error monitor health status"""
    health_status = "healthy"
    issues = []

    if error_monitor.error_count > 100:
        health_status = "warning"
        issues.append("High error count detected")

    if len(error_monitor.error_log) > 50:
        health_status = "warning"
        issues.append("Many recent errors")

    # Check for slow operations
    slow_operations = [
        op
        for op, stats in error_monitor.performance_stats.items()
        if stats["avg_time"] > 5.0  # Operations taking more than 5 seconds
    ]

    if slow_operations:
        health_status = "warning"
        issues.append(f"Slow operations detected: {', '.join(slow_operations)}")

    return {
        "status": health_status,
        "issues": issues,
        "metrics": {
            "total_errors": error_monitor.error_count,
            "recent_errors": len(error_monitor.error_log),
            "monitored_operations": len(error_monitor.performance_stats),
            "slow_operations": len(slow_operations),
        },
    }


# Error handler for FastAPI
async def global_error_handler(request, exc):
    """Global error handler for FastAPI applications"""
    error_monitor.log_error(
        exc,
        {
            "request_method": request.method,
            "request_url": str(request.url),
            "request_path": request.url.path,
        },
    )

    # Return appropriate error response
    return {
        "error": "Internal server error",
        "message": "An unexpected error occurred",
        "timestamp": datetime.now().isoformat(),
    }


logger.info("✅ Error monitoring module initialized")
