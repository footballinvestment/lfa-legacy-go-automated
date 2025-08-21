// TEST LAYOUT COMPONENT - Suspected cause of React Error #130
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import { SafeAuthProvider, useSafeAuth, ProtectedRoute, PublicRoute } from "./SafeAuthContext";
import Layout from "./components/layout/Layout";

// Simple test page that uses Layout
const LayoutTestPage: React.FC = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ color: "#10b981" }}>🏗️ LAYOUT COMPONENT TEST</h1>
      <p style={{ color: "#cbd5e1", marginBottom: "20px" }}>
        Testing Layout component with all MUI components:
      </p>
      
      <div style={{ 
        background: "#334155", 
        padding: "20px", 
        borderRadius: "8px",
        color: "white",
        marginBottom: "20px"
      }}>
        <h3 style={{ color: "#10b981", marginBottom: "15px" }}>🧪 Layout Components</h3>
        <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
          ✅ AppBar: Navigation bar<br/>
          ✅ Toolbar: Navigation buttons<br/>
          ✅ Typography: Text elements<br/>
          ✅ Button: Navigation buttons<br/>
          ✅ Box: Layout containers with sx props<br/>
          ✅ Container: Main content wrapper<br/>
          ✅ Menu: User dropdown menu<br/>
          ✅ MenuItem: Menu options<br/>
          ✅ IconButton: Icon buttons<br/>
          ✅ Chip: Credits display<br/>
          ✅ Drawer: Mobile navigation<br/>
          ✅ List: Navigation items<br/>
          ✅ ListItem: Individual nav items<br/>
          ✅ ListItemIcon: Navigation icons<br/>
          ✅ ListItemText: Navigation text<br/>
          ✅ useMediaQuery: Responsive breakpoints<br/>
          ✅ useTheme: Theme integration<br/>
          ✅ Material Icons: Various icons
        </div>
      </div>

      <div style={{ 
        background: "#065f46", 
        padding: "15px", 
        borderRadius: "8px",
        color: "white"
      }}>
        <strong>🔬 Testing Layout Component Integration</strong><br/>
        <span style={{ fontSize: "14px" }}>
          If React Error #130 occurs, it's likely from:<br/>
          • Box sx prop combinations<br/>
          • Menu/MenuItem interactions<br/>
          • Drawer component complexity<br/>
          • Material Icons imports<br/>
          • useMediaQuery/useTheme hooks
        </span>
      </div>
    </div>
  );
};

const LayoutTestLogin: React.FC = () => {
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
        <LayoutTestPage />
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
      <h3 style={{ color: "#10b981", textAlign: "center" }}>🏗️ LAYOUT TEST</h3>
      
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
        🏗️ Testing Layout component with ALL MUI components<br/>
        Login to see if Layout causes React Error #130<br/>
        Layout includes: AppBar, Menu, Drawer, Icons, Box sx props
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
                  <LayoutTestLogin />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <LayoutTestLogin />
                </ProtectedRoute>
              } 
            />
            
            {/* Add dummy routes that Layout navigation expects */}
            <Route path="/tournaments" element={<ProtectedRoute><LayoutTestLogin /></ProtectedRoute>} />
            <Route path="/social" element={<ProtectedRoute><LayoutTestLogin /></ProtectedRoute>} />
            <Route path="/game-results" element={<ProtectedRoute><LayoutTestLogin /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><LayoutTestLogin /></ProtectedRoute>} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </SafeAuthProvider>
    </ThemeProvider>
  );
};

export default App;