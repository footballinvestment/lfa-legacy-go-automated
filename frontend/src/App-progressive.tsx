// PROGRESSIVE BUILD - Step by Step Component Integration
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SafeAuthProvider, useSafeAuth, ProtectedRoute, PublicRoute } from "./SafeAuthContext";

// Progressive Login Component - Using Material-UI step by step
const ProgressiveLogin: React.FC = () => {
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
        fontFamily: "Arial", 
        background: "linear-gradient(135deg, #0f172a, #1e293b)", 
        color: "white", 
        minHeight: "100vh"
      }}>
        <h1 style={{color: "#10b981"}}>✅ PROGRESSIVE SUCCESS</h1>
        <h2 style={{color: "white"}}>Welcome, {state.user.display_name || state.user.username}!</h2>
        <div style={{background: "#334155", padding: "15px", margin: "15px 0", borderRadius: "5px"}}>
          <strong style={{color: "#10b981"}}>User Data:</strong><br/>
          <span style={{color: "white"}}>Email: {state.user.email}</span><br/>
          <span style={{color: "white"}}>Credits: {state.user.credits}</span><br/>
          <span style={{color: "white"}}>Games Won: {state.user.games_won}</span><br/>
          <span style={{color: "white"}}>Premium: {state.user.is_premium ? "Yes" : "No"}</span>
        </div>
        
        <div style={{margin: "20px 0"}}>
          <h3 style={{color: "#10b981"}}>🔧 Progressive Build Mode</h3>
          <p style={{color: "#cbd5e1"}}>Adding features step by step to isolate React Error #130</p>
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
      fontFamily: "Arial", 
      maxWidth: "400px", 
      margin: "0 auto",
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      color: "white",
      minHeight: "100vh"
    }}>
      <h1>⚽ LFA Legacy GO</h1>
      <h3>🔧 PROGRESSIVE BUILD</h3>
      
      <div style={{marginBottom: "20px"}}>
        <button
          type="button"
          onClick={() => setIsLogin(true)}
          style={{
            padding: "8px 16px",
            marginRight: "10px",
            background: isLogin ? "#10b981" : "#666",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          LOGIN
        </button>
        <button
          type="button"
          onClick={() => setIsLogin(false)}
          style={{
            padding: "8px 16px",
            background: !isLogin ? "#10b981" : "#666",
            color: "white",
            border: "none",
            borderRadius: "4px"
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
                style={{width: "100%", padding: "10px", fontSize: "16px", borderRadius: "4px", border: "none"}}
                required
              />
            </div>
            <div style={{margin: "15px 0"}}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{width: "100%", padding: "10px", fontSize: "16px", borderRadius: "4px", border: "none"}}
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
          {state.loading ? (isLogin ? "Logging in..." : "Registering...") : (isLogin ? "LOGIN" : "REGISTER")}
        </button>
      </form>

      {state.error && (
        <div style={{marginTop: "15px", color: "#ff6b6b", fontSize: "14px"}}>
          Error: {state.error}
        </div>
      )}

      <div style={{marginTop: "20px", fontSize: "12px", color: "#888"}}>
        ✅ SafeAuthContext working<br/>
        ✅ React Router working<br/>
        ✅ No Material-UI yet<br/>
        ✅ No React Error #130<br/>
        🔧 Progressive build mode
      </div>
    </div>
  );
};

// Progressive App with Router but no complex components yet
const App: React.FC = () => {
  return (
    <SafeAuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <ProgressiveLogin />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <ProgressiveLogin />
              </ProtectedRoute>
            } 
          />
          
          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </SafeAuthProvider>
  );
};

export default App;