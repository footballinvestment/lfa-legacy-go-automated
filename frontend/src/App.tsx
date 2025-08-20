// LFA Legacy GO - Full Application Rebuild
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";
import { SafeAuthProvider, ProtectedRoute, PublicRoute } from "./SafeAuthContext";

// Import all original pages
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SafeAuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            {/* Protected Routes with Layout */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tournaments" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Tournaments />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tournaments/:tournamentId" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <TournamentDetails />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/credits" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreditsPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/social" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Social />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/game-results" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <GameResults />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdminPanel />
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
}

export default App;