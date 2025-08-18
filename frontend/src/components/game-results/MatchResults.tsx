import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Button,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  EmojiEvents,
  Schedule,
  Person,
  Refresh,
  Edit,
  Visibility,
  Star,
  LocationOn,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';

// Mock service - replace with actual API
const gameResultsService = {
  async getRecentResults() {
    // This would be replaced with actual API call
    return [
      {
        id: 1,
        game_type: 'football',
        opponent: { id: 2, username: 'john_doe', full_name: 'John Doe', level: 8 },
        result: 'win',
        score: '3-1',
        played_at: '2025-01-15T14:30:00Z',
        duration: 90,
        tournament_id: 1,
        tournament_name: 'Weekend Championship',
        location: 'Central Park Field 1',
        can_edit: true,
      },
      {
        id: 2,
        game_type: 'football',
        opponent: { id: 3, username: 'alice_smith', full_name: 'Alice Smith', level: 12 },
        result: 'loss',
        score: '1-2',
        played_at: '2025-01-14T16:00:00Z',
        duration: 85,
        tournament_id: null,
        tournament_name: null,
        location: 'City Stadium',
        can_edit: false,
      },
    ];
  },
  
  async submitGameResult(gameData: any) {
    // This would be replaced with actual API call
    console.log('Submitting game result:', gameData);
    return { id: Date.now(), ...gameData };
  },
};

interface GameResult {
  id: number;
  game_type: string;
  opponent: {
    id: number;
    username: string;
    full_name: string;
    level: number;
  };
  result: 'win' | 'loss' | 'draw';
  score: string;
  played_at: string;
  duration: number;
  tournament_id?: number;
  tournament_name?: string;
  location: string;
  can_edit: boolean;
}

const MatchResults: React.FC = () => {
  const [recentResults, setRecentResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitDialog, setSubmitDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState<GameResult | null>(null);
  const [newResult, setNewResult] = useState({
    opponent_id: '',
    game_type: 'football',
    result: '',
    my_score: '',
    opponent_score: '',
    duration: '',
    location: '',
    notes: '',
  });

  const loadRecentResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await gameResultsService.getRecentResults();
      setRecentResults(results);
    } catch (err: any) {
      setError(err.message || 'Failed to load recent results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentResults();
  }, []);

  const handleSubmitResult = async () => {
    try {
      const gameData = {
        ...newResult,
        score: `${newResult.my_score}-${newResult.opponent_score}`,
        played_at: new Date().toISOString(),
      };
      
      await gameResultsService.submitGameResult(gameData);
      setSubmitDialog(false);
      setNewResult({
        opponent_id: '',
        game_type: 'football',
        result: '',
        my_score: '',
        opponent_score: '',
        duration: '',
        location: '',
        notes: '',
      });
      await loadRecentResults();
    } catch (err: any) {
      setError(err.message || 'Failed to submit game result');
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'success';
      case 'loss': return 'error';
      case 'draw': return 'warning';
      default: return 'default';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win': return '🏆';
      case 'loss': return '😞';
      case 'draw': return '🤝';
      default: return '⚽';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Recent Match Results</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadRecentResults} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setSubmitDialog(true)}
          >
            Add Result
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Recent Results */}
      {recentResults.length > 0 ? (
        <Grid container spacing={2}>
          {recentResults.map((game) => (
            <Grid key={game.id} size={{ xs: 12, md: 6 }}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent>
                  {/* Result Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" component="span" sx={{ mr: 2 }}>
                        {getResultIcon(game.result)}
                      </Typography>
                      <Chip
                        label={game.result.toUpperCase()}
                        color={getResultColor(game.result)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {game.score}
                    </Typography>
                  </Box>

                  {/* Opponent Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {game.opponent.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        vs {game.opponent.full_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          @{game.opponent.username}
                        </Typography>
                        <Chip
                          label={`Level ${game.opponent.level}`}
                          size="small"
                          variant="outlined"
                          icon={<Star />}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Game Details */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Schedule sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDistanceToNow(new Date(game.played_at), { addSuffix: true })}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {game.location}
                      </Typography>
                    </Box>

                    {game.tournament_name && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={game.tournament_name}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          icon={<EmojiEvents />}
                        />
                      </Box>
                    )}
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => setDetailDialog(game)}
                      sx={{ flex: 1 }}
                    >
                      Details
                    </Button>
                    {game.can_edit && (
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        variant="outlined"
                        sx={{ flex: 1 }}
                      >
                        Edit
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <EmojiEvents sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No recent results
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Submit your game results to track your performance!
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setSubmitDialog(true)}
            sx={{ mt: 2 }}
          >
            Add Your First Result
          </Button>
        </Box>
      )}

      {/* Submit Result Dialog */}
      <Dialog open={submitDialog} onClose={() => setSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Game Result</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Game Type</InputLabel>
              <Select
                value={newResult.game_type}
                onChange={(e) => setNewResult(prev => ({ ...prev, game_type: e.target.value }))}
                label="Game Type"
              >
                <MenuItem value="football">Football</MenuItem>
                <MenuItem value="basketball">Basketball</MenuItem>
                <MenuItem value="tennis">Tennis</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Opponent User ID"
              type="number"
              value={newResult.opponent_id}
              onChange={(e) => setNewResult(prev => ({ ...prev, opponent_id: e.target.value }))}
              helperText="Enter the user ID of your opponent"
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Your Score"
                type="number"
                value={newResult.my_score}
                onChange={(e) => setNewResult(prev => ({ ...prev, my_score: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Opponent Score"
                type="number"
                value={newResult.opponent_score}
                onChange={(e) => setNewResult(prev => ({ ...prev, opponent_score: e.target.value }))}
                fullWidth
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Result</InputLabel>
              <Select
                value={newResult.result}
                onChange={(e) => setNewResult(prev => ({ ...prev, result: e.target.value }))}
                label="Result"
              >
                <MenuItem value="win">Win</MenuItem>
                <MenuItem value="loss">Loss</MenuItem>
                <MenuItem value="draw">Draw</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Game Duration (minutes)"
              type="number"
              value={newResult.duration}
              onChange={(e) => setNewResult(prev => ({ ...prev, duration: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Location"
              value={newResult.location}
              onChange={(e) => setNewResult(prev => ({ ...prev, location: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Notes (Optional)"
              multiline
              rows={3}
              value={newResult.notes}
              onChange={(e) => setNewResult(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitResult} 
            variant="contained"
            disabled={!newResult.opponent_id || !newResult.my_score || !newResult.opponent_score || !newResult.result}
          >
            Submit Result
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog 
        open={Boolean(detailDialog)} 
        onClose={() => setDetailDialog(null)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Match Details</DialogTitle>
        <DialogContent>
          {detailDialog && (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Game Information
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Type:</strong> {detailDialog.game_type}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Result:</strong> {detailDialog.result.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Score:</strong> {detailDialog.score}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Duration:</strong> {detailDialog.duration} minutes
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Location:</strong> {detailDialog.location}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Played:</strong> {format(new Date(detailDialog.played_at), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Opponent
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
                      {detailDialog.opponent.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {detailDialog.opponent.full_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{detailDialog.opponent.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Level {detailDialog.opponent.level}
                      </Typography>
                    </Box>
                  </Box>

                  {detailDialog.tournament_name && (
                    <Box>
                      <Typography variant="body2" paragraph>
                        <strong>Tournament:</strong> {detailDialog.tournament_name}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MatchResults;