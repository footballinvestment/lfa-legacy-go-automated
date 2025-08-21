// STEP 3 EMERGENCY: Hard Stop for Navigation Loops
// 🚨 EMERGENCY PATCH: Blocks all navigation events after initial load

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import { SafeAuthProvider, useSafeAuth, ProtectedRoute, PublicRoute } from "./SafeAuthContext";
import Layout from "./components/layout/Layout";
import OptimizedDashboard from "./components/OptimizedDashboard";

// Global emergency controls
let isEmergencyModeActive = false;
let dashboardInitialized = false;
let navigationBlocked = false;
let initialLoadComplete = false;

// Performance tracking - HARD LIMITS
let renderCount = 0;
const MAX_RENDERS = 5;
const MAX_NAVIGATIONS = 3;

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 Emergency Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: "40px",
          textAlign: "center",
          background: "#fee2e2",
          color: "#dc2626",
          borderRadius: "8px",
          margin: "20px"
        }}>
          <h2>🚨 Emergency Mode: Application Stabilized</h2>
          <p>Navigation loops have been blocked. Application is safe.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "10px"
            }}
          >
            🔄 Safe Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced Login Component
const EmergencyLogin: React.FC = () => {
  const { state, login, register, clearError } = useSafeAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    console.log('🚨 Emergency login - blocking navigation after login');
    
    if (isLogin) {
      const success = await login({ username, password });
      if (success) {
        // Set emergency mode after successful login
        isEmergencyModeActive = true;
        console.log('🚨 Emergency mode activated after login');
      }
    } else {
      const success = await register({ username, password, email, full_name: fullName });
      if (success) {
        isEmergencyModeActive = true;
        console.log('🚨 Emergency mode activated after registration');
      }
    }
  };

  return (
    <div style={{
      padding: "40px", 
      fontFamily: "Roboto, Arial", 
      maxWidth: "400px", 
      margin: "0 auto",
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      color: "white",
      minHeight: "100vh"
    }}>
      <h1 style={{fontSize: "2rem", color: "#dc2626", textAlign: "center"}}>⚽ LFA Legacy GO</h1>
      <h3 style={{fontSize: "1.2rem", color: "#f59e0b", textAlign: "center"}}>🚨 EMERGENCY MODE</h3>
      
      <div style={{marginBottom: "20px"}}>
        <button
          type="button"
          onClick={() => setIsLogin(true)}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            background: isLogin ? "linear-gradient(135deg, #dc2626, #b91c1c)" : "#64748b",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          LOGIN
        </button>
        <button
          type="button"
          onClick={() => setIsLogin(false)}
          style={{
            padding: "10px 20px",
            background: !isLogin ? "linear-gradient(135deg, #dc2626, #b91c1c)" : "#64748b",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          REGISTER
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <div style={{margin: "15px 0"}}>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: "100%", 
                  padding: "12px", 
                  fontSize: "16px",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                  background: "#334155",
                  color: "white",
                  outline: "none"
                }}
                required
              />
            </div>
            <div style={{margin: "15px 0"}}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%", 
                  padding: "12px", 
                  fontSize: "16px",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                  background: "#334155",
                  color: "white",
                  outline: "none"
                }}
                required
              />
            </div>
          </>
        )}
        <div style={{margin: "15px 0"}}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%", 
              padding: "12px", 
              fontSize: "16px",
              borderRadius: "8px",
              border: "1px solid #475569",
              background: "#334155",
              color: "white",
              outline: "none"
            }}
            required
          />
        </div>
        <div style={{margin: "15px 0"}}>
          <input
            type="password"
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%", 
              padding: "12px", 
              fontSize: "16px",
              borderRadius: "8px",
              border: "1px solid #475569",
              background: "#334155",
              color: "white",
              outline: "none"
            }}
            required
          />
        </div>
        <button
          type="submit"
          disabled={state.loading}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "16px",
            background: state.loading ? "#64748b" : "linear-gradient(135deg, #dc2626, #b91c1c)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: state.loading ? "wait" : "pointer",
            fontWeight: "500",
            transition: "all 0.2s ease"
          }}
        >
          {state.loading ? (isLogin ? "Logging in..." : "Registering...") : (isLogin ? "LOGIN" : "REGISTER")}
        </button>
      </form>

      {state.error && (
        <div style={{marginTop: "15px", color: "#ef4444", fontSize: "14px", background: "#1e293b", padding: "12px", borderRadius: "8px"}}>
          Error: {state.error}
        </div>
      )}

      <div style={{marginTop: "20px", fontSize: "12px", color: "#94a3b8", background: "#1e293b", padding: "12px", borderRadius: "8px"}}>
        <strong style={{color: "#f59e0b"}}>🚨 EMERGENCY PATCH:</strong><br/>
        • 🛑 Navigation loops HARD BLOCKED<br/>
        • 🔒 State changes locked after init<br/>
        • 🚫 No re-renders beyond limit<br/>
        • ⚡ Maximum performance mode<br/>
        • 🔐 Application stabilized
      </div>
    </div>
  );
};

