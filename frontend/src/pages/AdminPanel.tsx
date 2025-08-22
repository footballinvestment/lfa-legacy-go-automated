import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  CircularProgress,
  Badge,
} from "@mui/material";
import {
  ArrowBack,
  Dashboard,
  People,
  EmojiEvents,
  Settings,
  Security,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Edit,
  Delete,
  Block,
  PersonAdd,
  AdminPanelSettings,
  SupervisorAccount,
  NetworkCheck,
  Storage,
  Memory,
  Speed,
  TrendingUp,
  TrendingDown,
  MoreVert,
} from "@mui/icons-material";
import { useSafeAuth } from "../SafeAuthContext";

// Interfaces for Admin Panel
interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTournaments: number;
  activeTournaments: number;
  systemHealth: "healthy" | "warning" | "critical";
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  apiResponseTime: number;
}

interface AdminUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  level: number;
  credits: number;
  is_active: boolean;
  is_admin: boolean;
  last_activity: string;
  registration_date: string;
  games_played: number;
  total_spent: number;
}

interface SystemAlert {
  id: string;
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSafeAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is admin (basic auth check)
  useEffect(() => {
    if (!state.user?.is_admin) {
      navigate("/dashboard");
      return;
    }
    loadAdminData();
  }, [state.user, navigate]);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      // Simulate loading admin data (replace with real API calls)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock system metrics
      setMetrics({
        totalUsers: 1247,
        activeUsers: 89,
        totalTournaments: 156,
        activeTournaments: 12,
        systemHealth: "healthy",
        memoryUsage: 67,
        cpuUsage: 23,
        diskUsage: 45,
        apiResponseTime: 142,
      });

      // Mock user data
      setUsers([
        {
          id: 1,
          username: "striker23",
          full_name: "Alex Rodriguez",
          email: "alex@example.com",
          level: 7,
          credits: 150,
          is_active: true,
          is_admin: false,
          last_activity: "2025-08-17T17:30:00Z",
          registration_date: "2024-12-01",
          games_played: 34,
          total_spent: 89.99,
        },
        {
          id: 2,
          username: "goalkeeper",
          full_name: "Sarah Chen",
          email: "sarah@example.com",
          level: 6,
          credits: 75,
          is_active: true,
          is_admin: false,
          last_activity: "2025-08-17T16:45:00Z",
          registration_date: "2024-11-15",
          games_played: 28,
          total_spent: 45.5,
        },
      ]);

      // Mock system alerts
      setAlerts([
        {
          id: "1",
          type: "info",
          title: "System Update",
          message: "Backend successfully updated to version 3.1.0",
          timestamp: "2025-08-17T18:00:00Z",
          resolved: true,
        },
        {
          id: "2",
          type: "warning",
          title: "High Memory Usage",
          message: "Frontend memory usage above 2GB threshold",
          timestamp: "2025-08-17T17:45:00Z",
          resolved: false,
        },
      ]);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const handleUserAction = (action: string, userId: number) => {
    console.log(`Admin action: ${action} for user ${userId}`);
    // Implement user management actions
  };

  const formatLastActivity = (timestamp: string) => {
    const now = new Date();
    const activity = new Date(timestamp);
    const diffMs = now.getTime() - activity.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Active now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "success";
      case "warning":
        return "warning";
      case "critical":
        return "error";
      default:
        return "default";
    }
  };

  if (!state.user?.is_admin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access Denied: Administrator privileges required.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading Admin Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate("/dashboard")}>
            <ArrowBack />
          </IconButton>
          <AdminPanelSettings sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Admin Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              System management and user oversight
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          {metrics && (
            <Chip
              icon={<NetworkCheck />}
              label={`System ${metrics.systemHealth}`}
              color={getHealthColor(metrics.systemHealth) as any}
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* System Metrics Overview */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <People sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {metrics.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
                </Typography>
                <Typography variant="caption" color="success.main">
                  {metrics.activeUsers} active
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <EmojiEvents
                  sx={{ fontSize: 40, color: "secondary.main", mb: 1 }}
                />
                <Typography variant="h4" fontWeight="bold">
                  {metrics.totalTournaments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tournaments
                </Typography>
                <Typography variant="caption" color="success.main">
                  {metrics.activeTournaments} active
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Memory sx={{ fontSize: 40, color: "warning.main", mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {metrics.memoryUsage}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Memory Usage
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics.memoryUsage}
                  sx={{ mt: 1 }}
                  color={metrics.memoryUsage > 80 ? "error" : "primary"}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Speed sx={{ fontSize: 40, color: "info.main", mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {metrics.apiResponseTime}ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  API Response
                </Typography>
                <Typography variant="caption" color="success.main">
                  Excellent
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="System Overview" icon={<Dashboard />} />
          <Tab label="User Management" icon={<People />} />
          <Tab label="System Alerts" icon={<Warning />} />
          <Tab label="Settings" icon={<Settings />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {/* System Overview Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Performance
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      CPU Usage: {metrics?.cpuUsage}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={metrics?.cpuUsage || 0}
                      sx={{ mb: 1 }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Disk Usage: {metrics?.diskUsage}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={metrics?.diskUsage || 0}
                      sx={{ mb: 1 }}
                    />
                  </Box>
                  <Alert severity="info">
                    All systems operating within normal parameters.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Button variant="outlined" startIcon={<People />}>
                      View All Users
                    </Button>
                    <Button variant="outlined" startIcon={<EmojiEvents />}>
                      Manage Tournaments
                    </Button>
                    <Button variant="outlined" startIcon={<Assessment />}>
                      System Reports
                    </Button>
                    <Button variant="outlined" startIcon={<Settings />}>
                      System Settings
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* User Management Tab */}
        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6">User Management</Typography>
                <Button variant="contained" startIcon={<PersonAdd />}>
                  Add User
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Credits</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Activity</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                              {user.username[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {user.full_name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                @{user.username}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={`Level ${user.level}`} size="small" />
                        </TableCell>
                        <TableCell>{user.credits}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? "Active" : "Inactive"}
                            color={user.is_active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {formatLastActivity(user.last_activity)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setUserDialogOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleUserAction("block", user.id)}
                          >
                            <Block />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* System Alerts Tab */}
        {activeTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Alerts
              </Typography>
              <List>
                {alerts.map((alert) => (
                  <ListItem key={alert.id} divider>
                    <ListItemIcon>
                      {alert.type === "error" && <Error color="error" />}
                      {alert.type === "warning" && <Warning color="warning" />}
                      {alert.type === "info" && <Info color="info" />}
                      {alert.type === "success" && (
                        <CheckCircle color="success" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(alert.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={alert.resolved ? "Resolved" : "Active"}
                      color={alert.resolved ? "success" : "warning"}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Settings
              </Typography>
              <Alert severity="info">
                System settings will be implemented in a future update.
              </Alert>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* User Edit Dialog */}
      <Dialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box
              sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}
            >
              <TextField
                label="Full Name"
                defaultValue={selectedUser.full_name}
                fullWidth
              />
              <TextField
                label="Email"
                defaultValue={selectedUser.email}
                fullWidth
              />
              <TextField
                label="Credits"
                type="number"
                defaultValue={selectedUser.credits}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedUser.is_active ? "active" : "inactive"}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setUserDialogOpen(false)}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;
