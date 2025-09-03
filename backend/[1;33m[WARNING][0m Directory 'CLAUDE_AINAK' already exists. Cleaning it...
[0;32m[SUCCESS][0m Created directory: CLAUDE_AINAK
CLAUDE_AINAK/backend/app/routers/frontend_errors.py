"""
Frontend error logging endpoint
"""

from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import APIRouter, Request
from pydantic import BaseModel
from app.core.logging import get_logger

logger = get_logger("frontend_errors")
router = APIRouter()


class FrontendErrorLog(BaseModel):
    """Frontend error log entry model."""

    errorId: str
    type: str  # 'api', 'runtime', 'network', 'validation'
    message: str
    stack: Optional[str] = None
    timestamp: str
    url: str
    userId: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


@router.post("/frontend-errors")
async def log_frontend_error(error_log: FrontendErrorLog, request: Request):
    """Log frontend error to backend logging system."""

    try:
        # Get client information
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")

        # Enhanced logging with client context
        logger.error(
            f"Frontend {error_log.type.upper()} Error: {error_log.message}",
            extra={
                "error_id": error_log.errorId,
                "error_type": error_log.type,
                "frontend_url": error_log.url,
                "user_id": error_log.userId,
                "client_ip": client_ip,
                "user_agent": user_agent,
                "stack_trace": error_log.stack,
                "error_details": error_log.details,
                "error_timestamp": error_log.timestamp,
            },
        )

        return {
            "success": True,
            "message": "Error logged successfully",
            "errorId": error_log.errorId,
        }

    except Exception as e:
        logger.error(f"Failed to log frontend error: {str(e)}", exc_info=True)
        return {"success": False, "message": "Failed to log error", "error": str(e)}
