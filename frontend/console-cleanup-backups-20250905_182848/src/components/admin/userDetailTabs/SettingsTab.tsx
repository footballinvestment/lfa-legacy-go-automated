import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
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
  ListItemIcon,
  ListItemText,
  Chip,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  Block,
  CheckCircle,
  Security,
  Delete,
  RestartAlt,
  VpnKey,
  Warning,
  Shield,
  PersonRemove,
} from "@mui/icons-material";
import { AdminUser } from "../../../types/moderation";
import { moderationApi } from "../../../services/moderationApi";

interface SettingsTabProps {
  user: AdminUser;
  onUserUpdate: (updatedUser: AdminUser) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ user, onUserUpdate }) => {
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [newStatus, setNewStatus] = useState<AdminUser["status"]>("active");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleStatusChange = async (
    status: AdminUser["status"],
    actionReason: string
  ) => {
    setLoading(true);
    try {
      const updatedUser = await moderationApi.updateUser(user.id, {
        status,
        // Add reason to moderation log
      });

      onUserUpdate(updatedUser);
      setSnackbar({
        open: true,
        message: `User ${status} successfully`,
        severity: "success",
      });
      setDialogOpen(null);
      setReason("");
    } catch (error) {
      console.error("Error updating user status:", error);
      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update user status",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDangerousAction = async (action: string) => {
    setLoading(true);
    try {
      // These would be separate API endpoints in a real implementation
      let message = "";

      switch (action) {
        case "reset_password":
          // await moderationApi.resetUserPassword(user.id);
          message = "Password reset email sent to user";
          break;
        case "force_logout":
          // await moderationApi.forceLogoutUser(user.id);
          message = "User logged out from all devices";
          break;
        case "delete_account":
          // await moderationApi.deleteUser(user.id);
          message = "User account deleted";
          break;
        default:
          throw new Error("Unknown action");
      }

      setSnackbar({
        open: true,
        message,
        severity: action === "delete_account" ? "warning" : "success",
      });
      setDialogOpen(null);
      setReason("");
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : `Failed to ${action.replace("_", " ")}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusActions = () => {
    switch (user.status) {
      case "active":
        return [
          {
            action: "suspend",
            label: "Suspend User",
            color: "warning",
            icon: <Block />,
          },
          {
            action: "ban",
            label: "Ban User",
            color: "error",
            icon: <Security />,
          },
        ];
      case "suspended":
        return [
          {
            action: "activate",
            label: "Activate User",
            color: "success",
            icon: <CheckCircle />,
          },
          {
            action: "ban",
            label: "Ban User",
            color: "error",
            icon: <Security />,
          },
        ];
      case "banned":
        return [
          {
            action: "activate",
            label: "Activate User",
            color: "success",
            icon: <CheckCircle />,
          },
        ];
      case "pending":
        return [
          {
            action: "activate",
            label: "Approve User",
            color: "success",
            icon: <CheckCircle />,
          },
          {
            action: "ban",
            label: "Reject User",
            color: "error",
            icon: <Security />,
          },
        ];
      default:
        return [];
    }
  };

  const statusActions = getStatusActions();

  const dangerousActions = [
    {
      action: "reset_password",
      label: "Force Password Reset",
      description: "Send password reset email to user",
      icon: <RestartAlt />,
      color: "warning",
    },
    {
      action: "force_logout",
      label: "Force Logout",
      description: "Log user out from all devices",
      icon: <VpnKey />,
      color: "warning",
    },
    {
      action: "delete_account",
      label: "Delete Account",
      description: "Permanently delete user account and all data",
      icon: <Delete />,
      color: "error",
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Account Settings & Actions
      </Typography>

      <Grid container spacing={3}>
        {/* Current Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Status
              </Typography>

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
              >
                <Chip
                  label={user.status.toUpperCase()}
                  color={
                    user.status === "active"
                      ? "success"
                      : user.status === "suspended"
                        ? "warning"
                        : user.status === "banned"
                          ? "error"
                          : "info"
                  }
                  size="medium"
                />
                <Typography variant="body2" color="text.secondary">
                  Current account status
                </Typography>
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Available Actions:
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {statusActions.map((statusAction) => (
                  <Button
                    key={statusAction.action}
                    variant="outlined"
                    color={statusAction.color as any}
                    startIcon={statusAction.icon}
                    onClick={() => {
                      setNewStatus(statusAction.action as AdminUser["status"]);
                      setDialogOpen("status_change");
                    }}
                    fullWidth
                  >
                    {statusAction.label}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Details
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Shield />
                  </ListItemIcon>
                  <ListItemText
                    primary="Account Type"
                    secondary={user.roles.join(", ")}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary="Security Level"
                    secondary={
                      user.roles.includes("admin")
                        ? "High - Admin Access"
                        : user.roles.includes("moderator")
                          ? "Medium - Moderator Access"
                          : "Standard - User Access"
                    }
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Warning />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total Violations"
                    secondary={user.violations ? user.violations.length : 0}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Dangerous Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PersonRemove color="error" />
                Dangerous Actions
              </Typography>

              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>Warning:</strong> These actions are irreversible or have
                significant impact on the user's account. Use with extreme
                caution and ensure you have proper authorization.
              </Alert>

              <Grid container spacing={2}>
                {dangerousActions.map((action) => (
                  <Grid item xs={12} sm={4} key={action.action}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          {React.cloneElement(action.icon, {
                            color: action.color as any,
                          })}
                          <Typography variant="subtitle2">
                            {action.label}
                          </Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {action.description}
                        </Typography>

                        <Button
                          variant="outlined"
                          color={action.color as any}
                          fullWidth
                          onClick={() => setDialogOpen(action.action)}
                        >
                          Execute
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Change Dialog */}
      <Dialog
        open={dialogOpen === "status_change"}
        onClose={() => setDialogOpen(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to change the user status from{" "}
            <strong>{user.status}</strong> to <strong>{newStatus}</strong>?
          </Typography>

          <TextField
            fullWidth
            label="Reason for status change"
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a reason for this action..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={newStatus === "banned" ? "error" : "primary"}
            onClick={() => handleStatusChange(newStatus, reason)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            Confirm Change
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dangerous Action Confirmation Dialog */}
      {dangerousActions.map((action) => (
        <Dialog
          key={action.action}
          open={dialogOpen === action.action}
          onClose={() => setDialogOpen(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: "error.main" }}>
            Confirm Dangerous Action
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              <strong>Warning:</strong> This action cannot be undone!
            </Alert>

            <Typography variant="body1" gutterBottom>
              You are about to: <strong>{action.label}</strong>
            </Typography>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {action.description}
            </Typography>

            <TextField
              fullWidth
              label="Reason for this action"
              multiline
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a detailed reason for this action..."
              sx={{ mt: 2 }}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(null)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDangerousAction(action.action)}
              disabled={loading || !reason.trim()}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {action.label}
            </Button>
          </DialogActions>
        </Dialog>
      ))}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsTab;
