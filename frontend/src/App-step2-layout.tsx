// STEP 2: LAYOUT INTEGRATION - Layout komponens hozzáadása Theme-mel
// ⚠️ CRITICAL: Layout + BrowserRouter + Routes integrálása React Error #130 ellenőrzéssel

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import { SafeAuthProvider, useSafeAuth, ProtectedRoute, PublicRoute } from "./SafeAuthContext";
import Layout from "./components/layout/Layout";

// Enhanced Login Component with Router Integration
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
    console.log('🔍 Form submit - Step 2 Layout - checking data types:', {
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
      <h3 style={{fontSize: "1.2rem", color: "#3b82f6", textAlign: "center"}}>🏗️ STEP 2: Layout Integration</h3>
      
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
        <strong style={{color: "#3b82f6"}}>🏗️ Step 2 Features:</strong><br/>
        • BrowserRouter active<br/>
        • Routes & Route components<br/>
        • Layout component ready<br/>
        • ProtectedRoute & PublicRoute<br/>
        • Mobile responsive navigation
      </div>
    </div>
  );
};

// Test Dashboard Component - SIMPLE để elkerüljük a React Error #130-at
const TestDashboard: React.FC = () => {
  const { state } = useSafeAuth();
  
  console.log('🏗️ TestDashboard rendering - Layout integration test');
  console.log('🔍 User state type check:', typeof state.user);
  
  return (
    <div style={{
      background: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
      padding: "40px",
      borderRadius: "16px",
      textAlign: "center" as const
    }}>
      <h1 style={{
        color: "#10b981", 
        fontSize: "2.5rem", 
        marginBottom: "20px",
        textShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        🎯 LAYOUT INTEGRATION SUCCESS!
      </h1>
      
      {/* ⚠️ SAFE USER RENDERING - Always use optional chaining */}
      <h2 style={{color: "#1e293b", marginBottom: "30px"}}>
        Welcome back, {state.user?.display_name || state.user?.username || 'Guest'}! 
      </h2>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        }}>
          <h3>✅ AppBar Navigation</h3>
          <p>Desktop navigation working</p>
        </div>
        
        <div style={{
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          color: "white", 
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        }}>
          <h3>📱 Mobile Drawer</h3>
          <p>Responsive drawer menu</p>
        </div>
        
        <div style={{
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          color: "white",
          padding: "20px", 
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        }}>
          <h3>👤 User Menu</h3>
          <p>Profile & logout options</p>
        </div>
      </div>
      
      <div style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "12px",
        border: "2px solid #e2e8f0",
        marginBottom: "20px"
      }}>
        <h3 style={{color: "#059669", marginBottom: "15px"}}>🏗️ STEP 2 COMPLETE</h3>
        <div style={{color: "#475569", fontSize: "16px", textAlign: "left" as const}}>
          <p><strong>✅ Layout Component:</strong> AppBar, Toolbar, Navigation integrated</p>
          <p><strong>✅ Router System:</strong> BrowserRouter, Routes, Route active</p>
          <p><strong>✅ Protected Routes:</strong> Authentication-based routing</p>
          <p><strong>✅ Material-UI:</strong> Full component integration</p>
          <p><strong>✅ Responsive:</strong> Mobile drawer navigation</p>
          <p><strong>✅ Safe Rendering:</strong> No React Error #130</p>
        </div>
      </div>
      
      <div style={{
        background: "#1e293b",
        color: "white",
        padding: "15px",
        borderRadius: "12px",
        fontSize: "14px"
      }}>
        <strong style={{color: "#fbbf24"}}>🔧 Debug Info:</strong><br/>
        User Type: {typeof state.user}<br/>
        Credits: {state.user?.credits ?? 'N/A'}<br/>
        Loading: {state.loading ? 'Yes' : 'No'}<br/>
        Theme: Material-UI + Layout active
      </div>
    </div>
  );
};

// App Component with Full Layout Integration
const App: React.FC = () => {
  console.log('🏗️ Step 2: Rendering App with Layout Integration');
  
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
            
            {/* Protected Route - Dashboard with Layout */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <TestDashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Placeholder Protected Routes for Navigation Testing */}
            <Route 
              path="/tournaments" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <div style={{textAlign: "center", padding: "40px"}}>
                      <h2 style={{color: "#10b981"}}>🏆 Tournaments Page</h2>
                      <p>Layout navigation test - tournaments placeholder</p>
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
                      <p>Layout navigation test - social placeholder</p>
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
                      <p>Layout navigation test - results placeholder</p>
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
                      <p>Layout navigation test - profile placeholder</p>
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