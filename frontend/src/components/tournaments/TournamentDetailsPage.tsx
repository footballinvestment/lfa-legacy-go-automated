// src/components/tournaments/TournamentDetailsPage.tsx
// LFA Legacy GO - Tournament Details Page with Modern UI Integration

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  IconButton,
  LinearProgress,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  TrendingUp,
  PersonAdd,
  PersonRemove,
  CheckCircle,
  PlayArrow,
  ExpandMore,
  SportsScore,
} from "@mui/icons-material";
import { useSafeAuth } from "../../contexts/AuthContext";

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

interface Participant {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  level: number;
  registration_time: string;
  status: string;
  current_round: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  total_score: number;
  average_score: number;
  points: number;
  final_position?: number;
  prize_won: number;
  performance_rating: number;
}

interface TournamentDetails {
  tournament: Tournament;
  participants: Participant[];
  bracket?: any;
  current_round: number;
  total_rounds: number;
  user_participation?: Participant;
  can_register: boolean;
  can_withdraw: boolean;
  upcoming_matches: any[];
  completed_matches: any[];
  tournament_rules: {
    format: string;
    entry_fee: number;
    min_participants: number;
    max_participants: number;
    prize_distribution: Record<string, number>;
    level_requirements: {
      min_level: number;
      max_level?: number;
    };
  };
}

// Mock Data for Demo Mode
const mockTournamentData: TournamentDetails = {
  tournament: {
    id: 1,
    tournament_id: "DEMO_001",
    name: "Friday Night Championship",
    description:
      "Weekly championship featuring the best players in the city. This is the main event of the week!",
    tournament_type: "Championship",
    game_type: "Football",
    format: "Single Elimination",
    status: "registration",
    location_id: 1,
    location_name: "Downtown Sports Arena",
    start_time: "2024-12-15T19:00:00Z",
    end_time: "2024-12-15T23:00:00Z",
    registration_deadline: "2024-12-15T17:00:00Z",
    min_participants: 8,
    max_participants: 16,
    current_participants: 12,
    entry_fee_credits: 50,
    prize_pool_credits: 600,
    min_level: 3,
    max_level: 8,
    organizer_id: 1,
    organizer_username: "admin",
    winner_id: undefined,
    winner_username: undefined,
    is_registration_open: true,
    is_full: false,
    can_start: true,
    created_at: "2024-12-10T10:00:00Z",
  },
  participants: [
    {
      id: 1,
      user_id: 1,
      username: "striker23",
      full_name: "Alex Rodriguez",
      level: 7,
      registration_time: "2024-12-10T12:00:00Z",
      status: "registered",
      current_round: 0,
      matches_played: 0,
      matches_won: 0,
      matches_lost: 0,
      total_score: 0,
      average_score: 0,
      points: 0,
      prize_won: 0,
      performance_rating: 8.5,
    },
    {
      id: 2,
      user_id: 2,
      username: "goalkeeper",
      full_name: "Sarah Chen",
      level: 6,
      registration_time: "2024-12-10T14:30:00Z",
      status: "registered",
      current_round: 0,
      matches_played: 0,
      matches_won: 0,
      matches_lost: 0,
      total_score: 0,
      average_score: 0,
      points: 0,
      prize_won: 0,
      performance_rating: 7.8,
    },
    {
      id: 3,
      user_id: 3,
      username: "midfielder",
      full_name: "James Wilson",
      level: 5,
      registration_time: "2024-12-11T09:15:00Z",
      status: "registered",
      current_round: 0,
      matches_played: 0,
      matches_won: 0,
      matches_lost: 0,
      total_score: 0,
      average_score: 0,
      points: 0,
      prize_won: 0,
      performance_rating: 7.2,
    },
    {
      id: 4,
      user_id: 4,
      username: "speedster",
      full_name: "Maria Gonzalez",
      level: 8,
      registration_time: "2024-12-11T16:45:00Z",
      status: "registered",
      current_round: 0,
      matches_played: 0,
      matches_won: 0,
      matches_lost: 0,
      total_score: 0,
      average_score: 0,
      points: 0,
      prize_won: 0,
      performance_rating: 9.1,
    },
    {
      id: 5,
      user_id: 5,
      username: "defender99",
      full_name: "Chris Taylor",
      level: 4,
      registration_time: "2024-12-12T11:20:00Z",
      status: "registered",
      current_round: 0,
      matches_played: 0,
      matches_won: 0,
      matches_lost: 0,
      total_score: 0,
      average_score: 0,
      points: 0,
      prize_won: 0,
      performance_rating: 6.9,
    },
    {
      id: 6,
      user_id: 6,
      username: "proactive",
      full_name: "Anna Kim",
      level: 7,
      registration_time: "2024-12-12T15:30:00Z",
      status: "registered",
      current_round: 0,
      matches_played: 0,
      matches_won: 0,
      matches_lost: 0,
      total_score: 0,
      average_score: 0,
      points: 0,
      prize_won: 0,
      performance_rating: 8.3,
    },
  ],
  current_round: 0,
  total_rounds: 4,
  user_participation: undefined,
  can_register: true,
  can_withdraw: false,
  upcoming_matches: [
    {
      id: 1,
      round: 1,
      player1: "Alex Rodriguez",
      player2: "Sarah Chen",
      scheduled_time: "2024-12-15T19:00:00Z",
    },
    {
      id: 2,
      round: 1,
      player1: "James Wilson",
      player2: "Maria Gonzalez",
      scheduled_time: "2024-12-15T19:30:00Z",
    },
  ],
  completed_matches: [],
  tournament_rules: {
    format: "Single Elimination",
    entry_fee: 50,
    min_participants: 8,
    max_participants: 16,
    prize_distribution: {
      "1st Place": 300,
      "2nd Place": 200,
      "3rd Place": 100,
    },
    level_requirements: {
      min_level: 3,
      max_level: 8,
    },
  },
};

const TournamentDetailsPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { state: authState } = useSafeAuth();

  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

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
        return <PersonAdd />;
      case "in_progress":
        return <PlayArrow />;
      case "completed":
        return <CheckCircle />;
      default:
        return <Schedule />;
    }
  };

  useEffect(() => {
    fetchTournamentDetails();
  }, [tournamentId]);

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true);

      // For demo, use mock data
      setTimeout(() => {
        setTournament(mockTournamentData);
        setLoading(false);
      }, 1000);

      // TODO: Real API call
      // const response = await fetch(`/api/tournaments/${tournamentId}`);
      // const data = await response.json();
      // setTournament(data);
    } catch (error) {
      console.error("Error fetching tournament details:", error);
      setTournament(mockTournamentData);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setActionLoading(true);

      // Demo simulation
      setTimeout(() => {
        if (tournament) {
          const updatedTournament = { ...tournament };
          updatedTournament.tournament.current_participants += 1;
          updatedTournament.user_participation = {
            id: 999,
            user_id: authState.user?.id || 999,
            username: authState.user?.username || "currentUser",
            full_name: authState.user?.full_name || "Current User",
            level: authState.user?.level || 5,
            registration_time: new Date().toISOString(),
            status: "registered",
            current_round: 0,
            matches_played: 0,
            matches_won: 0,
            matches_lost: 0,
            total_score: 0,
            average_score: 0,
            points: 0,
            prize_won: 0,
            performance_rating: 0,
          };
          updatedTournament.can_register = false;
          updatedTournament.can_withdraw = true;
          updatedTournament.participants.push(
            updatedTournament.user_participation
          );

          setTournament(updatedTournament);
        }
        setActionLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error registering:", error);
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setActionLoading(true);

      setTimeout(() => {
        if (tournament) {
          const updatedTournament = { ...tournament };
          updatedTournament.tournament.current_participants -= 1;
          updatedTournament.user_participation = undefined;
          updatedTournament.can_register = true;
          updatedTournament.can_withdraw = false;
          updatedTournament.participants =
            updatedTournament.participants.filter(
              (p) => p.user_id !== authState.user?.id
            );

          setTournament(updatedTournament);
        }
        setActionLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error withdrawing:", error);
      setActionLoading(false);
    }
  };

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

  if (!tournament) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Tournament not found</Alert>
      </Box>
    );
  }

  const { tournament: tournamentData, participants } = tournament;

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <IconButton onClick={() => navigate("/tournaments")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {tournamentData.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {tournamentData.description}
          </Typography>
        </Box>
        <Chip
          icon={getStatusIcon(tournamentData.status)}
          label={tournamentData.status.replace("_", " ").toUpperCase()}
          color={getStatusColor(tournamentData.status) as any}
          sx={{ ml: 2 }}
        />
      </Box>

      {/* Demo Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          🎮 Demo Mode: This is a demonstration of tournament details and
          registration. Registration actions are simulated.
        </Typography>
      </Alert>

      {/* Tournament Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={4}>
            {/* Left Column - Tournament Info */}
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tournament Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <EmojiEvents sx={{ mr: 1, color: "primary.main" }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Type
                        </Typography>
                        <Typography variant="body1">
                          {tournamentData.tournament_type}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Schedule sx={{ mr: 1, color: "secondary.main" }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Start Time
                        </Typography>
                        <Typography variant="body1">
                          {new Date(tournamentData.start_time).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <LocationOn sx={{ mr: 1, color: "success.main" }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Location
                        </Typography>
                        <Typography variant="body1">
                          {tournamentData.location_name}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <People sx={{ mr: 1, color: "info.main" }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Participants
                        </Typography>
                        <Typography variant="body1">
                          {tournamentData.current_participants} /{" "}
                          {tournamentData.max_participants}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={
                            (tournamentData.current_participants /
                              tournamentData.max_participants) *
                            100
                          }
                          sx={{ mt: 1, height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <AccountBalanceWallet
                        sx={{ mr: 1, color: "warning.main" }}
                      />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Entry Fee
                        </Typography>
                        <Typography variant="body1">
                          {tournamentData.entry_fee_credits} credits
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <TrendingUp sx={{ mr: 1, color: "error.main" }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Level Range
                        </Typography>
                        <Typography variant="body1">
                          {tournamentData.min_level} -{" "}
                          {tournamentData.max_level || "No limit"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {tournament.can_register && (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PersonAdd />}
                    onClick={handleRegister}
                    disabled={actionLoading}
                    sx={{
                      background: "linear-gradient(45deg, #2e7d32, #66bb6a)",
                      "&:hover": {
                        background: "linear-gradient(45deg, #1b5e20, #4caf50)",
                      },
                    }}
                  >
                    {actionLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Join Tournament"
                    )}
                  </Button>
                )}

                {tournament.can_withdraw && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<PersonRemove />}
                    onClick={handleWithdraw}
                    disabled={actionLoading}
                    color="error"
                  >
                    {actionLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Withdraw"
                    )}
                  </Button>
                )}

                {tournamentData.status !== "registration" && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<EmojiEvents />}
                    onClick={() =>
                      navigate(`/tournaments/${tournamentId}/bracket`)
                    }
                  >
                    View Bracket
                  </Button>
                )}

                {authState.user?.id === tournamentData.organizer_id && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<SportsScore />}
                    onClick={() =>
                      navigate(`/tournaments/${tournamentId}/matches`)
                    }
                  >
                    Manage Matches
                  </Button>
                )}
              </Box>
            </Grid>

            {/* Right Column - Additional Info */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Prize Pool */}
                <Card
                  sx={{
                    background: "linear-gradient(135deg, #ffecb3, #fff8e1)",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <EmojiEvents sx={{ mr: 1, color: "warning.main" }} />
                      Prize Pool
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "warning.dark" }}
                    >
                      {tournamentData.prize_pool_credits}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      credits total
                    </Typography>
                  </CardContent>
                </Card>

                {/* Format Info */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tournament Format
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {tournamentData.format}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tournamentData.game_type}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Registration Deadline */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Registration Deadline
                    </Typography>
                    <Typography variant="body1">
                      {new Date(
                        tournamentData.registration_deadline
                      ).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
        >
          <Tab label={`Participants (${participants.length})`} />
          <Tab label="Tournament Rules" />
          <Tab label="Match Schedule" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Grid container spacing={2}>
          {participants.map((participant) => (
            <Grid item xs={12} sm={6} md={4} key={participant.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                      {participant.full_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {participant.full_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{participant.username}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">Level</Typography>
                    <Chip
                      label={participant.level}
                      size="small"
                      color="primary"
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">Rating</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {participant.performance_rating}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Registered:{" "}
                    {new Date(
                      participant.registration_time
                    ).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {currentTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {/* Tournament Rules */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Format & Rules
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Format
                  </Typography>
                  <Typography variant="body1">
                    {tournament.tournament_rules.format}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Entry Fee
                  </Typography>
                  <Typography variant="body1">
                    {tournament.tournament_rules.entry_fee} credits
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Participants
                  </Typography>
                  <Typography variant="body1">
                    {tournament.tournament_rules.min_participants} -{" "}
                    {tournament.tournament_rules.max_participants} players
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Level Requirements
                  </Typography>
                  <Typography variant="body1">
                    Level{" "}
                    {tournament.tournament_rules.level_requirements.min_level}
                    {tournament.tournament_rules.level_requirements.max_level
                      ? ` - ${tournament.tournament_rules.level_requirements.max_level}`
                      : "+"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            {/* Prize Distribution */}
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <EmojiEvents sx={{ mr: 1, color: "warning.main" }} />
                  Prize Distribution
                </Typography>

                {Object.entries(
                  tournament.tournament_rules.prize_distribution
                ).map(([position, amount]) => (
                  <Box
                    key={position}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">{position}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {amount} credits
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {currentTab === 2 && (
        <Box>
          {/* Upcoming Matches */}
          <Typography variant="h6" gutterBottom>
            Upcoming Matches
          </Typography>
          {tournament.upcoming_matches.length > 0 ? (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {tournament.upcoming_matches.map((match) => (
                <Grid item xs={12} md={6} key={match.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Round {match.round}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body1">{match.player1}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          vs
                        </Typography>
                        <Typography variant="body1">{match.player2}</Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {new Date(match.scheduled_time).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ mb: 4 }}>
              No upcoming matches scheduled yet.
            </Alert>
          )}

          {/* Tournament Progress */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tournament Progress
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Current Round</Typography>
                <Typography variant="body2">
                  {tournament.current_round} / {tournament.total_rounds}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={
                  (tournament.current_round / tournament.total_rounds) * 100
                }
                sx={{ my: 2, height: 8, borderRadius: 4 }}
              />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Upcoming Matches</Typography>
                <Typography variant="body2">
                  {tournament.upcoming_matches.length}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Completed Matches</Typography>
                <Typography variant="body2">
                  {tournament.completed_matches.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default TournamentDetailsPage;
