// LFA Legacy GO - Full Application Rebuild
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import {
  SafeAuthProvider,
  ProtectedRoute,
  PublicRoute,
} from "./SafeAuthContext";

// Import all original pages
import Login from "./pages/Login";
import SimpleDashboard from "./components/dashboard";
import Tournaments from "./pages/Tournaments";
import Profile from "./pages/Profile";
import CreditsPage from "./pages/CreditsPage";
import Social from "./pages/Social";
import TournamentDetails from "./pages/TournamentDetails";
import GameResults from "./pages/GameResults";
import AdminPanel from "./pages/AdminPanel";
import VerifyEmail from "./pages/VerifyEmail";
import Layout from "./components/layout/Layout";

function App() {
  console.log("🔴 APP COMPONENT MOUNTING");
  console.log("🔴 About to render SafeAuthProvider");
  console.log("🔴 SafeAuthProvider import:", { SafeAuthProvider });
  console.log("🔴 React version:", React.version);
  
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
                  <Login />
                </PublicRoute>
              }
            />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Protected Routes with Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SimpleDashboard />
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
/* Cache bust: 2025 Sze  4 Csü 16:37:31 CEST */
/* FORCE REBUILD 1757012852 */
