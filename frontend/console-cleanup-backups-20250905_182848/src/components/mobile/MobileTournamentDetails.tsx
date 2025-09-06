import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  AppBar,
  Toolbar,
  Paper,
  Grid,
  LinearProgress,
  Fab,
  Collapse,
  Alert,
  Skeleton,
  useTheme,
} from "@mui/material";
import {
  ArrowBack,
  Share,
  QrCode,
  LocationOn,
  Schedule,
  People,
  Star,
  EmojiEvents,
  SportsSoccer,
  Person,
  Flag,
  Timer,
  TrendingUp,
  Info,
  Rule,
  Payment,
  Notifications,
  Favorite,
  FavoriteBorder,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Cancel,
  Warning,
  Add,
} from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";
import {
  Tournament,
  TournamentParticipant,
  Match,
  TournamentStats,
} from "../../types/tournament";
import { useSafeAuth } from "../../SafeAuthContext";
import ErrorBoundary from "../common/ErrorBoundary";

// SwipeableViews component for tab switching - can be replaced with a simple Box if library not available
const SwipeableViews: React.FC<{
  index: number;
  onChangeIndex: (index: number) => void;
  children: React.ReactNode[];
}> = ({ index, onChangeIndex, children }) => {
  return <Box>{children[index]}</Box>;
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface MobileTournamentDetailsProps {
  tournamentId: number;
  open: boolean;
  onClose: () => void;
  onJoin?: (tournament: Tournament) => void;
}

const MobileTournamentDetails: React.FC<MobileTournamentDetailsProps> = ({
  tournamentId,
  open,
  onClose,
  onJoin,
}) => {
  const theme = useTheme();
  const { user } = useSafeAuth();
  const isAuthenticated = user !== null;

  // State management
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Mock data - replace with API calls
  const mockParticipants: TournamentParticipant[] = [
    {
      id: 1,
      tournamentId,
      userId: 1,
      userName: "Alex Rodriguez",
      userEmail: "alex@example.com",
      registrationDate: new Date().toISOString(),
      status: "confirmed",
      seedNumber: 1,
    },
    {
      id: 2,
      tournamentId,
      userId: 2,
      userName: "Maria Santos",
      userEmail: "maria@example.com",
      registrationDate: new Date().toISOString(),
      status: "confirmed",
      seedNumber: 2,
    },
    {
      id: 3,
      tournamentId,
      userId: 3,
      userName: "James Chen",
      userEmail: "james@example.com",
      registrationDate: new Date().toISOString(),
      status: "registered",
    },
  ];

  const mockMatches: Match[] = [
    {
      id: 1,
      tournamentId,
      roundNumber: 1,
      matchNumber: 1,
      participant1Id: 1,
      participant2Id: 2,
      participant1Name: "Alex Rodriguez",
      participant2Name: "Maria Santos",
      status: "pending",
      scheduledTime: new Date(Date.now() + 3600000).toISOString(),
      location: "Field A",
    },
  ];

  const mockStats: TournamentStats = {
    tournamentId,
    totalMatches: 8,
    completedMatches: 3,
    averageMatchDuration: 45,
    totalGoals: 12,
    topScorer: {
      participantId: 1,
      participantName: "Alex Rodriguez",
      goals: 4,
    },
  };

  const mockTournament: Tournament = {
    id: tournamentId,
    name: "Friday Night Football Championship",
    description:
      "Weekly competitive tournament for serious players. This is a high-energy event that brings together the best local talent for an exciting evening of football competition.",
    location: "Central Park Sports Complex, NYC",
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 172800000).toISOString(),
    maxParticipants: 16,
    currentParticipants: 12,
    entryFee: 25,
    prizePool: 300,
    status: "upcoming",
    organizerId: 1,
    organizerName: "NYC Football League",
    rules:
      "1. All FIFA rules apply\n2. No slide tackles in penalty area\n3. 7v7 format\n4. 30-minute halves\n5. 3-point system for wins\n6. Yellow cards carry over between matches\n7. Red card = suspension from next match\n8. Equipment must be approved by referee",
    format: "Single elimination with consolation bracket",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    skillLevel: "intermediate",
    ageRestriction: { min: 18, max: 35 },
    registrationDeadline: new Date(Date.now() + 43200000).toISOString(),
    tags: ["competitive", "weekly", "nyc", "7v7"],
  };

  // Load tournament data
  const loadTournamentData = useCallback(async () => {
    if (!open) return;

    setLoading(true);
    try {
      // Simulate API calls
      await new Promise((resolve) => setTimeout(resolve, 800));

      setTournament(mockTournament);
      setParticipants(mockParticipants);
      setMatches(mockMatches);
      setStats(mockStats);
    } catch (error) {
      console.error("Failed to load tournament data:", error);
    } finally {
      setLoading(false);
    }
  }, [open, tournamentId]);

  // Handle share tournament
  const handleShare = async () => {
    if (!tournament) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: tournament?.name || "Tournament",
          text: `Check out this tournament: ${tournament?.description || ""}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      setShareDialogOpen(true);
    }
  };

  // Handle watchlist toggle
  const handleWatchlistToggle = () => {
    setIsWatchlisted(!isWatchlisted);
  };

  // Handle join tournament
  const handleJoinTournament = () => {
    if (!tournament) return;
    setJoinDialogOpen(true);
  };

  // Confirm join
  const confirmJoin = () => {
    if (!tournament || !onJoin) return;
    onJoin(tournament);
    setJoinDialogOpen(false);
  };

  // Tab change handler
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Load data when dialog opens
  useEffect(() => {
    loadTournamentData();
  }, [loadTournamentData]);

  if (!tournament && !loading) {
    return null;
  }

  // Render tournament info tab
  const renderInfoTab = () => (
    <Container maxWidth="sm" sx={{ px: 2, py: 3 }}>
      {loading ? (
        <Box>
          <Skeleton variant="text" width="80%" height={32} />
          <Skeleton
            variant="rectangular"
            height={200}
            sx={{ my: 2, borderRadius: 2 }}
          />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="60%" />
        </Box>
      ) : (
        <Box>
          {/* Tournament Image Placeholder */}
          <Paper
            sx={{
              height: 200,
              bgcolor: "primary.main",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <SportsSoccer sx={{ fontSize: 64, opacity: 0.7 }} />
          </Paper>

          {/* Tournament Description */}
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.6 }}>
            {tournament?.description}
          </Typography>

          {/* Tournament Details Grid */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                <People color="primary" sx={{ mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {tournament?.currentParticipants}/
                  {tournament?.maxParticipants}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Players
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                <EmojiEvents color="primary" sx={{ mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ${tournament?.prizePool || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Prize Pool
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Key Information */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Tournament Details
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Schedule color="action" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Start Date
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(
                        tournament?.startDate || ""
                      ).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(tournament?.startDate || "").toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <LocationOn color="action" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Location
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tournament?.location}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Payment color="action" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Entry Fee
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${tournament?.entryFee || 0}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                  <Info color="action" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Format
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tournament?.format}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {tournament?.tags && tournament.tags.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    Tags
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {tournament?.tags?.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Rules Section */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => setRulesExpanded(!rulesExpanded)}
                sx={{ cursor: "pointer" }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Rule color="action" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Tournament Rules
                  </Typography>
                </Box>
                {rulesExpanded ? <ExpandLess /> : <ExpandMore />}
              </Box>

              <Collapse in={rulesExpanded}>
                <Box mt={2}>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-line",
                      lineHeight: 1.6,
                    }}
                  >
                    {tournament?.rules}
                  </Typography>
                </Box>
              </Collapse>
            </CardContent>
          </Card>

          {/* Age & Skill Restrictions */}
          {(tournament?.ageRestriction || tournament?.skillLevel) && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Requirements:
              </Typography>
              {tournament?.ageRestriction && (
                <Typography variant="body2">
                  • Age: {tournament.ageRestriction.min}-
                  {tournament.ageRestriction.max} years
                </Typography>
              )}
              {tournament?.skillLevel && (
                <Typography variant="body2">
                  • Skill Level: {tournament.skillLevel}
                </Typography>
              )}
            </Alert>
          )}

          {/* Registration Deadline */}
          {tournament?.registrationDeadline && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Registration closes on{" "}
              {new Date(tournament.registrationDeadline).toLocaleDateString()}{" "}
              at{" "}
              {new Date(tournament.registrationDeadline).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </Alert>
          )}
        </Box>
      )}
    </Container>
  );

  // Render participants tab
  const renderParticipantsTab = () => (
    <Container maxWidth="sm" sx={{ px: 2, py: 3 }}>
      {loading ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <Box key={i} display="flex" alignItems="center" gap={2} mb={2}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box flex={1}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </Box>
              <Skeleton variant="rectangular" width={60} height={24} />
            </Box>
          ))}
        </Box>
      ) : (
        <List>
          {participants.map((participant, index) => (
            <React.Fragment key={participant.id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>{participant.userName.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={participant.userName}
                  secondary={
                    <>
                      Joined{" "}
                      {new Date(
                        participant.registrationDate
                      ).toLocaleDateString()}
                      {participant.seedNumber &&
                        ` • Seed #${participant.seedNumber}`}
                    </>
                  }
                />
                <Chip
                  label={participant.status}
                  size="small"
                  color={
                    participant.status === "confirmed" ? "success" : "default"
                  }
                  variant="outlined"
                />
              </ListItem>
              {index < participants.length - 1 && <Divider />}
            </React.Fragment>
          ))}

          {/* Empty slots */}
          {tournament &&
            tournament.currentParticipants < tournament.maxParticipants && (
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "grey.200" }}>
                    <Person color="disabled" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Open Slot"
                  secondary={`${tournament.maxParticipants - tournament.currentParticipants} spots remaining`}
                />
              </ListItem>
            )}
        </List>
      )}
    </Container>
  );

  // Render matches tab
  const renderMatchesTab = () => (
    <Container maxWidth="sm" sx={{ px: 2, py: 3 }}>
      {loading ? (
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
      ) : matches.length > 0 ? (
        <List>
          {matches.map((match) => (
            <Card key={match.id} sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Round {match.roundNumber}, Match {match.matchNumber}
                </Typography>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="body2">
                    {match.participant1Name || "TBD"}
                  </Typography>
                  <Typography variant="h6">vs</Typography>
                  <Typography variant="body2">
                    {match.participant2Name || "TBD"}
                  </Typography>
                </Box>

                {match.scheduledTime && (
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Schedule fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(match.scheduledTime).toLocaleDateString()} at{" "}
                      {new Date(match.scheduledTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Box>
                )}

                {match.location && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {match.location}
                    </Typography>
                  </Box>
                )}

                <Chip
                  label={match.status.replace("_", " ").toUpperCase()}
                  size="small"
                  color={match.status === "completed" ? "success" : "default"}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          ))}
        </List>
      ) : (
        <Box textAlign="center" py={4}>
          <SportsSoccer sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Match schedule will be available after registration closes
          </Typography>
        </Box>
      )}
    </Container>
  );

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <ErrorBoundary>
        <AppBar
          position="sticky"
          sx={{ bgcolor: "background.paper", color: "text.primary" }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onClose}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>

            <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
              {loading ? "Loading..." : tournament?.name}
            </Typography>

            <IconButton
              color="inherit"
              onClick={handleWatchlistToggle}
              sx={{ mr: 1 }}
            >
              {isWatchlisted ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>

            <IconButton
              color="inherit"
              onClick={() => setQrDialogOpen(true)}
              sx={{ mr: 1 }}
            >
              <QrCode />
            </IconButton>

            <IconButton color="inherit" onClick={handleShare}>
              <Share />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ pb: 10 }}>
          {!loading && tournament && (
            <>
              {/* Tournament Status Banner */}
              <Paper
                sx={{
                  mx: 2,
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor:
                    tournament.status === "upcoming"
                      ? "primary.main"
                      : tournament.status === "active"
                        ? "success.main"
                        : "grey.500",
                  color: "white",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, textAlign: "center" }}
                >
                  {tournament.status.toUpperCase()} TOURNAMENT
                </Typography>
              </Paper>

              {/* Tab Navigation */}
              <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="fullWidth"
                >
                  <Tab label="Info" />
                  <Tab label="Players" />
                  <Tab label="Matches" />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <SwipeableViews index={activeTab} onChangeIndex={setActiveTab}>
                {renderInfoTab()}
                {renderParticipantsTab()}
                {renderMatchesTab()}
              </SwipeableViews>
            </>
          )}

          {loading && (
            <Container maxWidth="sm" sx={{ px: 2, py: 3 }}>
              <LinearProgress sx={{ mb: 3 }} />
              <Skeleton
                variant="rectangular"
                height={200}
                sx={{ mb: 2, borderRadius: 2 }}
              />
              <Skeleton variant="text" width="80%" height={32} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="60%" />
            </Container>
          )}
        </Box>

        {/* Join Tournament FAB */}
        {!loading &&
          tournament &&
          tournament.status === "upcoming" &&
          tournament.currentParticipants < tournament.maxParticipants &&
          isAuthenticated && (
            <Fab
              color="primary"
              variant="extended"
              onClick={handleJoinTournament}
              sx={{
                position: "fixed",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000,
              }}
            >
              <Add sx={{ mr: 1 }} />
              Join Tournament
            </Fab>
          )}

        {/* Join Confirmation Dialog */}
        <Dialog
          open={joinDialogOpen}
          onClose={() => setJoinDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Join Tournament</DialogTitle>
          <DialogContent>
            {tournament && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Are you sure you want to join{" "}
                  <strong>{tournament.name}</strong>?
                </Typography>
                <Box mt={2}>
                  <Alert severity="info">
                    Entry fee of <strong>${tournament.entryFee}</strong> will be
                    charged upon confirmation.
                  </Alert>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setJoinDialogOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button onClick={confirmJoin} variant="contained">
              Confirm & Pay
            </Button>
          </DialogActions>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog
          open={qrDialogOpen}
          onClose={() => setQrDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Tournament QR Code</DialogTitle>
          <DialogContent>
            <Box textAlign="center" py={2}>
              <Paper
                sx={{
                  width: 200,
                  height: 200,
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "grey.100",
                }}
              >
                <QrCode sx={{ fontSize: 120, color: "grey.600" }} />
              </Paper>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Share this QR code for others to quickly join the tournament
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </ErrorBoundary>
    </Dialog>
  );
};

export default MobileTournamentDetails;
