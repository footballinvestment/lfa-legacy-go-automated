// STEP 3 FIXED: API Performance Issues Resolved
// 🔧 CRITICAL FIXES: Debounced API calls, Error boundaries, Reduced re-renders

import React, { useState, useCallback, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import { SafeAuthProvider, useSafeAuth, ProtectedRoute, PublicRoute } from "./SafeAuthContext";
import Layout from "./components/layout/Layout";
import OptimizedDashboard from "./components/OptimizedDashboard";

// Performance tracking for debugging
let renderCount = 0;
let navigationCount = 0;

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
    console.error('🚨 Dashboard Error Boundary caught error:', error, errorInfo);
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
          <h2>⚠️ Dashboard Temporarily Unavailable</h2>
          <p>The dashboard encountered an error and has been safely contained.</p>
          <button 
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
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
            🔄 Reload Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced Login Component - same as Step 2
const EnhancedLogin: React.FC = () => {
  const { state, login, register, logout, clearError } = useSafeAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    console.log('🔍 Form submit - Step 3 Fixed - checking data types:', {
      username: typeof username,
      password: typeof password,
      email: typeof email,
      fullName: typeof fullName
    });
    
    if (isLogin) {
      await login({ username, password });
    } else {
      await register({ username, password, email, full_name: fullName });
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
      <h1 style={{fontSize: "2rem", color: "#10b981", textAlign: "center"}}>⚽ LFA Legacy GO</h1>
      <h3 style={{fontSize: "1.2rem", color: "#059669", textAlign: "center"}}>🔧 STEP 3: Dashboard FIXED</h3>
      
      <div style={{marginBottom: "20px"}}>
        <button
          type="button"
          onClick={() => setIsLogin(true)}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            background: isLogin ? "linear-gradient(135deg, #10b981, #059669)" : "#64748b",
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
            background: !isLogin ? "linear-gradient(135deg, #10b981, #059669)" : "#64748b",
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
            background: state.loading ? "#64748b" : "linear-gradient(135deg, #10b981, #059669)",
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
        <strong style={{color: "#059669"}}>🔧 Step 3 FIXES:</strong><br/>
        • ✅ API call debouncing<br/>
        • ✅ Error boundaries added<br/>
        • ✅ Reduced re-renders<br/>
        • ✅ Performance optimized<br/>
        • ✅ Graceful error handling
      </div>
    </div>
  );
};

// Dashboard Container Wrapper with Performance Controls
const DashboardContainer: React.FC = () => {
  const { state } = useSafeAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [dashboardKey, setDashboardKey] = useState(0);
  const initTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Performance tracking
  renderCount++;
  console.log(`🔧 DashboardContainer render #${renderCount} - Step 3 Fixed`);
  
  // Initialize dashboard only once
  const initializeDashboard = useCallback(() => {
    if (!isInitialized && state.user && !state.loading) {
      console.log('🚀 Dashboard initialization starting...');
      
      // Clear any existing timer
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
      }
      
      // Delayed initialization to prevent API racing
      initTimerRef.current = setTimeout(() => {
        setIsInitialized(true);
        console.log('✅ Dashboard initialization complete');
      }, 300);
    }
  }, [isInitialized, state.user, state.loading]);

  useEffect(() => {
    initializeDashboard();
    
    return () => {
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
      }
    };
  }, [initializeDashboard]);

  // Reset dashboard if user changes (logout/login)
  useEffect(() => {
    if (!state.user && isInitialized) {
      console.log('🔄 Resetting dashboard due to user logout');
      setIsInitialized(false);
      setDashboardKey(prev => prev + 1);
    }
  }, [state.user, isInitialized]);

  console.log('🔍 Dashboard state check:', {
    hasUser: !!state.user,
    isLoading: state.loading,
    isInitialized,
    userType: typeof state.user,
    creditsType: typeof state.user?.credits
  });
  
  // Loading state
  if (state.loading || !state.user) {
    return (
      <div style={{
        textAlign: "center",
        padding: "40px",
        color: "#64748b"
      }}>
        <h2>🔄 Loading Dashboard...</h2>
        <p>Initializing optimized components...</p>
        <div style={{
          marginTop: "15px",
          padding: "10px",
          background: "#f8fafc",
          borderRadius: "8px",
          fontSize: "14px"
        }}>
          <strong>Performance:</strong> Render #{renderCount} | Navigation #{navigationCount}
        </div>
      </div>
    );
  }

  // Validation safety checks
  if (typeof state.user !== 'object' || 
      typeof state.user.username !== 'string') {
    console.error('🚨 Dashboard safety check FAILED - invalid user structure');
    return (
      <ErrorBoundary>
        <div style={{
          textAlign: "center",
          padding: "40px",
          background: "#fee2e2",
          color: "#dc2626",
          borderRadius: "8px"
        }}>
          <h2>⚠️ Dashboard Error</h2>
          <p>Invalid user data detected. Dashboard safely contained.</p>
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
            🔄 Refresh Application
          </button>
        </div>
      </ErrorBoundary>
    );
  }

  // Wait for initialization before rendering Dashboard
  if (!isInitialized) {
    return (
      <div style={{
        textAlign: "center",
        padding: "40px",
        color: "#059669"
      }}>
        <h2>⚡ Optimizing Dashboard...</h2>
        <p>Preparing components for optimal performance...</p>
        <div style={{
          marginTop: "15px",
          padding: "10px",
          background: "#ecfdf5",
          color: "#047857",
          borderRadius: "8px",
          fontSize: "14px"
        }}>
          <strong>Performance Mode:</strong> API calls debounced, re-renders minimized
        </div>
      </div>
    );
  }

  console.log('✅ All Dashboard safety checks passed, rendering optimized Dashboard');
  
  return (
    <ErrorBoundary>
      {/* Performance success indicator */}
      <div style={{
        background: "linear-gradient(135deg, #059669, #10b981)",
        color: "white",
        padding: "15px",
        marginBottom: "20px",
        borderRadius: "12px",
        textAlign: "center"
      }}>
        <h2 style={{margin: "0 0 10px 0"}}>🔧 STEP 3 FIXED: Performance Optimized</h2>
        <p style={{margin: 0, opacity: 0.9}}>
          ✅ API debouncing active • ✅ Error boundaries • ✅ Re-renders minimized • ✅ Graceful degradation
        </p>
        <div style={{
          marginTop: "10px",
          fontSize: "12px",
          opacity: 0.8
        }}>
          Renders: {renderCount} | Navigation: {navigationCount} | User: {state.user.username}
        </div>
      </div>
      
      {/* Render Optimized Dashboard with unique key for forced refresh if needed */}
      <OptimizedDashboard key={dashboardKey} />
    </ErrorBoundary>
  );
};

