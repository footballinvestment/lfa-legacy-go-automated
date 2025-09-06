import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Divider,
} from "@mui/material";
import {
  Person,
  Email,
  Schedule,
  Security,
  EmojiEvents,
  TrendingUp,
  Warning,
  Verified,
} from "@mui/icons-material";
import { AdminUser } from "../../../types/moderation";

interface OverviewTabProps {
  user: AdminUser;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ user }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "suspended":
        return "warning";
      case "banned":
        return "error";
      case "pending":
        return "info";
      default:
        return "default";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "error";
      case "moderator":
        return "warning";
      case "player":
        return "primary";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* User Avatar and Basic Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Badge
                color={user.roles.includes("admin") ? "error" : "default"}
                variant={user.roles.includes("admin") ? "dot" : undefined}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              >
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: "auto",
                    mb: 2,
                    fontSize: "3rem",
                    bgcolor: "primary.main",
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </Badge>

              <Typography variant="h5" gutterBottom>
                {user.name}
                {user.roles.includes("admin") && (
                  <Verified sx={{ ml: 1, color: "primary.main" }} />
                )}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: "center",
                  mb: 2,
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  label={user.status}
                  color={getStatusColor(user.status) as any}
                  size="small"
                />
                {user.roles.map((role) => (
                  <Chip
                    key={role}
                    label={role}
                    color={getRoleColor(role) as any}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Typography variant="caption" color="text.secondary">
                ID: {user.id}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText primary="Full Name" secondary={user.name} />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText primary="Email" secondary={user.email} />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Schedule />
                  </ListItemIcon>
                  <ListItemText
                    primary="Registration Date"
                    secondary={new Date(user.created_at).toLocaleDateString()}
                  />
                </ListItem>

                {user.last_login && (
                  <ListItem>
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Login"
                      secondary={new Date(user.last_login).toLocaleString()}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Game Statistics */}
        {user.game_stats && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <EmojiEvents color="primary" />
                  Game Statistics
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography
                      variant="h4"
                      color="primary.main"
                      align="center"
                    >
                      {user.game_stats.tournaments_played}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                    >
                      Tournaments
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography
                      variant="h4"
                      color="success.main"
                      align="center"
                    >
                      {user.game_stats.win_rate}%
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                    >
                      Win Rate
                    </Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography
                      variant="h5"
                      color="success.main"
                      align="center"
                    >
                      {user.game_stats.wins}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                      display="block"
                    >
                      Wins
                    </Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="h5" color="error.main" align="center">
                      {user.game_stats.losses}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                      display="block"
                    >
                      Losses
                    </Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="h5" color="info.main" align="center">
                      #{user.game_stats.rank}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                      display="block"
                    >
                      Rank
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Quick Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <TrendingUp color="secondary" />
                Quick Overview
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Account Status"
                    secondary={
                      <Chip
                        label={user.status}
                        color={getStatusColor(user.status) as any}
                        size="small"
                      />
                    }
                  />
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemText
                    primary="Total Violations"
                    secondary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Warning
                          color={
                            user.violations && user.violations.length > 0
                              ? "warning"
                              : "disabled"
                          }
                          fontSize="small"
                        />
                        <Typography variant="body2">
                          {user.violations ? user.violations.length : 0}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemText
                    primary="Profile Completion"
                    secondary="Basic information provided"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewTab;
