// src/components/tournaments/TournamentBracket.tsx
// LFA Legacy GO - Tournament Bracket Visualization with Material-UI Integration

import React, { useState, useEffect, useMemo } from "react";
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
  Paper,
  Divider,
  Avatar,
  LinearProgress,
} from "@mui/material";
import {
  ArrowBack,
  EmojiEvents,
  PlayArrow,
  CheckCircle,
  Schedule,
  Person,
  Close,
  Timeline,
} from "@mui/icons-material";

interface Match {
  id: string;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  score: string | null;
  status: "scheduled" | "in_progress" | "completed" | "pending";
  scheduled_time?: string; // Made optional
  completed_at?: string; // Made optional
  actualMatch?: {
    round_number: number;
    match_number: number;
    player1_username: string;
    player2_username: string;
    status: string;
    player1_score: number;
    player2_score: number;
    winner_id: number;
    player1_id: number;
    player2_id?: number;
    scheduled_time?: string; // Added optional fields
    completed_at?: string;
  };
}

interface Player {
  id: number;
  username: string;
  full_name: string;
  level: number;
}

interface Round {
  round: number;
  name: string;
  matches: Match[];
}

interface BracketData {
  rounds: Round[];
  totalRounds: number;
}

const TournamentBracket: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [hoveredMatch, setHoveredMatch] = useState<Match | null>(null);

  // Demo participants data
  const demoParticipants: Player[] = [
    { id: 1, username: "alice_j", full_name: "Alice Johnson", level: 8 },
    { id: 2, username: "bob_smith", full_name: "Bob Smith", level: 6 },
    { id: 3, username: "charlie_b", full_name: "Charlie Brown", level: 7 },
    { id: 4, username: "diana_p", full_name: "Diana Prince", level: 9 },
    { id: 5, username: "ethan_h", full_name: "Ethan Hunt", level: 5 },
    { id: 6, username: "fiona_a", full_name: "Fiona Apple", level: 8 },
    { id: 7, username: "george_l", full_name: "George Lucas", level: 6 },
    { id: 8, username: "helen_k", full_name: "Helen Keller", level: 7 },
  ];

  // Demo bracket data generator
  const generateDemoBracket = (): BracketData => {
    const participants = [...demoParticipants];
    const totalRounds = Math.ceil(Math.log2(participants.length));
    const rounds: Round[] = [];

    // Round 1 - Quarterfinals
    const round1Matches: Match[] = [];
    for (let i = 0; i < participants.length; i += 2) {
      const match: Match = {
        id: `r1-m${i / 2 + 1}`,
        matchNumber: i / 2 + 1,
        player1: participants[i] || null,
        player2: participants[i + 1] || null,
        winner: Math.random() > 0.5 ? participants[i] : participants[i + 1],
        score: Math.random() > 0.3 ? "3-1" : null,
        status: Math.random() > 0.3 ? "completed" : "in_progress",
        scheduled_time: "2024-12-15T19:00:00Z",
        actualMatch: {
          round_number: 1,
          match_number: i / 2 + 1,
          player1_username: participants[i]?.username || "",
          player2_username: participants[i + 1]?.username || "",
          status: Math.random() > 0.3 ? "completed" : "in_progress",
          player1_score: Math.floor(Math.random() * 4),
          player2_score: Math.floor(Math.random() * 4),
          winner_id:
            Math.random() > 0.5
              ? participants[i]?.id || 0
              : participants[i + 1]?.id || 0,
          player1_id: participants[i]?.id || 0,
          player2_id: participants[i + 1]?.id,
          scheduled_time: "2024-12-15T19:00:00Z",
          completed_at:
            Math.random() > 0.3 ? "2024-12-15T20:30:00Z" : undefined,
        },
      };
      round1Matches.push(match);
    }

    rounds.push({
      round: 1,
      name: "Quarterfinals",
      matches: round1Matches,
    });

    // Round 2 - Semifinals
    const round2Matches: Match[] = [];
    const round1Winners = round1Matches
      .filter((m) => m.status === "completed")
      .map((m) => m.winner)
      .filter((p): p is Player => p !== null);

    for (let i = 0; i < round1Winners.length; i += 2) {
      if (round1Winners[i + 1]) {
        const match: Match = {
          id: `r2-m${i / 2 + 1}`,
          matchNumber: i / 2 + 1,
          player1: round1Winners[i],
          player2: round1Winners[i + 1],
          winner: Math.random() > 0.5 ? round1Winners[i] : round1Winners[i + 1],
          score: Math.random() > 0.5 ? "3-2" : null,
          status: Math.random() > 0.5 ? "completed" : "scheduled",
          scheduled_time: "2024-12-15T20:00:00Z",
          actualMatch: {
            round_number: 2,
            match_number: i / 2 + 1,
            player1_username: round1Winners[i].username,
            player2_username: round1Winners[i + 1].username,
            status: Math.random() > 0.5 ? "completed" : "scheduled",
            player1_score: Math.floor(Math.random() * 4),
            player2_score: Math.floor(Math.random() * 4),
            winner_id:
              Math.random() > 0.5
                ? round1Winners[i].id
                : round1Winners[i + 1].id,
            player1_id: round1Winners[i].id,
            player2_id: round1Winners[i + 1].id,
            scheduled_time: "2024-12-15T20:00:00Z",
            completed_at:
              Math.random() > 0.5 ? "2024-12-15T21:30:00Z" : undefined,
          },
        };
        round2Matches.push(match);
      }
    }

    rounds.push({
      round: 2,
      name: "Semifinals",
      matches: round2Matches,
    });

    // Round 3 - Finals
    const round2Winners = round2Matches
      .filter((m) => m.status === "completed")
      .map((m) => m.winner)
      .filter((p): p is Player => p !== null);

    if (round2Winners.length >= 2) {
      const finalMatch: Match = {
        id: "r3-m1",
        matchNumber: 1,
        player1: round2Winners[0],
        player2: round2Winners[1],
        winner: null,
        score: null,
        status: "scheduled",
        scheduled_time: "2024-12-15T21:00:00Z",
        actualMatch: {
          round_number: 3,
          match_number: 1,
          player1_username: round2Winners[0].username,
          player2_username: round2Winners[1].username,
          status: "scheduled",
          player1_score: 0,
          player2_score: 0,
          winner_id: 0,
          player1_id: round2Winners[0].id,
          player2_id: round2Winners[1].id,
          scheduled_time: "2024-12-15T21:00:00Z",
        },
      };

      rounds.push({
        round: 3,
        name: "Finals",
        matches: [finalMatch],
      });
    }

    return {
      rounds,
      totalRounds,
    };
  };

  const bracketData = useMemo(() => generateDemoBracket(), []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      case "scheduled":
        return "primary";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle />;
      case "in_progress":
        return <PlayArrow />;
      case "scheduled":
        return <Schedule />;
      default:
        return <Schedule />;
    }
  };

  const MatchCard: React.FC<{ match: Match; roundNumber: number }> = ({
    match,
    roundNumber,
  }) => {
    const hasWinner = match.winner !== null;

    return (
      <Card
        sx={{
          minWidth: 200,
          margin: 1,
          cursor: "pointer",
          position: "relative",
          "&:hover": {
            transform: "scale(1.02)",
            boxShadow: 3,
            transition: "all 0.2s ease-in-out",
          },
          background: hasWinner
            ? "linear-gradient(135deg, #e8f5e8, #f1f8e9)"
            : "white",
        }}
        onClick={() => setSelectedMatch(match)}
        onMouseEnter={() => setHoveredMatch(match)}
        onMouseLeave={() => setHoveredMatch(null)}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          {/* Match Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Match {match.matchNumber}
            </Typography>
            <Chip
              icon={getStatusIcon(match.status)}
              label={match.status.replace("_", " ")}
              size="small"
              color={getStatusColor(match.status) as any}
            />
          </Box>

          {/* Player 1 */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1,
              mb: 1,
              borderRadius: 1,
              backgroundColor:
                match.winner === match.player1
                  ? "success.light"
                  : "transparent",
              fontWeight: match.winner === match.player1 ? 600 : 400,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.8rem",
                fontWeight: match.winner === match.player1 ? 600 : 400,
              }}
            >
              {match.player1 ? match.player1.full_name : "TBD"}
            </Typography>
            {match.score && match.status === "completed" && (
              <Typography
                variant="body2"
                sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
              >
                {match.actualMatch?.player1_score || 0}
              </Typography>
            )}
          </Box>

          {/* VS Divider */}
          <Box sx={{ textAlign: "center", my: 1 }}>
            <Typography variant="caption" color="text.secondary">
              vs
            </Typography>
          </Box>

          {/* Player 2 */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1,
              mb: 1,
              borderRadius: 1,
              backgroundColor:
                match.winner === match.player2
                  ? "warning.light"
                  : "transparent",
              fontWeight: match.winner === match.player2 ? 600 : 400,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.8rem",
                fontWeight: match.winner === match.player2 ? 600 : 400,
              }}
            >
              {match.player2 ? match.player2.full_name : "TBD"}
            </Typography>
            {match.score && match.status === "completed" && (
              <Typography
                variant="body2"
                sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
              >
                {match.actualMatch?.player2_score || 0}
              </Typography>
            )}
          </Box>

          {/* Status Badge */}
          <Box
            sx={{
              position: "absolute",
              bottom: -8,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <Chip
              label={match.status.replace("_", " ")}
              size="small"
              color={getStatusColor(match.status) as any}
              sx={{ fontSize: "0.6rem", height: 20 }}
            />
          </Box>

          {/* Winner Badge */}
          {hasWinner && (
            <Box sx={{ position: "absolute", top: -8, right: -8 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: "warning.main",
                  fontSize: "0.7rem",
                }}
              >
                👑
              </Avatar>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

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
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Tournament Bracket
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Follow the tournament progression and match results
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Timeline />}
          onClick={() => navigate(`/tournaments/${tournamentId}/matches`)}
        >
          Match Control
        </Button>
      </Box>

      {/* Demo Alert */}
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, bgcolor: "info.light", color: "info.contrastText" }}>
          <Typography variant="body2">
            🎮 Demo Mode: This is an interactive tournament bracket
            demonstration with simulated match data and real-time updates.
          </Typography>
        </Paper>
      </Box>

      {/* Tournament Progress */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tournament Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={
              (bracketData.rounds.filter((r) =>
                r.matches.every((m) => m.status === "completed")
              ).length /
                bracketData.totalRounds) *
              100
            }
            sx={{ mb: 2, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary">
            Round{" "}
            {bracketData.rounds.findIndex((r) =>
              r.matches.some((m) => m.status !== "completed")
            ) + 1 || bracketData.totalRounds}{" "}
            of {bracketData.totalRounds}
          </Typography>
        </CardContent>
      </Card>

      {/* Bracket Grid */}
      <Box sx={{ overflowX: "auto", pb: 2 }}>
        <Grid container spacing={3} sx={{ minWidth: 800 }}>
          {bracketData.rounds.map((round) => (
            <Grid item xs={12 / bracketData.totalRounds} key={round.round}>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {round.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Round {round.round}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {round.matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    roundNumber={round.round}
                  />
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Match Details Dialog */}
      <Dialog
        open={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedMatch && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <EmojiEvents sx={{ mr: 1, color: "primary.main" }} />
                Match {selectedMatch.matchNumber} Details
                <IconButton
                  onClick={() => setSelectedMatch(null)}
                  sx={{ ml: "auto" }}
                >
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={5}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Avatar sx={{ mx: "auto", mb: 1, bgcolor: "primary.main" }}>
                      <Person />
                    </Avatar>
                    <Typography variant="h6">
                      {selectedMatch.player1?.full_name || "TBD"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Level {selectedMatch.player1?.level || "-"}
                    </Typography>
                    {selectedMatch.actualMatch && (
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                        {selectedMatch.actualMatch.player1_score}
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={2}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      VS
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={5}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Avatar
                      sx={{ mx: "auto", mb: 1, bgcolor: "secondary.main" }}
                    >
                      <Person />
                    </Avatar>
                    <Typography variant="h6">
                      {selectedMatch.player2?.full_name || "TBD"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Level {selectedMatch.player2?.level || "-"}
                    </Typography>
                    {selectedMatch.actualMatch && (
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                        {selectedMatch.actualMatch.player2_score}
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ textAlign: "center" }}>
                    <Chip
                      icon={getStatusIcon(selectedMatch.status)}
                      label={selectedMatch.status
                        .replace("_", " ")
                        .toUpperCase()}
                      color={getStatusColor(selectedMatch.status) as any}
                      size="medium"
                      sx={{ mb: 2 }}
                    />

                    {selectedMatch.scheduled_time && (
                      <Typography variant="body2" color="text.secondary">
                        Scheduled:{" "}
                        {new Date(
                          selectedMatch.scheduled_time
                        ).toLocaleString()}
                      </Typography>
                    )}

                    {selectedMatch.actualMatch?.completed_at && (
                      <Typography variant="body2" color="text.secondary">
                        Completed:{" "}
                        {new Date(
                          selectedMatch.actualMatch.completed_at
                        ).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedMatch(null)}>Close</Button>
              {selectedMatch.status === "in_progress" && (
                <Button variant="contained" startIcon={<PlayArrow />}>
                  Watch Live
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TournamentBracket;
