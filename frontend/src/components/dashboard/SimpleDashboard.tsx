import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import {
  EmojiEvents,
  Person,
  AccountBalanceWallet,
  SportsScore,
} from "@mui/icons-material";
import { useSafeAuth } from "../../SafeAuthContext";
import { useNavigate } from "react-router-dom";

const SimpleDashboard: React.FC = () => {
  const { state } = useSafeAuth();
  const navigate = useNavigate();
  const { user } = state;

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Header */}
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Welcome back, {user?.full_name || user?.username || 'Player'}!
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Credits Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalanceWallet sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="primary.main">
                {user?.credits || 0}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Credits
              </Typography>
              <Button 
                variant="contained" 
                size="small"
                onClick={() => navigate('/credits')}
              >
                Manage
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Level Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="secondary.main">
                {user?.level || 1}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Level
              </Typography>
              <Typography variant="caption">
                XP: {user?.xp || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Games Won Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <SportsScore sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="success.main">
                {user?.games_won || 0}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Games Won
              </Typography>
              <Typography variant="caption">
                Played: {user?.games_played || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Person sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" component="div" color="info.main">
                Profile
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                {user?.email || 'Update your profile'}
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/profile')}
              >
                View
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<EmojiEvents />}
            onClick={() => navigate('/tournaments')}
            sx={{ py: 2 }}
          >
            Join Tournament
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            color="secondary"
            startIcon={<AccountBalanceWallet />}
            onClick={() => navigate('/credits')}
            sx={{ py: 2 }}
          >
            Buy Credits
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<Person />}
            onClick={() => navigate('/social')}
            sx={{ py: 2 }}
          >
            Social
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<SportsScore />}
            onClick={() => navigate('/game-results')}
            sx={{ py: 2 }}
          >
            Game Results
          </Button>
        </Grid>
      </Grid>

      {/* Welcome Message */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎮 Welcome to LFA Legacy GO!
          </Typography>
          <Typography variant="body1" paragraph>
            Your football gaming dashboard is ready. Explore tournaments, connect with friends, 
            and track your progress as you build your football legacy.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start by joining a tournament or checking out the social features to connect with other players.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimpleDashboard;