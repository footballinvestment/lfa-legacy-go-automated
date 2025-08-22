import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  EmojiEvents,
  Timer,
  LocationOn,
  Refresh,
  SportsSoccer,
  Star,
  Analytics,
} from "@mui/icons-material";
import { useSafeAuth } from "../../SafeAuthContext";

// Mock service - replace with actual API
const gameResultsService = {
  async getStatistics(timeframe = "all") {
    // This would be replaced with actual API call
    return {
      overall: {
        games_played: 15,
        games_won: 9,
        games_lost: 4,
        games_drawn: 2,
        win_rate: 60.0,
        goals_scored: 28,
        goals_conceded: 18,
        goal_difference: 10,
        average_game_duration: 87,
        favorite_location: "Central Park Field 1",
        total_playtime: 1305, // minutes
      },
      by_game_type: {
        football: { games: 12, wins: 7, win_rate: 58.3 },
        basketball: { games: 2, wins: 1, win_rate: 50.0 },
        tennis: { games: 1, wins: 1, win_rate: 100.0 },
      },
      recent_performance: {
        last_5_games: ["win", "win", "loss", "win", "draw"],
        trend: "improving", // 'improving', 'declining', 'stable'
      },
      achievements: [
        {
          id: 1,
          name: "First Victory",
          description: "Win your first game",
          earned_at: "2025-01-10",
        },
        {
          id: 2,
          name: "Hat Trick Hero",
          description: "Score 3 goals in a single game",
          earned_at: "2025-01-12",
        },
        {
          id: 3,
          name: "Winning Streak",
          description: "Win 3 games in a row",
          earned_at: "2025-01-15",
        },
      ],
    };
  },
};

interface Statistics {
  overall: {
    games_played: number;
    games_won: number;
    games_lost: number;
    games_drawn: number;
    win_rate: number;
    goals_scored: number;
    goals_conceded: number;
    goal_difference: number;
    average_game_duration: number;
    favorite_location: string;
    total_playtime: number;
  };
  by_game_type: Record<
    string,
    {
      games: number;
      wins: number;
      win_rate: number;
    }
  >;
  recent_performance: {
    last_5_games: string[];
    trend: "improving" | "declining" | "stable";
  };
  achievements: Array<{
    id: number;
    name: string;
    description: string;
    earned_at: string;
  }>;
}

const Statistics: React.FC = () => {
  const { state } = useSafeAuth();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("all");

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await gameResultsService.getStatistics(timeframe);
      setStatistics(stats);
    } catch (err: any) {
      setError(err.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [timeframe]);

  const getPerformanceTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp color="success" />;
      case "declining":
        return <TrendingDown color="error" />;
      default:
        return <Analytics color="primary" />;
    }
  };

  const getPerformanceTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "success";
      case "declining":
        return "error";
      default:
        return "primary";
    }
  };

  const getGameResultIcon = (result: string) => {
    switch (result) {
      case "win":
        return "🏆";
      case "loss":
        return "😞";
      case "draw":
        return "🤝";
      default:
        return "⚽";
    }
  };

  const formatPlaytime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading && !statistics) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading statistics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <IconButton onClick={loadStatistics}>
            <Refresh />
          </IconButton>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!statistics) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Analytics sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No statistics available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Play some games to see your performance statistics!
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Timeframe Selector */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">Performance Statistics</Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              label="Timeframe"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="7days">Last 7 Days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={loadStatistics} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* Overall Statistics */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Performance
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="primary">
                      {statistics.overall.games_played}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Games Played
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="success.main">
                      {statistics.overall.games_won}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Wins
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="error.main">
                      {statistics.overall.games_lost}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Losses
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="warning.main">
                      {statistics.overall.games_drawn}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Draws
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Win Rate Progress */}
              <Box sx={{ mt: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Win Rate
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.overall.win_rate.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={statistics.overall.win_rate}
                  color={
                    statistics.overall.win_rate >= 60
                      ? "success"
                      : statistics.overall.win_rate >= 40
                        ? "warning"
                        : "error"
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Game Type Breakdown */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance by Game Type
              </Typography>

              <Grid container spacing={2}>
                {Object.entries(statistics.by_game_type).map(
                  ([gameType, stats]) => (
                    <Grid key={gameType} size={{ xs: 12, sm: 4 }}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: "center" }}>
                          <SportsSoccer color="primary" sx={{ mb: 1 }} />
                          <Typography variant="h6" textTransform="capitalize">
                            {gameType}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {stats.games} games • {stats.wins} wins
                          </Typography>
                          <Chip
                            label={`${stats.win_rate.toFixed(1)}% win rate`}
                            color={
                              stats.win_rate >= 60
                                ? "success"
                                : stats.win_rate >= 40
                                  ? "warning"
                                  : "error"
                            }
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Side Statistics */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Recent Performance */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                {getPerformanceTrendIcon(statistics.recent_performance.trend)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Recent Form
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                {statistics.recent_performance.last_5_games.map(
                  (result, index) => (
                    <Box key={index} sx={{ textAlign: "center" }}>
                      <Typography variant="h6">
                        {getGameResultIcon(result)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {result.charAt(0).toUpperCase()}
                      </Typography>
                    </Box>
                  )
                )}
              </Box>

              <Chip
                label={`${statistics.recent_performance.trend} form`}
                color={getPerformanceTrendColor(
                  statistics.recent_performance.trend
                )}
                icon={getPerformanceTrendIcon(
                  statistics.recent_performance.trend
                )}
                sx={{ width: "100%" }}
              />
            </CardContent>
          </Card>

          {/* Key Stats */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Statistics
              </Typography>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Goals Scored
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {statistics.overall.goals_scored}
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Goals Conceded
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {statistics.overall.goals_conceded}
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Goal Difference
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={
                    statistics.overall.goal_difference >= 0
                      ? "success.main"
                      : "error.main"
                  }
                >
                  {statistics.overall.goal_difference >= 0 ? "+" : ""}
                  {statistics.overall.goal_difference}
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Avg. Game Duration
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {statistics.overall.average_game_duration} min
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Total Playtime
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatPlaytime(statistics.overall.total_playtime)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Achievements
              </Typography>

              {statistics.achievements.length > 0 ? (
                statistics.achievements.slice(0, 3).map((achievement) => (
                  <Box
                    key={achievement.id}
                    sx={{ display: "flex", alignItems: "center", mb: 2 }}
                  >
                    <Star color="warning" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {achievement.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {achievement.description}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No achievements yet. Keep playing to unlock them!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Statistics;