// Navigation tracker to debug excessive navigation
const NavigationTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    navigationCount++;
    console.log(`🧭 Navigation event #${navigationCount}`);
  });

  return <>{children}</>;
};

// App Component with Optimized Dashboard Integration
const App: React.FC = () => {
  console.log('🔧 Step 3 Fixed: Rendering App with Optimized Dashboard');
  
  return (
    <ThemeProvider theme={lightAppTheme}>
      <CssBaseline />
      <SafeAuthProvider>
        <Router>
          <NavigationTracker>
            <Routes>
              {/* Public Route - Login Page */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <EnhancedLogin />
                  </PublicRoute>
                } 
              />
              
              {/* Protected Route - Optimized Dashboard with Layout */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardContainer />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Navigation Test Routes - Keep simple for now */}
              <Route 
                path="/tournaments" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div style={{textAlign: "center", padding: "40px"}}>
                        <h2 style={{color: "#10b981"}}>🏆 Tournaments Page</h2>
                        <p>Coming in Step 4 - Tournaments integration</p>
                        <div style={{
                          background: "#f8fafc",
                          padding: "20px",
                          borderRadius: "8px",
                          marginTop: "20px"
                        }}>
                          <strong>Next Phase:</strong> Tournament list, creation, join functionality
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/social" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div style={{textAlign: "center", padding: "40px"}}>
                        <h2 style={{color: "#3b82f6"}}>👥 Social Page</h2>
                        <p>Coming in Step 5 - Social features integration</p>
                        <div style={{
                          background: "#f8fafc",
                          padding: "20px",
                          borderRadius: "8px",
                          marginTop: "20px"
                        }}>
                          <strong>Next Phase:</strong> Friends, challenges, social interactions
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/game-results" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div style={{textAlign: "center", padding: "40px"}}>
                        <h2 style={{color: "#f59e0b"}}>📊 Game Results</h2>
                        <p>Coming in Step 6 - Results & Analytics</p>
                        <div style={{
                          background: "#f8fafc",
                          padding: "20px",
                          borderRadius: "8px",
                          marginTop: "20px"
                        }}>
                          <strong>Next Phase:</strong> Match history, statistics, analytics
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div style={{textAlign: "center", padding: "40px"}}>
                        <h2 style={{color: "#8b5cf6"}}>👤 Profile Page</h2>
                        <p>Coming in Step 7 - Profile management</p>
                        <div style={{
                          background: "#f8fafc",
                          padding: "20px",
                          borderRadius: "8px",
                          marginTop: "20px"
                        }}>
                          <strong>Next Phase:</strong> User settings, profile editing, preferences
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/credits" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div style={{textAlign: "center", padding: "40px"}}>
                        <h2 style={{color: "#10b981"}}>💰 Credits Page</h2>
                        <p>Coming in Step 8 - Credits management</p>
                        <div style={{
                          background: "#f8fafc",
                          padding: "20px",
                          borderRadius: "8px",
                          marginTop: "20px"
                        }}>
                          <strong>Next Phase:</strong> Credit purchases, transaction history
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Default Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </NavigationTracker>
        </Router>
      </SafeAuthProvider>
    </ThemeProvider>
  );
};

export default App;