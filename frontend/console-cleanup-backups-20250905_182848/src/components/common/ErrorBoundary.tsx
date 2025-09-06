import React, { Component, ReactNode } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Stack,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import BugReportIcon from "@mui/icons-material/BugReport";

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send error to monitoring service
    if (process.env.NODE_ENV === "production") {
      // Example: sendErrorToMonitoringService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    // ✅ FIXED: Reset error state instead of page reload
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default error UI
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
          p={3}
        >
          <Paper elevation={3} sx={{ maxWidth: 600, p: 4 }}>
            <Stack spacing={3} alignItems="center">
              <BugReportIcon color="error" sx={{ fontSize: 64 }} />

              <Alert severity="error" sx={{ width: "100%" }}>
                <AlertTitle>Something went wrong</AlertTitle>
                An unexpected error occurred while rendering this component.
              </Alert>

              <Typography variant="body2" color="text.secondary" align="center">
                This error has been automatically logged. You can try refreshing
                the component or reloading the page to recover.
              </Typography>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>

                <Button variant="contained" onClick={this.handleReload}>
                  Reload Page
                </Button>
              </Stack>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <Box sx={{ mt: 3, width: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    Error Details (Development Only)
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: "grey.50",
                      maxHeight: 200,
                      overflow: "auto",
                    }}
                  >
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{ fontSize: 12 }}
                    >
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
