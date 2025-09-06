import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Pagination,
  CircularProgress,
  TextField,
  InputAdornment,
  Grid,
  Divider,
} from "@mui/material";
import {
  Timeline,
  Login,
  Logout,
  Person,
  EmojiEvents,
  Security,
  Edit,
  Warning,
  Search,
  Schedule,
} from "@mui/icons-material";
import { AdminUser, ModerationLog } from "../../../types/moderation";
import { moderationApi } from "../../../services/moderationApi";

interface HistoryTabProps {
  user: AdminUser;
}

interface ActivityItem {
  id: string;
  type:
    | "login"
    | "logout"
    | "profile_update"
    | "tournament_join"
    | "violation_added"
    | "status_change"
    | "role_change";
  description: string;
  timestamp: string;
  details?: Record<string, any>;
  actor?: {
    id: number;
    name: string;
  };
}

const HistoryTab: React.FC<HistoryTabProps> = ({ user }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const itemsPerPage = 10;

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Load moderation logs
      const { logs } = await moderationApi.getModerationLogs({
        target_user_id: user.id,
        page,
        limit: itemsPerPage,
      });

      setModerationLogs(logs);

      // Generate mock activity data (in real app, this would come from API)
      const mockActivities: ActivityItem[] = [
        {
          id: "1",
          type: "login",
          description: "User logged in from web browser",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          details: { ip_address: "192.168.1.100", user_agent: "Chrome/91.0" },
        },
        {
          id: "2",
          type: "tournament_join",
          description: 'Joined tournament "Friday Night Championship"',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          details: {
            tournament_id: 42,
            tournament_name: "Friday Night Championship",
          },
        },
        {
          id: "3",
          type: "profile_update",
          description: "Updated profile information",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          details: { fields_updated: ["bio", "location"] },
        },
        {
          id: "4",
          type: "login",
          description: "User logged in from mobile app",
          timestamp: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          details: {
            ip_address: "192.168.1.105",
            user_agent: "Mobile App v1.2",
          },
        },
        {
          id: "5",
          type: "status_change",
          description: "Account status changed from pending to active",
          timestamp: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          actor: { id: 1, name: "System Admin" },
          details: { old_status: "pending", new_status: "active" },
        },
      ];

      // Add moderation logs to activities
      const moderationActivities: ActivityItem[] = logs.map((log) => ({
        id: `mod-${log.id}`,
        type: "status_change",
        description: `${log.action} performed by admin`,
        timestamp: log.created_at,
        actor: { id: log.actor_id, name: "Admin User" },
        details: log.details,
      }));

      const allActivities = [...mockActivities, ...moderationActivities]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .filter(
          (activity) =>
            searchTerm === "" ||
            activity.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        );

      setActivities(allActivities);
      setTotalPages(Math.ceil(allActivities.length / itemsPerPage));
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user.id, page, searchTerm]);

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "login":
        return <Login color="success" />;
      case "logout":
        return <Logout color="warning" />;
      case "profile_update":
        return <Edit color="info" />;
      case "tournament_join":
        return <EmojiEvents color="primary" />;
      case "violation_added":
        return <Warning color="error" />;
      case "status_change":
      case "role_change":
        return <Security color="secondary" />;
      default:
        return <Timeline />;
    }
  };

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "login":
        return "success";
      case "logout":
        return "warning";
      case "profile_update":
        return "info";
      case "tournament_join":
        return "primary";
      case "violation_added":
        return "error";
      case "status_change":
      case "role_change":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return time.toLocaleDateString();
  };

  const paginatedActivities = activities.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Activity History
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h4" color="primary">
                {activities.filter((a) => a.type === "login").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Logins
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h4" color="secondary">
                {activities.filter((a) => a.type === "tournament_join").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tournament Joins
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h4" color="info.main">
                {activities.filter((a) => a.type === "profile_update").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Profile Updates
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h4" color="error.main">
                {activities.filter((a) => a.type === "violation_added").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Admin Actions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search activity history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Activity Timeline */}
      <Card>
        <CardContent>
          {paginatedActivities.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Schedule sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No activity found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "This user has no recorded activity"}
              </Typography>
            </Box>
          ) : (
            <List>
              {paginatedActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: `${getActivityColor(activity.type)}.main`,
                        }}
                      >
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body1">
                            {activity.description}
                          </Typography>
                          <Chip
                            label={activity.type.replace("_", " ")}
                            size="small"
                            color={getActivityColor(activity.type) as any}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(activity.timestamp)} •{" "}
                            {new Date(activity.timestamp).toLocaleString()}
                          </Typography>

                          {activity.actor && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Performed by: {activity.actor.name}
                            </Typography>
                          )}

                          {activity.details &&
                            Object.keys(activity.details).length > 0 && (
                              <Box
                                sx={{
                                  mt: 1,
                                  p: 1,
                                  bgcolor: "grey.50",
                                  borderRadius: 1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Details:{" "}
                                  {JSON.stringify(activity.details, null, 2)}
                                </Typography>
                              </Box>
                            )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < paginatedActivities.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default HistoryTab;
