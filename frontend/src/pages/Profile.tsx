import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Button,
  Avatar,
  Chip,
  Divider,
} from "@mui/material";
import {
  Person,
  Edit,
  EmojiEvents,
  SportsScore,
  TrendingUp,
  Security,
  CheckCircle,
} from "@mui/icons-material";
import { useSafeAuth } from "../SafeAuthContext";
import MFASetup from "../components/auth/MFASetup";

const Profile: React.FC = () => {
  const { state, refreshStats } = useSafeAuth();
  const [showMFASetup, setShowMFASetup] = useState(false);

  const handleMFASuccess = () => {
    // Refresh user data to update mfa_enabled status
    if (refreshStats) {
      refreshStats();
    }
  };

  if (!state.user) {
    return <Typography>Loading...</Typography>;
  }

  const winRate =
    state.user.games_played > 0
      ? (state.user.games_won / state.user.games_played) * 100
      : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Profile
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Personal Information Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    mr: 2,
                    bgcolor: "primary.main",
                    fontSize: "1.5rem",
                  }}
                >
                  {state.user.full_name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Button startIcon={<Edit />} variant="outlined" size="small">
                    Edit Profile
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Full Name
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {state.user.full_name}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Username
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  @{state.user.username}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {state.user.email}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Account Type
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    icon={<Person />}
                    label={state.user.is_admin ? "Administrator" : "Player"}
                    color={state.user.is_admin ? "secondary" : "primary"}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <EmojiEvents sx={{ mr: 1, verticalAlign: "middle" }} />
                Game Statistics
              </Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <Box
                    textAlign="center"
                    sx={{ p: 2, bgcolor: "primary.light", borderRadius: 1 }}
                  >
                    <Typography variant="h4" color="primary.contrastText">
                      {state.user.games_played || 0}
                    </Typography>
                    <Typography variant="caption" color="primary.contrastText">
                      Games Played
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Box
                    textAlign="center"
                    sx={{ p: 2, bgcolor: "success.light", borderRadius: 1 }}
                  >
                    <Typography variant="h4" color="success.contrastText">
                      {state.user.games_won || 0}
                    </Typography>
                    <Typography variant="caption" color="success.contrastText">
                      Games Won
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Win Rate
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {winRate.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={winRate}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      backgroundColor:
                        winRate >= 50 ? "success.main" : "warning.main",
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body1">
                    Two-Factor Authentication
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {state.user?.mfa_enabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>
                
                <Button
                  variant={state.user?.mfa_enabled ? "outlined" : "contained"}
                  color={state.user?.mfa_enabled ? "error" : "primary"}
                  onClick={() => setShowMFASetup(true)}
                >
                  {state.user?.mfa_enabled ? 'Disable MFA' : 'Setup Two-Factor Authentication'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>

              <Box sx={{ mt: 2 }}>
                {state.user.games_played > 0 ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Last game played: 2 days ago
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Best winning streak:{" "}
                      {Math.max(1, Math.floor(state.user.games_won / 2))} games
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Member since: {new Date().toLocaleDateString()}
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No recent activity. Start playing to see your activity here!
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* MFA Setup Modal */}
      <MFASetup
        open={showMFASetup}
        onClose={() => setShowMFASetup(false)}
        onSuccess={handleMFASuccess}
      />
    </Box>
  );
};

export default Profile;