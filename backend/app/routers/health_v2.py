"""
Production Health Check Router with Standardized API Responses
Enhanced health monitoring for production deployment
"""

from fastapi import APIRouter, Request, Depends
from datetime import datetime, timedelta
import psutil
import os
import time
from typing import Dict, Any

from app.core.api_response import ResponseBuilder, success_response
from app.core.database_production import db_config

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """
    Basic health check endpoint
    Returns simple health status for load balancers and monitoring systems
    """
    try:
        # Check if we're in test environment
        is_testing = os.getenv("TESTING", "false").lower() == "true"
        
        if is_testing:
            # In test environment, return healthy without database check
            is_healthy = True
            health_status = {"test_mode": True, "database": {"status": "healthy"}}
        else:
            # Production environment - do full health check
            health_status = db_config.health_check()
            is_healthy = health_status.get("database", {}).get("status") == "healthy"

        if is_healthy:
            return ResponseBuilder.success(
                data={
                    "status": "healthy",
                    "timestamp": datetime.utcnow().isoformat(),
                    "version": "3.0.0",
                    "service": "lfa-legacy-go-api",
                },
                message="Service is healthy",
                request_id=getattr(request.state, "request_id", None),
            )
        else:
            return ResponseBuilder.error(
                error_code="HEALTH_CHECK_FAILED",
                error_message="Service is unhealthy",
                details=health_status,
                status_code=503,
                request_id=getattr(request.state, "request_id", None),
            )

    except Exception as e:
        return ResponseBuilder.internal_error(
            message="Health check failed",
            error_details=str(e),
            request_id=getattr(request.state, "request_id", None),
        )


@router.get("/health/detailed")
async def detailed_health_check(request: Request):
    """
    Comprehensive health check with detailed system information
    """
    try:
        # Get database health
        db_health = db_config.health_check()

        # Get system metrics
        system_metrics = get_system_metrics()

        # Get application metrics
        app_metrics = get_application_metrics()

        # Determine overall status
        overall_status = determine_overall_health(db_health, system_metrics)

        health_data = {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "version": "3.0.0",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "uptime": get_uptime(),
            "database": db_health.get("database", {}),
            "cache": db_health.get("redis", {}),
            "connection_pool": db_health.get("connection_pool", {}),
            "system": system_metrics,
            "application": app_metrics,
        }

        status_code = 200 if overall_status == "healthy" else 503

        return ResponseBuilder.success(
            data=health_data,
            message=f"Detailed health check completed - Status: {overall_status}",
            status_code=status_code,
            request_id=getattr(request.state, "request_id", None),
        )

    except Exception as e:
        return ResponseBuilder.internal_error(
            message="Detailed health check failed",
            error_details=str(e),
            request_id=getattr(request.state, "request_id", None),
        )


@router.get("/health/live")
async def liveness_probe(request: Request):
    """
    Kubernetes/Docker liveness probe endpoint
    Simple check to determine if the application should be restarted
    """
    try:
        # Basic application responsiveness check
        start_time = time.time()

        # Test critical components
        test_results = {
            "application": True,  # If we reach here, app is responsive
            "database": False,
            "response_time": 0,
        }

        # Quick database ping
        try:
            with db_config.get_connection() as conn:
                conn.execute("SELECT 1")
            test_results["database"] = True
        except:
            test_results["database"] = False

        # Calculate response time
        test_results["response_time"] = round((time.time() - start_time) * 1000, 2)

        # Liveness criteria: app responds and database is accessible
        is_alive = test_results["application"] and test_results["database"]

        if is_alive:
            return ResponseBuilder.success(
                data=test_results,
                message="Application is alive",
                request_id=getattr(request.state, "request_id", None),
            )
        else:
            return ResponseBuilder.error(
                error_code="LIVENESS_CHECK_FAILED",
                error_message="Application is not responding properly",
                details=test_results,
                status_code=503,
                request_id=getattr(request.state, "request_id", None),
            )

    except Exception as e:
        return ResponseBuilder.internal_error(
            message="Liveness probe failed",
            error_details=str(e),
            request_id=getattr(request.state, "request_id", None),
        )


