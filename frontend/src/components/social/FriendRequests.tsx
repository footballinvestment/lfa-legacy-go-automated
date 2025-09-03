import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Check,
  Close,
  Refresh,
  PersonAdd,
  Schedule,
  Send,
} from "@mui/icons-material";
import { format, formatDistanceToNow } from "date-fns";
import { socialService, FriendRequest } from "../../services/api";

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

const FriendRequests: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadFriendRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Loading both incoming and sent requests...');
      
      // Load both types
      const [incoming, sent] = await Promise.all([
        socialService.getFriendRequests(),      // Incoming
        socialService.getSentFriendRequests()   // Sent - NEW!
      ]);
      
      console.log('📊 Incoming requests:', incoming);
      console.log('📊 Sent requests:', sent);
      
      setIncomingRequests(incoming);
      setSentRequests(sent);
      
    } catch (err: any) {
      console.error('❌ Failed to load friend requests:', err);
      setError(err.message || "Failed to load friend requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriendRequests();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAcceptRequest = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await socialService.respondToFriendRequest(requestId, true);
      await loadFriendRequests();
    } catch (err: any) {
      setError(err.message || "Failed to accept friend request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await socialService.respondToFriendRequest(requestId, false);
      await loadFriendRequests();
    } catch (err: any) {
      setError(err.message || "Failed to decline friend request");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "success";
      case "declined":
        return "error";
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
      default:
        return "Pending";
    }
  };

  // No need to filter - we have separate state for each type
  const completedRequests: FriendRequest[] = []; // TODO: Implement history

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">Friend Requests</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadFriendRequests} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Request Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab
            label={`Incoming (${incomingRequests.length})`}
            icon={<PersonAdd />}
            iconPosition="start"
          />
          <Tab
            label={`Sent (${sentRequests.length})`}
            icon={<Send />}
            iconPosition="start"
          />
          <Tab
            label={`History (${completedRequests.length})`}
            icon={<Schedule />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Incoming Requests */}
      <TabPanel value={activeTab} index={0}>
        {incomingRequests.length > 0 ? (
          <Grid container spacing={2}>
            {incomingRequests.map((request) => (
              <Grid key={request.id} size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: "primary.main",
                          mr: 2,
                          width: 48,
                          height: 48,
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                        }}
                      >
                        {request.from_user.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {request.from_user.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{request.from_user.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Level {request.from_user.level}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Sent{" "}
                        {formatDistanceToNow(new Date(request.created_at), {
                          addSuffix: true,
                        })}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<Check />}
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={actionLoading === request.id}
                        sx={{ flex: 1 }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Close />}
                        onClick={() => handleDeclineRequest(request.id)}
                        disabled={actionLoading === request.id}
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
            <PersonAdd sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No incoming requests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Friend requests will appear here when players want to connect with
              you
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Sent Requests */}
      <TabPanel value={activeTab} index={1}>
        {sentRequests.length > 0 ? (
          <Grid container spacing={2}>
            {sentRequests.map((request) => (
              <Grid key={request.id} size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: "secondary.main",
                          mr: 2,
                          width: 48,
                          height: 48,
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                        }}
                      >
                        {request.to_user.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {request.to_user.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{request.to_user.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Level {request.to_user.level}
                        </Typography>
                      </Box>
                      <Chip label="Pending" color="warning" size="small" />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Sent{" "}
                        {formatDistanceToNow(new Date(request.created_at), {
                          addSuffix: true,
                        })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Waiting for response...
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Send sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No sent requests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Friend requests you send will appear here
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Request History */}
      <TabPanel value={activeTab} index={2}>
        {completedRequests.length > 0 ? (
          <Grid container spacing={2}>
            {completedRequests.map((request) => (
              <Grid key={request.id} size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: "grey.500",
                          mr: 2,
                          width: 48,
                          height: 48,
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                        }}
                      >
                        {(
                          request.from_user?.username ||
                          request.to_user?.username ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {request.from_user?.full_name ||
                            request.to_user?.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @
                          {request.from_user?.username ||
                            request.to_user?.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(request.created_at), "MMM dd, yyyy")}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusText(request.status)}
                        color={getStatusColor(request.status)}
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
            <Schedule sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No request history
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your completed friend requests will appear here
            </Typography>
          </Box>
        )}
      </TabPanel>
    </Box>
  );
};

export default FriendRequests;
