// src/components/tournaments/LiveTournamentFeed.tsx
// LFA Legacy GO - Live Tournament Feed with Real-time Updates

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Switch,
  FormControlLabel,
  Paper,
  Badge,
  Tab,
  Tabs,
  Alert,
  LinearProgress,
  Grid,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  EmojiEvents,
  SportsScore,
  PersonAdd,
  TrendingUp,
  Notifications,
  Refresh,
  FilterList,
  MoreVert,
  PlayArrow,
  Timeline,
  Star,
  Group,
  LocationOn,
} from "@mui/icons-material";
import { useSafeAuth } from "../../contexts/AuthContext";

interface TournamentEvent {
  id: string;
  type:
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "match_start"
    | "match_end"
    | "tournament_start"
    | "player_joined";
  tournamentId: string;
  tournamentName: string;
  matchId?: string;
  playerId?: string;
  playerName?: string;
  teamName?: string;
  minute?: number;
  description: string;
  timestamp: Date;
  priority: "low" | "medium" | "high";
}

interface EventDetails {
  score?: string;
  venue?: string;
  attendance?: number;
}

interface ActiveTournament {
  id: string;
  name: string;
  status: "live" | "upcoming" | "completed";
  participants: number;
  startTime: Date;
  endTime?: Date;
  location: string;
  progress: number;
}

