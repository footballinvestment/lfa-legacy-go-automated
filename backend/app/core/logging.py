"""
Centralized logging configuration for LFA Legacy GO
"""

import logging
import logging.handlers
import os
import sys
from datetime import datetime
from typing import Dict, Any
import json
from pathlib import Path


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add extra fields
        if hasattr(record, "user_id"):
            log_entry["user_id"] = record.user_id
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if hasattr(record, "url"):
            log_entry["url"] = record.url
        if hasattr(record, "method"):
            log_entry["method"] = record.method
        if hasattr(record, "status_code"):
            log_entry["status_code"] = record.status_code
        if hasattr(record, "error_code"):
            log_entry["error_code"] = record.error_code
        if hasattr(record, "details"):
            log_entry["details"] = record.details

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def setup_logging(
    log_level: str = "INFO",
    log_dir: str = "logs",
    enable_file_logging: bool = True,
    enable_json_logging: bool = False,
    max_file_size: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5,
) -> None:
    """
    Configure application logging with file rotation and structured logging.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files
        enable_file_logging: Whether to enable file logging
        enable_json_logging: Whether to use JSON format for logs
        max_file_size: Maximum size for each log file before rotation
        backup_count: Number of backup files to keep
    """

    # Create logs directory if it doesn't exist
    if enable_file_logging:
        Path(log_dir).mkdir(exist_ok=True)

    # Set logging level
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # Remove any existing handlers
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Configure formatters
    if enable_json_logging:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(formatter)

    # Configure root logger
    root_logger.setLevel(numeric_level)
    root_logger.addHandler(console_handler)

    if enable_file_logging:
        # Application log file (rotating)
        app_log_file = os.path.join(log_dir, "lfa_legacy_go.log")
        app_handler = logging.handlers.RotatingFileHandler(
            app_log_file,
            maxBytes=max_file_size,
            backupCount=backup_count,
            encoding="utf-8",
        )
        app_handler.setLevel(numeric_level)
        app_handler.setFormatter(formatter)
        root_logger.addHandler(app_handler)

        # Error log file (errors and critical only)
        error_log_file = os.path.join(log_dir, "lfa_legacy_go_errors.log")
        error_handler = logging.handlers.RotatingFileHandler(
            error_log_file,
            maxBytes=max_file_size,
            backupCount=backup_count,
            encoding="utf-8",
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        root_logger.addHandler(error_handler)

        # Access log file (HTTP requests)
        access_log_file = os.path.join(log_dir, "lfa_legacy_go_access.log")
        access_handler = logging.handlers.RotatingFileHandler(
            access_log_file,
            maxBytes=max_file_size,
            backupCount=backup_count,
            encoding="utf-8",
        )
        access_handler.setLevel(logging.INFO)
        access_handler.setFormatter(formatter)

        # Create access logger
        access_logger = logging.getLogger("lfa_legacy_go.access")
        access_logger.addHandler(access_handler)
        access_logger.setLevel(logging.INFO)
        access_logger.propagate = False

    # Set specific logger levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.INFO)

    # Application loggers
    logging.getLogger("lfa_legacy_go").setLevel(numeric_level)
    logging.getLogger("app").setLevel(numeric_level)


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name."""
    return logging.getLogger(f"lfa_legacy_go.{name}")


class RequestLogger:
    """Context manager for request-specific logging."""

    def __init__(self, request_id: str, user_id: str = None):
        self.request_id = request_id
        self.user_id = user_id
        self.logger = get_logger("request")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def log(self, level: int, message: str, **kwargs):
        """Log with request context."""
        extra = {"request_id": self.request_id, "user_id": self.user_id, **kwargs}
        self.logger.log(level, message, extra=extra)

    def info(self, message: str, **kwargs):
        self.log(logging.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs):
        self.log(logging.WARNING, message, **kwargs)

    def error(self, message: str, **kwargs):
        self.log(logging.ERROR, message, **kwargs)

    def debug(self, message: str, **kwargs):
        self.log(logging.DEBUG, message, **kwargs)


def log_api_request(
    method: str,
    url: str,
    status_code: int,
    response_time: float,
    user_id: str = None,
    request_id: str = None,
):
    """Log API request with structured data."""
    access_logger = logging.getLogger("lfa_legacy_go.access")

    extra = {
        "method": method,
        "url": url,
        "status_code": status_code,
        "response_time": response_time,
        "user_id": user_id,
        "request_id": request_id,
    }

    access_logger.info(
        f"{method} {url} - {status_code} - {response_time:.3f}s", extra=extra
    )


def log_database_operation(
    operation: str,
    table: str,
    duration: float = None,
    affected_rows: int = None,
    user_id: str = None,
):
    """Log database operations."""
    db_logger = get_logger("database")

    extra = {
        "operation": operation,
        "table": table,
        "duration": duration,
        "affected_rows": affected_rows,
        "user_id": user_id,
    }

    message = f"DB {operation} on {table}"
    if duration:
        message += f" - {duration:.3f}s"
    if affected_rows is not None:
        message += f" - {affected_rows} rows"

    db_logger.info(message, extra=extra)


def log_authentication_event(
    event_type: str,
    username: str,
    success: bool,
    ip_address: str = None,
    user_agent: str = None,
):
    """Log authentication events."""
    auth_logger = get_logger("auth")

    extra = {
        "event_type": event_type,
        "username": username,
        "success": success,
        "ip_address": ip_address,
        "user_agent": user_agent,
    }

    level = logging.INFO if success else logging.WARNING
    message = f"Auth {event_type} {'SUCCESS' if success else 'FAILED'} for {username}"

    auth_logger.log(level, message, extra=extra)
