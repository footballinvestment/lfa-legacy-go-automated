import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
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
  Snackbar,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Warning,
  CheckCircle,
  Close,
} from "@mui/icons-material";
import {
  Violation,
  ViolationCreate,
  AdminUser,
} from "../../../types/moderation";
import { moderationApi } from "../../../services/moderationApi";
import { useSafeAuth } from "../../../SafeAuthContext";

interface ViolationsTabProps {
  user: AdminUser;
}

const ViolationsTab: React.FC<ViolationsTabProps> = ({ user }) => {
  const { user: currentUser } = useSafeAuth();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingViolation, setEditingViolation] = useState<Violation | null>(
    null
  );
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState<ViolationCreate>({
    type: "",
    reason: "",
    notes: "",
    created_by: currentUser?.id || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const violationTypes = [
    "warning",
    "suspension",
    "inappropriate_conduct",
    "cheating",
    "harassment",
    "spam",
    "terms_violation",
    "other",
  ];

  const loadViolations = async () => {
    try {
      const data = await moderationApi.getUserViolations(user.id);
      setViolations(data);
    } catch (error) {
      console.error("Error loading violations:", error);
      setSnackbar({
        open: true,
        message: "Failed to load violations",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadViolations();
  }, [user.id]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.type.trim()) {
      newErrors.type = "Violation type is required";
    }

    if (!formData.reason?.trim()) {
      newErrors.reason = "Reason is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingViolation) {
        await moderationApi.updateViolation(
          user.id,
          editingViolation.id,
          formData
        );
        setSnackbar({
          open: true,
          message: "Violation updated successfully",
          severity: "success",
        });
      } else {
        await moderationApi.addViolation(user.id, formData);
        setSnackbar({
          open: true,
          message: "Violation added successfully",
          severity: "success",
        });
      }

      await loadViolations();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving violation:", error);
      setSnackbar({
        open: true,
        message:
          error instanceof Error ? error.message : "Failed to save violation",
        severity: "error",
      });
    }
  };

  const handleDelete = async (violationId: number) => {
    if (!window.confirm("Are you sure you want to delete this violation?"))
      return;

    try {
      await moderationApi.deleteViolation(user.id, violationId);
      await loadViolations();
      setSnackbar({
        open: true,
        message: "Violation deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting violation:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete violation",
        severity: "error",
      });
    }
  };

  const handleEdit = (violation: Violation) => {
    setEditingViolation(violation);
    setFormData({
      type: violation.type,
      reason: violation.reason || "",
      notes: violation.notes || "",
      created_by: violation.created_by,
    });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingViolation(null);
    setFormData({
      type: "",
      reason: "",
      notes: "",
      created_by: currentUser?.id || 0,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingViolation(null);
    setFormData({
      type: "",
      reason: "",
      notes: "",
      created_by: currentUser?.id || 0,
    });
    setErrors({});
  };

  const getViolationSeverityColor = (type: string) => {
    switch (type) {
      case "warning":
        return "warning";
      case "suspension":
      case "cheating":
        return "error";
      case "harassment":
      case "inappropriate_conduct":
        return "error";
      case "spam":
      case "terms_violation":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "error";
      case "resolved":
        return "success";
      case "dismissed":
        return "default";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">User Violations</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddNew}>
          Add Violation
        </Button>
      </Box>

      {violations.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <CheckCircle sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Violations Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This user has a clean record with no violations.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {violations.map((violation) => (
                <TableRow key={violation.id}>
                  <TableCell>
                    <Chip
                      label={violation.type.replace("_", " ")}
                      color={getViolationSeverityColor(violation.type) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{violation.reason}</Typography>
                    {violation.notes && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {violation.notes}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(violation.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={violation.status}
                      color={getStatusColor(violation.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(violation)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(violation.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Violation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {editingViolation ? "Edit Violation" : "Add New Violation"}
          <IconButton onClick={handleCloseDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Violation Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                label="Violation Type"
              >
                {violationTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace("_", " ").toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
              {errors.type && (
                <Typography variant="caption" color="error">
                  {errors.type}
                </Typography>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="Reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              error={!!errors.reason}
              helperText={errors.reason}
              placeholder="Brief description of the violation"
            />

            <TextField
              fullWidth
              label="Additional Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              multiline
              rows={4}
              placeholder="Detailed notes, evidence, or context..."
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingViolation ? "Update" : "Add"} Violation
          </Button>
        </DialogActions>
      </Dialog>

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

export default ViolationsTab;
