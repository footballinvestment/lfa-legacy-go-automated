// LFA Legacy GO - Progressive Rebuild with SafeAuthContext
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";
import { SafeAuthProvider, useSafeAuth, ProtectedRoute, PublicRoute } from "./SafeAuthContext";

// Working Login Page
function WorkingLogin() {
  const { state, login, clearError } = useSafeAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login({ username, password });
    if (success) {
      window.location.href = '/dashboard';
    }
  };

  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{padding: "40px", textAlign: "center", maxWidth: "400px", margin: "0 auto"}}>
      <h1>LFA Legacy GO - Login</h1>
      <form onSubmit={handleLogin} style={{marginTop: "30px"}}>
        <div style={{marginBottom: "15px"}}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{width: "100%", padding: "10px", fontSize: "16px"}}
            required
          />
        </div>
        <div style={{marginBottom: "15px"}}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{width: "100%", padding: "10px", fontSize: "16px"}}
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
            backgroundColor: "#007bff", 
            color: "white", 
            border: "none",
            cursor: state.loading ? "wait" : "pointer"
          }}
        >
          {state.loading ? "Logging in..." : "Login"}
        </button>
      </form>
      {state.error && (
        <div style={{marginTop: "15px", color: "red", fontSize: "14px"}}>
          {state.error}
        </div>
      )}
      <p style={{marginTop: "20px", color: "#666", fontSize: "14px"}}>
        Use your real account credentials - connected to live API
      </p>
    </div>
  );
}

// Protected Dashboard Page
function ProtectedDashboard() {
  const { state, logout } = useSafeAuth();

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div style={{padding: "20px"}}>
      <h1>LFA Legacy GO - Dashboard</h1>
      <p>Welcome back, {state.user?.display_name || state.user?.username}!</p>
      <p>Email: {state.user?.email}</p>
      <p>Credits: {state.user?.credits || 0}</p>
      <p>Games Won: {state.user?.games_won || 0} | Games Lost: {state.user?.games_lost || 0}</p>
      <p>Premium: {state.user?.is_premium ? 'Yes' : 'No'}</p>
      <nav style={{marginTop: "20px"}}>
        <a href="/tournaments" style={{marginRight: "15px", color: "#007bff"}}>Tournaments</a>
        <a href="/profile" style={{marginRight: "15px", color: "#007bff"}}>Profile</a>
        <button 
          onClick={handleLogout}
          style={{
            padding: "8px 15px", 
            backgroundColor: "#dc3545", 
            color: "white", 
            border: "none", 
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </nav>
    </div>
  );
}

// Simple Tournaments Page
function SimpleTournaments() {
  return (
    <div style={{padding: "20px"}}>
      <h1>Tournaments</h1>
      <p>Tournament list coming soon...</p>
      <a href="/dashboard">Back to Dashboard</a>
    </div>
  );
}

// Simple Profile Page  
function SimpleProfile() {
  return (
    <div style={{padding: "20px"}}>
      <h1>Profile</h1>
      <p>User profile coming soon...</p>
      <a href="/dashboard">Back to Dashboard</a>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SafeAuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<PublicRoute><WorkingLogin /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><ProtectedDashboard /></ProtectedRoute>} />
            <Route path="/tournaments" element={<ProtectedRoute><SimpleTournaments /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><SimpleProfile /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </SafeAuthProvider>
    </ThemeProvider>
  );
}

export default App;