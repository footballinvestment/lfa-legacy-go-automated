import React, { useState, useEffect } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  EmojiEvents,
  Person,
  TrendingUp,
  Refresh,
  Add,
  Timeline
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { tournamentService } from '../services/api';

interface DashboardStats {
  totalTournaments: number;
  activeTournaments: number;
  recentActivity: string[];
}

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const tournaments = await tournamentService.getTournaments();
      setStats({
        totalTournaments: tournaments.length,
        activeTournaments: tournaments.filter((t: any) => t.status === 'registration').length,
        recentActivity: ['Registered for tournament', 'Completed profile setup']
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const userStats = [
    {
      title: 'Level',
      value: state.user?.level || 1,
      icon: <TrendingUp />,
      color: 'primary' as const,
      progress: ((state.user?.xp || 0) % 100),
    },
    {
      title: 'Credits',
      value: state.user?.credits || 0,
      icon: <EmojiEvents />,
      color: 'secondary' as const,
      action: () => alert('Credit purchase coming soon!'),
    },
    {
      title: 'Games Played',
      value: state.user?.games_played || 0,
      icon: <Person />,
      color: 'success' as const,
      winRate: state.user?.games_played 
        ? ((state.user.games_won || 0) / state.user.games_played) * 100 
        : 0,
    },
  ];

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 3
      }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Welcome back, {state.user?.full_name || state.user?.username}!
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={loadDashboardStats} disabled={loading}>
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
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Fade in timeout={300 * (index + 1)}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: stat.action ? 'pointer' : 'default',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': stat.action ? {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  } : {}
                }}
                onClick={stat.action}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ color: `${stat.color}.main` }}>
                      {stat.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h4" component="div" fontWeight="bold">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                    {stat.action && (
                      <IconButton size="small" color={stat.color}>
                        <Add />
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
                        color={stat.color}
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
                        color={stat.color}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                        {stat.winRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Timeline color="primary" />
                <Typography variant="h6">Tournament Stats</Typography>
              </Box>
              
              {loading ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  py: 4,
                  gap: 2
                }}>
                  <LinearProgress sx={{ width: '100%' }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading...
                  </Typography>
                </Box>
              ) : stats ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Tournaments
                    </Typography>
                    <Chip label={stats.totalTournaments} color="primary" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Open for Registration
                    </Typography>
                    <Chip label={stats.activeTournaments} color="success" size="small" />
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<EmojiEvents />}
                    onClick={() => (window.location.href = '/tournaments')}
                    sx={{ py: 1.5 }}
                  >
                    Join Tournament
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Person />}
                    onClick={() => (window.location.href = '/profile')}
                    sx={{ py: 1.5 }}
                  >
                    View Profile
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;