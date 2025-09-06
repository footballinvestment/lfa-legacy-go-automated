import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Chip,
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
  LinearProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  EmojiEvents,
  AccessTime,
  LocationOn,
  Add,
  Check,
  Close,
  Refresh,
  SportsSoccer,
} from "@mui/icons-material";
import { format, formatDistanceToNow } from "date-fns";
import {
  socialService,
  locationService,
  Challenge,
  Location,
} from "../../services/api";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const ChallengeSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    challenged_user_id: "",
    game_type: "football",
    location_id: "",
  });

  const loadChallenges = async () => {
    setLoading(true);
    setError(null);
    try {
      const challengeData = await socialService.getChallenges();
      setChallenges(challengeData);
    } catch (err: any) {
      setError(err.message || "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const locationData = await locationService.getLocations();
      setLocations(locationData);
    } catch (err: any) {
      console.error("Failed to load locations:", err);
    }
  };

  useEffect(() => {
    loadChallenges();
    loadLocations();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAcceptChallenge = async (challengeId: number) => {
    try {
      await socialService.respondToChallenge(challengeId, true);
      await loadChallenges();
    } catch (err: any) {
      setError(err.message || "Failed to accept challenge");
    }
  };

  const handleDeclineChallenge = async (challengeId: number) => {
    try {
      await socialService.respondToChallenge(challengeId, false);
      await loadChallenges();
    } catch (err: any) {
      setError(err.message || "Failed to decline challenge");
    }
  };

  const handleCreateChallenge = async () => {
    try {
      await socialService.sendChallenge(
        parseInt(newChallenge.challenged_user_id),
        newChallenge.game_type,
        newChallenge.location_id
          ? parseInt(newChallenge.location_id)
          : undefined
      );
      setCreateDialogOpen(false);
      setNewChallenge({
        challenged_user_id: "",
        game_type: "football",
        location_id: "",
      });
      await loadChallenges();
    } catch (err: any) {
      setError(err.message || "Failed to create challenge");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "success";
      case "declined":
        return "error";
      case "expired":
        return "default";
      default:
        return "warning";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Accepted";
      case "declined":
        return "Declined";
      case "expired":
        return "Expired";
      default:
        return "Pending";
    }
  };

  const incomingChallenges = challenges.filter(
    (c) => c.status === "pending" && c.challenged_id
  );
  const sentChallenges = challenges.filter((c) => c.challenger_id);
  const completedChallenges = challenges.filter((c) =>
    ["accepted", "declined", "expired"].includes(c.status)
  );

  return (
    <Box>
      {/* Header with Create Button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">Game Challenges</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadChallenges} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            New Challenge
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Challenge Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab
            label={`Incoming (${incomingChallenges.length})`}
            icon={<EmojiEvents />}
            iconPosition="start"
          />
          <Tab
            label={`Sent (${sentChallenges.length})`}
            icon={<SportsSoccer />}
            iconPosition="start"
          />
          <Tab
            label={`History (${completedChallenges.length})`}
            icon={<AccessTime />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Incoming Challenges */}
      <TabPanel value={activeTab} index={0}>
        {incomingChallenges.length > 0 ? (
          <Grid container spacing={2}>
            {incomingChallenges.map((challenge) => (
              <Grid key={challenge.id} size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                        {challenge.challenger.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {challenge.challenger.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{challenge.challenger.username} • Level{" "}
                          {challenge.challenger.level}
                        </Typography>
                      </Box>
                      <Chip
                        label={challenge.game_type}
                        color="primary"
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <AccessTime
                          sx={{ mr: 1, fontSize: 16, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {formatDistanceToNow(new Date(challenge.created_at), {
                            addSuffix: true,
                          })}
                        </Typography>
                      </Box>

                      {challenge.location_id && (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <LocationOn
                            sx={{
                              mr: 1,
                              fontSize: 16,
                              color: "text.secondary",
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Location specified
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<Check />}
                        onClick={() => handleAcceptChallenge(challenge.id)}
                        sx={{ flex: 1 }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Close />}
                        onClick={() => handleDeclineChallenge(challenge.id)}
                        sx={{ flex: 1 }}
                      >
                        Decline
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <EmojiEvents
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              No incoming challenges
            </Typography>
            <Typography variant="body2" color="text.secondary">
              When players challenge you, they'll appear here
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Sent Challenges */}
      <TabPanel value={activeTab} index={1}>
        {sentChallenges.length > 0 ? (
          <Grid container spacing={2}>
            {sentChallenges.map((challenge) => (
              <Grid key={challenge.id} size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ bgcolor: "secondary.main", mr: 2 }}>
                        {challenge.challenged.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {challenge.challenged.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{challenge.challenged.username} • Level{" "}
                          {challenge.challenged.level}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusText(challenge.status)}
                        color={getStatusColor(challenge.status)}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Game: {challenge.game_type}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sent{" "}
                        {formatDistanceToNow(new Date(challenge.created_at), {
                          addSuffix: true,
                        })}
                      </Typography>
                      {challenge.expires_at && (
                        <Typography variant="body2" color="warning.main">
                          Expires{" "}
                          {format(
                            new Date(challenge.expires_at),
                            "MMM dd, HH:mm"
                          )}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <SportsSoccer
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              No sent challenges
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Challenge your friends to start competing!
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Challenge History */}
      <TabPanel value={activeTab} index={2}>
        {completedChallenges.length > 0 ? (
          <Grid container spacing={2}>
            {completedChallenges.map((challenge) => (
              <Grid key={challenge.id} size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ bgcolor: "grey.500", mr: 2 }}>
                        {(
                          challenge.challenger?.username ||
                          challenge.challenged?.username ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          vs{" "}
                          {challenge.challenger?.full_name ||
                            challenge.challenged?.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {challenge.game_type} •{" "}
                          {format(
                            new Date(challenge.created_at),
                            "MMM dd, yyyy"
                          )}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusText(challenge.status)}
                        color={getStatusColor(challenge.status)}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <AccessTime sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No challenge history
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your completed challenges will appear here
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Create Challenge Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Challenge</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Player ID"
              type="number"
              value={newChallenge.challenged_user_id}
              onChange={(e) =>
                setNewChallenge((prev) => ({
                  ...prev,
                  challenged_user_id: e.target.value,
                }))
              }
              helperText="Enter the ID of the player you want to challenge"
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Game Type</InputLabel>
              <Select
                value={newChallenge.game_type}
                onChange={(e) =>
                  setNewChallenge((prev) => ({
                    ...prev,
                    game_type: e.target.value,
                  }))
                }
                label="Game Type"
              >
                <MenuItem value="football">Football</MenuItem>
                <MenuItem value="basketball">Basketball</MenuItem>
                <MenuItem value="tennis">Tennis</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Location (Optional)</InputLabel>
              <Select
                value={newChallenge.location_id}
                onChange={(e) =>
                  setNewChallenge((prev) => ({
                    ...prev,
                    location_id: e.target.value,
                  }))
                }
                label="Location (Optional)"
              >
                <MenuItem value="">No specific location</MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateChallenge}
            variant="contained"
            disabled={!newChallenge.challenged_user_id}
          >
            Send Challenge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChallengeSystem;
