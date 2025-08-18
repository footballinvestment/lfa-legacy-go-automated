// src/components/dashboard/Dashboard.tsx
// LFA Legacy GO - Dashboard with REAL API data (no mock)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Fab,
  Fade,
} from "@mui/material";
import {
  AccountBalanceWallet,
  EmojiEvents,
  People,
  CalendarMonth,
  SportsScore,
  TrendingUp,
  Star,
  ArrowForward,
  Refresh,
  Add,
  Assessment,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { gameResultsService } from "../../services/gameResultsService";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

interface RecentActivity {
  id: number;
  type: "game" | "booking" | "tournament" | "achievement";
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

interface GameStats {
  games_played: number;
  games_won: number;
  games_lost: number;
  games_drawn: number;
  win_rate: number;
  total_playtime: number;
  recent_results: any[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state, refreshStats } = useAuth();
  const { user } = state;

  const [loading, setLoading] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load game statistics on component mount
  useEffect(() => {
    loadGameStatistics();
  }, []);

  const loadGameStatistics = async () => {
    try {
      setStatsLoading(true);
      setError(null);

      // ✅ REAL API CALL - no mock logic
      const stats = await gameResultsService.getStatistics("all");

      setGameStats({
        games_played: stats.overall.games_played,
        games_won: stats.overall.games_won,
        games_lost: stats.overall.games_lost,
        games_drawn: stats.overall.games_drawn,
        win_rate: stats.overall.win_rate,
        total_playtime: stats.overall.total_playtime,
        recent_results: stats.recent_performance?.last_5_games || [],
      });
    } catch (err: any) {
      console.error("Failed to load game statistics:", err);

      // ✅ REAL FALLBACK - use user data from auth, NOT mock data
      const fallbackStats = {
        games_played: user?.games_played || 0,
        games_won: user?.games_won || 0,
        games_lost: user?.games_lost || 0,
        games_drawn: 0,
        win_rate:
          user?.games_played && user?.games_won
            ? Math.round(
                ((user.games_won || 0) / Math.max(user.games_played || 1, 1)) *
                  100
              )
            : 0,
        total_playtime: 0,
        recent_results: [],
      };

      setGameStats(fallbackStats);

      // Show a helpful error message
      if (err.response?.status === 404) {
        setError("Game statistics not found. Start playing to see your stats!");
      } else if (err.response?.status >= 500) {
        setError("Server error loading statistics. Using cached data.");
      } else {
        setError(
          "Unable to load latest statistics. Some data may be outdated."
        );
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadGameStatistics(),
        refreshStats ? refreshStats() : Promise.resolve(),
      ]);
      setError(null); // Clear any previous errors on successful refresh
    } catch (err) {
      console.error("Refresh failed:", err);
      setError("Failed to refresh data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calculate user progress with proper XP handling
  const currentXP = user?.xp || 0;
  const currentLevel = user?.level || 1;
  const xpForNextLevel = currentLevel * 100; // XP required for next level
  const progressPercent = Math.min((currentXP / xpForNextLevel) * 100, 100);

  // ✅ Use REAL game statistics (no mock logic)
  const winRate = gameStats?.win_rate || 0;
  const gamesPlayed = gameStats?.games_played || 0;
  const gamesWon = gameStats?.games_won || 0;

  // Quick Action Cards
  const quickActions: QuickAction[] = [
    {
      title: "Join Tournament",
      description: "Find and join upcoming tournaments",
      icon: <EmojiEvents />,
      color: "primary",
      action: () => navigate("/tournaments"),
    },
    {
      title: "Add Game Result",
      description: "Record your latest game results",
      icon: <Add />,
      color: "success",
      action: () => navigate("/game-results?action=add"),
    },
    {
      title: "View Statistics",
      description: "Detailed performance analytics",
      icon: <Assessment />,
      color: "info",
      action: () => navigate("/game-results"),
    },
    {
      title: "Social Hub",
      description: "Connect with friends and challengers",
      icon: <People />,
      color: "secondary",
      action: () => navigate("/social"),
    },
  ];

  // Statistics cards with REAL data
  const statsCards = [
    {
      title: "Current Level",
      value: user?.level || 1,
      icon: <Star />,
      color: "primary",
      progress: progressPercent,
      subtitle: `${currentXP}/${xpForNextLevel} XP`,
      action: () => navigate("/profile"),
    },
    {
      title: "Credits",
      value: user?.credits || 0,
      icon: <AccountBalanceWallet />,
      color: "success",
      subtitle: "Available balance",
      action: () => navigate("/credits"),
    },
    {
      title: "Games Played",
      value: gamesPlayed,
      icon: <SportsScore />,
      color: "info",
      subtitle: statsLoading ? "Loading..." : `${gamesWon} wins`,
      winRate: winRate,
      action: () => navigate("/game-results"),
    },
    {
      title: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      icon: <TrendingUp />,
      color: "warning",
      subtitle: gamesPlayed > 0 ? `${gamesPlayed} total games` : "No games yet",
      action: () => navigate("/game-results"),
    },
  ];

  // Recent activities with real data integration
  const recentActivities: RecentActivity[] = [
    {
      id: 1,
      type: "game",
      title: "Last Game Result",
      description:
        gamesPlayed > 0
          ? `${winRate > 50 ? "Victory" : "Good effort"} in recent match`
          : "No games recorded yet",
      timestamp: "Recently",
      icon: <SportsScore />,
      color: winRate > 50 ? "success.main" : "info.main",
    },
    {
      id: 2,
      type: "tournament",
      title: "Tournament Activity",
      description: "Check upcoming tournaments",
      timestamp: "Today",
      icon: <EmojiEvents />,
      color: "primary.main",
    },
    {
      id: 3,
      type: "achievement",
      title: "Level Progress",
      description: `Level ${user?.level || 1} - ${progressPercent.toFixed(
        0
      )}% to next`,
      timestamp: "Current",
      icon: <Star />,
      color: "warning.main",
    },
  ];

  return (
    <Box>
      {/* Header */}
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
          Welcome back, {user?.full_name || user?.username}!
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity={
            error.includes("cached") || error.includes("outdated")
              ? "warning"
              : "info"
          }
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Fade in timeout={300 * (index + 1)}>
              <Card
                sx={{
                  height: "100%",
                  cursor: stat.action ? "pointer" : "default",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": stat.action
                    ? {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
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
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box sx={{ color: `${stat.color}.main` }}>{stat.icon}</Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h4"
                        component="div"
                        fontWeight="bold"
                      >
                        {statsLoading && stat.title.includes("Games") ? (
                          <CircularProgress size={24} />
                        ) : (
                          stat.value
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                    {stat.action && (
                      <IconButton size="small" color={stat.color as any}>
                        <ArrowForward />
                      </IconButton>
                    )}
                  </Box>

                  {stat.progress !== undefined && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Progress to next level
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={stat.progress}
                        color={stat.color as any}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  )}

                  {stat.winRate !== undefined && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Win Rate
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={stat.winRate}
                        color={stat.color as any}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        {stat.winRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  )}

                  {stat.subtitle && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      {stat.subtitle}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions and Recent Activities */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <ArrowForward color="primary" />
                <Typography variant="h6">Quick Actions</Typography>
              </Box>
              <Grid container spacing={2}>
                {quickActions.map((action) => (
                  <Grid item xs={6} key={action.title}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          backgroundColor: "action.hover",
                          transform: "scale(1.02)",
                        },
                      }}
                      onClick={action.action}
                    >
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Box sx={{ color: `${action.color}.main`, mb: 1 }}>
                          {action.icon}
                        </Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {action.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {action.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <CalendarMonth color="primary" />
                <Typography variant="h6">Recent Activity</Typography>
              </Box>
              <List disablePadding>
                {recentActivities.map((activity, index) => (
                  <ListItem
                    key={activity.id}
                    sx={{
                      borderRadius: 1,
                      "&:hover": { backgroundColor: "action.hover" },
                    }}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: activity.color,
                          width: 32,
                          height: 32,
                        }}
                      >
                        {activity.icon}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {activity.timestamp}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add game result"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate("/game-results?action=add")}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Dashboard;
