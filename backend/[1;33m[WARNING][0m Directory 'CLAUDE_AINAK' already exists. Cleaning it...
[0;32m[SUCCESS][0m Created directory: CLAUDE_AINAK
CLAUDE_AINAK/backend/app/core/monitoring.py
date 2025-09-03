"""
Monitoring and Observability - PHASE 5
Comprehensive monitoring, metrics, and alerting system
"""

import time
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from threading import Lock
import psutil
import os
from collections import defaultdict, deque


@dataclass
class MetricPoint:
    """Individual metric data point."""
    timestamp: float
    value: float
    labels: Dict[str, str]


@dataclass 
class HealthStatus:
    """System health status."""
    service: str
    status: str  # healthy, degraded, unhealthy
    timestamp: str
    uptime: float
    version: str
    database: Dict[str, Any]
    memory: Dict[str, Any]
    cpu: Dict[str, Any]
    disk: Dict[str, Any]
    errors: List[str]


class MetricsCollector:
    """Collects and stores application metrics."""
    
    def __init__(self, retention_minutes: int = 60):
        self.metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.retention_seconds = retention_minutes * 60
        self.lock = Lock()
        self.start_time = time.time()
        
    def record_metric(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Record a metric value."""
        with self.lock:
            point = MetricPoint(
                timestamp=time.time(),
                value=value,
                labels=labels or {}
            )
            self.metrics[name].append(point)
            
    def get_metrics(self, name: str, since_seconds: int = 300) -> List[MetricPoint]:
        """Get metric values from the last N seconds."""
        cutoff = time.time() - since_seconds
        with self.lock:
            return [point for point in self.metrics[name] if point.timestamp >= cutoff]
            
    def get_all_metrics(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get all current metrics."""
        with self.lock:
            result = {}
            for name, points in self.metrics.items():
                result[name] = [asdict(point) for point in points]
            return result
            
    def cleanup_old_metrics(self):
        """Remove old metric points to prevent memory leaks."""
        cutoff = time.time() - self.retention_seconds
        with self.lock:
            for name in self.metrics:
                while self.metrics[name] and self.metrics[name][0].timestamp < cutoff:
                    self.metrics[name].popleft()


class HealthChecker:
    """Monitors system health and availability."""
    
    def __init__(self):
        self.start_time = time.time()
        self.version = "3.0.0"
        self.logger = logging.getLogger(__name__)
        
    def check_health(self) -> HealthStatus:
        """Perform comprehensive health check."""
        errors = []
        
        # Database health
        database_status = self._check_database()
        if database_status["status"] != "connected":
            errors.append("Database connection failed")
            
        # Memory health
        memory_status = self._check_memory()
        if memory_status["usage_percent"] > 90:
            errors.append("High memory usage")
            
        # CPU health
        cpu_status = self._check_cpu()
        if cpu_status["usage_percent"] > 90:
            errors.append("High CPU usage")
            
        # Disk health
        disk_status = self._check_disk()
        if disk_status["usage_percent"] > 90:
            errors.append("High disk usage")
            
        # Determine overall status
        if errors:
            overall_status = "unhealthy" if len(errors) > 2 else "degraded"
        else:
            overall_status = "healthy"
            
        return HealthStatus(
            service="lfa-legacy-go-api",
            status=overall_status,
            timestamp=datetime.utcnow().isoformat(),
            uptime=time.time() - self.start_time,
            version=self.version,
            database=database_status,
            memory=memory_status,
            cpu=cpu_status,
            disk=disk_status,
            errors=errors
        )
        
    def _check_database(self) -> Dict[str, Any]:
        """Check database connectivity and performance."""
        try:
            from app.database import SessionLocal
            
            start_time = time.time()
            db = SessionLocal()
            
            # Simple query to test connectivity
            db.execute("SELECT 1")
            response_time = (time.time() - start_time) * 1000
            
            db.close()
            
            return {
                "status": "connected",
                "response_time": round(response_time, 2),
                "connection_pool": "healthy"
            }
            
        except Exception as e:
            self.logger.error(f"Database health check failed: {e}")
            return {
                "status": "error",
                "response_time": None,
                "error": str(e)
            }
            
    def _check_memory(self) -> Dict[str, Any]:
        """Check memory usage."""
        try:
            memory = psutil.virtual_memory()
            return {
                "total": round(memory.total / 1024 / 1024, 2),  # MB
                "used": round(memory.used / 1024 / 1024, 2),   # MB
                "available": round(memory.available / 1024 / 1024, 2),  # MB
                "usage_percent": round(memory.percent, 2)
            }
        except Exception as e:
            return {"error": str(e)}
            
    def _check_cpu(self) -> Dict[str, Any]:
        """Check CPU usage."""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            return {
                "usage_percent": round(cpu_percent, 2),
                "cpu_count": cpu_count,
                "load_average": os.getloadavg() if hasattr(os, 'getloadavg') else None
            }
        except Exception as e:
            return {"error": str(e)}
            
    def _check_disk(self) -> Dict[str, Any]:
        """Check disk usage."""
        try:
            disk = psutil.disk_usage('/')
            return {
                "total": round(disk.total / 1024 / 1024 / 1024, 2),  # GB
                "used": round(disk.used / 1024 / 1024 / 1024, 2),   # GB
                "free": round(disk.free / 1024 / 1024 / 1024, 2),   # GB
                "usage_percent": round((disk.used / disk.total) * 100, 2)
            }
        except Exception as e:
            return {"error": str(e)}


class PerformanceMonitor:
    """Monitors application performance metrics."""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics = metrics_collector
        self.request_times = deque(maxlen=1000)
        self.error_counts = defaultdict(int)
        
    def record_request(self, method: str, path: str, status_code: int, duration: float):
        """Record API request metrics."""
        self.metrics.record_metric("request_count", 1, {
            "method": method,
            "path": path,
            "status": str(status_code)
        })
        
        self.metrics.record_metric("request_duration", duration, {
            "method": method,
            "path": path
        })
        
        self.request_times.append(duration)
        
        if status_code >= 400:
            self.error_counts[status_code] += 1
            self.metrics.record_metric("error_count", 1, {
                "status": str(status_code)
            })
            
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary statistics."""
        if not self.request_times:
            return {"message": "No requests recorded"}
            
        durations = list(self.request_times)
        durations.sort()
        
        count = len(durations)
        p50 = durations[int(count * 0.5)] if count > 0 else 0
        p95 = durations[int(count * 0.95)] if count > 0 else 0
        p99 = durations[int(count * 0.99)] if count > 0 else 0
        
        return {
            "total_requests": count,
            "average_duration": round(sum(durations) / count, 3) if count > 0 else 0,
            "p50_duration": round(p50, 3),
            "p95_duration": round(p95, 3),
            "p99_duration": round(p99, 3),
            "error_counts": dict(self.error_counts),
            "requests_per_minute": self._calculate_rpm()
        }
        
    def _calculate_rpm(self) -> float:
        """Calculate requests per minute from recent data."""
        recent_requests = [
            point for point in self.metrics.get_metrics("request_count", since_seconds=60)
        ]
        return len(recent_requests)


class AlertManager:
    """Manages system alerts and notifications."""
    
    def __init__(self, metrics_collector: MetricsCollector, health_checker: HealthChecker):
        self.metrics = metrics_collector
        self.health_checker = health_checker
        self.alerts = deque(maxlen=100)
        self.logger = logging.getLogger(__name__)
        
    def check_alerts(self):
        """Check for alert conditions."""
        health = self.health_checker.check_health()
        
        # High error rate alert
        error_rate = self._calculate_error_rate()
        if error_rate > 0.1:  # 10% error rate
            self._create_alert("high_error_rate", f"Error rate is {error_rate:.1%}")
            
        # Memory usage alert
        if health.memory.get("usage_percent", 0) > 85:
            self._create_alert("high_memory", f"Memory usage is {health.memory['usage_percent']}%")
            
        # CPU usage alert
        if health.cpu.get("usage_percent", 0) > 85:
            self._create_alert("high_cpu", f"CPU usage is {health.cpu['usage_percent']}%")
            
        # Database connectivity alert
        if health.database.get("status") != "connected":
            self._create_alert("database_down", "Database connection failed")
            
    def _calculate_error_rate(self) -> float:
        """Calculate current error rate."""
        total_requests = len(self.metrics.get_metrics("request_count", since_seconds=300))
        error_requests = len(self.metrics.get_metrics("error_count", since_seconds=300))
        
        if total_requests == 0:
            return 0.0
            
        return error_requests / total_requests
        
    def _create_alert(self, alert_type: str, message: str):
        """Create a new alert."""
        alert = {
            "type": alert_type,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "severity": "warning"
        }
        
        self.alerts.append(alert)
        self.logger.warning(f"Alert: {alert_type} - {message}")
        
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get current active alerts."""
        # Return alerts from last 15 minutes
        cutoff = datetime.utcnow() - timedelta(minutes=15)
        
        return [
            alert for alert in self.alerts 
            if datetime.fromisoformat(alert["timestamp"]) > cutoff
        ]


# Global monitoring instances
metrics_collector = MetricsCollector()
health_checker = HealthChecker()
performance_monitor = PerformanceMonitor(metrics_collector)
alert_manager = AlertManager(metrics_collector, health_checker)


def get_monitoring_dashboard() -> Dict[str, Any]:
    """Get comprehensive monitoring dashboard data."""
    health = health_checker.check_health()
    performance = performance_monitor.get_performance_summary()
    alerts = alert_manager.get_active_alerts()
    
    return {
        "health": asdict(health),
        "performance": performance,
        "alerts": alerts,
        "metrics_summary": {
            "total_metrics": len(metrics_collector.metrics),
            "uptime": time.time() - metrics_collector.start_time
        }
    }


def cleanup_monitoring_data():
    """Cleanup old monitoring data to prevent memory leaks."""
    metrics_collector.cleanup_old_metrics()
    alert_manager.check_alerts()