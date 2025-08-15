import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Save,
  Cancel,
  Edit,
} from '@mui/icons-material';
import { AdminUser } from '../../../types/moderation';
import { moderationApi } from '../../../services/moderationApi';

interface ProfileTabProps {
  user: AdminUser;
  onUserUpdate: (updatedUser: AdminUser) => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, onUserUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    status: user.status,
    roles: user.roles,
    profile: {
      bio: user.profile?.bio || '',
      location: user.profile?.location || '',
      phone: user.profile?.phone || '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.roles.length === 0) {
      newErrors.roles = 'At least one role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await moderationApi.updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        status: formData.status,
        roles: formData.roles,
        profile: formData.profile,
      });

      onUserUpdate(updatedUser);
      setEditMode(false);
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to update profile',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      status: user.status,
      roles: user.roles,
      profile: {
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        phone: user.profile?.phone || '',
      },
    });
    setErrors({});
    setEditMode(false);
  };

  const handleRoleToggle = (role: string) => {
    if (editMode) {
      const newRoles = formData.roles.includes(role)
        ? formData.roles.filter(r => r !== role)
        : [...formData.roles, role];
      
      setFormData({ ...formData, roles: newRoles });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Profile Information</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {editMode ? (
            <>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                onClick={handleSave}
                disabled={loading}
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!editMode}
                    error={!!errors.name}
                    helperText={errors.name}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editMode}
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth disabled={!editMode}>
                    <InputLabel>Account Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      label="Account Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="suspended">Suspended</MenuItem>
                      <MenuItem value="banned">Banned</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={3}
                    value={formData.profile.bio}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, bio: e.target.value }
                    })}
                    disabled={!editMode}
                    placeholder="Tell us about yourself..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData.profile.location}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, location: e.target.value }
                    })}
                    disabled={!editMode}
                    placeholder="City, Country"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.profile.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, phone: e.target.value }
                    })}
                    disabled={!editMode}
                    placeholder="+1 (555) 123-4567"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Roles and Permissions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Roles and Permissions
              </Typography>
              
              {errors.roles && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.roles}
                </Alert>
              )}
              
              <Grid container spacing={2}>
                {['player', 'moderator', 'admin'].map((role) => (
                  <Grid item xs={12} sm={4} key={role}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.roles.includes(role)}
                          onChange={() => handleRoleToggle(role)}
                          disabled={!editMode}
                        />
                      }
                      label={role.charAt(0).toUpperCase() + role.slice(1)}
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <strong>Player:</strong> Basic tournament participation<br />
                <strong>Moderator:</strong> Can manage violations and reports<br />
                <strong>Admin:</strong> Full system access and user management
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

export default ProfileTab;