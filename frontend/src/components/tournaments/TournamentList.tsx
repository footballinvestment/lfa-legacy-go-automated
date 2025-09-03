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
import { useSafeAuth } from "../../SafeAuthContext";

// Tournament Types
interface Tournament {
  id: number;
  tournament_id: string;
  name: string;
  description?: string;
  tournament_type: string;
  status: string;
  location_name: string;
  start_time: string;
  end_time: string;
  entry_fee_credits: number;
  prize_pool_credits: number;
  current_participants: number;
  max_participants: number;
  organizer_username: string;
  is_registration_open: boolean;
  is_full: boolean;
  created_at: string;
}

interface TournamentStats {
  totalTournaments: number;
  activeTournaments: string;
  totalParticipants: number;
  completionRate: number;
  monthlyGrowth: number;
}

const TournamentList: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSafeAuth();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Sample tournament stats
  const [tournamentStats] = useState<TournamentStats>({
    totalTournaments: 156,
    activeTournaments: "23",
    totalParticipants: 1247,
    completionRate: 85,
    monthlyGrowth: 12,
  });

  // Load tournaments
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const sampleTournaments: Tournament[] = [
          {
            id: 1,
            tournament_id: "TOUR001",
            name: "Evening Championship",
            description: "Weekly championship tournament for all skill levels",
            tournament_type: "Championship",
            status: "registration_open",
            location_name: "Downtown Sports Center",
            start_time: "2024-12-15T18:00:00Z",
            end_time: "2024-12-15T22:00:00Z",
            entry_fee_credits: 15,
            prize_pool_credits: 500,
            current_participants: 8,
            max_participants: 16,
            organizer_username: "admin",
            is_registration_open: true,
            is_full: false,
            created_at: "2024-12-01T10:00:00Z",
          },
          {
            id: 2,
            tournament_id: "TOUR002",
            name: "Beginner's Cup",
            description: "Perfect for new players to get started",
            tournament_type: "Cup",
            status: "in_progress",
            location_name: "Riverside Football Club",
            start_time: "2024-12-14T16:00:00Z",
            end_time: "2024-12-14T20:00:00Z",
            entry_fee_credits: 10,
            prize_pool_credits: 250,
            current_participants: 12,
            max_participants: 12,
            organizer_username: "moderator",
            is_registration_open: false,
            is_full: true,
            created_at: "2024-11-28T14:30:00Z",
          },
        ];

        setTournaments(sampleTournaments);
      } catch (err: any) {
        setError(err.message || "Failed to load tournaments");
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, []);

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    tournament: Tournament
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTournament(tournament);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTournament(null);
  };

  const handleViewDetails = () => {
    if (selectedTournament) {
      navigate(`/tournaments/${selectedTournament.id}`);
    }
    handleMenuClose();
  };

  const handleRegister = async (tournament: Tournament) => {
    try {
      // Simulate API call
      alert(`Registered for ${tournament.name}!`);
      // Refresh tournaments after registration
    } catch (err: any) {
      alert(err.message || "Registration failed");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "registration_open":
        return "success";
      case "in_progress":
        return "warning";
      case "completed":
        return "default";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // KPI Card component
  const renderKPICard = (
    title: string,
    value: string,
    icon: React.ReactNode,
    color: string,
    change?: string
  ) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ bgcolor: color, mr: 2 }}>{icon}</Avatar>
          <Typography variant="h6" sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          {value}
        </Typography>
        {change && (
          <Chip
            size="small"
            label={change}
            color={change.startsWith("+") ? "success" : "error"}
            sx={{ fontSize: "0.75rem" }}
          />
        )}
      </CardContent>
    </Card>
  );

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        {renderKPICard(
          "Total Tournaments",
          tournamentStats.totalTournaments.toLocaleString(),
          <EmojiEvents />,
          "#1976d2",
          `+${tournamentStats.monthlyGrowth}%`
        )}
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        {renderKPICard(
          "Active Tournaments",
          tournamentStats.activeTournaments,
          <Timeline />,
          "#2e7d32",
          "+5.2%"
        )}
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        {renderKPICard(
          "Total Participants",
          tournamentStats.totalParticipants.toLocaleString(),
          <People />,
          "#ed6c02",
          "+8.7%"
        )}
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        {renderKPICard(
          "Completion Rate",
          `${tournamentStats.completionRate}%`,
          <TrendingUp />,
          "#9c27b0",
          "+2.1%"
        )}
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Tournament Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Advanced tournament analytics and trends will be displayed here.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderTournamentList = () => (
    <Grid container spacing={3}>
      {tournaments.map((tournament) => (
        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={tournament.id}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
              "&:hover": { boxShadow: 4 },
            }}
            onClick={() => navigate(`/tournaments/${tournament.id}`)}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              {/* Tournament Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Typography variant="h6" component="h3">
                  {tournament.name}
                </Typography>
                <Box>
                  <Chip
                    label={tournament.status}
                    color={getStatusColor(tournament.status)}
                    size="small"
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, tournament)}
                    sx={{ ml: 1 }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
              </Box>

              {/* Tournament Type */}
              <Chip
                label={tournament.tournament_type}
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
              />

              {/* Description */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {tournament.description || "No description available"}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {/* Tournament Details */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Schedule fontSize="small" color="action" />
                  <Typography variant="body2">
                    {formatDateTime(tournament.start_time)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2">
                    {tournament.location_name}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <People fontSize="small" color="action" />
                  <Typography variant="body2">
                    {tournament.current_participants}/
                    {tournament.max_participants} players
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (tournament.current_participants /
                        tournament.max_participants) *
                      100
                    }
                    sx={{ flexGrow: 1, ml: 1 }}
                  />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccountBalanceWallet fontSize="small" color="action" />
                  <Typography variant="body2">
                    {tournament.entry_fee_credits} credits
                  </Typography>
                  <Typography
                    variant="body2"
                    color="success.main"
                    sx={{ ml: "auto" }}
                  >
                    Prize: {tournament.prize_pool_credits}
                  </Typography>
                </Box>
              </Box>

              {/* Organizer */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}
              >
                <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>
                  {tournament.organizer_username.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="caption" color="text.secondary">
                  by {tournament.organizer_username}
                </Typography>
              </Box>
            </CardContent>

            {/* Action Button */}
            <Box sx={{ p: 2, pt: 0 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={
                  tournament.is_registration_open ? <Add /> : <PlayArrow />
                }
                disabled={tournament.is_full && tournament.is_registration_open}
                onClick={(e) => {
                  e.stopPropagation();
                  if (tournament.is_registration_open) {
                    handleRegister(tournament);
                  } else {
                    navigate(`/tournaments/${tournament.id}`);
                  }
                }}
              >
                {tournament.is_full
                  ? "Full"
                  : tournament.is_registration_open
                    ? "Register"
                    : tournament.status === "in_progress"
                      ? "Watch Live"
                      : "View Details"}
              </Button>
            </Box>
          </Card>
        </Grid>
      ))}

      {tournaments.length === 0 && !loading && (
        <Grid size={{ xs: 12 }}>
          <Box sx={{ textAlign: "center", py: 8 }}>
            <EmojiEvents
              sx={{ fontSize: 80, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              No tournaments found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Be the first to create a tournament!
            </Typography>
            <Button variant="contained" startIcon={<Add />}>
              Create Tournament
            </Button>
          </Box>
        </Grid>
      )}
    </Grid>
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
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
        <Box>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h4"
            component="h1"
            sx={{ display: "inline", fontWeight: "bold" }}
          >
            Tournament Management
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>
          Create Tournament
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" icon={<TrendingUp />} />
          <Tab label="All Tournaments" icon={<EmojiEvents />} />
          <Tab label="My Tournaments" icon={<Person />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {currentTab === 0 && renderOverviewTab()}
      {currentTab === 1 && renderTournamentList()}
      {currentTab === 2 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            My Tournaments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tournaments you've created or are participating in will appear here.
          </Typography>
        </Box>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create tournament"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => alert("Create tournament dialog will open here")}
      >
        <Add />
      </Fab>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Edit Tournament
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <SportsScore sx={{ mr: 1 }} />
          View Results
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
          <Delete sx={{ mr: 1 }} />
          Delete Tournament
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TournamentList;
