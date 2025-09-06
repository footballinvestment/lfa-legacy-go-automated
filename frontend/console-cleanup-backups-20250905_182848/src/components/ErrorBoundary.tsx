import React, { Component, ReactNode, ErrorInfo } from "react";
import { Box, Typography, Button, Alert, AlertTitle } from "@mui/material";
import { Home, Refresh, BugReport } from "@mui/icons-material";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught an error:", error);
      console.error("Error Info:", errorInfo);
    }

    // Log error to monitoring service
    this.logErrorToService(error, errorInfo, errorId);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    try {
      const errorData = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem("userId") || "anonymous",
      };

      // Send to logging endpoint
      fetch("/api/frontend-errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      }).catch((fetchError) => {
        console.error("Failed to log error to service:", fetchError);
      });

      // Store in localStorage for debugging
      const storedErrors = JSON.parse(
        localStorage.getItem("lfa_errors") || "[]"
      );
      storedErrors.push(errorData);

      // Keep only last 10 errors
      if (storedErrors.length > 10) {
        storedErrors.shift();
      }

      localStorage.setItem("lfa_errors", JSON.stringify(storedErrors));
    } catch (loggingError) {
      console.error("Error logging failed:", loggingError);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    const subject = `Bug Report - Error ID: ${errorId}`;
    const body = `Error Details:\n${JSON.stringify(errorReport, null, 2)}`;
    const mailtoUrl = `mailto:support@lfagolegacy.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(mailtoUrl);
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            p: 3,
            backgroundColor: "#f5f5f5",
          }}
        >
          <Alert
            severity="error"
            sx={{
              mb: 3,
              maxWidth: "600px",
              width: "100%",
            }}
          >
            <AlertTitle>Oops! Something went wrong</AlertTitle>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We're sorry, but something unexpected happened. Our team has been
              notified and is working to fix this issue.
            </Typography>
            {this.state.errorId && (
              <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                Error ID: {this.state.errorId}
              </Typography>
            )}
          </Alert>

          {process.env.NODE_ENV === "development" && (
            <Alert
              severity="warning"
              sx={{ mb: 3, maxWidth: "600px", width: "100%" }}
            >
              <AlertTitle>Development Debug Info</AlertTitle>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Error:</strong> {this.state.error?.message}
              </Typography>
              <details>
                <summary>Stack Trace</summary>
                <pre style={{ fontSize: "12px", overflow: "auto" }}>
                  {this.state.error?.stack}
                </pre>
              </details>
            </Alert>
          )}

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<Refresh />}
              onClick={this.handleReload}
            >
              Reload Page
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Home />}
              onClick={this.handleGoHome}
            >
              Go Home
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<BugReport />}
              onClick={this.handleReportBug}
            >
              Report Bug
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 3, textAlign: "center" }}
          >
            If this problem persists, please contact our support team.
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
