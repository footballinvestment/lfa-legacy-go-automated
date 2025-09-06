import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Avatar,
  Divider,
} from "@mui/material";
import {
  EmojiEvents,
  LocationOn,
  Schedule,
  People,
  AccountBalanceWallet,
  Refresh,
  Add,
  StarBorder,
  Star,
} from "@mui/icons-material";
import { useSafeAuth } from "../SafeAuthContext";
import { tournamentService } from "../services/api";

interface Tournament {
  id: number;
  name: string;
  description: string;
  status: string;
  start_time: string;
  entry_fee_credits: number;
  current_participants: number;
  max_participants: number;
  location_name: string;
  organizer_username?: string;
  prize_pool_credits?: number;
  tournament_type?: string;
}

const Tournaments: React.FC = () => {
  const { state } = useSafeAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  const loadTournaments = async () => {
    try {
      const data = await tournamentService.getTournaments();
      setTournaments(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load tournaments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTournaments();
  };

  const handleRegister = async (tournamentId: number) => {
    try {
      await tournamentService.registerForTournament(tournamentId);
      await loadTournaments(); // Refresh data after registration
    } catch (err: any) {
      alert(err.message || "Registration failed");
    }
  };

  const toggleFavorite = (tournamentId: number) => {
    setFavorites((prev) =>
      prev.includes(tournamentId)
        ? prev.filter((id) => id !== tournamentId)
        : [...prev, tournamentId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
      case "registration_open":
        return "success";
      case "in_progress":
      case "active":
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
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };
  };

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
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading tournaments...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={handleRefresh}
          startIcon={<Refresh />}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          🏆 Tournaments
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => alert("Create tournament feature coming soon!")}
          >
            Create Tournament
          </Button>
        </Box>
      </Box>

      {tournaments.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <EmojiEvents sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No tournaments available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Check back later or create your own tournament to get started!
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => alert("Create tournament feature coming soon!")}
          >
            Create Your First Tournament
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {tournaments.map((tournament) => {
            const { date, time } = formatDateTime(tournament.start_time);
            const isFavorite = favorites.includes(tournament.id);
            const isFull =
              tournament.current_participants >= tournament.max_participants;
            const isRegistrationOpen =
              tournament.status?.toLowerCase() === "open" ||
              tournament.status?.toLowerCase() === "registration_open";

            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={tournament.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    "&:hover": {
                      boxShadow: 4,
                      transform: "translateY(-2px)",
                      transition: "all 0.2s ease-in-out",
                    },
                  }}
                >
                  {/* Favorite toggle */}
                  <IconButton
                    size="small"
                    onClick={() => toggleFavorite(tournament.id)}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      bgcolor: "background.paper",
                      "&:hover": { bgcolor: "background.paper" },
                    }}
                  >
                    {isFavorite ? <Star color="warning" /> : <StarBorder />}
                  </IconButton>

                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Tournament Header */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {tournament.name}
                      </Typography>
                      <Chip
                        label={tournament.status || "Open"}
                        color={getStatusColor(tournament.status)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    </Box>

                    {/* Tournament Description */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, minHeight: "40px" }}
                    >
                      {tournament.description ||
                        "Join this exciting tournament and compete with other players!"}
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    {/* Tournament Details */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                        mb: 3,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Schedule color="action" fontSize="small" />
                        <Typography variant="body2">
                          {date} at {time}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LocationOn color="action" fontSize="small" />
                        <Typography variant="body2">
                          {tournament.location_name || "TBD"}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <People color="action" fontSize="small" />
                        <Typography variant="body2">
                          {tournament.current_participants}/
                          {tournament.max_participants} players
                        </Typography>
                        {isFull && (
                          <Chip label="Full" size="small" color="error" />
                        )}
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <AccountBalanceWallet color="action" fontSize="small" />
                        <Typography variant="body2">
                          {tournament.entry_fee_credits} credits
                        </Typography>
                        {tournament.prize_pool_credits && (
                          <Chip
                            label={`Prize: ${tournament.prize_pool_credits}`}
                            size="small"
                            color="success"
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Tournament Type & Organizer */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 3,
                      }}
                    >
                      {tournament.tournament_type && (
                        <Chip
                          label={tournament.tournament_type}
                          variant="outlined"
                          size="small"
                        />
                      )}
                      {tournament.organizer_username && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Avatar
                            sx={{ width: 20, height: 20, fontSize: "0.75rem" }}
                          >
                            {tournament.organizer_username
                              .charAt(0)
                              .toUpperCase()}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            by {tournament.organizer_username}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>

                  {/* Action Button */}
                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={() => handleRegister(tournament.id)}
                      disabled={!isRegistrationOpen || isFull}
                      startIcon={<EmojiEvents />}
                      sx={{
                        py: 1.5,
                        fontWeight: "bold",
                      }}
                    >
                      {!isRegistrationOpen
                        ? "Registration Closed"
                        : isFull
                          ? "Tournament Full"
                          : "Register Now"}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Summary Stats */}
      {tournaments.length > 0 && (
        <Box
          sx={{ mt: 6, p: 3, bgcolor: "background.default", borderRadius: 2 }}
        >
          <Typography variant="h6" gutterBottom>
            Tournament Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {tournaments.length}
                </Typography>
                <Typography variant="caption">Total Tournaments</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {
                    tournaments.filter(
                      (t) =>
                        t.status?.toLowerCase() === "open" ||
                        t.status?.toLowerCase() === "registration_open"
                    ).length
                  }
                </Typography>
                <Typography variant="caption">Open for Registration</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {
                    tournaments.filter(
                      (t) =>
                        t.status?.toLowerCase() === "in_progress" ||
                        t.status?.toLowerCase() === "active"
                    ).length
                  }
                </Typography>
                <Typography variant="caption">Active Now</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box textAlign="center">
                <Typography variant="h4" color="text.secondary">
                  {tournaments
                    .reduce((sum, t) => sum + (t.prize_pool_credits || 0), 0)
                    .toLocaleString()}
                </Typography>
                <Typography variant="caption">Total Prize Pool</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default Tournaments;
