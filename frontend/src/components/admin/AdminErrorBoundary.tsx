import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Stack,
  Chip
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ErrorBoundary from '../common/ErrorBoundary';

interface AdminErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
}

const AdminErrorFallback: React.FC<AdminErrorFallbackProps> = ({ 
  error, 
  resetError 
}) => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="500px"
      p={3}
    >
      <Paper elevation={3} sx={{ maxWidth: 700, p: 4 }}>
        <Stack spacing={3} alignItems="center">
          <AdminPanelSettingsIcon color="error" sx={{ fontSize: 64 }} />
          
          <Chip 
            label="Admin Panel Error" 
            color="error" 
            variant="outlined"
            size="medium"
          />
          
          <Alert severity="error" sx={{ width: '100%' }}>
            <AlertTitle>Admin Panel Error</AlertTitle>
            The admin interface encountered an unexpected error. This could be due to:
            <ul style={{ margin: '8px 0 0 20px' }}>
              <li>Network connectivity issues</li>
              <li>Server-side errors</li>
              <li>Invalid data format</li>
              <li>Permission changes</li>
            </ul>
          </Alert>

          <Typography variant="body1" color="text.secondary" align="center">
            Your admin session is still active. You can try to recover by refreshing 
            the component or navigating to a different admin section.
          </Typography>

          <Stack direction="row" spacing={2}>
            {resetError && (
              <Button
                variant="outlined"
                onClick={resetError}
              >
                Try Again
              </Button>
            )}
            
            <Button
              variant="contained"
              onClick={() => window.location.href = '/admin'}
            >
              Return to Admin Home
            </Button>
          </Stack>

          {process.env.NODE_ENV === 'development' && error && (
            <Box sx={{ mt: 3, width: '100%' }}>
              <Typography variant="h6" gutterBottom color="error">
                Development Error Details
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ p: 2, bgcolor: '#fff3e0', maxHeight: 250, overflow: 'auto' }}
              >
                <Typography variant="body2" component="pre" sx={{ fontSize: 11 }}>
                  {error.toString()}
                </Typography>
              </Paper>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

interface AdminErrorBoundaryProps {
  children: React.ReactNode;
  section?: string;
}

const AdminErrorBoundary: React.FC<AdminErrorBoundaryProps> = ({ 
  children, 
  section 
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log admin-specific error details
    console.error(`Admin Error in ${section || 'Unknown Section'}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // In production, send to monitoring service with admin context
    if (process.env.NODE_ENV === 'production') {
      // Example: sendAdminErrorToMonitoring({
      //   error,
      //   errorInfo,
      //   section,
      //   adminContext: true
      // });
    }
  };

  return (
    <ErrorBoundary 
      fallbackComponent={<AdminErrorFallback />}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};

export default AdminErrorBoundary;