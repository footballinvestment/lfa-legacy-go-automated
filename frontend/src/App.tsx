// src/App.tsx
// LFA Legacy GO - Main App Component with Full Tournament System Routing

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box, IconButton } from "@mui/material";
import { LightMode, DarkMode } from "@mui/icons-material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { createAppTheme } from "./styles/theme";
import AuthForm from "./components/auth/AuthForm";
import Layout from "./components/layout/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import LocationList from "./components/locations/LocationList";
import BookingForm from "./components/booking/BookingForm";
import TournamentList from "./components/tournaments/TournamentList";
import TournamentDetailsPage from "./components/tournaments/TournamentDetailsPage";
import TournamentBracket from "./components/tournaments/TournamentBracket";
import MatchControlDashboard from "./components/tournaments/MatchControlDashboard";
import LiveTournamentFeed from "./components/tournaments/LiveTournamentFeed";
import TournamentAnalyticsDashboard from "./components/tournaments/TournamentAnalyticsDashboard";
import AdvancedDataVisualization from "./components/common/AdvancedDataVisualization";
import AdvancedAdminDashboard from "./components/admin/AdvancedAdminDashboard";
import AdvancedUserManagement from "./components/admin/AdvancedUserManagement";
import AdminRoute from "./components/auth/AdminRoute";
import FriendsList from "./components/social/FriendsList";
import CreditPurchase from "./components/credits/CreditPurchase";
import GameResults from "./components/game-results/GameResults";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Main App Content with Routing
const AppContent: React.FC = () => {
  const { state } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const theme = createAppTheme(darkMode);

  if (state.isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        }}
      >
        <Box
          sx={{
            textAlign: "center",
            color: "white",
            fontSize: "1.5rem",
          }}
        >
          Loading LFA Legacy GO...
        </Box>
      </Box>
    );
  }

  if (!state.isAuthenticated || !state.user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthForm />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        {/* Dark Mode Toggle */}
        <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 1200 }}>
          <IconButton
            onClick={() => setDarkMode(!darkMode)}
            sx={{
              backgroundColor: "background.paper",
              boxShadow: 2,
              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
          >
            {darkMode ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Box>

        <Routes>
          {/* Core Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/locations" element={<LocationList />} />
          <Route path="/booking" element={<BookingForm />} />
          <Route path="/social" element={<FriendsList />} />
          <Route path="/credits" element={<CreditPurchase />} />
          <Route path="/game-results" element={<GameResults />} />

          {/* Tournament System Routes */}
          <Route path="/tournaments" element={<TournamentList />} />
          <Route path="/tournaments/live-feed" element={<LiveTournamentFeed />} />
          <Route path="/tournaments/analytics" element={<TournamentAnalyticsDashboard />} />
          <Route path="/tournaments/charts" element={<AdvancedDataVisualization />} />
          <Route
            path="/tournaments/:tournamentId"
            element={<TournamentDetailsPage />}
          />
          <Route
            path="/tournaments/:tournamentId/bracket"
            element={<TournamentBracket />}
          />
          <Route
            path="/tournaments/:tournamentId/matches"
            element={<MatchControlDashboard />}
          />

          {/* Admin Routes - Protected */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdvancedAdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminRoute>
                <AdvancedAdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminRoute>
                <AdvancedUserManagement />
              </AdminRoute>
            } 
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
};

// Main App with Providers
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
