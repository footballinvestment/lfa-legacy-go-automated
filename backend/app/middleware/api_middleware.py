"""
API Middleware for request handling, logging, and error management
"""

from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from uuid import uuid4
import time
import logging
import json
from typing import Callable

from app.core.api_response import ResponseBuilder, ApiException

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request logging and ID tracking"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate unique request ID
        request_id = str(uuid4())
        request.state.request_id = request_id

        # Start timing
        start_time = time.time()

        # Log request
        client_ip = self.get_client_ip(request)
        logger.info(
            f"Request {request_id}: {request.method} {request.url.path} "
            f"from {client_ip}"
        )

        # Process request
        try:
            response = await call_next(request)

            # Calculate processing time
            process_time = time.time() - start_time

            # Add headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))

            # Log response
            logger.info(
                f"Response {request_id}: {response.status_code} "
                f"in {process_time*1000:.2f}ms"
            )

            return response

        except Exception as e:
            process_time = time.time() - start_time

            # Log error
            logger.error(
                f"Error {request_id}: {str(e)} " f"in {process_time*1000:.2f}ms"
            )

            # Handle different exception types
            if isinstance(e, ApiException):
                return ResponseBuilder.error(
                    error_code=e.error_code,
                    error_message=e.message,
                    details=e.details,
                    status_code=e.status_code,
                    request_id=request_id,
                )
            elif isinstance(e, HTTPException):
                return ResponseBuilder.error(
                    error_code="HTTP_ERROR",
                    error_message=e.detail if hasattr(e, "detail") else str(e),
                    status_code=e.status_code,
                    request_id=request_id,
                )
            else:
                # Unexpected error
                return ResponseBuilder.internal_error(
                    message="An unexpected error occurred",
                    error_details=str(e),
                    request_id=request_id,
                )

    def get_client_ip(self, request: Request) -> str:
        """Get client IP address from request"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"


class CORSMiddleware(BaseHTTPMiddleware):
    """Custom CORS middleware with production settings"""

    def __init__(
        self, app, allowed_origins: list = None, allow_credentials: bool = True
    ):
        super().__init__(app)
        self.allowed_origins = allowed_origins or ["*"]
        self.allow_credentials = allow_credentials

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        origin = request.headers.get("origin")

        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            response.headers["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, DELETE, OPTIONS"
            )
            response.headers["Access-Control-Allow-Headers"] = (
                "Content-Type, Authorization, X-Request-ID"
            )
            response.headers["Access-Control-Max-Age"] = "86400"
        else:
            response = await call_next(request)

        # Add CORS headers
        if self.is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            if self.allow_credentials:
                response.headers["Access-Control-Allow-Credentials"] = "true"

        return response

    def is_origin_allowed(self, origin: str) -> bool:
        """Check if origin is allowed"""
        if not origin:
            return False

        if "*" in self.allowed_origins:
            return True

        return origin in self.allowed_origins


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Security headers
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": "default-src 'self'",
        }

        for header, value in security_headers.items():
            response.headers[header] = value

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware"""

    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.request_counts = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = self.get_client_ip(request)
        current_time = time.time()

        # Clean old entries
        self.cleanup_old_entries(current_time)

        # Check rate limit
        if self.is_rate_limited(client_ip, current_time):
            return ResponseBuilder.error(
                error_code="RATE_LIMITED",
                error_message="Too many requests",
                details={
                    "max_requests": self.max_requests,
                    "window_seconds": self.window_seconds,
                },
                status_code=429,
            )

        # Record request
        self.record_request(client_ip, current_time)

        return await call_next(request)

    def get_client_ip(self, request: Request) -> str:
        """Get client IP from request"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def is_rate_limited(self, client_ip: str, current_time: float) -> bool:
        """Check if client is rate limited"""
        if client_ip not in self.request_counts:
            return False

        recent_requests = [
            req_time
            for req_time in self.request_counts[client_ip]
            if current_time - req_time < self.window_seconds
        ]

        return len(recent_requests) >= self.max_requests

    def record_request(self, client_ip: str, current_time: float):
        """Record a request for rate limiting"""
        if client_ip not in self.request_counts:
            self.request_counts[client_ip] = []

        self.request_counts[client_ip].append(current_time)

    def cleanup_old_entries(self, current_time: float):
        """Clean up old request entries"""
        for client_ip in list(self.request_counts.keys()):
            self.request_counts[client_ip] = [
                req_time
                for req_time in self.request_counts[client_ip]
                if current_time - req_time < self.window_seconds
            ]

            if not self.request_counts[client_ip]:
                del self.request_counts[client_ip]


class RequestSizeMiddleware(BaseHTTPMiddleware):
    """Middleware to limit request body size"""

    def __init__(self, app, max_size: int = 10 * 1024 * 1024):  # 10MB default
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        content_length = request.headers.get("content-length")

        if content_length and int(content_length) > self.max_size:
            return ResponseBuilder.error(
                error_code="REQUEST_TOO_LARGE",
                error_message=f"Request body too large. Maximum size: {self.max_size} bytes",
                details={
                    "max_size": self.max_size,
                    "received_size": int(content_length),
                },
                status_code=413,
            )

        return await call_next(request)
