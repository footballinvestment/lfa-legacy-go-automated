import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close,
  Person,
  AccountBox,
  Warning,
  Timeline,
  Settings,
} from '@mui/icons-material';
import { AdminUser } from '../../types/moderation';
import { moderationApi } from '../../services/moderationApi';
import AdminErrorBoundary from './AdminErrorBoundary';

// Import tab components
import OverviewTab from './userDetailTabs/OverviewTab';
import ProfileTab from './userDetailTabs/ProfileTab';
import ViolationsTab from './userDetailTabs/ViolationsTab';
import HistoryTab from './userDetailTabs/HistoryTab';
import SettingsTab from './userDetailTabs/SettingsTab';

interface UserDetailProps {
  userId: number | null;
  open: boolean;
  onClose: () => void;
  onUserUpdate?: (updatedUser: AdminUser) => void;
}

const UserDetailModal: React.FC<UserDetailProps> = ({
  userId,
  open,
  onClose,
  onUserUpdate,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUser = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const userData = await moderationApi.getUser(userId);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && userId) {
      loadUser();
    }
  }, [open, userId]);

  const handleUserUpdate = (updatedUser: AdminUser) => {
    setUser(updatedUser);
    onUserUpdate?.(updatedUser);
  };

  const handleClose = () => {
    setActiveTab(0);
    setUser(null);
    setError(null);
    onClose();
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            {error}
          </Alert>
        </Box>
      );
    }

    if (!user) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            No user data available
          </Alert>
        </Box>
      );
    }

    switch (activeTab) {
      case 0:
        return (
          <AdminErrorBoundary section="OverviewTab">
            <OverviewTab user={user} />
          </AdminErrorBoundary>
        );
      case 1:
        return (
          <AdminErrorBoundary section="ProfileTab">
            <ProfileTab user={user} onUserUpdate={handleUserUpdate} />
          </AdminErrorBoundary>
        );
      case 2:
        return (
          <AdminErrorBoundary section="ViolationsTab">
            <ViolationsTab user={user} />
          </AdminErrorBoundary>
        );
      case 3:
        return (
          <AdminErrorBoundary section="HistoryTab">
            <HistoryTab user={user} />
          </AdminErrorBoundary>
        );
      case 4:
        return (
          <AdminErrorBoundary section="SettingsTab">
            <SettingsTab user={user} onUserUpdate={handleUserUpdate} />
          </AdminErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {user ? `User Details - ${user.name}` : 'Loading User Details...'}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      {!loading && !error && user && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="Overview" 
              icon={<Person />} 
              iconPosition="start" 
            />
            <Tab 
              label="Profile" 
              icon={<AccountBox />} 
              iconPosition="start"
            />
            <Tab 
              label="Violations" 
              icon={<Warning />} 
              iconPosition="start"
            />
            <Tab 
              label="History" 
              icon={<Timeline />} 
              iconPosition="start"
            />
            <Tab 
              label="Settings" 
              icon={<Settings />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
      )}
      
      <DialogContent sx={{ p: 0, flex: 1, overflow: 'auto' }}>
        <AdminErrorBoundary section="UserDetailModal">
          {renderTabContent()}
        </AdminErrorBoundary>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;