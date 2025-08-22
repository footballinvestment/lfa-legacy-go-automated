"""
Health check and monitoring endpoints
Provides system status, error metrics, and performance data
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from datetime import datetime

from ..core.error_monitoring import ErrorMonitor, get_system_health

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/")
def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint
    Returns simple status and timestamp
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "LFA Legacy GO Backend",
        "version": "1.0.0",
    }


@router.get("/detailed")
def detailed_health_check() -> Dict[str, Any]:
    """
    Detailed health check with system metrics
    Returns comprehensive health information
    """
    try:
        health_data = get_system_health()

        # Add additional system checks
        health_data.update(
            {
                "database": {
                    "status": "connected",  # In real app, check database connection
                    "response_time_ms": 15,  # Mock response time
                },
                "dependencies": {
                    "external_apis": "healthy",  # Check external API dependencies
                    "file_system": "healthy",  # Check file system access
                },
            }
        )

        logger.info(
            "Detailed health check requested",
            extra={
                "health_status": health_data["status"],
                "health_score": health_data["health_score"],
            },
        )

        return health_data

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Health check failed",
        )


@router.get("/errors")
def get_error_metrics(hours: int = 24) -> Dict[str, Any]:
    """
    Get error metrics for the specified time window

    Args:
        hours: Time window in hours (default: 24)
    """
    if hours > 168:  # Limit to 7 days
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Time window cannot exceed 168 hours (7 days)",
        )

    try:
        monitor = ErrorMonitor()
        error_summary = monitor.get_error_summary(time_window_hours=hours)

        logger.info(
            f"Error metrics requested for {hours} hours",
            extra={
                "time_window_hours": hours,
                "total_errors": error_summary["total_errors"],
            },
        )

        return error_summary

    except Exception as e:
        logger.error(f"Failed to get error metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve error metrics",
        )


@router.get("/performance")
def get_performance_metrics() -> Dict[str, Any]:
    """
    Get performance metrics summary
    """
    try:
        monitor = ErrorMonitor()
        performance_summary = monitor.get_performance_summary()

        logger.info(
            "Performance metrics requested",
            extra={
                "total_operations": performance_summary["summary"]["total_operations"],
                "avg_response_time": performance_summary["summary"][
                    "avg_response_time"
                ],
            },
        )

        return performance_summary

    except Exception as e:
        logger.error(f"Failed to get performance metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve performance metrics",
        )


@router.post("/clear-metrics")
def clear_old_metrics(hours: int = 48) -> Dict[str, Any]:
    """
    Clear metrics older than specified hours
    Requires admin authentication in production

    Args:
        hours: Clear metrics older than this many hours (default: 48)
    """
    if hours < 1 or hours > 168:  # Between 1 hour and 7 days
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hours must be between 1 and 168",
        )

    try:
        monitor = ErrorMonitor()
        monitor.clear_metrics(older_than_hours=hours)

        logger.info(
            f"Metrics cleared for data older than {hours} hours",
            extra={"cleared_hours": hours},
        )

        return {
            "status": "success",
            "message": f"Cleared metrics older than {hours} hours",
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to clear metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear metrics",
        )


@router.get("/alerts")
def get_active_alerts() -> Dict[str, Any]:
    """
    Get current active alerts and warnings
    """
    try:
        monitor = ErrorMonitor()

        # Get recent errors (last hour) to identify active issues
        error_summary = monitor.get_error_summary(time_window_hours=1)
        performance_summary = monitor.get_performance_summary()

        alerts = []
        warnings = []

        # Check for high error rates
        if error_summary["total_errors"] > 10:
            alerts.append(
                {
                    "type": "high_error_rate",
                    "severity": (
                        "critical" if error_summary["total_errors"] > 50 else "warning"
                    ),
                    "message": f"High error rate detected: {error_summary['total_errors']} errors in last hour",
                    "details": {
                        "error_count": error_summary["total_errors"],
                        "unique_types": error_summary["unique_error_types"],
                    },
                }
            )

        # Check for slow performance
        avg_response_time = performance_summary["summary"]["avg_response_time"]
        if avg_response_time > 1000:  # 1 second
            severity = "critical" if avg_response_time > 5000 else "warning"
            alerts.append(
                {
                    "type": "slow_performance",
                    "severity": severity,
                    "message": f"Slow average response time: {avg_response_time:.2f}ms",
                    "details": {
                        "avg_response_time_ms": avg_response_time,
                        "threshold_ms": 1000,
                    },
                }
            )

        # Check success rate
        success_rate = performance_summary["summary"]["overall_success_rate"]
        if success_rate < 0.95:  # 95%
            severity = "critical" if success_rate < 0.90 else "warning"
            alerts.append(
                {
                    "type": "low_success_rate",
                    "severity": severity,
                    "message": f"Low success rate: {success_rate:.1%}",
                    "details": {"success_rate": success_rate, "threshold": 0.95},
                }
            )

        logger.info(f"Alerts requested: {len(alerts)} alerts, {len(warnings)} warnings")

        return {
            "alerts": alerts,
            "warnings": warnings,
            "total_active_issues": len(alerts) + len(warnings),
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get alerts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve alerts",
        )