const LiveTournamentFeed: React.FC = () => {
  const { user } = useSafeAuth();
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [activeTournaments, setActiveTournaments] = useState<
    ActiveTournament[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const getEventIcon = (type: TournamentEvent["type"]) => {
    switch (type) {
      case "goal":
        return <SportsScore color="success" />;
      case "yellow_card":
        return <SportsScore color="warning" />;
      case "red_card":
        return <SportsScore color="error" />;
      case "substitution":
        return <PersonAdd color="info" />;
      case "match_start":
        return <PlayArrow color="primary" />;
      case "match_end":
        return <EmojiEvents color="secondary" />;
      case "tournament_start":
        return <EmojiEvents color="primary" />;
      case "player_joined":
        return <Group color="info" />;
      default:
        return <Timeline />;
    }
  };

  const getEventColor = (type: TournamentEvent["type"]) => {
    switch (type) {
      case "goal":
        return "success";
      case "yellow_card":
        return "warning";
      case "red_card":
        return "error";
      case "substitution":
        return "info";
      case "match_start":
        return "primary";
      case "match_end":
        return "secondary";
      case "tournament_start":
        return "primary";
      case "player_joined":
        return "info";
      default:
        return "default";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const generateRandomEvent = (): TournamentEvent => {
    const eventTypes: TournamentEvent["type"][] = [
      "goal",
      "yellow_card",
      "red_card",
      "substitution",
      "match_start",
      "match_end",
      "player_joined",
    ];

    const tournaments = [
      "Premier League Cup",
      "Champions Trophy",
      "Summer League",
      "Elite Tournament",
    ];
    const players = [
      "John Smith",
      "Maria Garcia",
      "David Johnson",
      "Sarah Wilson",
      "Alex Chen",
    ];
    const teams = [
      "Red Eagles",
      "Blue Warriors",
      "Green Lions",
      "Golden Tigers",
    ];

    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const tournament =
      tournaments[Math.floor(Math.random() * tournaments.length)];
    const player = players[Math.floor(Math.random() * players.length)];
    const team = teams[Math.floor(Math.random() * teams.length)];

    let description = "";
    switch (type) {
      case "goal":
        description = `⚽ ${player} scored for ${team}!`;
        break;
      case "yellow_card":
        description = `🟨 ${player} received a yellow card`;
        break;
      case "red_card":
        description = `🟥 ${player} was sent off with a red card`;
        break;
      case "substitution":
        description = `🔄 ${player} was substituted in for ${team}`;
        break;
      case "match_start":
        description = `🏁 Match started: ${team} vs ${teams[Math.floor(Math.random() * teams.length)]}`;
        break;
      case "match_end":
        description = `🏆 Match ended with final score 2-1`;
        break;
      case "player_joined":
        description = `👋 ${player} joined the tournament`;
        break;
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      tournamentId: Math.random().toString(36).substr(2, 9),
      tournamentName: tournament,
      playerId: Math.random().toString(36).substr(2, 9),
      playerName: player,
      teamName: team,
      minute:
        type === "goal" || type === "yellow_card" || type === "red_card"
          ? Math.floor(Math.random() * 90) + 1
          : undefined,
      description,
      timestamp: new Date(),
      priority:
        Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
    };
  };

  const mockTournaments: ActiveTournament[] = [
    {
      id: "1",
      name: "Premier League Cup",
      status: "live",
      participants: 24,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      location: "Wembley Stadium",
      progress: 65,
    },
    {
      id: "2",
      name: "Champions Trophy",
      status: "upcoming",
      participants: 16,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      location: "Emirates Stadium",
      progress: 0,
    },
    {
      id: "3",
      name: "Summer League",
      status: "live",
      participants: 32,
      startTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
      location: "Old Trafford",
      progress: 80,
    },
  ];

  useEffect(() => {
    setActiveTournaments(mockTournaments);

    const initialEvents: TournamentEvent[] = Array.from(
      { length: 10 },
      generateRandomEvent
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setEvents(initialEvents);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (liveUpdates) {
      interval = setInterval(() => {
        if (Math.random() > 0.3) {
          const newEvent = generateRandomEvent();
          setEvents((prev) => [newEvent, ...prev].slice(0, 50));
        }
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [liveUpdates]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      const newEvents = Array.from({ length: 5 }, generateRandomEvent);
      setEvents((prev) => [...newEvents, ...prev].slice(0, 50));
      setLoading(false);
    }, 1000);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const filteredEvents = events.filter((event) => {
    if (selectedTab === 0) return true;
    if (selectedTab === 1) return event.priority === "high";
    if (selectedTab === 2) return event.type === "goal";
    if (selectedTab === 3)
      return event.type === "match_start" || event.type === "match_end";
    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Timeline color="primary" />
          Live Tournament Feed
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <FormControlLabel
            control={
              <Switch
                checked={liveUpdates}
                onChange={(e) => setLiveUpdates(e.target.checked)}
                color="primary"
              />
            }
            label="Live Updates"
          />
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
          <IconButton onClick={handleMenuClick}>
            <FilterList />
          </IconButton>
          <IconButton>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {liveUpdates && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Badge color="success" variant="dot">
              <Notifications />
            </Badge>
            Live updates are enabled. New events will appear automatically.
          </Box>
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0 }}>
            <Tabs
              value={selectedTab}
              onChange={(_, newValue) => setSelectedTab(newValue)}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab label="All Events" />
              <Tab label="Priority" />
              <Tab label="Goals" />
              <Tab label="Matches" />
            </Tabs>

            <List sx={{ maxHeight: "70vh", overflow: "auto" }}>
              {filteredEvents.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{ bgcolor: `${getEventColor(event.type)}.main` }}
                      >
                        {getEventIcon(event.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body1">
                            {event.description}
                          </Typography>
                          <Chip
                            size="small"
                            label={event.tournamentName}
                            color={getEventColor(event.type) as any}
                            variant="outlined"
                          />
                          {event.priority === "high" && (
                            <Star color="warning" fontSize="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mt: 0.5,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(event.timestamp)}
                          </Typography>
                          {event.minute && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {event.minute}'
                            </Typography>
                          )}
                          {event.teamName && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {event.teamName}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < filteredEvents.length - 1 && <Divider />}
                </React.Fragment>
              ))}

              {filteredEvents.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No events found"
                    secondary="Try adjusting your filters or check back later"
                    sx={{ textAlign: "center" }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <EmojiEvents color="primary" />
              Active Tournaments
            </Typography>

            {activeTournaments.map((tournament) => (
              <Card key={tournament.id} sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "between",
                      alignItems: "flex-start",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {tournament.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={tournament.status}
                      color={
                        tournament.status === "live"
                          ? "success"
                          : tournament.status === "upcoming"
                            ? "info"
                            : "default"
                      }
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {tournament.location}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Group fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {tournament.participants} participants
                    </Typography>
                  </Box>

                  {tournament.status === "live" && (
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="caption">Progress</Typography>
                        <Typography variant="caption">
                          {tournament.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={tournament.progress}
                      />
                    </Box>
                  )}

                  {tournament.status === "upcoming" && (
                    <Typography variant="caption" color="text.secondary">
                      Starts {formatTimeAgo(tournament.startTime)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}

            <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
              View All Tournaments
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>All Events</MenuItem>
        <MenuItem onClick={handleMenuClose}>High Priority Only</MenuItem>
        <MenuItem onClick={handleMenuClose}>Goals Only</MenuItem>
        <MenuItem onClick={handleMenuClose}>Match Events</MenuItem>
      </Menu>
    </Box>
  );
};

export default LiveTournamentFeed;
