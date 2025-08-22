// src/components/tournaments/MatchControlDashboard.tsx
// LFA Legacy GO - Match Control Dashboard with Material-UI Integration

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Alert,
  CircularProgress,
  Fab,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack,
  PlayArrow,
  Pause,
  CheckCircle,
  Schedule,
  Edit,
  Add,
  MoreVert,
  Timer,
  EmojiEvents,
  Person,
  Save,
  Close,
  Timeline,
  SportsScore,
} from "@mui/icons-material";
import { useSafeAuth } from "../../contexts/AuthContext";

interface Player {
  id: number;
  username: string;
  full_name: string;
  level: number;
}

interface Match {
  id: string;
  match_id: string;
  round_number: number;
  match_number: number;
  player1: Player;
  player2: Player | null;
  status: "scheduled" | "in_progress" | "completed" | "pending";
  player1_score: number | null;
  player2_score: number | null;
  winner_id: number | null;
  scheduled_time: string;
  actual_start_time: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
}

interface ScoreInput {
  player1: string;
  player2: string;
  matchId: string | null;
}

const MatchControlDashboard: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { state: authState } = useSafeAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scoreInput, setScoreInput] = useState<ScoreInput>({
    player1: "",
    player2: "",
    matchId: null,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Demo match data
  const demoMatches: Match[] = [
    {
      id: "R1M1",
      match_id: "MATCH_001",
      round_number: 1,
      match_number: 1,
      player1: {
        id: 1,
        username: "alice_j",
        full_name: "Alice Johnson",
        level: 8,
      },
      player2: {
        id: 2,
        username: "bob_smith",
        full_name: "Bob Smith",
        level: 6,
      },
      status: "completed",
      player1_score: 3,
      player2_score: 1,
      winner_id: 1,
      scheduled_time: "2024-12-25T14:00:00",
      actual_start_time: "2024-12-25T14:02:00",
      completed_at: "2024-12-25T14:25:00",
      duration_minutes: 23,
    },
    {
      id: "R1M2",
      match_id: "MATCH_002",
      round_number: 1,
      match_number: 2,
      player1: {
        id: 3,
        username: "charlie_b",
        full_name: "Charlie Brown",
        level: 7,
      },
      player2: {
        id: 4,
        username: "diana_p",
        full_name: "Diana Prince",
        level: 9,
      },
      status: "in_progress",
      player1_score: 2,
      player2_score: 2,
      winner_id: null,
      scheduled_time: "2024-12-25T14:30:00",
      actual_start_time: "2024-12-25T14:32:00",
      completed_at: null,
      duration_minutes: 18,
    },
    {
      id: "R1M3",
      match_id: "MATCH_003",
      round_number: 1,
      match_number: 3,
      player1: {
        id: 5,
        username: "ethan_h",
        full_name: "Ethan Hunt",
        level: 5,
      },
      player2: {
        id: 6,
        username: "fiona_a",
        full_name: "Fiona Apple",
        level: 8,
      },
      status: "scheduled",
      player1_score: null,
      player2_score: null,
      winner_id: null,
      scheduled_time: "2024-12-25T15:00:00",
      actual_start_time: null,
      completed_at: null,
      duration_minutes: null,
    },
    {
      id: "R1M4",
      match_id: "MATCH_004",
      round_number: 1,
      match_number: 4,
      player1: {
        id: 7,
        username: "george_l",
        full_name: "George Lucas",
        level: 6,
      },
      player2: {
        id: 8,
        username: "hannah_m",
        full_name: "Hannah Montana",
        level: 7,
      },
      status: "scheduled",
      player1_score: null,
      player2_score: null,
      winner_id: null,
      scheduled_time: "2024-12-25T15:30:00",
      actual_start_time: null,
      completed_at: null,
      duration_minutes: null,
    },
    {
      id: "R2M1",
      match_id: "MATCH_005",
      round_number: 2,
      match_number: 1,
      player1: {
        id: 1,
        username: "alice_j",
        full_name: "Alice Johnson",
        level: 8,
      },
      player2: null,
      status: "pending",
      player1_score: null,
      player2_score: null,
      winner_id: null,
      scheduled_time: "2024-12-25T16:00:00",
      actual_start_time: null,
      completed_at: null,
      duration_minutes: null,
    },
  ];

  useEffect(() => {
    setMatches(demoMatches);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "primary";
      case "scheduled":
        return "warning";
      case "pending":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle sx={{ fontSize: 20 }} />;
      case "in_progress":
        return <PlayArrow sx={{ fontSize: 20 }} />;
      case "scheduled":
        return <Schedule sx={{ fontSize: 20 }} />;
      case "pending":
        return <Timer sx={{ fontSize: 20 }} />;
      default:
        return <Schedule sx={{ fontSize: 20 }} />;
    }
  };

  const filterMatches = (status: string) => {
    if (status === "all") return matches;
    return matches.filter((match) => match.status === status);
  };

  const handleStatusChange = (matchId: string, newStatus: string) => {
    setActionLoading(true);
    setTimeout(() => {
      setMatches((prev) =>
        prev.map((match) =>
          match.id === matchId
            ? {
                ...match,
                status: newStatus as any,
                actual_start_time:
                  newStatus === "in_progress"
                    ? new Date().toISOString()
                    : match.actual_start_time,
                completed_at:
                  newStatus === "completed"
                    ? new Date().toISOString()
                    : match.completed_at,
              }
            : match
        )
      );
      setActionLoading(false);
    }, 1000);
  };

  const handleScoreUpdate = (
    matchId: string,
    player1Score: string,
    player2Score: string
  ) => {
    const winnerId =
      parseInt(player1Score) > parseInt(player2Score)
        ? matches.find((m) => m.id === matchId)?.player1.id
        : matches.find((m) => m.id === matchId)?.player2?.id;

    setMatches((prev) =>
      prev.map((match) =>
        match.id === matchId
          ? {
              ...match,
              player1_score: parseInt(player1Score),
              player2_score: parseInt(player2Score),
              winner_id: winnerId || null,
              status: "completed",
              completed_at: new Date().toISOString(),
            }
          : match
      )
    );

    setScoreInput({ player1: "", player2: "", matchId: null });
  };

  const openScoreInput = (match: Match) => {
    setScoreInput({
      player1: match.player1_score?.toString() || "",
      player2: match.player2_score?.toString() || "",
      matchId: match.id,
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString("hu-HU", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabFilters = [
    { label: "All", value: "all" },
    { label: "Scheduled", value: "scheduled" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
    { label: "Pending", value: "pending" },
  ];

  const tabCounts = {
    all: matches.length,
    scheduled: matches.filter((m) => m.status === "scheduled").length,
    in_progress: matches.filter((m) => m.status === "in_progress").length,
    completed: matches.filter((m) => m.status === "completed").length,
    pending: matches.filter((m) => m.status === "pending").length,
  };

  const currentFilter = tabFilters[activeTab]?.value || "all";
  const filteredMatches = filterMatches(currentFilter);

  const MatchCard: React.FC<{ match: Match }> = ({ match }) => (
    <Card
      sx={{
        border: "1px solid",
        borderColor: "divider",
        "&:hover": { borderColor: "primary.main", boxShadow: 2 },
        transition: "all 0.2s ease",
      }}
    >
      <CardContent>
        {/* Match Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {getStatusIcon(match.status)}
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Round {match.round_number} - Match {match.match_number}
            </Typography>
            <Chip
              label={match.status.replace("_", " ")}
              size="small"
              color={getStatusColor(match.status) as any}
            />
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              setSelectedMatch(match);
              setAnchorEl(e.currentTarget);
            }}
          >
            <MoreVert />
          </IconButton>
        </Box>

        {/* Players */}
        <Box sx={{ mb: 2 }}>
          {/* Player 1 */}
          <Paper
            sx={{
              p: 1.5,
              mb: 1,
              backgroundColor:
                match.winner_id === match.player1.id
                  ? "warning.light"
                  : "grey.50",
              border:
                match.winner_id === match.player1.id
                  ? "2px solid"
                  : "1px solid",
              borderColor:
                match.winner_id === match.player1.id
                  ? "warning.main"
                  : "grey.300",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    mr: 1.5,
                    bgcolor: "primary.main",
                  }}
                >
                  {match.player1.full_name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {match.player1.full_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Level {match.player1.level}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {match.player1_score !== null ? match.player1_score : "-"}
              </Typography>
            </Box>
          </Paper>

          {/* VS */}
          <Box sx={{ textAlign: "center", my: 0.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              VS
            </Typography>
          </Box>

          {/* Player 2 */}
          <Paper
            sx={{
              p: 1.5,
              backgroundColor:
                match.winner_id === match.player2?.id
                  ? "warning.light"
                  : "grey.50",
              border:
                match.winner_id === match.player2?.id
                  ? "2px solid"
                  : "1px solid",
              borderColor:
                match.winner_id === match.player2?.id
                  ? "warning.main"
                  : "grey.300",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    mr: 1.5,
                    bgcolor: "secondary.main",
                  }}
                >
                  {match.player2?.full_name?.charAt(0) || "?"}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {match.player2?.full_name || "TBD"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Level {match.player2?.level || "-"}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {match.player2_score !== null ? match.player2_score : "-"}
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Match Info */}
        <Box sx={{ mb: 2, fontSize: "0.8rem" }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              Scheduled:
            </Typography>
            <Typography variant="caption">
              {formatDateTime(match.scheduled_time)}
            </Typography>
          </Box>
          {match.actual_start_time && (
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="caption" color="text.secondary">
                Started:
              </Typography>
              <Typography variant="caption">
                {formatDateTime(match.actual_start_time)}
              </Typography>
            </Box>
          )}
          {match.duration_minutes && (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">
                Duration:
              </Typography>
              <Typography variant="caption">
                {match.duration_minutes} min
              </Typography>
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {match.status === "scheduled" && (
            <Button
              size="small"
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => handleStatusChange(match.id, "in_progress")}
              disabled={actionLoading}
            >
              Start
            </Button>
          )}

          {match.status === "in_progress" && (
            <>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<SportsScore />}
                onClick={() => openScoreInput(match)}
              >
                Score
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Pause />}
                onClick={() => handleStatusChange(match.id, "scheduled")}
              >
                Pause
              </Button>
            </>
          )}

          {match.status === "completed" && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => openScoreInput(match)}
            >
              Edit Score
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <IconButton
          onClick={() => navigate(`/tournaments/${tournamentId}`)}
          sx={{ mr: 2 }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Match Control Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Timeline />}
          onClick={() => navigate(`/tournaments/${tournamentId}/bracket`)}
        >
          View Bracket
        </Button>
      </Box>

      {/* Demo Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          🎮 Demo Mode: This is a demonstration of the match control system. All
          changes are simulated and will reset on page refresh.
        </Typography>
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "text.primary" }}
              >
                {matches.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Matches
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                {tabCounts.in_progress}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "success.main" }}
              >
                {tabCounts.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "warning.main" }}
              >
                {tabCounts.scheduled}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scheduled
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          {tabFilters.map((filter, index) => (
            <Tab
              key={filter.value}
              label={`${filter.label} (${
                tabCounts[filter.value as keyof typeof tabCounts]
              })`}
            />
          ))}
        </Tabs>
      </Card>

      {/* Match List */}
      <Grid container spacing={2}>
        {filteredMatches.map((match) => (
          <Grid item xs={12} md={6} lg={4} key={match.id}>
            <MatchCard match={match} />
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {filteredMatches.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <EmojiEvents sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No {currentFilter !== "all" ? currentFilter : ""} matches found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentFilter !== "all"
              ? "Try switching to a different filter."
              : "Matches will appear here once the tournament starts."}
          </Typography>
        </Box>
      )}

      {/* Score Input Dialog */}
      <Dialog
        open={!!scoreInput.matchId}
        onClose={() =>
          setScoreInput({ player1: "", player2: "", matchId: null })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enter Match Score</DialogTitle>
        <DialogContent>
          {(() => {
            const match = matches.find((m) => m.id === scoreInput.matchId);
            if (!match) return null;

            return (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    label={match.player1.full_name}
                    type="number"
                    inputProps={{ min: 0, max: 10 }}
                    value={scoreInput.player1}
                    onChange={(e) =>
                      setScoreInput((prev) => ({
                        ...prev,
                        player1: e.target.value,
                      }))
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label={match.player2?.full_name || "Player 2"}
                    type="number"
                    inputProps={{ min: 0, max: 10 }}
                    value={scoreInput.player2}
                    onChange={(e) =>
                      setScoreInput((prev) => ({
                        ...prev,
                        player2: e.target.value,
                      }))
                    }
                    fullWidth
                  />
                </Grid>
              </Grid>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setScoreInput({ player1: "", player2: "", matchId: null })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={() =>
              handleScoreUpdate(
                scoreInput.matchId!,
                scoreInput.player1,
                scoreInput.player2
              )
            }
            disabled={!scoreInput.player1 || !scoreInput.player2}
          >
            Save Score
          </Button>
        </DialogActions>
      </Dialog>

      {/* Match Details Dialog */}
      <Dialog
        open={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedMatch && (
          <>
            <DialogTitle>Match Details - {selectedMatch.match_id}</DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Match Information
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Round:
                    </Typography>
                    <Typography variant="body2">
                      {selectedMatch.round_number}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Status:
                    </Typography>
                    <Chip
                      label={selectedMatch.status.replace("_", " ")}
                      size="small"
                      color={getStatusColor(selectedMatch.status) as any}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Scheduled:
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(selectedMatch.scheduled_time)}
                    </Typography>
                  </Box>
                  {selectedMatch.duration_minutes && (
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Duration:
                      </Typography>
                      <Typography variant="body2">
                        {selectedMatch.duration_minutes} minutes
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Players & Score
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {[selectedMatch.player1, selectedMatch.player2].map(
                      (player, index) => (
                        <Paper
                          key={index}
                          sx={{
                            p: 2,
                            border: "2px solid",
                            borderColor:
                              selectedMatch.winner_id === player?.id
                                ? "warning.main"
                                : "divider",
                            backgroundColor:
                              selectedMatch.winner_id === player?.id
                                ? "warning.light"
                                : "background.paper",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Avatar
                                sx={{
                                  mr: 2,
                                  bgcolor:
                                    index === 0
                                      ? "primary.main"
                                      : "secondary.main",
                                }}
                              >
                                <Person />
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {player?.full_name || "TBD"}
                                  {selectedMatch.winner_id === player?.id &&
                                    " 👑"}
                                </Typography>
                                {player?.level && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Level {player.level}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                              {index === 0
                                ? selectedMatch.player1_score !== null
                                  ? selectedMatch.player1_score
                                  : "-"
                                : selectedMatch.player2_score !== null
                                  ? selectedMatch.player2_score
                                  : "-"}
                            </Typography>
                          </Box>
                        </Paper>
                      )
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedMatch(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            if (selectedMatch) {
              setSelectedMatch(selectedMatch);
            }
            setAnchorEl(null);
          }}
        >
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedMatch) {
              openScoreInput(selectedMatch);
            }
            setAnchorEl(null);
          }}
        >
          Edit Score
        </MenuItem>
      </Menu>

      {/* FAB for quick actions */}
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => {
          /* TODO: Quick add match */
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default MatchControlDashboard;
