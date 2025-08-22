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
} from "@mui/material";
import { EmojiEvents, LocationOn, Schedule } from "@mui/icons-material";
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
}

const Tournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const data = await tournamentService.getTournaments();
        setTournaments(data);
      } catch (err: any) {
        setError(err.message || "Failed to load tournaments");
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, []);

  const handleRegister = async (tournamentId: number) => {
    try {
      await tournamentService.registerForTournament(tournamentId);
      // ✅ FIXED: Refresh tournaments data instead of page reload
      loadTournaments();
    } catch (err: any) {
      alert(err.message || "Registration failed");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
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
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Tournaments
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {tournaments.map((tournament) => (
          <Grid item xs={12} md={6} lg={4} key={tournament.id}>
            <Card
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <EmojiEvents color="primary" />
                  <Typography variant="h6" component="h2" fontWeight="bold">
                    {tournament.name}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {tournament.description}
                </Typography>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <LocationOn fontSize="small" />
                  <Typography variant="body2">
                    {tournament.location_name}
                  </Typography>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <Schedule fontSize="small" />
                  <Typography variant="body2">
                    {new Date(tournament.start_time).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <Chip
                    label={tournament.status}
                    color={
                      tournament.status === "registration"
                        ? "primary"
                        : "default"
                    }
                    size="small"
                  />
                  <Chip
                    label={`${tournament.current_participants}/${tournament.max_participants}`}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Typography variant="h6" color="primary" fontWeight="bold">
                  {tournament.entry_fee_credits} Credits
                </Typography>
              </CardContent>

              <Box sx={{ p: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={tournament.status !== "registration"}
                  onClick={() => handleRegister(tournament.id)}
                >
                  {tournament.status === "registration" ? "Register" : "Closed"}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Tournaments;
