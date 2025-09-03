"""
Standardized API Response System
Consistent response formats for all API endpoints
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from uuid import uuid4
from pydantic import BaseModel
from fastapi import status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class ApiResponse(BaseModel):
    """Standard API response model"""

    success: bool
    data: Optional[Any] = None
    message: str = ""
    timestamp: str
    request_id: str

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class ApiError(BaseModel):
    """Standard API error model"""

    success: bool = False
    error: Dict[str, Any]
    message: str = ""
    timestamp: str
    request_id: str


class ResponseBuilder:
    """Builder class for creating standardized API responses"""

    @staticmethod
    def success(
        data: Any = None,
        message: str = "Success",
        status_code: int = status.HTTP_200_OK,
        request_id: Optional[str] = None,
    ) -> JSONResponse:
        """Create a successful API response"""

        response_data = ApiResponse(
            success=True,
            data=data,
            message=message,
            timestamp=datetime.utcnow().isoformat(),
            request_id=request_id or str(uuid4()),
        )

        return JSONResponse(status_code=status_code, content=response_data.dict())

    @staticmethod
    def error(
        error_code: str,
        error_message: str,
        details: Optional[Any] = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        request_id: Optional[str] = None,
    ) -> JSONResponse:
        """Create an error API response"""

        error_data = ApiError(
            success=False,
            error={"code": error_code, "message": error_message, "details": details},
            message=error_message,
            timestamp=datetime.utcnow().isoformat(),
            request_id=request_id or str(uuid4()),
        )

        return JSONResponse(status_code=status_code, content=error_data.dict())

    @staticmethod
    def validation_error(
        validation_errors: List[Dict],
        message: str = "Validation failed",
        request_id: Optional[str] = None,
    ) -> JSONResponse:
        """Create a validation error response"""

        return ResponseBuilder.error(
            error_code="VALIDATION_ERROR",
            error_message=message,
            details={"validation_errors": validation_errors},
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            request_id=request_id,
        )

    @staticmethod
    def not_found(
        resource: str = "Resource",
        resource_id: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> JSONResponse:
        """Create a not found error response"""

        message = f"{resource} not found"
        if resource_id:
            message += f" (ID: {resource_id})"

        return ResponseBuilder.error(
            error_code="NOT_FOUND",
            error_message=message,
            details={"resource": resource, "resource_id": resource_id},
            status_code=status.HTTP_404_NOT_FOUND,
            request_id=request_id,
        )

    @staticmethod
    def unauthorized(
        message: str = "Authentication required", request_id: Optional[str] = None
    ) -> JSONResponse:
        """Create an unauthorized error response"""

        return ResponseBuilder.error(
            error_code="UNAUTHORIZED",
            error_message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            request_id=request_id,
        )

    @staticmethod
    def forbidden(
        message: str = "Access denied", request_id: Optional[str] = None
    ) -> JSONResponse:
        """Create a forbidden error response"""

        return ResponseBuilder.error(
            error_code="FORBIDDEN",
            error_message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            request_id=request_id,
        )

    @staticmethod
    def internal_error(
        message: str = "Internal server error",
        error_details: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> JSONResponse:
        """Create an internal server error response"""

        # Log the error details for debugging
        if error_details:
            logger.error(f"Internal error: {error_details}")

        return ResponseBuilder.error(
            error_code="INTERNAL_ERROR",
            error_message=message,
            details={"error_id": request_id or str(uuid4())} if error_details else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            request_id=request_id,
        )

    @staticmethod
    def created(
        data: Any,
        message: str = "Resource created successfully",
        request_id: Optional[str] = None,
    ) -> JSONResponse:
        """Create a resource created response"""

        return ResponseBuilder.success(
            data=data,
            message=message,
            status_code=status.HTTP_201_CREATED,
            request_id=request_id,
        )

    @staticmethod
    def no_content(
        message: str = "Operation completed successfully",
        request_id: Optional[str] = None,
    ) -> JSONResponse:
        """Create a no content response"""

        return ResponseBuilder.success(
            data=None,
            message=message,
            status_code=status.HTTP_204_NO_CONTENT,
            request_id=request_id,
        )


# Convenience functions for common response types
def success_response(
    data: Any = None, message: str = "Success", status_code: int = status.HTTP_200_OK
) -> JSONResponse:
    """Quick success response"""
    return ResponseBuilder.success(data, message, status_code)


def error_response(
    error_code: str,
    message: str,
    details: Any = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> JSONResponse:
    """Quick error response"""
    return ResponseBuilder.error(error_code, message, details, status_code)


def paginated_response(
    items: List[Any],
    total: int,
    page: int = 1,
    per_page: int = 10,
    message: str = "Success",
) -> JSONResponse:
    """Create a paginated response"""

    total_pages = (total + per_page - 1) // per_page

    pagination_data = {
        "items": items,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    }

    return success_response(pagination_data, message)


# Custom exception classes for automatic error handling
class ApiException(Exception):
    """Base API exception"""

    def __init__(
        self,
        error_code: str,
        message: str,
        details: Any = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
    ):
        self.error_code = error_code
        self.message = message
        self.details = details
        self.status_code = status_code
        super().__init__(message)


class ValidationException(ApiException):
    """Validation error exception"""

    def __init__(self, message: str, validation_errors: List[Dict]):
        super().__init__(
            error_code="VALIDATION_ERROR",
            message=message,
            details={"validation_errors": validation_errors},
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )


class NotFoundException(ApiException):
    """Resource not found exception"""

    def __init__(self, resource: str, resource_id: Optional[str] = None):
        message = f"{resource} not found"
        if resource_id:
            message += f" (ID: {resource_id})"

        super().__init__(
            error_code="NOT_FOUND",
            message=message,
            details={"resource": resource, "resource_id": resource_id},
            status_code=status.HTTP_404_NOT_FOUND,
        )


class UnauthorizedException(ApiException):
    """Unauthorized access exception"""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            error_code="UNAUTHORIZED",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class ForbiddenException(ApiException):
    """Forbidden access exception"""

    def __init__(self, message: str = "Access denied"):
        super().__init__(
            error_code="FORBIDDEN",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


# HTTP status code constants for easy reference
class StatusCodes:
    """HTTP status codes for API responses"""

    # Success codes
    OK = 200
    CREATED = 201
    ACCEPTED = 202
    NO_CONTENT = 204

    # Client error codes
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    METHOD_NOT_ALLOWED = 405
    CONFLICT = 409
    UNPROCESSABLE_ENTITY = 422
    TOO_MANY_REQUESTS = 429

    # Server error codes
    INTERNAL_SERVER_ERROR = 500
    BAD_GATEWAY = 502
    SERVICE_UNAVAILABLE = 503
    GATEWAY_TIMEOUT = 504
