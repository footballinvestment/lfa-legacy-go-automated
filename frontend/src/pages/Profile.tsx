import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import {
  Person,
  Edit,
  EmojiEvents,
  SportsScore,
  TrendingUp,
  Security,
  CheckCircle,
  Close,
} from "@mui/icons-material";
import { useSafeAuth } from "../SafeAuthContext";
import MFASetup from "../components/auth/MFASetup";

const Profile: React.FC = () => {
  console.log("🔴 PROFILE: Emergency auth bypass starting");
  
  // Emergency fallback state
  const [emergencyUser, setEmergencyUser] = useState(null);
  
  // Try normal context first
  let normalContext;
  try {
    normalContext = useSafeAuth();
    console.log("🔴 Normal context works:", normalContext);
  } catch (error) {
    console.error("🔴 Normal context failed:", error);
    normalContext = null;
  }
  
  // Manual user fetch if context fails
  useEffect(() => {
    if (!normalContext && !emergencyUser) {
      console.log("🔴 EMERGENCY: Manual user fetch triggered");
      const token = localStorage.getItem('auth_token');
      if (token) {
        fetch('https://lfa-legacy-go-backend-376491487980.us-central1.run.app/api/auth/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(r => r.json())
        .then(userData => {
          console.log("🔴 EMERGENCY: Manual fetch success:", userData);
          const user = {
            ...userData,
            mfa_enabled: Boolean(userData.mfa_enabled || false)
          };
          setEmergencyUser(user);
        })
        .catch(error => {
          console.error("🔴 EMERGENCY: Manual fetch failed:", error);
        });
      }
    }
  }, [normalContext, emergencyUser]);
  
  // Use whichever works
  const state = normalContext?.state || { user: emergencyUser, loading: false, error: null };
  
  console.log("🔴 FINAL STATE:", state);
  const [showMFASetup, setShowMFASetup] = useState(false);

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

              <Divider sx={{ my: 3 }} />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Current Ranking
                </Typography>
                <Chip
                  icon={<TrendingUp />}
                  label={`#${Math.floor(Math.random() * 100) + 1}`}
                  color="warning"
                  variant="outlined"
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Total Score
                </Typography>
                <Typography variant="h6" color="primary">
                  {(
                    (state.user.games_won || 0) * 10 +
                    (state.user.games_played || 0) * 2
                  ).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <EmojiEvents sx={{ mr: 1, verticalAlign: "middle" }} />
                Achievements
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                {state.user.games_played >= 1 && (
                  <Chip
                    icon={<SportsScore />}
                    label="First Game"
                    color="success"
                    size="small"
                  />
                )}
                {state.user.games_won >= 1 && (
                  <Chip
                    icon={<EmojiEvents />}
                    label="First Win"
                    color="warning"
                    size="small"
                  />
                )}
                {state.user.games_played >= 10 && (
                  <Chip
                    icon={<SportsScore />}
                    label="Veteran Player"
                    color="primary"
                    size="small"
                  />
                )}
                {winRate >= 70 && (
                  <Chip
                    icon={<TrendingUp />}
                    label="Champion"
                    color="error"
                    size="small"
                  />
                )}
                {state.user.games_played === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    Play your first game to unlock achievements!
                  </Typography>
                )}
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

        {/* Security Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Security sx={{ mr: 2, color: "primary.main", fontSize: 28 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Account Security
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Email Verification Status */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                  Email Verification
                </Typography>
                <Chip
                  icon={<CheckCircle />}
                  label="Verified"
                  color="success"
                  size="small"
                />
              </Box>

              {/* MFA Status */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                  Two-Factor Authentication
                </Typography>
                <Chip
                  label={(state.user as any).mfa_enabled ? "Enabled" : "Disabled"}
                  color={(state.user as any).mfa_enabled ? "success" : "warning"}
                  size="small"
                />
              </Box>

              {/* MFA Setup Button */}
              {!(state.user as any).mfa_enabled && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Security />}
                  onClick={() => setShowMFASetup(true)}
                  sx={{
                    borderColor: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      backgroundColor: 'primary.light'
                    }
                  }}
                >
                  Enable Two-Factor Authentication
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* MFA Setup Dialog */}
      <Dialog 
        open={showMFASetup} 
        onClose={() => setShowMFASetup(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Setup Two-Factor Authentication</Typography>
          <IconButton onClick={() => setShowMFASetup(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <MFASetup 
            onComplete={() => {
              setShowMFASetup(false);
              // Refresh user data to show MFA as enabled
              window.location.reload();
            }}
            onCancel={() => setShowMFASetup(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Profile;
