import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  IconButton,
  Switch,
  Chip,
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Divider,
  FormControlLabel,
} from "@mui/material";
import {
  Dashboard,
  SupervisorAccount,
  Security,
  Settings,
  People,
  EmojiEvents,
  Warning,
  CheckCircle,
  Block,
  Edit,
  Delete,
  Visibility,
  NotificationImportant,
  TrendingUp,
  Assessment,
  SystemUpdate,
  NetworkCheck,
  Error,
  Info,
  Refresh,
  Download,
  Search,
  FilterList,
  MoreVert,
} from "@mui/icons-material";
import { useSafeAuth } from "../../SafeAuthContext";

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTournaments: number;
  activeTournaments: number;
  pendingApprovals: number;
  systemAlerts: number;
  serverUptime: number;
  avgResponseTime: number;
}

interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  services: Array<{
    name: string;
    status: "online" | "offline" | "degraded";
    responseTime: number;
    lastCheck: string;
  }>;
  databases: Array<{
    name: string;
    status: "connected" | "disconnected" | "slow";
    connections: number;
    queries: number;
  }>;
  resources: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

interface UserAction {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failed" | "suspicious";
}

interface AdminAlert {
  id: string;
  type: "security" | "system" | "user" | "tournament";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  assignedTo?: string;
}

interface ModeratorAction {
  id: string;
  targetType: "user" | "tournament" | "content";
  targetId: string;
  action: "suspend" | "ban" | "approve" | "reject" | "delete";
  reason: string;
  moderatorId: string;
  timestamp: string;
  status: "pending" | "completed" | "failed";
}

const AdvancedAdminDashboard: React.FC = () => {
  const { user } = useSafeAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<AdminMetrics | null>(null);
  const [moderationQueue, setModerationQueue] = useState<ModeratorAction[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data
  useEffect(() => {
    const mockMetrics: AdminMetrics = {
      totalUsers: 15847,
      activeUsers: 3247,
      totalTournaments: 1247,
      activeTournaments: 23,
      pendingApprovals: 8,
      systemAlerts: 5,
      serverUptime: 99.8,
      avgResponseTime: 285,
    };

    const mockAlerts: AdminAlert[] = [
      {
        id: "1",
        type: "security",
        priority: "high",
        title: "Multiple Failed Login Attempts",
        description:
          "User ID 1234 has 15 failed login attempts in the last hour",
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        resolved: false,
      },
      {
        id: "2",
        type: "system",
        priority: "medium",
        title: "High CPU Usage",
        description: "Server CPU usage exceeded 85% for the last 10 minutes",
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        resolved: false,
      },
      {
        id: "3",
        type: "tournament",
        priority: "low",
        title: "Tournament Approval Needed",
        description: "5 tournaments are waiting for admin approval",
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        resolved: false,
      },
    ];

    const mockUserActions: UserAction[] = [
      {
        id: "1",
        userId: "1234",
        userName: "john.doe@example.com",
        action: "Login",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 Chrome/91.0",
        status: "success",
      },
      {
        id: "2",
        userId: "5678",
        userName: "suspicious.user@test.com",
        action: "Multiple Password Reset Attempts",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        ipAddress: "10.0.0.50",
        userAgent: "Bot/1.0",
        status: "suspicious",
      },
    ];

    const mockSystemHealth: SystemHealth = {
      status: "healthy",
      services: [
        {
          name: "API Gateway",
          status: "online",
          responseTime: 45,
          lastCheck: new Date().toISOString(),
        },
        {
          name: "Authentication",
          status: "online",
          responseTime: 32,
          lastCheck: new Date().toISOString(),
        },
        {
          name: "Tournament Service",
          status: "online",
          responseTime: 78,
          lastCheck: new Date().toISOString(),
        },
        {
          name: "Notification Service",
          status: "degraded",
          responseTime: 245,
          lastCheck: new Date().toISOString(),
        },
      ],
      databases: [
        {
          name: "Primary DB",
          status: "connected",
          connections: 45,
          queries: 1250,
        },
        {
          name: "Analytics DB",
          status: "connected",
          connections: 12,
          queries: 340,
        },
        {
          name: "Cache Redis",
          status: "connected",
          connections: 8,
          queries: 2150,
        },
      ],
      resources: {
        cpu: 45,
        memory: 72,
        disk: 38,
        network: 25,
      },
    };

    setSystemMetrics(mockMetrics);
    setAlerts(mockAlerts);
    setUserActions(mockUserActions);
    setSystemHealth(mockSystemHealth);
  }, []);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log("Refreshing admin data...");
      // In real app, this would fetch fresh data from API
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleUserAction = (action: string, userId: string) => {
    console.log(`Performing ${action} on user ${userId}`);
    setSnackbarMessage(`${action} action completed successfully`);
    setSnackbarOpen(true);
  };

  const handleAlertResolve = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
    setSnackbarMessage("Alert resolved successfully");
    setSnackbarOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
      case "connected":
      case "success":
      case "healthy":
        return "success";
      case "degraded":
      case "slow":
      case "warning":
        return "warning";
      case "offline":
      case "disconnected":
      case "failed":
      case "critical":
        return "error";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const renderSystemOverview = () => (
    <Grid container spacing={3}>
      {/* Key Metrics */}
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              boxShadow: 4,
              transform: "translateY(-2px)",
            },
          }}
          onClick={() => navigate("/admin/users")}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                <People />
              </Avatar>
              <Typography variant="h6">Total Users</Typography>
            </Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {systemMetrics?.totalUsers.toLocaleString()}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Chip
                size="small"
                label={`${systemMetrics?.activeUsers.toLocaleString()} active`}
                color="success"
              />
              <Button
                size="small"
                variant="text"
                sx={{ minWidth: "auto", p: 0.5 }}
              >
                Manage →
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ bgcolor: "secondary.main", mr: 2 }}>
                <EmojiEvents />
              </Avatar>
              <Typography variant="h6">Tournaments</Typography>
            </Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {systemMetrics?.totalTournaments.toLocaleString()}
            </Typography>
            <Chip
              size="small"
              label={`${systemMetrics?.activeTournaments} active`}
              color="info"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ bgcolor: "warning.main", mr: 2 }}>
                <NotificationImportant />
              </Avatar>
              <Typography variant="h6">Pending Approvals</Typography>
            </Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {systemMetrics?.pendingApprovals}
            </Typography>
            <Chip size="small" label="Needs attention" color="warning" />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ bgcolor: "error.main", mr: 2 }}>
                <Warning />
              </Avatar>
              <Typography variant="h6">System Alerts</Typography>
            </Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {systemMetrics?.systemAlerts}
            </Typography>
            <Chip size="small" label="Review required" color="error" />
          </CardContent>
        </Card>
      </Grid>

      {/* System Health Status */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              System Services Status
            </Typography>
            <List>
              {systemHealth?.services.map((service, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        bgcolor: `${getStatusColor(service.status)}.main`,
                        width: 32,
                        height: 32,
                      }}
                    >
                      <NetworkCheck fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={service.name}
                    secondary={`Response: ${service.responseTime}ms • Last check: ${new Date(service.lastCheck).toLocaleTimeString()}`}
                  />
                  <Chip
                    size="small"
                    label={service.status}
                    color={getStatusColor(service.status) as any}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Resource Usage
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">CPU</Typography>
                <Typography variant="body2">
                  {systemHealth?.resources.cpu}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={systemHealth?.resources.cpu}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Memory</Typography>
                <Typography variant="body2">
                  {systemHealth?.resources.memory}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={systemHealth?.resources.memory}
                color="secondary"
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Disk</Typography>
                <Typography variant="body2">
                  {systemHealth?.resources.disk}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={systemHealth?.resources.disk}
                color="success"
              />
            </Box>

            <Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Network</Typography>
                <Typography variant="body2">
                  {systemHealth?.resources.network}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={systemHealth?.resources.network}
                color="info"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Actions */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button variant="outlined" startIcon={<Refresh />}>
                Refresh All Data
              </Button>
              <Button variant="outlined" startIcon={<SystemUpdate />}>
                System Maintenance
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                color="secondary"
              >
                Export Logs
              </Button>
              <Button
                variant="outlined"
                startIcon={<Security />}
                color="warning"
              >
                Security Scan
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAlertsAndReports = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
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
              <Typography variant="h6">Active Alerts</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button size="small" startIcon={<FilterList />}>
                  Filter
                </Button>
                <Button size="small" startIcon={<Refresh />}>
                  Refresh
                </Button>
              </Box>
            </Box>

            <List>
              {alerts
                .filter((alert) => !alert.resolved)
                .map((alert) => (
                  <ListItem key={alert.id}>
                    <ListItemIcon>
                      <Badge
                        color={getPriorityColor(alert.priority) as any}
                        variant="dot"
                      >
                        {alert.type === "security" && <Security />}
                        {alert.type === "system" && <Warning />}
                        {alert.type === "user" && <People />}
                        {alert.type === "tournament" && <EmojiEvents />}
                      </Badge>
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {alert.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(alert.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Chip
                        size="small"
                        label={alert.priority}
                        color={getPriorityColor(alert.priority) as any}
                      />
                      <Button
                        size="small"
                        onClick={() => handleAlertResolve(alert.id)}
                      >
                        Resolve
                      </Button>
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderActivityLogs = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
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
              <Typography variant="h6">Recent User Activity</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Search..."
                  InputProps={{ startAdornment: <Search /> }}
                />
                <Button size="small" startIcon={<Download />}>
                  Export
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userActions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell>{action.userName}</TableCell>
                      <TableCell>{action.action}</TableCell>
                      <TableCell>
                        {new Date(action.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{action.ipAddress}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={action.status}
                          color={getStatusColor(action.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setSelectedUser(action)}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton size="small">
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
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <SupervisorAccount color="primary" />
          Advanced Admin Dashboard
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh All
          </Button>
          <Button variant="contained" startIcon={<Settings />}>
            Settings
          </Button>
        </Box>
      </Box>

      {/* System Status Banner */}
      <Alert
        severity={systemHealth?.status === "healthy" ? "success" : "warning"}
        sx={{ mb: 3 }}
      >
        System Status: {systemHealth?.status?.toUpperCase()} • Uptime:{" "}
        {systemMetrics?.serverUptime}% • Avg Response:{" "}
        {systemMetrics?.avgResponseTime}ms
      </Alert>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="System Overview" icon={<Dashboard />} />
          <Tab label="User Management" icon={<People />} />
          <Tab label="Tournament Oversight" icon={<EmojiEvents />} />
          <Tab label="Alerts & Reports" icon={<Warning />} />
          <Tab label="Activity Logs" icon={<Assessment />} />
          <Tab label="System Health" icon={<NetworkCheck />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {selectedTab === 0 && renderSystemOverview()}
        {selectedTab === 1 && (
          <Typography>User Management - Coming Soon</Typography>
        )}
        {selectedTab === 2 && (
          <Typography>Tournament Oversight - Coming Soon</Typography>
        )}
        {selectedTab === 3 && renderAlertsAndReports()}
        {selectedTab === 4 && renderActivityLogs()}
        {selectedTab === 5 && (
          <Typography>System Health - Coming Soon</Typography>
        )}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

      {/* User Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="body1">
                User: {selectedUser.userName}
              </Typography>
              <Typography variant="body2">
                Action: {selectedUser.action}
              </Typography>
              <Typography variant="body2">
                IP: {selectedUser.ipAddress}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => handleUserAction("suspend", selectedUser?.userId)}
          >
            Suspend User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedAdminDashboard;
