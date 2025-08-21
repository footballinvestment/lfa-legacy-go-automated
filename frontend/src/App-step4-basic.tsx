// 🚀 STEP 4 BASIC: Controlled Navigation Restoration
// MINIMAL React Router - Only 2 routes with emergency monitoring
// Gradual restoration with navigation loop prevention

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider, CssBaseline, Container, Typography, Grid, Box, Button, Card, CardContent } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import { SafeAuthProvider, useSafeAuth } from "./SafeAuthContext";
import Layout from "./components/layout/Layout";

// 🚀 NAVIGATION MONITOR - Track all navigation events with limits
const NavigationMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [navigationCount, setNavigationCount] = useState(0);
  const [lastPath, setLastPath] = useState('');
  
  useEffect(() => {
    if (location.pathname !== lastPath) {
      setNavigationCount(prev => {
        const newCount = prev + 1;
        console.log(`🚀 Step 4 Navigation #${newCount} - Path: ${location.pathname}`);
        
        // Emergency brake if too many navigations
        if (newCount > 10) {
          console.error('🚨 Step 4 EMERGENCY: Navigation limit exceeded!');
          return prev; // Don't increment further
        }
        
        return newCount;
      });
      setLastPath(location.pathname);
    }
  }, [location.pathname, lastPath]);
  
  // Emergency UI if navigation count too high
  if (navigationCount > 10) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" color="error" sx={{ mb: 3 }}>
          🚨 Step 4 Emergency Stop
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Navigation limit exceeded: {navigationCount}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Reverting to Nuclear Mode required
        </Typography>
      </Container>
    );
  }
  
  return <>{children}</>;
};

// 🚀 BASIC DASHBOARD - Enhanced from Nuclear with controlled features
const BasicDashboard: React.FC = () => {
  const { state } = useSafeAuth();
  
  console.log('🚀 BasicDashboard rendering - Step 4');
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          🚀 Step 4: Basic Navigation Restored
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'success.main' }}>
          Welcome back, {state.user?.username || 'User'}!
        </Typography>
        <Typography variant="body2" sx={{ 
          display: 'block', 
          padding: 1, 
          backgroundColor: 'info.light',
          borderRadius: 1,
          mb: 3 
        }}>
          🚀 Step 4 Active - Minimal Navigation with Emergency Monitoring
        </Typography>
      </Box>
      
      {/* Enhanced Grid Layout with Navigation Test */}
      <Grid container spacing={3}>
        {/* Navigation Test Card */}
        <Grid item xs={12} md={6}>
          <NavigationTestCard />
        </Grid>
        
        {/* Progress Status Card */}
        <Grid item xs={12} md={6}>
          <ProgressStatusCard />
        </Grid>
        
        {/* User Info Card */}
        <Grid item xs={12}>
          <UserInfoCard user={state.user} />
        </Grid>
      </Grid>
    </Container>
  );
};

// 🚀 NAVIGATION TEST CARD - Test basic routing
const NavigationTestCard: React.FC = () => {
  const [testCount, setTestCount] = useState(0);
  
  const handleNavigationTest = () => {
    setTestCount(prev => prev + 1);
    console.log(`🚀 Navigation test #${testCount + 1} - Basic routing functional`);
  };
  
  return (
    <Card sx={{ height: '100%', border: '2px solid', borderColor: 'primary.main' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary">
          🚀 Navigation Test
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Test basic navigation functionality
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleNavigationTest}
          sx={{ mb: 2 }}
        >
          Test Navigation ({testCount})
        </Button>
        <Typography variant="caption" sx={{ display: 'block' }}>
          Status: {testCount === 0 ? 'Ready' : `${testCount} tests completed`}
        </Typography>
      </CardContent>
    </Card>
  );
};

// 🚀 PROGRESS STATUS CARD - Show restoration progress
const ProgressStatusCard: React.FC = () => {
  const progressItems = [
    { name: 'Nuclear Mode', status: '✅ Complete' },
    { name: 'Basic Navigation', status: '🚀 In Progress' },
    { name: 'Authentication', status: '⏳ Pending' },
    { name: 'API Integration', status: '⏳ Pending' },
    { name: 'Full Features', status: '⏳ Pending' }
  ];
  
  return (
    <Card sx={{ height: '100%', border: '2px solid', borderColor: 'success.main' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="success.main">
          📊 Restoration Progress
        </Typography>
        {progressItems.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">{item.name}</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {item.status}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

// 🚀 USER INFO CARD - Display user data safely
const UserInfoCard: React.FC<{ user: any }> = ({ user }) => {
  return (
    <Card sx={{ border: '2px solid', borderColor: 'info.main' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="info.main">
          👤 User Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Username</Typography>
            <Typography variant="body1">{user?.username || 'Not available'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Credits</Typography>
            <Typography variant="body1">{user?.credits || '5 (default)'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Authentication</Typography>
            <Typography variant="body1">{user ? '✅ Authenticated' : '❌ Not authenticated'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Session</Typography>
            <Typography variant="body1">🚀 Step 4 Basic Mode</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// 🚀 BASIC LOGIN PAGE - Simple authentication UI
const BasicLoginPage: React.FC = () => {
  const [message, setMessage] = useState('');
  
  console.log('🚀 BasicLoginPage rendering - Step 4');
  
  const handleTestLogin = () => {
    setMessage('🚀 Step 4: Login functionality will be restored in next phase');
    console.log('🚀 Test login clicked - Step 4 Basic Mode');
  };
  
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ p: 4, border: '2px solid', borderColor: 'primary.main' }}>
        <Typography variant="h4" gutterBottom color="primary" textAlign="center">
          🚀 Step 4: Basic Login
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          Authentication will be restored in the next phase
        </Typography>
        
        <Button 
          variant="contained" 
          fullWidth 
          onClick={handleTestLogin}
          sx={{ mb: 2 }}
        >
          Test Login Interface
        </Button>
        
        {message && (
          <Typography variant="body2" color="info.main" sx={{ mt: 2, textAlign: 'center' }}>
            {message}
          </Typography>
        )}
        
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
          🚀 Step 4: Basic navigation testing phase
        </Typography>
      </Card>
    </Container>
  );
};

// 🚀 ROUTE WRAPPER - Authentication and routing logic
const RouteWrapper: React.FC = () => {
  const { state, isLoading } = useSafeAuth();
  
  console.log('🚀 RouteWrapper - state:', { 
    hasUser: !!state.user, 
    isLoading,
    step: 'Step 4 Basic'
  });
  
  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="primary">
          🚀 Step 4 Loading...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Initializing basic navigation mode
        </Typography>
      </Container>
    );
  }
  
  return (
    <Layout>
      <NavigationMonitor>
        <Routes>
          {/* Main Dashboard Route */}
          <Route path="/dashboard" element={<BasicDashboard />} />
          
          {/* Login Route */}
          <Route path="/login" element={<BasicLoginPage />} />
          
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch All - Redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </NavigationMonitor>
    </Layout>
  );
};

// 🚀 MAIN APP - Step 4 Basic Navigation
const App: React.FC = () => {
  console.log('🚀 STEP 4 BASIC: App rendering - Controlled Navigation Restoration');
  
  return (
    <ThemeProvider theme={lightAppTheme}>
      <CssBaseline />
      <SafeAuthProvider>
        <Router>
          <RouteWrapper />
        </Router>
      </SafeAuthProvider>
    </ThemeProvider>
  );
};

export default App;