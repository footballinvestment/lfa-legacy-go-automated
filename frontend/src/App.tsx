// src/App.tsx
// LFA Legacy GO - Main App Component with Full Tournament System Routing

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";
import { AuthProvider, ProtectedRoute, PublicRoute } from "./contexts/AuthContext";

// Import pages that we'll create
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
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/tournaments" element={
              <ProtectedRoute>
                <Layout>
                  <Tournaments />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/credits" element={
              <ProtectedRoute>
                <Layout>
                  <CreditsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/social" element={
              <ProtectedRoute>
                <Layout>
                  <Social />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/tournaments/:tournamentId" element={
              <ProtectedRoute>
                <Layout>
                  <TournamentDetails />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/game-results" element={
              <ProtectedRoute>
                <Layout>
                  <GameResults />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Layout>
                  <AdminPanel />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
