import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  LinearProgress,
  Alert,
  Fade,
  IconButton,
  Tooltip,
  Snackbar,
} from "@mui/material";
import {
  EmojiEvents,
  Person,
  TrendingUp,
  Refresh,
  Add,
  Timeline,
  AccountBalanceWallet,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { tournamentService, CouponRedemptionResponse } from "../services/api";
import CreditBalance from "../components/credits/CreditBalance";
import CouponRedemption from "../components/credits/CouponRedemption";
import AvailableCoupons from "../components/credits/AvailableCoupons";

interface DashboardStats {
  totalTournaments: number;
  activeTournaments: number;
  recentActivity: string[];
}

const Dashboard: React.FC = () => {
  // 🔥 KRITIKUS JAVÍTÁS: refreshStats kinyerése az AuthContext-ből
  const { state, refreshStats } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const loadDashboardStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const tournaments = await tournamentService.getTournaments();
      setStats({
        totalTournaments: tournaments.length,
        activeTournaments: tournaments.filter(
          (t: any) => t.status === "registration"
        ).length,
        recentActivity: [
          "Registered for tournament",
          "Completed profile setup",
        ],
      });
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  // 🎯 JAVÍTOTT: Most már megfelelően frissíti az auth context user adatait
  const handleCouponSuccess = async (response: CouponRedemptionResponse) => {
    setSuccessMessage(
      `🎉 ${response.coupon_name} redeemed! +${response.credits_awarded} credits`
    );
    setSnackbarOpen(true);

    // 🚀 KULCS JAVÍTÁS: Azonnal frissíti a user adatokat az auth context-ben
    try {
      await refreshStats();
      console.log("✅ User stats frissítve kupon beváltás után");
    } catch (error) {
      console.error("❌ User stats frissítés sikertelen:", error);

      // Fallback: késleltetett frissítés ha az azonnali nem sikerült
      setTimeout(async () => {
        try {
          await refreshStats();
          console.log("✅ User stats frissítve (fallback)");
        } catch (fallbackError) {
          console.error("❌ Fallback frissítés is sikertelen:", fallbackError);
        }
      }, 1500);
    }

    // Dashboard stats frissítése is
    setTimeout(() => {
      loadDashboardStats();
    }, 1000);
  };

  const handleCreditBalanceUpdate = (newBalance: number) => {
    // Opcionális: Direkt user context frissítés ha szükséges
    console.log("Credit balance frissítve:", newBalance);
  };

  const userStats = [
    {
      title: "Level",
      value: state.user?.level || 1,
      icon: <TrendingUp />,
      color: "primary" as const,
      progress: (state.user?.xp || 0) % 100,
    },
    {
      title: "Credits",
      value: state.user?.credits || 0, // 📊 Ez most már valós időben frissül!
      icon: <EmojiEvents />,
      color: "secondary" as const,
      action: () => {
        document.getElementById("coupon-section")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      },
    },
    {
      title: "Games Played",
      value: state.user?.games_played || 0,
      icon: <Person />,
      color: "success" as const,
      winRate: state.user?.games_played
        ? ((state.user.games_won || 0) / state.user.games_played) * 100
        : 0,
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          Welcome back, {state.user?.full_name || state.user?.username}!
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton
              onClick={() => {
                loadDashboardStats();
                refreshStats(); // 🔄 User stats frissítése is
              }}
              disabled={loading}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {userStats.map((stat, index) => (
          <Grid key={`user-stat-${index}`} size={{ xs: 12, sm: 6, md: 4 }}>
            <Fade in timeout={300 * (index + 1)}>
              <Card
                sx={{
                  height: "100%",
                  cursor: stat.action ? "pointer" : "default",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": stat.action
                    ? {
                        transform: "translateY(-4px)",
                        boxShadow: 3,
                      }
                    : {},
                }}
                onClick={stat.action}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography color="text.secondary" variant="h6">
                      {stat.title}
                    </Typography>
                    <Box sx={{ color: `${stat.color}.main` }}>{stat.icon}</Box>
                  </Box>

                  <Typography
                    variant="h4"
                    component="div"
                    fontWeight="bold"
                    color={`${stat.color}.main`}
                  >
                    {stat.value}
                  </Typography>

                  {stat.progress !== undefined && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={stat.progress}
                        color={stat.color}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: "block" }}
                      >
                        {Math.round(stat.progress)}% to next level
                      </Typography>
                    </Box>
                  )}

                  {stat.winRate !== undefined && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Win Rate: {stat.winRate.toFixed(1)}%
                    </Typography>
                  )}

                  {stat.action && (
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Click to manage →
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Tournament Stats */}
      {stats && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Tournament Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h5" color="primary">
                    {stats.totalTournaments}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Tournaments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h5" color="success.main">
                    {stats.activeTournaments}
                  </Typography>
                  <Typography color="text.secondary">Active Now</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Add />}
              onClick={() => navigate("/tournaments")}
              sx={{ py: 1.5 }}
            >
              Join Tournament
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AccountBalanceWallet />}
              onClick={() => navigate("/credits")}
              sx={{ py: 1.5 }}
              color="secondary"
            >
              💎 Manage Credits
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Person />}
              onClick={() => navigate("/profile")}
              sx={{ py: 1.5 }}
            >
              View Profile
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Coupon System Section */}
      <Box id="coupon-section" sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
          💎 Credits & Coupons
        </Typography>

        <Grid container spacing={3}>
          {/* Credit Balance */}
          <Grid size={{ xs: 12, md: 4 }}>
            <CreditBalance
              onAddCredits={() => navigate("/credits")}
              onViewHistory={() => navigate("/credits")}
              showHistoryButton={true}
            />
          </Grid>

          {/* Coupon Redemption */}
          <Grid size={{ xs: 12, md: 8 }}>
            <CouponRedemption
              onSuccess={handleCouponSuccess} // 🎯 Ez most már megfelelően frissíti az auth context-et
              onBalanceUpdate={handleCreditBalanceUpdate}
            />
          </Grid>

          {/* Available Coupons (Development) */}
          <Grid size={12}>
            <AvailableCoupons
              developmentMode={process.env.NODE_ENV === "development"}
              onCouponSelect={(code) => {
                // Auto-fill the coupon code in redemption form
                const couponInput = document.querySelector(
                  'input[placeholder*="coupon"]'
                ) as HTMLInputElement;
                if (couponInput) {
                  couponInput.value = code;
                  couponInput.focus();

                  // Trigger change event
                  const event = new Event("input", { bubbles: true });
                  couponInput.dispatchEvent(event);
                }
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Success Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={successMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

export default Dashboard;
