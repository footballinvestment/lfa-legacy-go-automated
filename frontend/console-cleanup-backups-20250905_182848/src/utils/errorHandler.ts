export interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, any>;
  };
  timestamp: string;
}

export interface ErrorLogEntry {
  errorId: string;
  type: "api" | "runtime" | "network" | "validation";
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  userId: string | null;
  details?: Record<string, any>;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: ErrorLogEntry[] = [];
  private maxErrors = 50;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | null {
    return localStorage.getItem("userId") || sessionStorage.getItem("userId");
  }

  private logToService(errorData: ErrorLogEntry): void {
    try {
      fetch("/api/frontend-errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      }).catch((error) => {
        console.error("Failed to send error to logging service:", error);
      });
    } catch (error) {
      console.error("Error logging service failed:", error);
    }
  }

  private storeError(errorData: ErrorLogEntry): void {
    this.errors.push(errorData);

    // Keep only the latest errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Store in localStorage for debugging
    try {
      localStorage.setItem(
        "lfa_frontend_errors",
        JSON.stringify(this.errors.slice(-10))
      );
    } catch (error) {
      console.warn("Could not store errors in localStorage:", error);
    }
  }

  logError(
    type: ErrorLogEntry["type"],
    message: string,
    error?: Error,
    details?: Record<string, any>
  ): string {
    const errorId = this.generateErrorId();
    const errorData: ErrorLogEntry = {
      errorId,
      type,
      message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.getUserId(),
      details,
    };

    // Log to console in development only
    if (process.env.NODE_ENV === "development") {
      // Development logging removed for production cleanliness
    }

    // Store locally
    this.storeError(errorData);

    // Send to logging service
    this.logToService(errorData);

    return errorId;
  }

  handleAPIError(error: any, context?: string): APIError | null {
    try {
      // Handle different error formats
      let apiError: APIError;

      if (error.response?.data && "error" in error.response.data) {
        // Standard API error response
        apiError = error.response.data;
      } else if (error.response?.status) {
        // HTTP error without standard format
        apiError = {
          success: false,
          error: {
            code: `HTTP_${error.response.status}`,
            message: error.response.statusText || "HTTP Error",
            details: { status: error.response.status },
          },
          timestamp: new Date().toISOString(),
        };
      } else if (error.message) {
        // Network or other errors
        apiError = {
          success: false,
          error: {
            code: "NETWORK_ERROR",
            message: error.message,
            details: {},
          },
          timestamp: new Date().toISOString(),
        };
      } else {
        // Unknown error format
        apiError = {
          success: false,
          error: {
            code: "UNKNOWN_ERROR",
            message: "An unexpected error occurred",
            details: {},
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Log the error
      this.logError("api", `API Error: ${apiError.error.message}`, error, {
        context,
        errorCode: apiError.error.code,
        statusCode: error.response?.status,
      });

      return apiError;
    } catch (handlingError) {
      console.error("Error handling API error:", handlingError);
      return null;
    }
  }

  getStoredErrors(): ErrorLogEntry[] {
    return [...this.errors];
  }

  clearStoredErrors(): void {
    this.errors = [];
    localStorage.removeItem("lfa_frontend_errors");
  }

  getUserFriendlyMessage(error: APIError | Error | string): string {
    if (typeof error === "string") {
      return error;
    }

    if (error instanceof Error) {
      // Common error patterns
      if (error.message.includes("Network Error")) {
        return "Unable to connect to the server. Please check your internet connection.";
      }
      if (error.message.includes("timeout")) {
        return "The request took too long. Please try again.";
      }
      return "An unexpected error occurred. Please try again.";
    }

    // APIError
    const { code, message } = error.error;

    switch (code) {
      case "AUTH_ERROR":
        return "Please log in to continue.";
      case "ACCESS_DENIED":
        return "You do not have permission to perform this action.";
      case "VALIDATION_ERROR":
        return message || "Please check your input and try again.";
      case "NOT_FOUND":
        return "The requested item could not be found.";
      case "DATABASE_ERROR":
        return "A temporary issue occurred. Please try again later.";
      case "TOURNAMENT_ERROR":
        return message || "There was an issue with the tournament operation.";
      case "CREDIT_ERROR":
        return message || "There was an issue with the credit operation.";
      case "NETWORK_ERROR":
        return "Unable to connect to the server. Please check your connection.";
      case "HTTP_401":
        return "Your session has expired. Please log in again.";
      case "HTTP_403":
        return "You do not have permission to access this resource.";
      case "HTTP_404":
        return "The requested page or resource was not found.";
      case "HTTP_429":
        return "Too many requests. Please wait a moment and try again.";
      case "HTTP_500":
        return "A server error occurred. Please try again later.";
      default:
        return message || "An unexpected error occurred. Please try again.";
    }
  }
}

// Global error handlers
export const setupGlobalErrorHandlers = (): void => {
  const errorHandler = ErrorHandler.getInstance();

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    errorHandler.logError(
      "runtime",
      "Unhandled Promise Rejection",
      new Error(event.reason),
      { reason: event.reason }
    );
  });

  // Handle global JavaScript errors
  window.addEventListener("error", (event) => {
    errorHandler.logError("runtime", "Global JavaScript Error", event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
};

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
export default ErrorHandler;
