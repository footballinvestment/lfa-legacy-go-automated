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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search,
  FilterList,
  EmojiEvents,
  Schedule,
  Person,
  Refresh,
  Visibility,
  Star,
} from '@mui/icons-material';
import { format } from 'date-fns';

// Mock service - replace with actual API
const gameResultsService = {
  async getGameHistory(page = 1, limit = 10, filters = {}) {
    // This would be replaced with actual API call
    return {
      results: [
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
        },
        {
          id: 3,
          game_type: 'football',
          opponent: { id: 4, username: 'mike_wilson', full_name: 'Mike Wilson', level: 6 },
          result: 'win',
          score: '2-0',
          played_at: '2025-01-13T10:15:00Z',
          duration: 88,
          tournament_id: 2,
          tournament_name: 'Daily Challenge',
          location: 'North Field Complex',
        },
      ],
      total: 3,
      page: 1,
      totalPages: 1,
    };
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
}

const GameHistory: React.FC = () => {
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [gameTypeFilter, setGameTypeFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadGameHistory = async (currentPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        search: searchQuery,
        game_type: gameTypeFilter,
        result: resultFilter,
      };
      const response = await gameResultsService.getGameHistory(currentPage, 10, filters);
      setGameHistory(response.results);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load game history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGameHistory(page);
  }, [page, searchQuery, gameTypeFilter, resultFilter]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
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
      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search games or opponents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
            size="small"
          />
          
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            Filters
          </Button>

          <Tooltip title="Refresh">
            <IconButton onClick={() => loadGameHistory(page)} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Filter Controls */}
        {showFilters && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Game Type</InputLabel>
              <Select
                value={gameTypeFilter}
                onChange={(e) => setGameTypeFilter(e.target.value)}
                label="Game Type"
              >
                <MenuItem value="">All Games</MenuItem>
                <MenuItem value="football">Football</MenuItem>
                <MenuItem value="basketball">Basketball</MenuItem>
                <MenuItem value="tennis">Tennis</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Result</InputLabel>
              <Select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                label="Result"
              >
                <MenuItem value="">All Results</MenuItem>
                <MenuItem value="win">Wins</MenuItem>
                <MenuItem value="loss">Losses</MenuItem>
                <MenuItem value="draw">Draws</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="text"
              onClick={() => {
                setSearchQuery('');
                setGameTypeFilter('');
                setResultFilter('');
              }}
              size="small"
            >
              Clear All
            </Button>
          </Box>
        )}
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Game History List */}
      {gameHistory.length > 0 ? (
        <Box>
          <Grid container spacing={2}>
            {gameHistory.map((game) => (
              <Grid key={game.id} size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Game Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Box sx={{ mr: 3, textAlign: 'center' }}>
                          <Typography variant="h6" component="div">
                            {getResultIcon(game.result)}
                          </Typography>
                          <Chip
                            label={game.result.toUpperCase()}
                            color={getResultColor(game.result)}
                            size="small"
                          />
                        </Box>

                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          {game.opponent.username.charAt(0).toUpperCase()}
                        </Avatar>

                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mr: 2 }}>
                              vs {game.opponent.full_name}
                            </Typography>
                            <Chip
                              label={`Level ${game.opponent.level}`}
                              size="small"
                              variant="outlined"
                              icon={<Star />}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Typography variant="body2" color="text.secondary">
                              @{game.opponent.username}
                            </Typography>
                            {game.tournament_name && (
                              <Chip
                                label={game.tournament_name}
                                size="small"
                                color="secondary"
                                variant="outlined"
                                icon={<EmojiEvents />}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Score and Date */}
                      <Box sx={{ textAlign: 'right', ml: 2 }}>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {game.score}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 1 }}>
                          <Schedule sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(game.played_at), 'MMM dd, HH:mm')}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {game.duration} mins • {game.location}
                        </Typography>
                      </Box>

                      {/* Action Button */}
                      <Box sx={{ ml: 2 }}>
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <EmojiEvents sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No game history found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || gameTypeFilter || resultFilter
              ? 'Try adjusting your search or filter criteria'
              : 'Play some games to see your match history here!'
            }
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GameHistory;