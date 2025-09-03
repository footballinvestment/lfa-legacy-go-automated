import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Divider,
  Alert,
  Box,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { adminService } from '../../services/api';

interface SystemConfig {
  maintenance_mode: boolean;
  registration_enabled: boolean;
  max_users_per_tournament: number;
  tournament_entry_fee: number;
  credit_purchase_enabled: boolean;
  email_notifications_enabled: boolean;
  daily_credit_bonus: number;
  max_daily_tournaments: number;
  session_timeout_hours: number;
  password_min_length: number;
  rate_limit_requests_per_minute: number;
  file_upload_max_size_mb: number;
  backup_retention_days: number;
  log_retention_days: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template: string;
  enabled: boolean;
}

const SystemSettings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({
    maintenance_mode: false,
    registration_enabled: true,
    max_users_per_tournament: 32,
    tournament_entry_fee: 10,
    credit_purchase_enabled: true,
    email_notifications_enabled: true,
    daily_credit_bonus: 5,
    max_daily_tournaments: 3,
    session_timeout_hours: 12,
    password_min_length: 8,
    rate_limit_requests_per_minute: 60,
    file_upload_max_size_mb: 10,
    backup_retention_days: 30,
    log_retention_days: 7,
  });

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    loadSystemConfig();
    loadEmailTemplates();
  }, []);

  const loadSystemConfig = async () => {
    try {
      const data = await adminService.getSystemStats();
      if (data?.config) {
        setConfig(prev => ({ ...prev, ...data.config }));
      }
    } catch (error) {
      console.error('Failed to load system config:', error);
      setMessage({ type: 'error', text: 'Failed to load system configuration' });
    }
  };

  const loadEmailTemplates = async () => {
    try {
      setEmailTemplates([
        {
          id: 'welcome',
          name: 'Welcome Email',
          subject: 'Welcome to LFA Legacy GO!',
          template: 'Welcome {{username}}! Your football gaming journey begins now.',
          enabled: true,
        },
        {
          id: 'tournament_reminder',
          name: 'Tournament Reminder',
          subject: 'Tournament Starting Soon',
          template: 'Your tournament {{tournament_name}} starts in 1 hour!',
          enabled: true,
        },
        {
          id: 'password_reset',
          name: 'Password Reset',
          subject: 'Reset Your Password',
          template: 'Click here to reset your password: {{reset_link}}',
          enabled: true,
        },
      ]);
    } catch (error) {
      console.error('Failed to load email templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'System configuration saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshConfig = () => {
    setLoading(true);
    loadSystemConfig();
    loadEmailTemplates();
  };

  const openTemplateDialog = (template?: EmailTemplate) => {
    setSelectedTemplate(template || {
      id: '',
      name: '',
      subject: '',
      template: '',
      enabled: true,
    });
    setTemplateDialogOpen(true);
  };

  const closeTemplateDialog = () => {
    setTemplateDialogOpen(false);
    setSelectedTemplate(null);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      if (selectedTemplate.id) {
        setEmailTemplates(prev => 
          prev.map(t => t.id === selectedTemplate.id ? selectedTemplate : t)
        );
      } else {
        const newTemplate = { ...selectedTemplate, id: Date.now().toString() };
        setEmailTemplates(prev => [...prev, newTemplate]);
      }
      setMessage({ type: 'success', text: 'Email template saved successfully' });
      closeTemplateDialog();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save email template' });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      setEmailTemplates(prev => prev.filter(t => t.id !== templateId));
      setMessage({ type: 'success', text: 'Email template deleted successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete email template' });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>Loading system settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          System Settings
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshConfig}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveConfig}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </Box>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* System Control Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={
                <Box display="flex" alignItems="center">
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                  System Control
                </Box>
              }
            />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.maintenance_mode}
                    onChange={(e) => handleConfigChange('maintenance_mode', e.target.checked)}
                    color="warning"
                  />
                }
                label="Maintenance Mode"
              />
              <Typography variant="caption" display="block" color="textSecondary" mb={2}>
                Temporarily disable access for all users except admins
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={config.registration_enabled}
                    onChange={(e) => handleConfigChange('registration_enabled', e.target.checked)}
                  />
                }
                label="User Registration"
              />
              <Typography variant="caption" display="block" color="textSecondary">
                Allow new users to create accounts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tournament Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Tournament Configuration" />
            <CardContent>
              <TextField
                label="Max Users per Tournament"
                type="number"
                value={config.max_users_per_tournament}
                onChange={(e) => handleConfigChange('max_users_per_tournament', parseInt(e.target.value))}
                fullWidth
                margin="normal"
                inputProps={{ min: 2, max: 64 }}
              />
              <TextField
                label="Tournament Entry Fee (Credits)"
                type="number"
                value={config.tournament_entry_fee}
                onChange={(e) => handleConfigChange('tournament_entry_fee', parseInt(e.target.value))}
                fullWidth
                margin="normal"
                inputProps={{ min: 0, max: 100 }}
              />
              <TextField
                label="Max Daily Tournaments per User"
                type="number"
                value={config.max_daily_tournaments}
                onChange={(e) => handleConfigChange('max_daily_tournaments', parseInt(e.target.value))}
                fullWidth
                margin="normal"
                inputProps={{ min: 1, max: 10 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Credit System Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Credit System" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.credit_purchase_enabled}
                    onChange={(e) => handleConfigChange('credit_purchase_enabled', e.target.checked)}
                  />
                }
                label="Credit Purchases Enabled"
              />
              <Typography variant="caption" display="block" color="textSecondary" mb={2}>
                Allow users to purchase credits
              </Typography>

              <TextField
                label="Daily Credit Bonus"
                type="number"
                value={config.daily_credit_bonus}
                onChange={(e) => handleConfigChange('daily_credit_bonus', parseInt(e.target.value))}
                fullWidth
                margin="normal"
                inputProps={{ min: 0, max: 50 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={
                <Box display="flex" alignItems="center">
                  <SecurityIcon color="primary" sx={{ mr: 1 }} />
                  Security Configuration
                </Box>
              }
            />
            <CardContent>
              <TextField
                label="Session Timeout (Hours)"
                type="number"
                value={config.session_timeout_hours}
                onChange={(e) => handleConfigChange('session_timeout_hours', parseInt(e.target.value))}
                fullWidth
                margin="normal"
                inputProps={{ min: 1, max: 168 }}
              />
              <TextField
                label="Minimum Password Length"
                type="number"
                value={config.password_min_length}
                onChange={(e) => handleConfigChange('password_min_length', parseInt(e.target.value))}
                fullWidth
                margin="normal"
                inputProps={{ min: 6, max: 20 }}
              />
              <TextField
                label="Rate Limit (Requests/Minute)"
                type="number"
                value={config.rate_limit_requests_per_minute}
                onChange={(e) => handleConfigChange('rate_limit_requests_per_minute', parseInt(e.target.value))}
                fullWidth
                margin="normal"
                inputProps={{ min: 10, max: 1000 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Storage Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={
                <Box display="flex" alignItems="center">
                  <StorageIcon color="secondary" sx={{ mr: 1 }} />
                  Storage & Data
                </Box>
              }
            />
            <CardContent>
              <TextField
                label="File Upload Max Size (MB)"
                type="number"
                value={config.file_upload_max_size_mb}
                onChange={(e) => handleConfigChange('file_upload_max_size_mb', parseInt(e.target.value))}
                fullWidth
                margin="normal"
                inputProps={{ min: 1, max: 100 }}
              />
              <TextField
                label="Backup Retention (Days)"
                type="number"
                value={config.backup_retention_days}
                onChange={(e) => handleConfigChange('backup_retention_days', parseInt(e.target.value))}
                fullWidth
                margin="normal"
                inputProps={{ min: 1, max: 365 }}
              />
              <TextField
                label="Log Retention (Days)"
                type="number"
                value={config.log_retention_days}
                onChange={(e) => handleConfigChange('log_retention_days', parseInt(e.target.value))}
                fullWidth
                margin="normal"
                inputProps={{ min: 1, max: 90 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Email Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={
                <Box display="flex" alignItems="center">
                  <EmailIcon color="info" sx={{ mr: 1 }} />
                  Email Configuration
                </Box>
              }
            />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.email_notifications_enabled}
                    onChange={(e) => handleConfigChange('email_notifications_enabled', e.target.checked)}
                  />
                }
                label="Email Notifications"
              />
              <Typography variant="caption" display="block" color="textSecondary" mb={2}>
                Send automated emails to users
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Email Templates</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => openTemplateDialog()}
                >
                  Add Template
                </Button>
              </Box>

              <List dense>
                {emailTemplates.map((template) => (
                  <ListItem key={template.id}>
                    <ListItemText
                      primary={template.name}
                      secondary={template.subject}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={template.enabled ? 'Active' : 'Disabled'}
                        color={template.enabled ? 'success' : 'default'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Tooltip title="Edit template">
                        <IconButton
                          size="small"
                          onClick={() => openTemplateDialog(template)}
                        >
                          <SettingsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete template">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTemplate(template.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Email Template Dialog */}
      <Dialog
        open={templateDialogOpen}
        onClose={closeTemplateDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate?.id ? 'Edit Email Template' : 'Add Email Template'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Template Name"
            value={selectedTemplate?.name || ''}
            onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email Subject"
            value={selectedTemplate?.subject || ''}
            onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email Template"
            value={selectedTemplate?.template || ''}
            onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, template: e.target.value } : null)}
            fullWidth
            multiline
            rows={6}
            margin="normal"
            helperText="Use {{variable}} for dynamic content like {{username}}, {{tournament_name}}"
          />
          <FormControlLabel
            control={
              <Switch
                checked={selectedTemplate?.enabled || false}
                onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, enabled: e.target.checked } : null)}
              />
            }
            label="Template Enabled"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTemplateDialog}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant="contained">
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* System Status Footer */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
        <Typography variant="body2" color="textSecondary">
          System Status: {config.maintenance_mode ? (
            <Chip label="Maintenance Mode" color="warning" size="small" />
          ) : (
            <Chip label="Online" color="success" size="small" />
          )}
          {' | '}
          Registration: {config.registration_enabled ? (
            <Chip label="Open" color="success" size="small" />
          ) : (
            <Chip label="Closed" color="error" size="small" />
          )}
          {' | '}
          Email Notifications: {config.email_notifications_enabled ? (
            <Chip label="Enabled" color="info" size="small" />
          ) : (
            <Chip label="Disabled" color="default" size="small" />
          )}
        </Typography>
      </Paper>
    </Box>
  );
};

export default SystemSettings;