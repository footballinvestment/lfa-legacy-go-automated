// MUI GRID COMPONENT TEST - Most likely culprit for React Error #130
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline, Grid, Paper } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import { SafeAuthProvider, useSafeAuth, ProtectedRoute, PublicRoute } from "./SafeAuthContext";

// Test MUI Grid Component (suspected cause of React Error #130)
const MUIGridTestLogin: React.FC = () => {
  const { state, login, register, clearError } = useSafeAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (isLogin) {
      await login({ username, password });
    } else {
      await register({ username, password, email, full_name: fullName });
    }
  };

  if (state.isAuthenticated && state.user) {
    return (
      <div style={{
        padding: "20px", 
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #1e293b)"
      }}>
        <h1 style={{color: "#10b981", marginBottom: "20px"}}>🔬 MUI GRID TEST</h1>
        
        {/* Testing Grid Component - SUSPECTED CAUSE OF REACT ERROR #130 */}
        <Grid container spacing={2} style={{ marginBottom: "20px" }}>
          <Grid item xs={12} md={6}>
            <Paper style={{ padding: "15px", background: "#334155", color: "white" }}>
              <h3 style={{color: "#10b981"}}>✅ Grid Test SUCCESS</h3>
              <p>Welcome, {state.user.display_name || state.user.username}!</p>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper style={{ padding: "15px", background: "#334155", color: "white" }}>
              <strong style={{color: "#10b981"}}>User Data:</strong><br/>
              <span>Email: {state.user.email}</span><br/>
              <span>Credits: {state.user.credits}</span><br/>
              <span>Games Won: {state.user.games_won}</span><br/>
              <span>Premium: {state.user.is_premium ? "Yes" : "No"}</span>
            </Paper>
          </Grid>
        </Grid>

        {/* Testing Grid with different breakpoints */}
        <Grid container spacing={3} style={{ marginBottom: "20px" }}>
          <Grid item xs={6} sm={4} md={3}>
            <Paper style={{ padding: "10px", background: "#065f46", color: "white", textAlign: "center" }}>
              <strong>XS=6</strong><br/>SM=4<br/>MD=3
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Paper style={{ padding: "10px", background: "#0c4a6e", color: "white", textAlign: "center" }}>
              <strong>XS=6</strong><br/>SM=4<br/>MD=3
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4} md={6}>
            <Paper style={{ padding: "10px", background: "#7c2d12", color: "white", textAlign: "center" }}>
              <strong>XS=12</strong><br/>SM=4<br/>MD=6
            </Paper>
          </Grid>
        </Grid>
        
        <div style={{margin: "20px 0"}}>
          <h3 style={{color: "#10b981"}}>🧪 MUI Components Status</h3>
          <p style={{color: "#cbd5e1"}}>
            ✅ ThemeProvider: WORKING<br/>
            ✅ CssBaseline: WORKING<br/>
            ✅ Grid container: TESTING<br/>
            ✅ Grid item: TESTING<br/>
            ✅ Paper component: TESTING<br/>
            🔬 Checking if Grid causes React Error #130
          </p>
          <button 
            onClick={() => state.logout && state.logout()}
            style={{
              padding: "15px 30px", 
              background: "#dc3545", 
              color: "white", 
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "40px", 
      maxWidth: "500px", 
      margin: "0 auto",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a, #1e293b)"
    }}>
      {/* Testing Grid in Login Form */}
      <Grid container spacing={2} style={{ marginBottom: "20px" }}>
        <Grid item xs={12}>
          <h1 style={{ color: "white", textAlign: "center" }}>⚽ LFA Legacy GO</h1>
          <h3 style={{ color: "#10b981", textAlign: "center" }}>🔬 GRID COMPONENT TEST</h3>
        </Grid>
      </Grid>
      
      <Grid container spacing={2} style={{ marginBottom: "20px" }}>
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
      </Grid>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {!isLogin && (
            <>
              <Grid item xs={12}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{width: "100%", padding: "10px", fontSize: "16px", borderRadius: "4px", border: "none"}}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{width: "100%", padding: "10px", fontSize: "16px", borderRadius: "4px", border: "none"}}
                  required
                />
              </Grid>
            </>
          )}
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
              {state.loading ? (isLogin ? "Logging in..." : "Registering...") : (isLogin ? "LOGIN" : "REGISTER")}
            </button>
          </Grid>
        </Grid>
      </form>

      {state.error && (
        <Grid container style={{ marginTop: "15px" }}>
          <Grid item xs={12}>
            <div style={{ color: "#ff6b6b", fontSize: "14px" }}>
              Error: {state.error}
            </div>
          </Grid>
        </Grid>
      )}

      <Grid container style={{ marginTop: "20px" }}>
        <Grid item xs={12}>
          <div style={{ fontSize: "12px", color: "#888" }}>
            ✅ SafeAuthContext working<br/>
            ✅ React Router working<br/>
            ✅ ThemeProvider working<br/>
            ✅ CssBaseline working<br/>
            🔬 Grid container TESTING<br/>
            🔬 Grid item TESTING<br/>
            🔬 Paper component TESTING
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

// MUI Grid Test App
const App: React.FC = () => {
  return (
    <ThemeProvider theme={lightAppTheme}>
      <CssBaseline />
      <SafeAuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <MUIGridTestLogin />
                </PublicRoute>
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <MUIGridTestLogin />
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