@router.get("/health/ready")
async def readiness_probe(request: Request):
    """
    Kubernetes/Docker readiness probe endpoint
    Check if the application is ready to serve traffic
    """
    try:
        readiness_checks = {
            "database": False,
            "cache": False,
            "configuration": False,
            "dependencies": False,
        }

        # Database readiness
        try:
            db_health = db_config.health_check()
            readiness_checks["database"] = (
                db_health.get("database", {}).get("status") == "healthy"
            )
        except:
            readiness_checks["database"] = False

        # Cache readiness (optional)
        try:
            cache_health = db_config.health_check()
            cache_status = cache_health.get("redis", {}).get("status")
            readiness_checks["cache"] = cache_status in ["healthy", "disabled"]
        except:
            readiness_checks["cache"] = True  # Optional component

        # Configuration readiness
        required_env_vars = ["DATABASE_URL"]
        readiness_checks["configuration"] = all(
            os.getenv(var) for var in required_env_vars
        )

        # Dependencies readiness (basic import test)
        try:
            import sqlalchemy
            import fastapi
            import redis

            readiness_checks["dependencies"] = True
        except ImportError:
            readiness_checks["dependencies"] = False

        # Overall readiness
        is_ready = all(readiness_checks.values())

        response_data = {
            "ready": is_ready,
            "checks": readiness_checks,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if is_ready:
            return ResponseBuilder.success(
                data=response_data,
                message="Application is ready to serve traffic",
                request_id=getattr(request.state, "request_id", None),
            )
        else:
            return ResponseBuilder.error(
                error_code="READINESS_CHECK_FAILED",
                error_message="Application is not ready to serve traffic",
                details=response_data,
                status_code=503,
                request_id=getattr(request.state, "request_id", None),
            )

    except Exception as e:
        return ResponseBuilder.internal_error(
            message="Readiness probe failed",
            error_details=str(e),
            request_id=getattr(request.state, "request_id", None),
        )


def get_system_metrics() -> Dict[str, Any]:
    """Get system performance metrics"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")

        return {
            "cpu": {"usage_percent": cpu_percent, "count": psutil.cpu_count()},
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "usage_percent": memory.percent,
                "used": memory.used,
            },
            "disk": {
                "total": disk.total,
                "free": disk.free,
                "usage_percent": (disk.used / disk.total) * 100,
            },
            "load_average": os.getloadavg() if hasattr(os, "getloadavg") else None,
        }
    except Exception as e:
        return {"error": f"Failed to get system metrics: {str(e)}"}


def get_application_metrics() -> Dict[str, Any]:
    """Get application-specific metrics"""
    try:
        process = psutil.Process()

        return {
            "process": {
                "pid": process.pid,
                "memory_usage": process.memory_info().rss,
                "cpu_percent": process.cpu_percent(),
                "create_time": datetime.fromtimestamp(
                    process.create_time()
                ).isoformat(),
                "threads": process.num_threads(),
            },
            "python": {
                "version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
                "executable": os.sys.executable,
            },
            "environment": {
                "python_path": os.sys.path[:3],  # First 3 entries
                "working_directory": os.getcwd(),
            },
        }
    except Exception as e:
        return {"error": f"Failed to get application metrics: {str(e)}"}


def get_uptime() -> str:
    """Get application uptime"""
    try:
        process = psutil.Process()
        create_time = datetime.fromtimestamp(process.create_time())
        uptime = datetime.now() - create_time
        return str(uptime).split(".")[0]  # Remove microseconds
    except:
        return "unknown"


def determine_overall_health(db_health: Dict, system_metrics: Dict) -> str:
    """Determine overall health status based on various checks"""

    # Critical checks
    db_healthy = db_health.get("database", {}).get("status") == "healthy"

    # System health thresholds
    cpu_usage = system_metrics.get("cpu", {}).get("usage_percent", 0)
    memory_usage = system_metrics.get("memory", {}).get("usage_percent", 0)
    disk_usage = system_metrics.get("disk", {}).get("usage_percent", 0)

    # Health determination logic
    if not db_healthy:
        return "unhealthy"

    if cpu_usage > 90 or memory_usage > 90 or disk_usage > 95:
        return "degraded"

    if cpu_usage > 70 or memory_usage > 70 or disk_usage > 80:
        return "warning"

    return "healthy"
