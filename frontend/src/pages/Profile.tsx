import React from 'react';
import { Box, Typography, Card, CardContent, Grid, LinearProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { state } = useAuth();

  if (!state.user) {
    return <Typography>Loading...</Typography>;
  }

  const winRate = state.user.games_played > 0 
    ? (state.user.games_won / state.user.games_played) * 100 
    : 0;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Profile
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
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
                  {state.user.username}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {state.user.email}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Game Statistics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Level
                </Typography>
                <Typography variant="h4" color="primary" sx={{ mb: 2 }}>
                  {state.user.level}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Experience Points
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {state.user.xp} XP
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Credits
                </Typography>
                <Typography variant="h5" color="secondary" sx={{ mb: 2 }}>
                  {state.user.credits}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Games Played
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {state.user.games_played}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Win Rate
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={winRate}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2">
                    {winRate.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;