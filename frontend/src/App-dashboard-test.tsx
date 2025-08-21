// TEST DASHBOARD PAGE - Final test for React Error #130 source
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import { SafeAuthProvider, useSafeAuth, ProtectedRoute, PublicRoute } from "./SafeAuthContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";

const DashboardTestLogin: React.FC = () => {
  const { state, login, clearError } = useSafeAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login({ username, password });
  };

  if (state.isAuthenticated && state.user) {
    return (
      <Layout>
        <Dashboard />
      </Layout>
    );
  }

  return (
    <div style={{
      padding: "40px", 
      maxWidth: "400px", 
      margin: "0 auto",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a, #1e293b)"
    }}>
      <h1 style={{ color: "white", textAlign: "center" }}>⚽ LFA Legacy GO</h1>
      <h3 style={{ color: "#10b981", textAlign: "center" }}>📊 DASHBOARD TEST</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{margin: "15px 0"}}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{width: "100%", padding: "10px", fontSize: "16px", borderRadius: "4px", border: "none"}}
            required
          />
        </div>
        <div style={{margin: "15px 0"}}>
          <input
            type="password"
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{width: "100%", padding: "10px", fontSize: "16px", borderRadius: "4px", border: "none"}}
            required
          />
        </div>
        <button
          type="submit"
          disabled={state.loading}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: state.loading ? "wait" : "pointer"
          }}
        >
          {state.loading ? "Logging in..." : "LOGIN"}
        </button>
      </form>

      {state.error && (
        <div style={{marginTop: "15px", color: "#ff6b6b", fontSize: "14px"}}>
          Error: {state.error}
        </div>
      )}

      <div style={{marginTop: "20px", fontSize: "12px", color: "#888"}}>
        📊 Testing Dashboard page with Layout<br/>
        Login to see FULL Dashboard with:<br/>
        • User stats cards<br/>
        • Tournament overview<br/>
        • Credit/Coupon system<br/>
        • API calls & data loading<br/>
        🔍 If React Error #130 occurs = Dashboard problem!
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={lightAppTheme}>
      <CssBaseline />
      <SafeAuthProvider>
        <Router>
          <Routes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <DashboardTestLogin />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardTestLogin />
                </ProtectedRoute>
              } 
            />
            
            {/* Add all routes that Dashboard navigation expects */}
            <Route path="/tournaments" element={<ProtectedRoute><DashboardTestLogin /></ProtectedRoute>} />
            <Route path="/social" element={<ProtectedRoute><DashboardTestLogin /></ProtectedRoute>} />
            <Route path="/game-results" element={<ProtectedRoute><DashboardTestLogin /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><DashboardTestLogin /></ProtectedRoute>} />
            <Route path="/credits" element={<ProtectedRoute><DashboardTestLogin /></ProtectedRoute>} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </SafeAuthProvider>
    </ThemeProvider>
  );
};

export default App;