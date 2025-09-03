"""
Logging configuration for LFA Legacy GO backend
Provides structured logging with different levels and formats
"""

import logging
import logging.config
import json
import sys
from datetime import datetime
from typing import Any, Dict
from pathlib import Path


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add extra fields if present
        if hasattr(record, "actor_id"):
            log_entry["actor_id"] = record.actor_id
        if hasattr(record, "target_user_id"):
            log_entry["target_user_id"] = record.target_user_id
        if hasattr(record, "action"):
            log_entry["action"] = record.action
        if hasattr(record, "details"):
            log_entry["details"] = record.details
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


class ModerationFilter(logging.Filter):
    """Filter for moderation-specific logs"""

    def filter(self, record: logging.LogRecord) -> bool:
        # Only allow logs from moderation modules or with moderation context
        moderation_modules = [
            "app.services.moderation_service",
            "app.routers.admin",
            "app.models.moderation",
        ]

        return (
            record.name in moderation_modules
            or hasattr(record, "action")
            or hasattr(record, "actor_id")
        )


def setup_logging(
    log_level: str = "INFO",
    log_format: str = "json",
    log_file: str = "app.log",
    enable_console: bool = True,
) -> None:
    """
    Setup logging configuration

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_format: Format type ('json' or 'text')
        log_file: Log file path
        enable_console: Whether to log to console
    """

    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Full path to log file
    log_file_path = log_dir / log_file

    # Configure formatters
    formatters = {
        "json": {"()": JSONFormatter},
        "text": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "detailed": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(funcName)s:%(lineno)d - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    }

    # Configure handlers
    handlers = {
        "console": {
            "class": "logging.StreamHandler",
            "level": log_level,
            "formatter": "text" if log_format != "json" else "json",
            "stream": sys.stdout,
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": log_level,
            "formatter": log_format,
            "filename": str(log_file_path),
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "encoding": "utf-8",
        },
        "moderation_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": log_level,
            "formatter": "json",
            "filename": str(log_dir / "moderation.log"),
            "maxBytes": 5242880,  # 5MB
            "backupCount": 10,
            "encoding": "utf-8",
            "filters": ["moderation_filter"],
        },
    }

    # Configure loggers
    loggers = {
        "app.services.moderation_service": {
            "level": log_level,
            "handlers": ["file", "moderation_file"]
            + (["console"] if enable_console else []),
            "propagate": False,
        },
        "app.routers.admin": {
            "level": log_level,
            "handlers": ["file", "moderation_file"]
            + (["console"] if enable_console else []),
            "propagate": False,
        },
        "app.models.moderation": {
            "level": log_level,
            "handlers": ["file"],
            "propagate": False,
        },
        "uvicorn.access": {"level": "INFO", "handlers": ["file"], "propagate": False},
    }

    # Configure filters
    filters = {"moderation_filter": {"()": ModerationFilter}}

    # Root logger configuration
    root_config = {
        "level": log_level,
        "handlers": ["file"] + (["console"] if enable_console else []),
    }

    # Complete logging configuration
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": formatters,
        "filters": filters,
        "handlers": handlers,
        "loggers": loggers,
        "root": root_config,
    }

    # Apply configuration
    logging.config.dictConfig(logging_config)

    # Log startup message
    logger = logging.getLogger(__name__)
    logger.info(
        f"Logging configured: level={log_level}, format={log_format}, file={log_file_path}"
    )


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name"""
    return logging.getLogger(name)


def log_moderation_action(
    logger: logging.Logger,
    action: str,
    actor_id: int,
    target_user_id: int = None,
    details: Dict[str, Any] = None,
    level: str = "INFO",
) -> None:
    """
    Log a moderation action with structured data

    Args:
        logger: Logger instance
        action: Action performed
        actor_id: ID of the user performing the action
        target_user_id: ID of the target user (if applicable)
        details: Additional details about the action
        level: Log level
    """
    log_method = getattr(logger, level.lower())
    log_method(
        f"Moderation action: {action}",
        extra={
            "action": action,
            "actor_id": actor_id,
            "target_user_id": target_user_id,
            "details": details or {},
        },
    )


def log_api_error(
    logger: logging.Logger,
    endpoint: str,
    method: str,
    error: Exception,
    user_id: int = None,
    request_data: Dict[str, Any] = None,
) -> None:
    """
    Log API errors with context

    Args:
        logger: Logger instance
        endpoint: API endpoint
        method: HTTP method
        error: Exception that occurred
        user_id: User ID if available
        request_data: Request data that caused the error
    """
    logger.error(
        f"API Error in {method} {endpoint}: {str(error)}",
        extra={
            "endpoint": endpoint,
            "method": method,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "user_id": user_id,
            "request_data": request_data,
        },
        exc_info=True,
    )


def log_performance_metric(
    logger: logging.Logger,
    operation: str,
    duration_ms: float,
    success: bool = True,
    details: Dict[str, Any] = None,
) -> None:
    """
    Log performance metrics

    Args:
        logger: Logger instance
        operation: Operation name
        duration_ms: Duration in milliseconds
        success: Whether operation was successful
        details: Additional performance details
    """
    logger.info(
        f"Performance: {operation} took {duration_ms:.2f}ms",
        extra={
            "operation": operation,
            "duration_ms": duration_ms,
            "success": success,
            "details": details or {},
        },
    )
