// 🔐 STEP 5 AUTH: Authentication Flow Restoration
// Building on Step 4 success - adding back login functionality with safety controls
// Gradual authentication integration with navigation monitoring

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider, CssBaseline, Container, Typography, Grid, Box, Button, Card, CardContent, TextField, Alert } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import { SafeAuthProvider, useSafeAuth } from "./SafeAuthContext";
import Layout from "./components/layout/Layout";

// 🔐 ENHANCED NAVIGATION MONITOR - Track auth state changes
const AuthNavigationMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { state } = useSafeAuth();
  const [navigationCount, setNavigationCount] = useState(0);
  const [lastPath, setLastPath] = useState('');
  const [authStateChanges, setAuthStateChanges] = useState(0);
  
  useEffect(() => {
    if (location.pathname !== lastPath) {
      setNavigationCount(prev => {
        const newCount = prev + 1;
        console.log(`🔐 Step 5 Navigation #${newCount} - Path: ${location.pathname} - Auth: ${!!state.user}`);
        
        // Emergency brake if too many navigations
        if (newCount > 15) {
          console.error('🚨 Step 5 EMERGENCY: Navigation limit exceeded!');
          return prev;
        }
        
        return newCount;
      });
      setLastPath(location.pathname);
    }
  }, [location.pathname, lastPath, state.user]);
  
  // Track auth state changes
  useEffect(() => {
    setAuthStateChanges(prev => {
      const newCount = prev + 1;
      console.log(`🔐 Auth state change #${newCount} - User: ${state.user?.username || 'none'}`);
      return newCount;
    });
  }, [state.user]);
  
  // Emergency UI if navigation count too high
  if (navigationCount > 15) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" color="error" sx={{ mb: 3 }}>
          🚨 Step 5 Emergency Stop
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Navigation limit exceeded: {navigationCount}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Reverting to Step 4 Basic Mode required
        </Typography>
      </Container>
    );
  }
  
  return <>{children}</>;
};

// 🔐 AUTHENTICATED DASHBOARD - Enhanced from Step 4
const AuthenticatedDashboard: React.FC = () => {
  const { state, logout } = useSafeAuth();
  const navigate = useNavigate();
  
  console.log('🔐 AuthenticatedDashboard rendering - Step 5');
  
  const handleLogout = async () => {
    console.log('🔐 Logout initiated');
    try {
      await logout();
      console.log('🔐 Logout successful');
      navigate('/login');
    } catch (error) {
      console.error('🔐 Logout failed:', error);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          🔐 Step 5: Authentication Restored
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'success.main' }}>
          Welcome back, {state.user?.username || 'Authenticated User'}!
        </Typography>
        <Typography variant="body2" sx={{ 
          display: 'block', 
          padding: 1, 
          backgroundColor: 'success.light',
          borderRadius: 1,
          mb: 3 
        }}>
          🔐 Step 5 Active - Authentication Flow with Navigation Monitoring
        </Typography>
      </Box>
      
      {/* Enhanced Grid Layout with Auth Features */}
      <Grid container spacing={3}>
        {/* Auth Status Card */}
        <Grid item xs={12} md={6}>
          <AuthStatusCard user={state.user} onLogout={handleLogout} />
        </Grid>
        
        {/* Progress Status Card */}
        <Grid item xs={12} md={6}>
          <AuthProgressCard />
        </Grid>
        
        {/* User Dashboard */}
        <Grid item xs={12}>
          <UserDashboardCard user={state.user} />
        </Grid>
      </Grid>
    </Container>
  );
};

