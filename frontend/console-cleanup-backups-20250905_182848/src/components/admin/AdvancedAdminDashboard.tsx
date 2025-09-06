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

interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
}

interface AdminStats {
  total_users: number;
  active_users: number;
  total_tournaments: number;
  active_tournaments: number;
  total_revenue: number;
  monthly_revenue: number;
}

const AdvancedAdminDashboard: React.FC = () => {
  const { state } = useSafeAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as any,
  });

  // Dummy admin data for now
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        // Simulate API calls
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setStats({
          total_users: 1247,
          active_users: 892,
          total_tournaments: 156,
          active_tournaments: 23,
          total_revenue: 45890,
          monthly_revenue: 8920,
        });

        setUsers([
          {
            id: 1,
            username: "testuser",
            email: "test@example.com",
            full_name: "Test User",
            is_active: true,
            is_admin: false,
            created_at: "2024-01-15T10:30:00Z",
          },
        ]);
      } catch (err) {
        setError("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    if (state.user?.is_admin) {
      fetchAdminData();
    }
  }, [state.user]);

  if (!state.user?.is_admin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleUserEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditDialog(true);
  };

  const handleUserToggle = async (
    userId: number,
    field: "is_active" | "is_admin"
  ) => {
    try {
      // Simulate API call
      const userIndex = users.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        const updatedUsers = [...users];
        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          [field]: !updatedUsers[userIndex][field],
        };
        setUsers(updatedUsers);
        setSnackbar({
          open: true,
          message: `User ${field} updated successfully`,
          severity: "success",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to update user",
        severity: "error",
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Loading Admin Dashboard...
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        🛠️ Advanced Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Admin Stats Overview */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Users
                    </Typography>
                    <Typography variant="h4">
                      {stats.total_users.toLocaleString()}
                    </Typography>
                  </Box>
                  <People color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Users
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.active_users.toLocaleString()}
                    </Typography>
                  </Box>
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Tournaments
                    </Typography>
                    <Typography variant="h4">
                      {stats.total_tournaments}
                    </Typography>
                  </Box>
                  <EmojiEvents color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Monthly Revenue
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      ${stats.monthly_revenue.toLocaleString()}
                    </Typography>
                  </Box>
                  <TrendingUp color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Admin Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Dashboard />} label="Overview" />
          <Tab icon={<People />} label="User Management" />
          <Tab icon={<EmojiEvents />} label="Tournament Management" />
          <Tab icon={<Assessment />} label="Analytics" />
          <Tab icon={<Settings />} label="System Settings" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Health
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography>Database: Online</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography>API Services: Running</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Warning color="warning" sx={{ mr: 1 }} />
                  <Typography>Cache: 85% Full</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Info color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="New user registration"
                      secondary="2 minutes ago"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <EmojiEvents color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tournament created"
                      secondary="15 minutes ago"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Failed login attempt"
                      secondary="1 hour ago"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

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
              <Typography variant="h6">
                User Management ({users.length} users)
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  size="small"
                  placeholder="Search users..."
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1 }} />,
                  }}
                />
                <Button variant="contained" startIcon={<People />}>
                  Add User
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar sx={{ mr: 2 }}>
                            {user.full_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
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
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={user.is_active}
                              onChange={() =>
                                handleUserToggle(user.id, "is_active")
                              }
                              size="small"
                            />
                          }
                          label={user.is_active ? "Active" : "Inactive"}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={user.is_admin}
                              onChange={() =>
                                handleUserToggle(user.id, "is_admin")
                              }
                              size="small"
                            />
                          }
                          label={user.is_admin ? "Admin" : "User"}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleUserEdit(user)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Block />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tournament Management
            </Typography>
            <Typography color="text.secondary">
              Tournament management tools will be implemented here.
            </Typography>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Analytics Dashboard
            </Typography>
            <Typography color="text.secondary">
              Advanced analytics and reporting tools will be implemented here.
            </Typography>
          </CardContent>
        </Card>
      )}

      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Settings
            </Typography>
            <Typography color="text.secondary">
              System configuration options will be implemented here.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={selectedUser.full_name}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                value={selectedUser.email}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Username"
                value={selectedUser.username}
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedAdminDashboard;
