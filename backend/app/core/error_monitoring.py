"""
Error monitoring and metrics collection for LFA Legacy GO
Tracks errors, performance metrics, and system health
"""

import time
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict
from functools import wraps
import threading


@dataclass
class ErrorMetric:
    """Error metric data structure"""
    error_type: str
    count: int
    first_occurrence: datetime
    last_occurrence: datetime
    endpoints: Dict[str, int] = field(default_factory=dict)
    user_ids: List[int] = field(default_factory=list)


@dataclass
class PerformanceMetric:
    """Performance metric data structure"""
    operation: str
    total_calls: int
    total_duration: float
    avg_duration: float
    min_duration: float
    max_duration: float
    success_rate: float
    last_updated: datetime


class ErrorMonitor:
    """
    Error monitoring and metrics collection system
    Thread-safe singleton for tracking application errors and performance
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.logger = logging.getLogger(__name__)
        self.error_metrics: Dict[str, ErrorMetric] = {}
        self.performance_metrics: Dict[str, PerformanceMetric] = {}
        self.alert_thresholds = {
            'error_rate_per_minute': 10,
            'avg_response_time_ms': 1000,
            'error_count_threshold': 5
        }
        self.data_lock = threading.Lock()
        self._initialized = True
    
    def record_error(
        self,
        error: Exception,
        endpoint: str = None,
        user_id: int = None,
        context: Dict[str, Any] = None
    ) -> None:
        """
        Record an error occurrence
        
        Args:
            error: The exception that occurred
            endpoint: API endpoint where error occurred
            user_id: User ID associated with the error
            context: Additional context about the error
        """
        error_type = type(error).__name__
        
        with self.data_lock:
            if error_type not in self.error_metrics:
                self.error_metrics[error_type] = ErrorMetric(
                    error_type=error_type,
                    count=0,
                    first_occurrence=datetime.now(),
                    last_occurrence=datetime.now()
                )
            
            metric = self.error_metrics[error_type]
            metric.count += 1
            metric.last_occurrence = datetime.now()
            
            if endpoint:
                metric.endpoints[endpoint] = metric.endpoints.get(endpoint, 0) + 1
            
            if user_id and user_id not in metric.user_ids:
                metric.user_ids.append(user_id)
                # Keep only last 100 user IDs to avoid memory issues
                if len(metric.user_ids) > 100:
                    metric.user_ids = metric.user_ids[-100:]
        
        # Log the error
        self.logger.error(
            f"Error recorded: {error_type} in {endpoint or 'unknown endpoint'}",
            extra={
                'error_type': error_type,
                'error_message': str(error),
                'endpoint': endpoint,
                'user_id': user_id,
                'context': context or {}
            }
        )
        
        # Check if we should trigger an alert
        self._check_error_thresholds(error_type)
    
    def record_performance(
        self,
        operation: str,
        duration_ms: float,
        success: bool = True
    ) -> None:
        """
        Record a performance metric
        
        Args:
            operation: Name of the operation
            duration_ms: Duration in milliseconds
            success: Whether the operation was successful
        """
        with self.data_lock:
            if operation not in self.performance_metrics:
                self.performance_metrics[operation] = PerformanceMetric(
                    operation=operation,
                    total_calls=0,
                    total_duration=0.0,
                    avg_duration=0.0,
                    min_duration=float('inf'),
                    max_duration=0.0,
                    success_rate=0.0,
                    last_updated=datetime.now()
                )
            
            metric = self.performance_metrics[operation]
            metric.total_calls += 1
            metric.total_duration += duration_ms
            metric.avg_duration = metric.total_duration / metric.total_calls
            metric.min_duration = min(metric.min_duration, duration_ms)
            metric.max_duration = max(metric.max_duration, duration_ms)
            
            # Calculate success rate (simplified - would need more sophisticated tracking)
            if success:
                metric.success_rate = (metric.success_rate * (metric.total_calls - 1) + 1.0) / metric.total_calls
            else:
                metric.success_rate = (metric.success_rate * (metric.total_calls - 1)) / metric.total_calls
            
            metric.last_updated = datetime.now()
        
        # Check performance thresholds
        self._check_performance_thresholds(operation, duration_ms)
    
    def get_error_summary(self, time_window_hours: int = 24) -> Dict[str, Any]:
        """
        Get error summary for the specified time window
        
        Args:
            time_window_hours: Time window in hours
            
        Returns:
            Dictionary with error summary data
        """
        cutoff_time = datetime.now() - timedelta(hours=time_window_hours)
        
        with self.data_lock:
            recent_errors = {
                error_type: metric for error_type, metric in self.error_metrics.items()
                if metric.last_occurrence >= cutoff_time
            }
            
            total_errors = sum(metric.count for metric in recent_errors.values())
            
            return {
                'time_window_hours': time_window_hours,
                'total_errors': total_errors,
                'unique_error_types': len(recent_errors),
                'error_breakdown': {
                    error_type: {
                        'count': metric.count,
                        'last_occurrence': metric.last_occurrence.isoformat(),
                        'affected_endpoints': len(metric.endpoints),
                        'affected_users': len(metric.user_ids)
                    }
                    for error_type, metric in recent_errors.items()
                },
                'top_error_endpoints': self._get_top_error_endpoints(recent_errors)
            }
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance metrics summary"""
        with self.data_lock:
            return {
                'operations': {
                    operation: {
                        'total_calls': metric.total_calls,
                        'avg_duration_ms': round(metric.avg_duration, 2),
                        'min_duration_ms': round(metric.min_duration, 2),
                        'max_duration_ms': round(metric.max_duration, 2),
                        'success_rate': round(metric.success_rate, 3),
                        'last_updated': metric.last_updated.isoformat()
                    }
                    for operation, metric in self.performance_metrics.items()
                },
                'summary': {
                    'total_operations': len(self.performance_metrics),
                    'avg_response_time': round(
                        sum(metric.avg_duration for metric in self.performance_metrics.values()) / 
                        len(self.performance_metrics), 2
                    ) if self.performance_metrics else 0,
                    'overall_success_rate': round(
                        sum(metric.success_rate for metric in self.performance_metrics.values()) / 
                        len(self.performance_metrics), 3
                    ) if self.performance_metrics else 0
                }
            }
    
    def clear_metrics(self, older_than_hours: int = 48) -> None:
        """
        Clear old metrics to prevent memory buildup
        
        Args:
            older_than_hours: Clear metrics older than this many hours
        """
        cutoff_time = datetime.now() - timedelta(hours=older_than_hours)
        
        with self.data_lock:
            # Clear old error metrics
            self.error_metrics = {
                error_type: metric for error_type, metric in self.error_metrics.items()
                if metric.last_occurrence >= cutoff_time
            }
            
            # Clear old performance metrics
            self.performance_metrics = {
                operation: metric for operation, metric in self.performance_metrics.items()
                if metric.last_updated >= cutoff_time
            }
        
        self.logger.info(f"Cleared metrics older than {older_than_hours} hours")
    
    def _check_error_thresholds(self, error_type: str) -> None:
        """Check if error thresholds are exceeded and log alerts"""
        with self.data_lock:
            metric = self.error_metrics[error_type]
            
            # Check if error count in last minute exceeds threshold
            recent_threshold_time = datetime.now() - timedelta(minutes=1)
            if metric.last_occurrence >= recent_threshold_time and metric.count >= self.alert_thresholds['error_count_threshold']:
                self.logger.warning(
                    f"HIGH ERROR RATE ALERT: {error_type} has occurred {metric.count} times",
                    extra={
                        'alert_type': 'high_error_rate',
                        'error_type': error_type,
                        'count': metric.count,
                        'threshold': self.alert_thresholds['error_count_threshold']
                    }
                )
    
    def _check_performance_thresholds(self, operation: str, duration_ms: float) -> None:
        """Check if performance thresholds are exceeded"""
        if duration_ms > self.alert_thresholds['avg_response_time_ms']:
            self.logger.warning(
                f"SLOW OPERATION ALERT: {operation} took {duration_ms:.2f}ms",
                extra={
                    'alert_type': 'slow_operation',
                    'operation': operation,
                    'duration_ms': duration_ms,
                    'threshold': self.alert_thresholds['avg_response_time_ms']
                }
            )
    
    def _get_top_error_endpoints(self, error_metrics: Dict[str, ErrorMetric]) -> List[Dict[str, Any]]:
        """Get top endpoints by error count"""
        endpoint_errors = defaultdict(int)
        
        for metric in error_metrics.values():
            for endpoint, count in metric.endpoints.items():
                endpoint_errors[endpoint] += count
        
        return [
            {'endpoint': endpoint, 'error_count': count}
            for endpoint, count in sorted(endpoint_errors.items(), key=lambda x: x[1], reverse=True)[:10]
        ]


