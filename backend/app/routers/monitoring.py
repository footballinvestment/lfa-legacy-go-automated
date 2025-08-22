"""
Monitoring API Endpoints - PHASE 5
RESTful endpoints for monitoring, metrics, and observability
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse, PlainTextResponse
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

from app.core.monitoring import (
    metrics_collector,
    health_checker,
    performance_monitor,
    alert_manager,
    get_monitoring_dashboard,
    cleanup_monitoring_data
)
from app.core.api_response import ResponseBuilder

router = APIRouter(prefix="/api/monitoring", tags=["Monitoring"])


@router.get("/health", summary="🏥 Comprehensive Health Check")
async def health_check():
    """
    Get comprehensive system health status.
    
    Returns detailed information about:
    - Service status
    - Database connectivity
    - Memory usage
    - CPU utilization
    - Disk space
    - System errors
    """
    try:
        health = health_checker.check_health()
        
        return ResponseBuilder.success(
            data=health.__dict__,
            message="Health check completed"
        )
        
    except Exception as e:
        return ResponseBuilder.error(
            message="Health check failed",
            error_code="HEALTH_CHECK_ERROR",
            status_code=503
        )


@router.get("/metrics", summary="📊 System Metrics")
async def get_metrics(
    metric_name: Optional[str] = Query(None, description="Specific metric name"),
    since_seconds: int = Query(300, description="Time range in seconds", ge=1, le=3600)
):
    """
    Get system metrics and performance data.
    
    Query Parameters:
    - metric_name: Filter for specific metric (optional)
    - since_seconds: Time range to retrieve (1-3600 seconds)
    """
    try:
        if metric_name:
            metrics_data = {
                metric_name: [
                    {
                        "timestamp": point.timestamp,
                        "value": point.value,
                        "labels": point.labels
                    }
                    for point in metrics_collector.get_metrics(metric_name, since_seconds)
                ]
            }
        else:
            metrics_data = metrics_collector.get_all_metrics()
            
        return ResponseBuilder.success(
            data={
                "metrics": metrics_data,
                "time_range_seconds": since_seconds,
                "total_metrics": len(metrics_data)
            },
            message="Metrics retrieved successfully"
        )
        
    except Exception as e:
        return ResponseBuilder.error(
            message="Failed to retrieve metrics",
            error_code="METRICS_ERROR"
        )


@router.get("/performance", summary="⚡ Performance Statistics")
async def get_performance():
    """
    Get application performance statistics.
    
    Returns:
    - Request counts and durations
    - Error rates
    - Response time percentiles
    - Throughput metrics
    """
    try:
        performance_data = performance_monitor.get_performance_summary()
        
        return ResponseBuilder.success(
            data=performance_data,
            message="Performance statistics retrieved"
        )
        
    except Exception as e:
        return ResponseBuilder.error(
            message="Failed to retrieve performance data",
            error_code="PERFORMANCE_ERROR"
        )


@router.get("/alerts", summary="🚨 Active Alerts")
async def get_alerts():
    """
    Get current active system alerts.
    
    Returns alerts from the last 15 minutes including:
    - High error rates
    - Resource usage warnings
    - Database connectivity issues
    - Performance degradations
    """
    try:
        alerts = alert_manager.get_active_alerts()
        
        return ResponseBuilder.success(
            data={
                "alerts": alerts,
                "total_alerts": len(alerts),
                "timestamp": datetime.utcnow().isoformat()
            },
            message=f"Retrieved {len(alerts)} active alerts"
        )
        
    except Exception as e:
        return ResponseBuilder.error(
            message="Failed to retrieve alerts",
            error_code="ALERTS_ERROR"
        )


@router.get("/dashboard", summary="📈 Monitoring Dashboard")
async def monitoring_dashboard():
    """
    Get comprehensive monitoring dashboard data.
    
    Returns complete overview including:
    - Health status
    - Performance metrics  
    - Active alerts
    - System resource usage
    - Error rates and trends
    """
    try:
        dashboard_data = get_monitoring_dashboard()
        
        return ResponseBuilder.success(
            data=dashboard_data,
            message="Dashboard data retrieved successfully"
        )
        
    except Exception as e:
        return ResponseBuilder.error(
            message="Failed to load dashboard",
            error_code="DASHBOARD_ERROR"
        )


@router.get("/metrics/prometheus", summary="📊 Prometheus Metrics", response_class=PlainTextResponse)
async def prometheus_metrics():
    """
    Export metrics in Prometheus format for monitoring integrations.
    
    Returns metrics in Prometheus exposition format compatible with:
    - Prometheus monitoring
    - Grafana dashboards
    - Other monitoring tools
    """
    try:
        # Get health data
        health = health_checker.check_health()
        performance = performance_monitor.get_performance_summary()
        
        # Format as Prometheus metrics
        prometheus_output = []
        
        # Health metrics
        prometheus_output.append(f"# HELP lfa_service_health Service health status (1=healthy, 0.5=degraded, 0=unhealthy)")
        prometheus_output.append(f"# TYPE lfa_service_health gauge")
        health_value = 1 if health.status == "healthy" else (0.5 if health.status == "degraded" else 0)
        prometheus_output.append(f'lfa_service_health{{service="lfa-legacy-go"}} {health_value}')
        
        # Uptime metrics
        prometheus_output.append(f"# HELP lfa_service_uptime_seconds Service uptime in seconds")
        prometheus_output.append(f"# TYPE lfa_service_uptime_seconds counter")
        prometheus_output.append(f'lfa_service_uptime_seconds{{service="lfa-legacy-go"}} {health.uptime}')
        
        # Memory metrics
        if "usage_percent" in health.memory:
            prometheus_output.append(f"# HELP lfa_memory_usage_percent Memory usage percentage")
            prometheus_output.append(f"# TYPE lfa_memory_usage_percent gauge")
            prometheus_output.append(f'lfa_memory_usage_percent{{service="lfa-legacy-go"}} {health.memory["usage_percent"]}')
        
        # CPU metrics
        if "usage_percent" in health.cpu:
            prometheus_output.append(f"# HELP lfa_cpu_usage_percent CPU usage percentage")
            prometheus_output.append(f"# TYPE lfa_cpu_usage_percent gauge")
            prometheus_output.append(f'lfa_cpu_usage_percent{{service="lfa-legacy-go"}} {health.cpu["usage_percent"]}')
        
        # Performance metrics
        if "total_requests" in performance:
            prometheus_output.append(f"# HELP lfa_requests_total Total number of requests")
            prometheus_output.append(f"# TYPE lfa_requests_total counter")
            prometheus_output.append(f'lfa_requests_total{{service="lfa-legacy-go"}} {performance["total_requests"]}')
            
        if "average_duration" in performance:
            prometheus_output.append(f"# HELP lfa_request_duration_seconds Average request duration")
            prometheus_output.append(f"# TYPE lfa_request_duration_seconds gauge")
            prometheus_output.append(f'lfa_request_duration_seconds{{service="lfa-legacy-go"}} {performance["average_duration"]}')
        
        return "\n".join(prometheus_output) + "\n"
        
    except Exception as e:
        return f"# Error generating metrics: {str(e)}\n"


@router.post("/alerts/test", summary="🧪 Test Alert System")
async def test_alert():
    """
    Trigger a test alert to verify monitoring system.
    
    Creates a test alert to validate:
    - Alert generation
    - Notification system
    - Monitoring pipeline
    """
    try:
        # Create test alert
        alert_manager._create_alert(
            "test_alert",
            "Test alert triggered manually for system validation"
        )
        
        return ResponseBuilder.success(
            data={"alert_created": True},
            message="Test alert created successfully"
        )
        
    except Exception as e:
        return ResponseBuilder.error(
            message="Failed to create test alert",
            error_code="TEST_ALERT_ERROR"
        )


@router.post("/cleanup", summary="🧹 Cleanup Monitoring Data")
async def cleanup_monitoring():
    """
    Clean up old monitoring data to prevent memory leaks.
    
    Removes:
    - Old metric points
    - Expired alerts
    - Stale performance data
    """
    try:
        cleanup_monitoring_data()
        
        return ResponseBuilder.success(
            data={"cleanup_completed": True},
            message="Monitoring data cleanup completed"
        )
        
    except Exception as e:
        return ResponseBuilder.error(
            message="Failed to cleanup monitoring data",
            error_code="CLEANUP_ERROR"
        )


@router.get("/status", summary="🚦 Simple Status Check")
async def simple_status():
    """
    Simple status endpoint for load balancer health checks.
    
    Returns basic service status without detailed metrics.
    Optimized for frequent polling by external systems.
    """
    try:
        health = health_checker.check_health()
        
        return JSONResponse(
            status_code=200 if health.status == "healthy" else 503,
            content={
                "status": health.status,
                "service": "lfa-legacy-go-api",
                "timestamp": health.timestamp
            }
        )
        
    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": "lfa-legacy-go-api",
                "timestamp": datetime.utcnow().isoformat()
            }
        )