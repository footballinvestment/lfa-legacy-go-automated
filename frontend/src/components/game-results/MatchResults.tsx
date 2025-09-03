import React, { useState, useEffect } from "react";
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
  Divider,
  Paper,
} from "@mui/material";
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
  Sports,
  TrendingUp,
  CheckCircle,
} from "@mui/icons-material";
import { format, formatDistanceToNow } from "date-fns";

// Mock service - replace with actual API
const gameResultsService = {
  async getRecentResults() {
    // This would be replaced with actual API call
    return [
      {
        id: 1,
        game_type: "football",
        opponent: {
          id: 2,
          username: "john_doe",
          full_name: "John Doe",
          level: 8,
        },
        result: "win",
        score: "3-1",
        played_at: "2025-01-15T14:30:00Z",
        duration: 90,
        tournament_id: 1,
        tournament_name: "Weekend Championship",
        location: "Central Park Field 1",
        can_edit: true,
      },
      {
        id: 2,
        game_type: "football",
        opponent: {
          id: 3,
          username: "alice_smith",
          full_name: "Alice Smith",
          level: 12,
        },
        result: "loss",
        score: "1-2",
        played_at: "2025-01-14T16:00:00Z",
        duration: 85,
        tournament_id: null,
        tournament_name: null,
        location: "City Stadium",
        can_edit: false,
      },
    ];
  },

  async submitGameResult(gameData: any) {
    // This would be replaced with actual API call
    console.log("Submitting game result:", gameData);
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
  result: "win" | "loss" | "draw";
  score: string;
  played_at: string;
  duration: number;
  tournament_id?: number;
  tournament_name?: string;
  location: string;
  can_edit: boolean;
}

interface NewGameResult {
  opponent_id: number;
  opponent_username: string;
  result: "win" | "loss" | "draw";
  user_score: number;
  opponent_score: number;
  duration: number;
  location: string;
  notes?: string;
}

const MatchResults: React.FC = () => {
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<GameResult | null>(null);
  const [newResult, setNewResult] = useState<NewGameResult>({
    opponent_id: 0,
    opponent_username: "",
    result: "win",
    user_score: 0,
    opponent_score: 0,
    duration: 90,
    location: "",
    notes: "",
  });

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await gameResultsService.getRecentResults();
      setResults(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load game results");
    } finally {
      setLoading(false);
    }
  };

  const handleAddResult = async () => {
    try {
      const gameData = {
        ...newResult,
        score: `${newResult.user_score}-${newResult.opponent_score}`,
        played_at: new Date().toISOString(),
      };

      await gameResultsService.submitGameResult(gameData);
      await loadResults(); // Refresh results
      setDialogOpen(false);

      // Reset form
      setNewResult({
        opponent_id: 0,
        opponent_username: "",
        result: "win",
        user_score: 0,
        opponent_score: 0,
        duration: 90,
        location: "",
        notes: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to add game result");
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "win":
        return "success";
      case "loss":
        return "error";
      case "draw":
        return "warning";
      default:
        return "default";
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case "win":
        return <CheckCircle />;
      case "loss":
        return <Sports />;
      case "draw":
        return <TrendingUp />;
      default:
        return <EmojiEvents />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading match results...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          🏆 Match Results
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadResults}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
          >
            Add Result
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Grid */}
      <Grid container spacing={3}>
        {results.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 6, textAlign: "center" }}>
              <Sports sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No Match Results Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Record your first match result to start tracking your
                performance!
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setDialogOpen(true)}
                size="large"
              >
                Add Your First Result
              </Button>
            </Paper>
          </Grid>
        ) : (
          results.map((result) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={result.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": { boxShadow: 4 },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Result Header */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Chip
                      icon={getResultIcon(result.result)}
                      label={result.result.toUpperCase()}
                      color={getResultColor(result.result)}
                      sx={{ fontWeight: "bold" }}
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {result.can_edit && (
                        <IconButton
                          size="small"
                          onClick={() => setSelectedResult(result)}
                        >
                          <Edit />
                        </IconButton>
                      )}
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Score Display */}
                  <Box sx={{ textAlign: "center", mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {result.score}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Final Score
                    </Typography>
                  </Box>

                  {/* Opponent Info */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: "secondary.main" }}>
                      {result.opponent.full_name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        vs {result.opponent.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        @{result.opponent.username} • Level{" "}
                        {result.opponent.level}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Match Details */}
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="body2">
                        {format(
                          new Date(result.played_at),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">{result.location}</Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Sports fontSize="small" color="action" />
                      <Typography variant="body2">
                        {result.duration} minutes
                      </Typography>
                    </Box>

                    {result.tournament_name && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <EmojiEvents fontSize="small" color="action" />
                        <Typography variant="body2">
                          {result.tournament_name}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Time Ago */}
                  <Box
                    sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Played {formatDistanceToNow(new Date(result.played_at))}{" "}
                      ago
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Statistics Summary */}
      {results.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            📊 Quick Stats
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="primary">
                    {results.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Matches
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="success.main">
                    {results.filter((r) => r.result === "win").length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Wins
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="warning.main">
                    {results.filter((r) => r.result === "draw").length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Draws
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="error.main">
                    {results.filter((r) => r.result === "loss").length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Losses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Add Result Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Match Result</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Opponent Username"
                value={newResult.opponent_username}
                onChange={(e) =>
                  setNewResult((prev) => ({
                    ...prev,
                    opponent_username: e.target.value,
                  }))
                }
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Match Result</InputLabel>
                <Select
                  value={newResult.result}
                  onChange={(e) =>
                    setNewResult((prev) => ({
                      ...prev,
                      result: e.target.value as any,
                    }))
                  }
                  label="Match Result"
                >
                  <MenuItem value="win">Win</MenuItem>
                  <MenuItem value="loss">Loss</MenuItem>
                  <MenuItem value="draw">Draw</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Your Score"
                type="number"
                value={newResult.user_score}
                onChange={(e) =>
                  setNewResult((prev) => ({
                    ...prev,
                    user_score: parseInt(e.target.value) || 0,
                  }))
                }
                inputProps={{ min: 0, max: 20 }}
                required
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Opponent Score"
                type="number"
                value={newResult.opponent_score}
                onChange={(e) =>
                  setNewResult((prev) => ({
                    ...prev,
                    opponent_score: parseInt(e.target.value) || 0,
                  }))
                }
                inputProps={{ min: 0, max: 20 }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Location"
                value={newResult.location}
                onChange={(e) =>
                  setNewResult((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Match Duration (minutes)"
                type="number"
                value={newResult.duration}
                onChange={(e) =>
                  setNewResult((prev) => ({
                    ...prev,
                    duration: parseInt(e.target.value) || 90,
                  }))
                }
                inputProps={{ min: 1, max: 180 }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notes (optional)"
                multiline
                rows={3}
                value={newResult.notes}
                onChange={(e) =>
                  setNewResult((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add any notes about the match..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddResult}
            disabled={!newResult.opponent_username || !newResult.location}
          >
            Add Result
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MatchResults;