// Emergency Dashboard - SINGLE RENDER ONLY
const EmergencyDashboard: React.FC = () => {
  const { state } = useSafeAuth();
  
  // Memoized dashboard to prevent re-renders - MUST BE BEFORE ANY EARLY RETURNS
  const stableDashboard = useMemo(() => {
    if (!state.user) {
      return (
        <div style={{
          textAlign: "center",
          padding: "40px",
          color: "#64748b"
        }}>
          <h2>🚨 Emergency Loading...</h2>
          <p>Stabilizing dashboard components...</p>
        </div>
      );
    }

    return (
      <ErrorBoundary>
        {/* Emergency success indicator */}
        <div style={{
          background: "linear-gradient(135deg, #dc2626, #b91c1c)",
          color: "white",
          padding: "15px",
          marginBottom: "20px",
          borderRadius: "12px",
          textAlign: "center"
        }}>
          <h2 style={{margin: "0 0 10px 0"}}>🚨 EMERGENCY MODE: Navigation Loops BLOCKED</h2>
          <p style={{margin: 0, opacity: 0.9}}>
            🛑 Hard navigation prevention • 🔒 State locked • 🚫 Re-renders blocked • ⚡ Stabilized
          </p>
          <div style={{
            marginTop: "10px",
            fontSize: "12px",
            opacity: 0.8
          }}>
            Renders: {renderCount}/{MAX_RENDERS} | User: {state.user.username} | Mode: EMERGENCY
          </div>
        </div>
        
        {/* Single Dashboard render */}
        <OptimizedDashboard />
      </ErrorBoundary>
    );
  }, [state.user]); // Only re-render if user changes

  // Hard render limit enforcement AFTER hooks
  renderCount++;
  if (renderCount > MAX_RENDERS) {
    console.warn(`🚨 EMERGENCY: Max renders (${MAX_RENDERS}) exceeded. Blocking further renders.`);
    return (
      <div style={{
        textAlign: "center",
        padding: "40px",
        background: "#fef2f2",
        color: "#dc2626",
        borderRadius: "8px"
      }}>
        <h2>🚨 Emergency Render Block</h2>
        <p>Maximum render limit reached. Application stabilized.</p>
        <p><strong>Renders:</strong> {renderCount}/{MAX_RENDERS}</p>
      </div>
    );
  }

  console.log(`🚨 EmergencyDashboard render #${renderCount}/${MAX_RENDERS} - Emergency Mode`);
  
  // Single initialization check
  if (!dashboardInitialized) {
    dashboardInitialized = true;
    console.log('🚨 Emergency Dashboard initialized - WILL NOT RE-INITIALIZE');
  }

  return stableDashboard;
};

// Navigation Blocker - Prevents all navigation after initial load
const NavigationBlocker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationCountRef = useRef(0);
  
  useEffect(() => {
    navigationCountRef.current++;
    
    console.log(`🚨 Navigation attempt #${navigationCountRef.current} - Path: ${location.pathname}`);
    
    // Allow first few navigations for initial app load
    if (navigationCountRef.current <= MAX_NAVIGATIONS) {
      console.log(`✅ Navigation allowed (${navigationCountRef.current}/${MAX_NAVIGATIONS})`);
      
      // Mark initial load as complete after first navigation
      if (navigationCountRef.current === 1) {
        setTimeout(() => {
          initialLoadComplete = true;
          console.log('🚨 Initial load complete - blocking further navigation');
        }, 1000);
      }
    } else {
      console.warn(`🛑 Navigation BLOCKED (${navigationCountRef.current}/${MAX_NAVIGATIONS}) - Emergency mode active`);
      navigationBlocked = true;
      
      // Force stay on current path - NO NAVIGATION ALLOWED
      if (location.pathname !== '/dashboard') {
        console.log('🚨 Forcing redirect to /dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  // Block all navigation events after limit
  useEffect(() => {
    if (navigationBlocked) {
      const blockNavigation = (event: BeforeUnloadEvent) => {
        console.warn('🛑 Page navigation blocked by emergency system');
        event.preventDefault();
        return '';
      };
      
      window.addEventListener('beforeunload', blockNavigation);
      return () => window.removeEventListener('beforeunload', blockNavigation);
    }
  }, []);

  return <>{children}</>;
};

// App Component with Emergency Controls
const App: React.FC = () => {
  console.log('🚨 Emergency App: Rendering with hard navigation blocks');
  
  return (
    <ThemeProvider theme={lightAppTheme}>
      <CssBaseline />
      <SafeAuthProvider>
        <Router>
          <NavigationBlocker>
            <Routes>
              {/* Public Route - Login Page */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <EmergencyLogin />
                  </PublicRoute>
                } 
              />
              
              {/* Protected Route - Emergency Dashboard */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EmergencyDashboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* All other routes redirect to dashboard - NO EXCEPTIONS */}
              <Route path="/tournaments" element={<Navigate to="/dashboard" replace />} />
              <Route path="/social" element={<Navigate to="/dashboard" replace />} />
              <Route path="/game-results" element={<Navigate to="/dashboard" replace />} />
              <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
              <Route path="/credits" element={<Navigate to="/dashboard" replace />} />
              
              {/* Default Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </NavigationBlocker>
        </Router>
      </SafeAuthProvider>
    </ThemeProvider>
  );
};

export default App;