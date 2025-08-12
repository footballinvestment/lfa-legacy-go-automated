// src/components/dashboard/Dashboard.tsx
// LFA Legacy GO - Main Dashboard with Enhanced Statistics

import React, { useState } from "react";
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
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { user } = state;

  const [loading, setLoading] = useState(false);

  // FIXED: Calculate user progress with proper XP handling
  const currentXP = user?.xp || 0;
  const currentLevel = user?.level || 1;
  const xpForNextLevel = currentLevel * 100; // XP required for next level
  const progressPercent = Math.min((currentXP / xpForNextLevel) * 100, 100);

  // FIXED: Calculate win rate with proper null checking
  const winRate =
    user?.games_played && user?.games_won
      ? Math.round(
          ((user.games_won ?? 0) / Math.max(user.games_played ?? 1, 1)) * 100
        )
      : 0;

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      title: "New Booking",
      description: "Book a game session",
      icon: <CalendarMonth />,
      color: "primary.main",
      action: () => navigate("/booking"),
    },
    {
      title: "Find Tournament",
      description: "Join upcoming tournaments",
      icon: <EmojiEvents />,
      color: "warning.main",
      action: () => navigate("/tournaments"),
    },
    {
      title: "View Friends",
      description: "See who's online",
      icon: <People />,
      color: "info.main",
      action: () => navigate("/social"),
    },
    {
      title: "Game Results",
      description: "Track your performance",
      icon: <SportsScore />,
      color: "success.main",
      action: () => navigate("/game-results"),
    },
  ];

  // Recent Activities (Demo Data)
  const recentActivities: RecentActivity[] = [
    {
      id: 1,
      type: "game",
      title: "Game Session Completed",
      description: "Scored 85 points at Downtown Arena",
      timestamp: "2 hours ago",
      icon: <SportsScore />,
      color: "success.main",
    },
    {
      id: 2,
      type: "tournament",
      title: "Tournament Registration",
      description: "Joined Friday Night Championship",
      timestamp: "5 hours ago",
      icon: <EmojiEvents />,
      color: "warning.main",
    },
    {
      id: 3,
      type: "achievement",
      title: "Achievement Unlocked",
      description: "First Victory - Won your first game",
      timestamp: "1 day ago",
      icon: <Star />,
      color: "primary.main",
    },
    {
      id: 4,
      type: "booking",
      title: "Booking Confirmed",
      description: "Session at North Arena tomorrow",
      timestamp: "2 days ago",
      icon: <CalendarMonth />,
      color: "info.main",
    },
  ];

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6">Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome back, {user.full_name}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your gaming progress
          </Typography>
        </Box>
        <IconButton
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          <Refresh />
        </IconButton>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: "center", p: 3 }}>
            <AccountBalanceWallet
              sx={{ color: "primary.main", fontSize: 40, mb: 1 }}
            />
            <Typography
              variant="h3"
              color="primary.main"
              sx={{ fontWeight: 700 }}
            >
              {user.credits || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Credits
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate("/credits")}
              sx={{ mt: 1 }}
            >
              Buy More
            </Button>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: "center", p: 3 }}>
            <Star sx={{ color: "secondary.main", fontSize: 40, mb: 1 }} />
            <Typography
              variant="h3"
              color="secondary.main"
              sx={{ fontWeight: 700 }}
            >
              {user.level || 1}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Level
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{ mt: 1, height: 4, borderRadius: 2 }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              {currentXP}/{xpForNextLevel} XP
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: "center", p: 3 }}>
            <SportsScore sx={{ color: "success.main", fontSize: 40, mb: 1 }} />
            <Typography
              variant="h3"
              color="success.main"
              sx={{ fontWeight: 700 }}
            >
              {user.games_played || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Games Played
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: "center", p: 3 }}>
            <EmojiEvents sx={{ color: "warning.main", fontSize: 40, mb: 1 }} />
            <Typography
              variant="h3"
              color="warning.main"
              sx={{ fontWeight: 700 }}
            >
              {user.games_won || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Games Won
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: "center", p: 3 }}>
            <TrendingUp sx={{ color: "info.main", fontSize: 40, mb: 1 }} />
            <Typography variant="h3" color="info.main" sx={{ fontWeight: 700 }}>
              {winRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Win Rate
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={6} key={index}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: 2,
                        },
                      }}
                      onClick={action.action}
                    >
                      <Box sx={{ color: action.color, mb: 1 }}>
                        {action.icon}
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {action.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Activity
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate("/game-results")}
                >
                  View All
                </Button>
              </Box>
              <List sx={{ p: 0 }}>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: activity.color,
                            width: 40,
                            height: 40,
                          }}
                        >
                          {activity.icon}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={
                          <React.Fragment>
                            <Typography variant="body2" component="span">
                              {activity.description}
                            </Typography>
                            <br />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              component="span"
                            >
                              {activity.timestamp}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* User Progress */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Your Progress
              </Typography>

              {/* Level Progress */}
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Level Progress</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Level {currentLevel}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPercent}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  {currentXP} / {xpForNextLevel} XP (
                  {Math.round(progressPercent)}%)
                </Typography>
              </Box>

              {/* Skills Overview */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Skills Overview
              </Typography>
              {user.skills && Object.keys(user.skills).length > 0 ? (
                Object.entries(user.skills).map(([skill, level]) => (
                  <Box key={skill} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ textTransform: "capitalize" }}
                      >
                        {skill.replace("_", " ")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Number(level)}/10
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(Number(level) / 10) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No skills data available. Play games to track your progress!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Achievements
                </Typography>
                <Chip
                  label={`${user.total_achievements || 0} earned`}
                  size="small"
                  color="primary"
                />
              </Box>

              {/* Achievement Grid */}
              <Grid container spacing={1}>
                {[
                  { name: "First Steps", icon: "🎯", earned: true },
                  { name: "Level 5", icon: "⭐", earned: user.level >= 5 },
                  {
                    name: "First Victory",
                    icon: "🏆",
                    earned: (user.games_won || 0) > 0,
                  },
                  { name: "Streak Master", icon: "🔥", earned: false },
                  { name: "High Scorer", icon: "💯", earned: false },
                  { name: "Tournament Winner", icon: "👑", earned: false },
                ].map((achievement, index) => (
                  <Grid item xs={4} key={index}>
                    <Paper
                      sx={{
                        p: 1.5,
                        textAlign: "center",
                        opacity: achievement.earned ? 1 : 0.5,
                        bgcolor: achievement.earned
                          ? "success.light"
                          : "grey.100",
                      }}
                    >
                      <Typography variant="h6">{achievement.icon}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {achievement.name}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate("/game-results")}
              >
                View All Achievements
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