// 🔐 AUTH STATUS CARD - Show authentication status
const AuthStatusCard: React.FC<{ user: any, onLogout: () => void }> = ({ user, onLogout }) => {
  const [logoutCount, setLogoutCount] = useState(0);
  
  const handleTestLogout = () => {
    setLogoutCount(prev => prev + 1);
    console.log(`🔐 Logout test #${logoutCount + 1}`);
    onLogout();
  };
  
  return (
    <Card sx={{ height: '100%', border: '2px solid', borderColor: 'success.main' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="success.main">
          🔐 Authentication Status
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Status: ✅ Authenticated
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Username: {user?.username || 'Unknown'}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Session: Active
        </Typography>
        <Button 
          variant="contained" 
          color="error"
          onClick={handleTestLogout}
          sx={{ mb: 2 }}
        >
          Logout ({logoutCount} tests)
        </Button>
        <Typography variant="caption" sx={{ display: 'block' }}>
          🔐 Step 5: Authentication fully integrated
        </Typography>
      </CardContent>
    </Card>
  );
};

// 🔐 AUTH PROGRESS CARD - Show restoration progress
const AuthProgressCard: React.FC = () => {
  const progressItems = [
    { name: 'Nuclear Mode', status: '✅ Complete' },
    { name: 'Basic Navigation', status: '✅ Complete' },
    { name: 'Authentication', status: '🔐 Active' },
    { name: 'API Integration', status: '⏳ Next Phase' },
    { name: 'Full Features', status: '⏳ Pending' }
  ];
  
  return (
    <Card sx={{ height: '100%', border: '2px solid', borderColor: 'info.main' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="info.main">
          📊 Authentication Progress
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

// 🔐 USER DASHBOARD CARD - Enhanced user interface
const UserDashboardCard: React.FC<{ user: any }> = ({ user }) => {
  return (
    <Card sx={{ border: '2px solid', borderColor: 'primary.main' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary">
          🏆 User Dashboard
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">User ID</Typography>
            <Typography variant="body1">{user?.id || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Credits</Typography>
            <Typography variant="body1" color="success.main">{user?.credits || 5}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Role</Typography>
            <Typography variant="body1">{user?.role || 'User'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Session</Typography>
            <Typography variant="body1" color="success.main">🔐 Step 5</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// 🔐 ENHANCED LOGIN PAGE - Full authentication functionality
const EnhancedLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  const { login } = useSafeAuth();
  const navigate = useNavigate();
  
  console.log('🔐 EnhancedLoginPage rendering - Step 5');
  
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginAttempts(prev => prev + 1);
    
    console.log(`🔐 Login attempt #${loginAttempts + 1} - Username: ${username}`);
    
    try {
      const result = await login({ username, password });
      console.log('🔐 Login successful:', result);
      
      if (result) {
        setMessage('✅ Login successful! Redirecting...');
        
        // Small delay to show success message
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        throw new Error('Login failed - invalid credentials');
      }
      
    } catch (error: any) {
      console.error('🔐 Login failed:', error);
      setMessage(`❌ Login failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTestLogin = () => {
    setUsername('newuser');
    setPassword('test123');
    setMessage('🔐 Valid test credentials filled - Click Login to test');
  };
  
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ p: 4, border: '2px solid', borderColor: 'primary.main' }}>
        <Typography variant="h4" gutterBottom color="primary" textAlign="center">
          🔐 Step 5: Enhanced Login
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, textAlign: 'center' }}>
          Authentication flow fully restored with safety controls
        </Typography>
        
        <Box component="form" onSubmit={handleLoginSubmit}>
          <TextField
            fullWidth
            label="Username/Email"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          
          <Button 
            type="submit"
            variant="contained" 
            fullWidth 
            sx={{ mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : `Login (${loginAttempts} attempts)`}
          </Button>
          
          <Button 
            variant="outlined" 
            fullWidth 
            onClick={handleTestLogin}
            sx={{ mb: 2 }}
          >
            Fill Test Credentials
          </Button>
          
          <Button 
            variant="text" 
            fullWidth 
            onClick={() => window.location.href = '/register'}
            sx={{ mb: 2 }}
          >
            Don't have an account? Register
          </Button>
        </Box>
        
        {message && (
          <Alert 
            severity={message.includes('✅') ? 'success' : 'error'}
            sx={{ mt: 2 }}
          >
            {message}
          </Alert>
        )}
        
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
          🔐 Step 5: Authentication with navigation monitoring
        </Typography>
      </Card>
    </Container>
  );
};

// 🔐 ENHANCED REGISTER PAGE - Registration functionality
const EnhancedRegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registerAttempts, setRegisterAttempts] = useState(0);
  
  const { register } = useSafeAuth();
  const navigate = useNavigate();
  
  console.log('🔐 EnhancedRegisterPage rendering - Step 5');
  
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setRegisterAttempts(prev => prev + 1);
    
    console.log(`🔐 Register attempt #${registerAttempts + 1} - Username: ${username}`);
    
    try {
      const result = await register({ username, password, email, full_name: fullName });
      console.log('🔐 Register successful:', result);
      
      if (result) {
        setMessage('✅ Registration successful! Redirecting...');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        throw new Error('Registration failed - please check your data');
      }
      
    } catch (error: any) {
      console.error('🔐 Register failed:', error);
      setMessage(`❌ Registration failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ p: 4, border: '2px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h4" gutterBottom color="secondary" textAlign="center">
          🔐 Step 5: Register
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, textAlign: 'center' }}>
          Create your new account
        </Typography>
        
        <Box component="form" onSubmit={handleRegisterSubmit}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          
          <Button 
            type="submit"
            variant="contained" 
            color="secondary"
            fullWidth 
            sx={{ mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : `Register (${registerAttempts} attempts)`}
          </Button>
          
          <Button 
            variant="text" 
            fullWidth 
            onClick={() => navigate('/login')}
            sx={{ mb: 2 }}
          >
            Already have an account? Login
          </Button>
        </Box>
        
        {message && (
          <Alert 
            severity={message.includes('✅') ? 'success' : 'error'}
            sx={{ mt: 2 }}
          >
            {message}
          </Alert>
        )}
        
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
          🔐 Step 5: Registration with authentication monitoring
        </Typography>
      </Card>
    </Container>
  );
};

// 🔐 ROUTE WRAPPER - Enhanced authentication and routing logic
const AuthRouteWrapper: React.FC = () => {
  const { state, isLoading } = useSafeAuth();
  
  console.log('🔐 AuthRouteWrapper - state:', { 
    hasUser: !!state.user, 
    isLoading,
    step: 'Step 5 Auth',
    username: state.user?.username
  });
  
  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="primary">
          🔐 Step 5 Loading...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Initializing authentication flow
        </Typography>
      </Container>
    );
  }
  
  return (
    <Layout>
      <AuthNavigationMonitor>
        <Routes>
          {/* Protected Dashboard Route */}
          <Route 
            path="/dashboard" 
            element={
              state.user ? (
                <AuthenticatedDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          {/* Login Route */}
          <Route 
            path="/login" 
            element={
              state.user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <EnhancedLoginPage />
              )
            }
          />
          
          {/* Registration Route */}
          <Route 
            path="/register" 
            element={
              state.user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <EnhancedRegisterPage />
              )
            }
          />
          
          {/* Default Redirect */}
          <Route 
            path="/" 
            element={
              <Navigate to={state.user ? "/dashboard" : "/login"} replace />
            }
          />
          
          {/* Catch All - Smart Redirect */}
          <Route 
            path="*" 
            element={
              <Navigate to={state.user ? "/dashboard" : "/login"} replace />
            }
          />
        </Routes>
      </AuthNavigationMonitor>
    </Layout>
  );
};

// 🔐 MAIN APP - Step 5 Authentication Restoration
const App: React.FC = () => {
  console.log('🔐 STEP 5 AUTH: App rendering - Authentication Flow Restoration');
  
  return (
    <ThemeProvider theme={lightAppTheme}>
      <CssBaseline />
      <SafeAuthProvider>
        <Router>
          <AuthRouteWrapper />
        </Router>
      </SafeAuthProvider>
    </ThemeProvider>
  );
};

export default App;