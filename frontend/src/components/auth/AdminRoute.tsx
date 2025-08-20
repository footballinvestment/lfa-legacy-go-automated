import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, AlertTitle } from '@mui/material';
import { useSafeAuth } from '../../SafeAuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { state } = useSafeAuth();

  // Show loading spinner while authentication state is being determined
  if (state.isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Box sx={{ textAlign: 'center' }}>
          Verifying admin privileges...
        </Box>
      </Box>
    );
  }

  // Redirect to dashboard if user is not authenticated
  if (!state.isAuthenticated || !state.user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user has admin privileges
  // Note: This assumes the user object has a 'user_type' or 'role' field
  // Adjust the property name based on your actual user data structure
  const isAdmin = state.user.user_type === 'admin' || 
                  state.user.role === 'admin' || 
                  state.user.is_admin === true;

  // Show unauthorized message if user is not an admin
  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Access Denied</AlertTitle>
          You do not have administrator privileges to access this page. 
          Please contact your system administrator if you believe this is an error.
        </Alert>
      </Box>
    );
  }

  // If user is authenticated and is an admin, render the protected component
  return <>{children}</>;
};

export default AdminRoute;