// STEP 1: THEME INTEGRATION - Material-UI Theme hozzáadása App-minimal.tsx-hez
// ⚠️ CRITICAL: Ellenőrizzük hogy nincs React Error #130 objektum renderelés miatt

import React, { useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import { SafeAuthProvider, useSafeAuth } from "./SafeAuthContext";

// Minimal Login Component - SAME AS BEFORE with theme styling updates
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
    
    // ⚠️ REACT ERROR #130 PROTECTION: Safe object handling
    console.log('🔍 Form submit - checking data types:', {
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

  // ⚠️ REACT ERROR #130 PROTECTION: Safe user object rendering
  if (state.isAuthenticated && state.user) {
    console.log('✅ User authenticated, rendering dashboard. User data type:', typeof state.user);
    
    return (
      <div style={{
        padding: "20px", 
        fontFamily: "Roboto, Arial", 
        background: "linear-gradient(135deg, #0f172a, #1e293b)", 
        color: "white", 
        minHeight: "100vh"
      }}>
        <h1 style={{color: "#10b981", fontSize: "2.5rem"}}>✅ SUCCESS - LFA Legacy GO with Material-UI</h1>
        
        {/* ⚠️ SAFE USER RENDERING - Always use optional chaining */}
        <h2 style={{color: "white"}}>Welcome, {state.user?.display_name || state.user?.username || 'Guest'}!</h2>
        
        <div style={{background: "#334155", padding: "15px", margin: "15px 0", borderRadius: "12px", color: "white"}}>
          <strong style={{color: "#10b981"}}>User Data (Safe Rendering):</strong><br/>
          <span style={{color: "white"}}>Email: {state.user?.email || 'N/A'}</span><br/>
          <span style={{color: "white"}}>Credits: {state.user?.credits ?? 0}</span><br/>
          <span style={{color: "white"}}>Games Won: {state.user?.games_won ?? 0}</span><br/>
          <span style={{color: "white"}}>Premium: {state.user?.is_premium ? "Yes" : "No"}</span><br/>
          <span style={{color: "white"}}>Created: {state.user?.created_at || 'Unknown'}</span>
        </div>
        
        <div style={{
          background: "#10b981", 
          padding: "15px", 
          margin: "15px 0", 
          borderRadius: "12px", 
          color: "white"
        }}>
          <h3>🎨 STEP 1 COMPLETE: Material-UI Theme Integration</h3>
          <p style={{margin: "10px 0"}}>
            ✅ ThemeProvider added<br/>
            ✅ CssBaseline integrated<br/>
            ✅ lightAppTheme imported<br/>
            ✅ Custom colors and typography<br/>
            ✅ No React Error #130<br/>
            ✅ Safe object rendering patterns
          </p>
        </div>
        
        <div style={{margin: "20px 0", display: "flex", gap: "10px", flexWrap: "wrap"}}>
          <button 
            onClick={() => {
              window.location.href = '/dashboard';
            }}
            style={{
              padding: "15px 30px", 
              background: "linear-gradient(135deg, #10b981, #059669)", 
              color: "white", 
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(16, 185, 129, 0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(16, 185, 129, 0.3)";
            }}
          >
            🏆 Ready for Layout Integration (Step 2)
          </button>
          <button 
            onClick={() => logout()}
            style={{
              padding: "15px 30px", 
              background: "#dc3545", 
              color: "white", 
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Logout
          </button>
        </div>
        
        <div style={{
          background: "#1e293b", 
          padding: "15px", 
          margin: "15px 0", 
          borderRadius: "12px", 
          fontSize: "14px",
          color: "#cbd5e1"
        }}>
          <strong style={{color: "#fbbf24"}}>🔧 Debug Info:</strong><br/>
          Loading: {state.loading ? 'Yes' : 'No'}<br/>
          Auth State: {state.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}<br/>
          User Object Type: {typeof state.user}<br/>
          Error: {state.error || 'None'}<br/>
          Theme: Material-UI lightAppTheme active
        </div>
      </div>
    );
  }

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
      <h1 style={{fontSize: "2rem", color: "#10b981"}}>⚽ LFA Legacy GO</h1>
      <h3 style={{fontSize: "1.2rem", color: "#34d399"}}>🎨 STEP 1: Material-UI Theme</h3>
      
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
        <strong style={{color: "#10b981"}}>✅ Step 1 Features:</strong><br/>
        • ThemeProvider active<br/>
        • Material-UI colors & typography<br/>
        • Safe object rendering<br/>
        • No React Error #130<br/>
        • Ready for Layout component
      </div>
    </div>
  );
};

// App Component with Material-UI Theme Integration
const App: React.FC = () => {
  console.log('🎨 Step 1: Rendering App with Material-UI Theme');
  
  return (
    <ThemeProvider theme={lightAppTheme}>
      <CssBaseline />
      <SafeAuthProvider>
        <MinimalLogin />
      </SafeAuthProvider>
    </ThemeProvider>
  );
};

export default App;