// TEST SEARCHFILTERS - Suspected cause of React Error #130
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline, Grid, Paper } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import { SafeAuthProvider, useSafeAuth, ProtectedRoute, PublicRoute } from "./SafeAuthContext";

// Simulate the problematic Grid usage from SearchFilters.tsx
const ProblematicGridTest: React.FC = () => {
  return (
    <div style={{ padding: "20px", background: "linear-gradient(135deg, #0f172a, #1e293b)", minHeight: "100vh" }}>
      <h1 style={{color: "#10b981"}}>🚨 PROBLEMATIC GRID API MIXING TEST</h1>
      
      {/* This should trigger React Error #130 - mixing old and new Grid API */}
      <Grid container spacing={2}>
        {/* NEW Grid v2 API */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper style={{ padding: "15px", background: "#065f46", color: "white" }}>
            <strong>✅ NEW Grid API</strong><br/>
            size=&#123;&#123; xs: 12, md: 6 &#125;&#125;
          </Paper>
        </Grid>
        
        {/* OLD Grid v1 API - THIS SHOULD CAUSE REACT ERROR #130 */}
        <Grid item xs={12} md={6}>
          <Paper style={{ padding: "15px", background: "#dc3545", color: "white" }}>
            <strong>🚨 OLD Grid API</strong><br/>
            item xs=&#123;12&#125; md=&#123;6&#125;
          </Paper>
        </Grid>
      </Grid>

      <div style={{ marginTop: "20px", padding: "15px", background: "#334155", color: "white" }}>
        <h3 style={{color: "#10b981"}}>🔍 API Mixing Analysis</h3>
        <p>
          ✅ Grid size=&#123;&#123;xs: 12&#125;&#125; - NEW MUI v6/v7 API<br/>
          🚨 Grid item xs=&#123;12&#125; - OLD MUI v4/v5 API<br/>
          💥 When mixed together = React Error #130
        </p>
      </div>
    </div>
  );
};

const SearchFiltersTestLogin: React.FC = () => {
  const { state, login, register, clearError } = useSafeAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (isLogin) {
      await login({ username, password });
    } else {
      await register({ username, password, email: "", full_name: "" });
    }
  };

  if (state.isAuthenticated && state.user) {
    return <ProblematicGridTest />;
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
      <h3 style={{ color: "#10b981", textAlign: "center" }}>🚨 GRID API MIXING TEST</h3>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              style={{
                width: "100%",
                padding: "8px 16px",
                background: isLogin ? "#10b981" : "#666",
                color: "white",
                border: "none",
                borderRadius: "4px"
              }}
            >
              LOGIN
            </button>
          </Grid>
          <Grid item xs={6}>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              style={{
                width: "100%",
                padding: "8px 16px",
                background: !isLogin ? "#10b981" : "#666",
                color: "white",
                border: "none",
                borderRadius: "4px"
              }}
            >
              REGISTER
            </button>
          </Grid>
          <Grid item xs={12}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{width: "100%", padding: "10px", fontSize: "16px", borderRadius: "4px", border: "none"}}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <input
              type="password"
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{width: "100%", padding: "10px", fontSize: "16px", borderRadius: "4px", border: "none"}}
              required
            />
          </Grid>
          <Grid item xs={12}>
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
          </Grid>
        </Grid>
      </form>

      {state.error && (
        <div style={{marginTop: "15px", color: "#ff6b6b", fontSize: "14px"}}>
          Error: {state.error}
        </div>
      )}

      <div style={{marginTop: "20px", fontSize: "12px", color: "#888"}}>
        🚨 Testing OLD Grid API (item xs=12)<br/>
        This should work in login but fail after authentication<br/>
        because we mix old + new Grid APIs
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
                  <SearchFiltersTestLogin />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <SearchFiltersTestLogin />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </SafeAuthProvider>
    </ThemeProvider>
  );
};

export default App;