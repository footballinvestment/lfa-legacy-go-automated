"""
Logging middleware for request/response tracking
"""

import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import log_api_request, get_logger

logger = get_logger("middleware")


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests and responses."""

    def __init__(self, app):
        super().__init__(app)
        self.logger = get_logger("access")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log details."""
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Get client information
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")

        # Start timing
        start_time = time.time()

        # Log incoming request
        self.logger.info(
            f"Incoming request: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "url": str(request.url),
                "client_ip": client_ip,
                "user_agent": user_agent,
                "query_params": dict(request.query_params),
            },
        )

        # Process request
        try:
            response = await call_next(request)
        except Exception as exc:
            # Log exception
            duration = time.time() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "url": str(request.url),
                    "duration": duration,
                    "error": str(exc),
                    "error_type": type(exc).__name__,
                },
                exc_info=True,
            )
            raise

        # Calculate response time
        process_time = time.time() - start_time

        # Add headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)

        # Get user ID if available
        user_id = getattr(request.state, "user_id", None)

        # Log response
        log_api_request(
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            response_time=process_time,
            user_id=user_id,
            request_id=request_id,
        )

        # Log slow requests
        if process_time > 1.0:  # Slow request threshold: 1 second
            logger.warning(
                f"Slow request detected: {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "url": str(request.url),
                    "duration": process_time,
                    "status_code": response.status_code,
                },
            )

        return response
