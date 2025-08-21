// STEP 3: DASHBOARD INTEGRATION - Real Dashboard komponens integrálása
// ⚠️ CRITICAL: Dashboard + Credit komponensek React Error #130 védelmével

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import { SafeAuthProvider, useSafeAuth, ProtectedRoute, PublicRoute } from "./SafeAuthContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";

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
    
    // ⚠️ REACT ERROR #130 PROTECTION: Safe object handling
    console.log('🔍 Form submit - Step 3 Dashboard - checking data types:', {
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
      <h3 style={{fontSize: "1.2rem", color: "#f59e0b", textAlign: "center"}}>📊 STEP 3: Dashboard Integration</h3>
      
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

      {/* ⚠️ SAFE ERROR RENDERING */}
      {state.error && (
        <div style={{marginTop: "15px", color: "#ef4444", fontSize: "14px", background: "#1e293b", padding: "12px", borderRadius: "8px"}}>
          Error: {state.error}
        </div>
      )}

      <div style={{marginTop: "20px", fontSize: "12px", color: "#94a3b8", background: "#1e293b", padding: "12px", borderRadius: "8px"}}>
        <strong style={{color: "#f59e0b"}}>📊 Step 3 Features:</strong><br/>
        • Real Dashboard component<br/>
        • Credit Balance & Coupons<br/>
        • Tournament stats integration<br/>
        • Safe object rendering<br/>
        • Full API data loading
      </div>
    </div>
  );
};

// Enhanced Dashboard with safety wrapper
const SafeDashboard: React.FC = () => {
  const { state } = useSafeAuth();
  
  console.log('📊 SafeDashboard rendering - Step 3');
  console.log('🔍 Dashboard safety check - user type:', typeof state.user);
  console.log('🔍 Dashboard safety check - user data safe:', {
    hasUser: !!state.user,
    userType: typeof state.user,
    creditsType: typeof state.user?.credits,
    creditsValue: state.user?.credits
  });
  
  // ⚠️ DOUBLE SAFETY CHECK: Return early if no user to prevent any object rendering issues
  if (!state.user) {
    return (
      <div style={{
        textAlign: "center",
        padding: "40px",
        color: "#64748b"
      }}>
        <h2>Loading user data...</h2>
        <p>Initializing dashboard components...</p>
      </div>
    );
  }

  // ⚠️ TRIPLE SAFETY: Additional checks for required user properties
  if (typeof state.user !== 'object' || 
      typeof state.user.username !== 'string' ||
      typeof state.user.credits !== 'number') {
    console.error('🚨 Dashboard safety check FAILED - invalid user object structure');
    return (
      <div style={{
        textAlign: "center",
        padding: "40px",
        background: "#fee2e2",
        color: "#dc2626",
        borderRadius: "8px"
      }}>
        <h2>Dashboard Error</h2>
        <p>Invalid user data structure. Please refresh the page.</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // ✅ SAFE TO RENDER: All checks passed
  console.log('✅ Dashboard safety checks passed, rendering full Dashboard component');
  
  return (
    <>
      {/* Success indicator */}
      <div style={{
        background: "linear-gradient(135deg, #059669, #10b981)",
        color: "white",
        padding: "15px",
        marginBottom: "20px",
        borderRadius: "12px",
        textAlign: "center"
      }}>
        <h2 style={{margin: "0 0 10px 0"}}>🎯 STEP 3 COMPLETE: Dashboard Integration</h2>
        <p style={{margin: 0, opacity: 0.9}}>
          ✅ Full Dashboard loaded • ✅ Credit components active • ✅ Safe object rendering
        </p>
      </div>
      
      {/* Render the actual Dashboard component */}
      <Dashboard />
    </>
  );
};

// App Component with Dashboard Integration
const App: React.FC = () => {
  console.log('📊 Step 3: Rendering App with Dashboard Integration');
  
  return (
    <ThemeProvider theme={lightAppTheme}>
      <CssBaseline />
      <SafeAuthProvider>
        <Router>
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
            
            {/* Protected Route - Real Dashboard with Layout */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <SafeDashboard />
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
        </Router>
      </SafeAuthProvider>
    </ThemeProvider>
  );
};

export default App;