// src/App.tsx
// LFA Legacy GO - Main App Component with Fixed Routing

import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import loopDetector from "./utils/loopDetection";

// Import pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tournaments from "./pages/Tournaments";
import Profile from "./pages/Profile";
import CreditsPage from "./pages/CreditsPage";
import Social from "./pages/Social";
import TournamentDetails from "./pages/TournamentDetails";
import GameResults from "./pages/GameResults";
import AdminPanel from "./pages/AdminPanel";
import Layout from "./components/layout/Layout";

// Simple routing wrapper that tracks navigation for loop detection
function RoutingWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Track route changes
    const handleLocationChange = () => {
      const currentPath = window.location.pathname;
      loopDetector.trackRedirect(currentPath);
    };

    // Listen for navigation events
    window.addEventListener('popstate', handleLocationChange);
    
    // Track initial load
    handleLocationChange();

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return <>{children}</>;
}

function AppRoutes() {
  const { state } = useAuth();

  if (state.loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Loading...</div>
        <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
          Initializing authentication...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* CRITICAL: Explicit route handling to prevent loops */}
      <Route 
        path="/login" 
        element={state.isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/dashboard" 
        element={state.isAuthenticated ? (
          <Layout>
            <Dashboard />
          </Layout>
        ) : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/tournaments" 
        element={state.isAuthenticated ? (
          <Layout>
            <Tournaments />
          </Layout>
        ) : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/profile" 
        element={state.isAuthenticated ? (
          <Layout>
            <Profile />
          </Layout>
        ) : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/credits" 
        element={state.isAuthenticated ? (
          <Layout>
            <CreditsPage />
          </Layout>
        ) : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/social" 
        element={state.isAuthenticated ? (
          <Layout>
            <Social />
          </Layout>
        ) : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/tournaments/:tournamentId" 
        element={state.isAuthenticated ? (
          <Layout>
            <TournamentDetails />
          </Layout>
        ) : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/game-results" 
        element={state.isAuthenticated ? (
          <Layout>
            <GameResults />
          </Layout>
        ) : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/admin" 
        element={state.isAuthenticated ? (
          <Layout>
            <AdminPanel />
          </Layout>
        ) : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={state.isAuthenticated ? "/dashboard" : "/login"} replace />} 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <RoutingWrapper>
            <AppRoutes />
          </RoutingWrapper>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
