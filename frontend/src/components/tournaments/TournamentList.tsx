// src/components/tournaments/TournamentList.tsx
// LFA Legacy GO - Tournament List with Enhanced Navigation Integration

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  LinearProgress,
  Fab,
  Menu,
  Divider,
  Paper,
} from "@mui/material";
import {
  ArrowBack,
  EmojiEvents,
  People,
  Schedule,
  LocationOn,
  AccountBalanceWallet,
  Add,
  TrendingUp,
  CheckCircle,
  Delete,
  Edit,
  Visibility,
  PlayArrow,
  MoreVert,
  Timeline,
  SportsScore,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

// Tournament Types
interface Tournament {
  id: number;
  tournament_id: string;
  name: string;
  description?: string;
  tournament_type: string;
  game_type: string;
  format: string;
  status: string;
  location_id: number;
  location_name: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  min_participants: number;
  max_participants: number;
  current_participants: number;
  entry_fee_credits: number;
  prize_pool_credits: number;
  min_level: number;
  max_level?: number;
  organizer_id: number;
  organizer_username: string;
  winner_id?: number;
  winner_username?: string;
  is_registration_open: boolean;
  is_full: boolean;
  can_start: boolean;
  created_at: string;
}

interface NewTournament {
  name: string;
  description: string;
  tournament_type: string;
  game_type: string;
  format: string;
  location_id: number;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  min_participants: number;
  max_participants: number;
  entry_fee_credits: number;
  prize_distribution: Record<string, number>;
  min_level: number;
  max_level: number;
}

const TournamentList: React.FC = () => {
  const navigate = useNavigate();
  const { state: authState } = useAuth();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);

  const [newTournament, setNewTournament] = useState<NewTournament>({
    name: "",
    description: "",
    tournament_type: "daily_challenge",
    game_type: "GAME1",
    format: "single_elimination",
    location_id: 1,
    start_time: "",
    end_time: "",
    registration_deadline: "",
    min_participants: 4,
    max_participants: 16,
    entry_fee_credits: 10,
    prize_distribution: { "1st": 100 },
    min_level: 1,
    max_level: 50,
  });

  // Enhanced Demo Tournament Data
  const demoTournaments: Tournament[] = [
    {
      id: 1,
      tournament_id: "TOURN_CHRISTMAS_2024",
      name: "Christmas Championship",
      description:
        "Special holiday tournament with exciting prizes and festive atmosphere",
      tournament_type: "championship",
      game_type: "GAME1",
      format: "single_elimination",
      status: "registration",
      location_id: 1,
      location_name: "Central Sports Arena",
      start_time: "2024-12-25T18:00:00",
      end_time: "2024-12-25T20:00:00",
      registration_deadline: "2024-12-25T16:00:00",
      min_participants: 4,
      max_participants: 16,
      current_participants: 6,
      entry_fee_credits: 50,
      prize_pool_credits: 500,
      min_level: 3,
      max_level: undefined,
      organizer_id: 1,
      organizer_username: "admin",
      winner_id: undefined,
      winner_username: undefined,
      is_registration_open: true,
      is_full: false,
      can_start: false,
      created_at: "2024-12-12T10:00:00",
    },
    {
      id: 2,
      tournament_id: "TOURN_WEEKLY_001",
      name: "Weekly Challenge #1",
      description: "Regular weekly tournament for all skill levels",
      tournament_type: "weekly_challenge",
      game_type: "GAME1",
      format: "round_robin",
      status: "in_progress",
      location_id: 2,
      location_name: "North Arena",
      start_time: "2024-12-20T15:00:00",
      end_time: "2024-12-20T17:00:00",
      registration_deadline: "2024-12-20T13:00:00",
      min_participants: 6,
      max_participants: 12,
      current_participants: 8,
      entry_fee_credits: 25,
      prize_pool_credits: 200,
      min_level: 1,
      max_level: 10,
      organizer_id: 2,
      organizer_username: "tournament_master",
      winner_id: undefined,
      winner_username: undefined,
      is_registration_open: false,
      is_full: false,
      can_start: true,
      created_at: "2024-12-15T14:00:00",
    },
    {
      id: 3,
      tournament_id: "TOURN_NOVICE_005",
      name: "Beginner's Cup #5",
      description: "Perfect for new players to test their skills",
      tournament_type: "beginner_friendly",
      game_type: "GAME2",
      format: "single_elimination",
      status: "completed",
      location_id: 1,
      location_name: "Central Sports Arena",
      start_time: "2024-12-18T14:00:00",
      end_time: "2024-12-18T16:00:00",
      registration_deadline: "2024-12-18T12:00:00",
      min_participants: 4,
      max_participants: 8,
      current_participants: 8,
      entry_fee_credits: 10,
      prize_pool_credits: 80,
      min_level: 1,
      max_level: 5,
      organizer_id: 1,
      organizer_username: "admin",
      winner_id: 5,
      winner_username: "rookie_champion",
      is_registration_open: false,
      is_full: true,
      can_start: false,
      created_at: "2024-12-10T09:00:00",
    },
    {
      id: 4,
      tournament_id: "TOURN_ELITE_001",
      name: "Elite Masters Series",
      description: "High-stakes tournament for expert players only",
      tournament_type: "elite_series",
      game_type: "GAME1",
      format: "double_elimination",
      status: "registration",
      location_id: 3,
      location_name: "Premium Arena",
      start_time: "2024-12-30T19:00:00",
      end_time: "2024-12-30T22:00:00",
      registration_deadline: "2024-12-29T18:00:00",
      min_participants: 8,
      max_participants: 32,
      current_participants: 15,
      entry_fee_credits: 100,
      prize_pool_credits: 1000,
      min_level: 8,
      max_level: undefined,
      organizer_id: 3,
      organizer_username: "elite_organizer",
      winner_id: undefined,
      winner_username: undefined,
      is_registration_open: true,
      is_full: false,
      can_start: false,
      created_at: "2024-12-08T16:00:00",
    },
  ];

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setLoading(true);

        // Demo: Using mock data
        setTimeout(() => {
          setTournaments(demoTournaments);
          setLoading(false);
        }, 1000);

        // TODO: Real API call
        // const response = await fetch('/api/tournaments');
        // const data = await response.json();
        // setTournaments(data);
      } catch (err) {
        console.error("Error loading tournaments:", err);
        setError("Failed to load tournaments");
        setTournaments(demoTournaments);
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, []);

  const handleCreateTournament = async () => {
    try {
      setCreating(true);

      // Demo: Create a new tournament
      const newTournamentData: Tournament = {
        id: Date.now(),
        tournament_id: `TOURN_${Date.now()}`,
        ...newTournament,
        status: "registration",
        location_name: "Central Sports Arena",
        current_participants: 0,
        prize_pool_credits: newTournament.entry_fee_credits * 8,
        organizer_id: authState.user?.id || 1,
        organizer_username: authState.user?.username || "current_user",
        winner_id: undefined,
        winner_username: undefined,
        is_registration_open: true,
        is_full: false,
        can_start: false,
        created_at: new Date().toISOString(),
      };

      setTimeout(() => {
        setTournaments((prev) => [newTournamentData, ...prev]);
        setShowCreateDialog(false);
        setCreating(false);
        // Reset form
        setNewTournament({
          name: "",
          description: "",
          tournament_type: "daily_challenge",
          game_type: "GAME1",
          format: "single_elimination",
          location_id: 1,
          start_time: "",
          end_time: "",
          registration_deadline: "",
          min_participants: 4,
          max_participants: 16,
          entry_fee_credits: 10,
          prize_distribution: { "1st": 100 },
          min_level: 1,
          max_level: 50,
        });
      }, 1500);

      // TODO: Real API call
      // const response = await fetch('/api/tournaments', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newTournament)
      // });
      // const data = await response.json();
    } catch (error) {
      console.error("Error creating tournament:", error);
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registration":
        return "primary";
      case "in_progress":
        return "warning";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "registration":
        return <Schedule />;
      case "in_progress":
        return <PlayArrow />;
      case "completed":
        return <CheckCircle />;
      default:
        return <Schedule />;
    }
  };

  const isOrganizer = (tournament: Tournament) => {
    return authState.user?.id === tournament.organizer_id;
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const statusFilters = ["all", "registration", "in_progress", "completed"];
    const currentFilter = statusFilters[activeTab];
    return currentFilter === "all" || tournament.status === currentFilter;
  });

  const handleViewTournament = (tournament: Tournament) => {
    navigate(`/tournaments/${tournament.id}`);
  };

  const handleViewBracket = (tournament: Tournament) => {
    navigate(`/tournaments/${tournament.id}/bracket`);
  };

  const handleManageMatches = (tournament: Tournament) => {
    navigate(`/tournaments/${tournament.id}/matches`);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    tournament: Tournament
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedTournament(tournament);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTournament(null);
  };

  const TournamentCard: React.FC<{ tournament: Tournament }> = ({
    tournament,
  }) => (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
          transition: "all 0.2s ease-in-out",
        },
        background: `linear-gradient(135deg, ${
          tournament.status === "registration"
            ? "#e3f2fd"
            : tournament.status === "in_progress"
            ? "#fff3e0"
            : "#e8f5e8"
        }, white)`,
        cursor: "pointer",
      }}
      onClick={() => handleViewTournament(tournament)}
    >
      <CardContent sx={{ flexGrow: 1, position: "relative" }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Chip
            icon={getStatusIcon(tournament.status)}
            label={tournament.status.replace("_", " ").toUpperCase()}
            color={getStatusColor(tournament.status) as any}
            size="small"
          />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e, tournament);
            }}
          >
            <MoreVert />
          </IconButton>
        </Box>

        {/* Tournament Info */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 700, mb: 1, lineHeight: 1.2 }}
        >
          {tournament.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, height: "40px", overflow: "hidden" }}
        >
          {tournament.description}
        </Typography>

        {/* Tournament Details */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <EmojiEvents sx={{ mr: 1, fontSize: 16, color: "warning.main" }} />
          <Typography variant="body2">
            {tournament.tournament_type.replace("_", " ")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <LocationOn sx={{ mr: 1, fontSize: 16, color: "primary.main" }} />
          <Typography variant="body2">{tournament.location_name}</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Schedule sx={{ mr: 1, fontSize: 16, color: "info.main" }} />
          <Typography variant="body2">
            {new Date(tournament.start_time).toLocaleDateString()}{" "}
            {new Date(tournament.start_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <People sx={{ mr: 1, fontSize: 16, color: "success.main" }} />
          <Typography variant="body2">
            {tournament.current_participants} / {tournament.max_participants}{" "}
            players
          </Typography>
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={
            (tournament.current_participants / tournament.max_participants) *
            100
          }
          sx={{ mb: 2, height: 6, borderRadius: 3 }}
        />

        {/* Entry Fee & Prize */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <AccountBalanceWallet
              sx={{ mr: 0.5, fontSize: 14, color: "secondary.main" }}
            />
            <Typography variant="caption">
              {tournament.entry_fee_credits} credits
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <EmojiEvents
              sx={{ mr: 0.5, fontSize: 14, color: "warning.main" }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {tournament.prize_pool_credits} prize
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Visibility />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewTournament(tournament);
            }}
            sx={{ flexGrow: 1 }}
          >
            View
          </Button>

          {tournament.current_participants > 0 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Timeline />}
              onClick={(e) => {
                e.stopPropagation();
                handleViewBracket(tournament);
              }}
            >
              Bracket
            </Button>
          )}

          {isOrganizer(tournament) && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<SportsScore />}
              onClick={(e) => {
                e.stopPropagation();
                handleManageMatches(tournament);
              }}
            >
              Manage
            </Button>
          )}
        </Box>

        {/* Organizer Badge */}
        {isOrganizer(tournament) && (
          <Chip
            label="You're organizing"
            size="small"
            color="info"
            sx={{ mt: 1, alignSelf: "flex-start" }}
          />
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 4,
          flexWrap: "wrap",
        }}
      >
        <IconButton
          onClick={() => navigate("/dashboard")}
          sx={{
            background: "linear-gradient(45deg, #1976d2, #42a5f5)",
            color: "white",
            "&:hover": {
              background: "linear-gradient(45deg, #1565c0, #1e88e5)",
            },
          }}
        >
          <ArrowBack />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            🏆 Tournaments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Join exciting tournaments and compete with other players
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateDialog(true)}
          size="large"
          sx={{
            background: "linear-gradient(45deg, #2e7d32, #66bb6a)",
            "&:hover": {
              background: "linear-gradient(45deg, #1b5e20, #4caf50)",
            },
          }}
        >
          Create Tournament
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "primary.main" }}
            >
              {tournaments.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tournaments
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "warning.main" }}
            >
              {
                tournaments.filter(
                  (t) =>
                    t.status === "registration" || t.status === "in_progress"
                ).length
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "success.main" }}
            >
              {tournaments.filter((t) => isOrganizer(t)).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your Tournaments
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        >
          <Tab label="All Tournaments" />
          <Tab label="Registration Open" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>
      </Box>

      {/* Tournament Grid */}
      <Grid container spacing={3}>
        {filteredTournaments.map((tournament) => (
          <Grid item xs={12} md={6} lg={4} key={tournament.id}>
            <TournamentCard tournament={tournament} />
          </Grid>
        ))}
      </Grid>

      {filteredTournaments.length === 0 && !loading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <EmojiEvents sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tournaments found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Be the first to create a tournament!
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateDialog(true)}
          >
            Create Tournament
          </Button>
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleViewTournament(selectedTournament!);
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        {(selectedTournament?.current_participants ?? 0) > 0 && (
          <MenuItem
            onClick={() => {
              handleViewBracket(selectedTournament!);
              handleMenuClose();
            }}
          >
            <Timeline sx={{ mr: 1 }} /> View Bracket
          </MenuItem>
        )}
        {selectedTournament && isOrganizer(selectedTournament) && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                handleManageMatches(selectedTournament);
                handleMenuClose();
              }}
            >
              <SportsScore sx={{ mr: 1 }} /> Manage Matches
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <Edit sx={{ mr: 1 }} /> Edit Tournament
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
              <Delete sx={{ mr: 1 }} /> Delete
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Create Tournament Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Tournament</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Tournament Name"
                value={newTournament.name}
                onChange={(e) =>
                  setNewTournament((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={newTournament.description}
                onChange={(e) =>
                  setNewTournament((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Tournament Type</InputLabel>
                <Select
                  value={newTournament.tournament_type}
                  onChange={(e) =>
                    setNewTournament((prev) => ({
                      ...prev,
                      tournament_type: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="daily_challenge">Daily Challenge</MenuItem>
                  <MenuItem value="weekly_challenge">Weekly Challenge</MenuItem>
                  <MenuItem value="championship">Championship</MenuItem>
                  <MenuItem value="beginner_friendly">
                    Beginner Friendly
                  </MenuItem>
                  <MenuItem value="elite_series">Elite Series</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={newTournament.format}
                  onChange={(e) =>
                    setNewTournament((prev) => ({
                      ...prev,
                      format: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="single_elimination">
                    Single Elimination
                  </MenuItem>
                  <MenuItem value="double_elimination">
                    Double Elimination
                  </MenuItem>
                  <MenuItem value="round_robin">Round Robin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Start Time"
                type="datetime-local"
                value={newTournament.start_time}
                onChange={(e) =>
                  setNewTournament((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Registration Deadline"
                type="datetime-local"
                value={newTournament.registration_deadline}
                onChange={(e) =>
                  setNewTournament((prev) => ({
                    ...prev,
                    registration_deadline: e.target.value,
                  }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Min Participants"
                type="number"
                value={newTournament.min_participants}
                onChange={(e) =>
                  setNewTournament((prev) => ({
                    ...prev,
                    min_participants: parseInt(e.target.value),
                  }))
                }
                fullWidth
                inputProps={{ min: 2, max: 64 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Max Participants"
                type="number"
                value={newTournament.max_participants}
                onChange={(e) =>
                  setNewTournament((prev) => ({
                    ...prev,
                    max_participants: parseInt(e.target.value),
                  }))
                }
                fullWidth
                inputProps={{ min: 4, max: 64 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Entry Fee (Credits)"
                type="number"
                value={newTournament.entry_fee_credits}
                onChange={(e) =>
                  setNewTournament((prev) => ({
                    ...prev,
                    entry_fee_credits: parseInt(e.target.value),
                  }))
                }
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Min Level"
                type="number"
                value={newTournament.min_level}
                onChange={(e) =>
                  setNewTournament((prev) => ({
                    ...prev,
                    min_level: parseInt(e.target.value),
                  }))
                }
                fullWidth
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateTournament}
            disabled={creating || !newTournament.name}
          >
            {creating ? "Creating..." : "Create Tournament"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentList;
