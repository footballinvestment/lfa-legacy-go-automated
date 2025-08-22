"""
Custom exceptions and error handling for LFA Legacy GO
"""

from typing import Any, Optional
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)


class LFAException(Exception):
    """Base exception for LFA Legacy GO application."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(LFAException):
    """Authentication related errors."""

    def __init__(
        self, message: str = "Authentication failed", details: Optional[dict] = None
    ):
        super().__init__(
            message=message, status_code=401, error_code="AUTH_ERROR", details=details
        )


class AuthorizationError(LFAException):
    """Authorization related errors."""

    def __init__(self, message: str = "Access denied", details: Optional[dict] = None):
        super().__init__(
            message=message,
            status_code=403,
            error_code="ACCESS_DENIED",
            details=details,
        )


class ValidationError(LFAException):
    """Validation related errors."""

    def __init__(
        self, message: str, field: Optional[str] = None, details: Optional[dict] = None
    ):
        if field and not details:
            details = {"field": field}
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class NotFoundError(LFAException):
    """Resource not found errors."""

    def __init__(
        self, message: str = "Resource not found", resource: Optional[str] = None
    ):
        details = {"resource": resource} if resource else {}
        super().__init__(
            message=message, status_code=404, error_code="NOT_FOUND", details=details
        )


class DatabaseError(LFAException):
    """Database related errors."""

    def __init__(
        self, message: str = "Database operation failed", details: Optional[dict] = None
    ):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR",
            details=details,
        )


class TournamentError(LFAException):
    """Tournament related errors."""

    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="TOURNAMENT_ERROR",
            details=details,
        )


class CreditError(LFAException):
    """Credit system related errors."""

    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(
            message=message, status_code=400, error_code="CREDIT_ERROR", details=details
        )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler for all unhandled exceptions."""

    # Handle custom LFA exceptions
    if isinstance(exc, LFAException):
        logger.warning(
            f"LFA Exception: {exc.error_code} - {exc.message}",
            extra={
                "error_code": exc.error_code,
                "status_code": exc.status_code,
                "details": exc.details,
                "url": str(request.url),
                "method": request.method,
            },
        )

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.error_code,
                    "message": exc.message,
                    "details": exc.details,
                },
                "timestamp": "2025-01-01T00:00:00Z",  # Will be updated by middleware
            },
        )

    # Handle FastAPI HTTPException
    elif isinstance(exc, HTTPException):
        logger.warning(
            f"HTTP Exception: {exc.status_code} - {exc.detail}",
            extra={
                "status_code": exc.status_code,
                "detail": exc.detail,
                "url": str(request.url),
                "method": request.method,
            },
        )

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {"code": "HTTP_ERROR", "message": exc.detail, "details": {}},
                "timestamp": "2025-01-01T00:00:00Z",
            },
        )

    # Handle SQLAlchemy database errors
    elif isinstance(exc, SQLAlchemyError):
        logger.error(
            f"Database Error: {str(exc)}",
            extra={
                "error_type": type(exc).__name__,
                "url": str(request.url),
                "method": request.method,
            },
            exc_info=True,
        )

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "DATABASE_ERROR",
                    "message": "Database operation failed",
                    "details": {"type": type(exc).__name__},
                },
                "timestamp": "2025-01-01T00:00:00Z",
            },
        )

    # Handle all other exceptions
    else:
        logger.error(
            f"Unhandled Exception: {str(exc)}",
            extra={
                "error_type": type(exc).__name__,
                "url": str(request.url),
                "method": request.method,
            },
            exc_info=True,
        )

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                    "details": {"type": type(exc).__name__},
                },
                "timestamp": "2025-01-01T00:00:00Z",
            },
        )
