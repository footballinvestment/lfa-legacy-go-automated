import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Skeleton,
} from "@mui/material";
import {
  ArrowBack,
  Refresh,
  EmojiEvents,
  People,
  Schedule,
  LocationOn,
  AccountTree,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { tournamentService, Tournament } from "../services/api";
import RegistrationPanel from "../components/tournaments/RegistrationPanel";
import ParticipantsList from "../components/tournaments/ParticipantsList";
import TournamentBracket from "../components/tournaments/TournamentBracket";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface TournamentDetailsData {
  tournament: Tournament;
  participants: any[];
  bracket?: any;
  current_round: number;
  total_rounds: number;
  user_participation?: any;
  can_register: boolean;
  can_withdraw: boolean;
  upcoming_matches: any[];
  completed_matches: any[];
  tournament_rules: any;
}

const TournamentDetails: React.FC = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournamentDetails, setTournamentDetails] =
    useState<TournamentDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const loadTournamentDetails = async () => {
    if (!tournamentId) return;

    setLoading(true);
    setError(null);
    try {
      const details = await tournamentService.getTournament(
        parseInt(tournamentId)
      );
      setTournamentDetails(details);
    } catch (err: any) {
      setError(err.message || "Failed to load tournament details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournamentDetails();
  }, [tournamentId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registration":
        return "success";
      case "in_progress":
        return "warning";
      case "completed":
        return "primary";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "registration":
        return "Registration Open";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  if (loading && !tournamentDetails) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header Skeleton */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <IconButton onClick={() => navigate("/tournaments")} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Skeleton variant="text" width={300} height={48} />
        </Box>

        {/* Content Skeleton */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
            <Skeleton variant="rectangular" height={300} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <IconButton onClick={() => navigate("/tournaments")} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Tournament Details
          </Typography>
        </Box>
        <Alert
          severity="error"
          action={
            <IconButton onClick={loadTournamentDetails}>
              <Refresh />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!tournamentDetails) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <IconButton onClick={() => navigate("/tournaments")} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Tournament Not Found
          </Typography>
        </Box>
        <Alert severity="info">Tournament details could not be loaded.</Alert>
      </Box>
    );
  }

  const { tournament } = tournamentDetails;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <IconButton onClick={() => navigate("/tournaments")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            {tournament.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={getStatusText(tournament.status)}
              color={getStatusColor(tournament.status)}
              icon={<EmojiEvents />}
            />
            <Chip
              label={`${tournament.current_participants}/${tournament.max_participants} players`}
              color={tournament.is_full ? "error" : "primary"}
              variant="outlined"
              icon={<People />}
            />
          </Box>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={loadTournamentDetails} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Tournament Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h6" gutterBottom>
                Tournament Information
              </Typography>
              <Typography variant="body1" paragraph>
                {tournament.description}
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Schedule sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      Start:{" "}
                      {format(
                        new Date(tournament.start_time),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Schedule sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      End:{" "}
                      {format(
                        new Date(tournament.end_time),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {tournament.location_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <EmojiEvents sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      Entry: {tournament.entry_fee_credits} credits
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <RegistrationPanel
                tournament={tournament}
                canRegister={tournamentDetails.can_register}
                canWithdraw={tournamentDetails.can_withdraw}
                userParticipation={tournamentDetails.user_participation}
                onRegistrationChange={loadTournamentDetails}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab
            label={`Participants (${tournament.current_participants})`}
            icon={<People />}
            iconPosition="start"
          />
          {tournament.status === "in_progress" && (
            <Tab label="Bracket" icon={<AccountTree />} iconPosition="start" />
          )}
          <Tab
            label="Rules & Format"
            icon={<Schedule />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <ParticipantsList
          participants={tournamentDetails.participants}
          tournamentId={parseInt(tournamentId || "0")}
        />
      </TabPanel>

      {tournament.status === "in_progress" && (
        <TabPanel value={activeTab} index={1}>
          <TournamentBracket
            tournamentId={parseInt(tournamentId || "0")}
            bracket={tournamentDetails.bracket}
            currentRound={tournamentDetails.current_round}
            totalRounds={tournamentDetails.total_rounds}
          />
        </TabPanel>
      )}

      <TabPanel
        value={activeTab}
        index={tournament.status === "in_progress" ? 2 : 1}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tournament Rules & Format
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Format Details
                </Typography>
                <Typography variant="body2" paragraph>
                  Type: {tournament.tournament_type}
                </Typography>
                <Typography variant="body2" paragraph>
                  Game: {tournament.game_type}
                </Typography>
                <Typography variant="body2" paragraph>
                  Format: {tournament.format}
                </Typography>
                <Typography variant="body2" paragraph>
                  Level Range: {tournament.min_level} -{" "}
                  {tournament.max_level || "No limit"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Prize Information
                </Typography>
                <Typography variant="body2" paragraph>
                  Prize Pool: {tournament.prize_pool_credits} credits
                </Typography>
                <Typography variant="body2" paragraph>
                  Registration Deadline:{" "}
                  {format(
                    new Date(tournament.registration_deadline),
                    "MMM dd, yyyy HH:mm"
                  )}
                </Typography>
                <Typography variant="body2" paragraph>
                  Organizer: {tournament.organizer_username}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default TournamentDetails;