def monitor_performance(operation_name: str):
    """
    Decorator to automatically monitor function performance
    
    Args:
        operation_name: Name of the operation being monitored
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            monitor = ErrorMonitor()
            success = True
            
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                success = False
                monitor.record_error(e, context={'operation': operation_name})
                raise
            finally:
                duration_ms = (time.time() - start_time) * 1000
                monitor.record_performance(operation_name, duration_ms, success)
        
        return wrapper
    return decorator


def get_system_health() -> Dict[str, Any]:
    """
    Get overall system health status
    
    Returns:
        Dictionary with system health information
    """
    monitor = ErrorMonitor()
    error_summary = monitor.get_error_summary(time_window_hours=1)  # Last hour
    performance_summary = monitor.get_performance_summary()
    
    # Calculate health score (simplified)
    error_score = max(0, 100 - (error_summary['total_errors'] * 10))
    performance_score = min(100, max(0, 100 - (performance_summary['summary']['avg_response_time'] / 10)))
    overall_health = (error_score + performance_score) / 2
    
    health_status = 'healthy' if overall_health > 80 else 'degraded' if overall_health > 50 else 'unhealthy'
    
    return {
        'status': health_status,
        'health_score': round(overall_health, 1),
        'error_summary': error_summary,
        'performance_summary': performance_summary,
        'timestamp': datetime.now().isoformat()
    }