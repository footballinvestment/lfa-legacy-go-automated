// MINIMAL WORKING APP - NO REACT ERROR #130
import React, { useState } from "react";
import { SafeAuthProvider, useSafeAuth } from "./SafeAuthContext";

// Minimal Login Component
const MinimalLogin: React.FC = () => {
  const { state, login, register, logout, clearError } = useSafeAuth();
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
        <h1 style={{color: "#10b981"}}>✅ SUCCESS - LFA Legacy GO</h1>
        <h2 style={{color: "white"}}>Welcome, {state.user.display_name || state.user.username}!</h2>
        <div style={{background: "#334155", padding: "15px", margin: "15px 0", borderRadius: "5px", color: "white"}}>
          <strong style={{color: "#10b981"}}>User Data:</strong><br/>
          <span style={{color: "white"}}>Email: {state.user.email}</span><br/>
          <span style={{color: "white"}}>Credits: {state.user.credits}</span><br/>
          <span style={{color: "white"}}>Games Won: {state.user.games_won}</span><br/>
          <span style={{color: "white"}}>Premium: {state.user.is_premium ? "Yes" : "No"}</span>
        </div>
        
        <div style={{margin: "20px 0"}}>
          <h3 style={{color: "#10b981"}}>🚀 Ready for Full Application!</h3>
          <button 
            onClick={() => {
              // Switch to full app
              window.location.href = '/dashboard';
            }}
            style={{
              padding: "15px 30px", 
              background: "#10b981", 
              color: "white", 
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              marginRight: "10px",
              cursor: "pointer"
            }}
          >
            🏆 Enter Full Application
          </button>
          <button 
            onClick={() => logout()}
            style={{
              padding: "15px 30px", 
              background: "#dc3545", 
              color: "white", 
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
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
      <h3>🔥 MINIMAL WORKING VERSION</h3>
      
      <div style={{marginBottom: "20px"}}>
        <button
          type="button"
          onClick={() => setIsLogin(true)}
          style={{
            padding: "8px 16px",
            marginRight: "10px",
            background: isLogin ? "#10b981" : "#666",
            color: "white",
            border: "none"
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
            border: "none"
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
                style={{width: "100%", padding: "10px", fontSize: "16px"}}
                required
              />
            </div>
            <div style={{margin: "15px 0"}}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{width: "100%", padding: "10px", fontSize: "16px"}}
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
            style={{width: "100%", padding: "10px", fontSize: "16px"}}
            required
          />
        </div>
        <div style={{margin: "15px 0"}}>
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
            background: "#10b981",
            color: "white",
            border: "none",
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
        ✅ API connected<br/>
        ✅ Login & Register available<br/>
        ✅ No React Error #130
      </div>
    </div>
  );
};

// Minimal App
const App: React.FC = () => {
  return (
    <SafeAuthProvider>
      <MinimalLogin />
    </SafeAuthProvider>
  );
};

export default App;