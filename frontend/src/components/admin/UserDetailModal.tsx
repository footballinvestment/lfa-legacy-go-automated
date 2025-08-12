import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Person,
  SportsScore,
  Warning,
  Timeline,
  Star,
  EmojiEvents,
  Block,
  CheckCircle,
  Edit,
  Close,
  Save,
  Cancel,
  Security,
  Email,
  Phone,
  LocationOn,
  Schedule,
  Verified,
  TrendingUp,
  Assessment,
} from '@mui/icons-material';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  status: 'active' | 'suspended' | 'banned' | 'pending';
  role: 'user' | 'moderator' | 'admin';
  level: number;
  credits: number;
  registrationDate: string;
  lastLogin: string;
  ipAddress: string;
  location: string;
  phone?: string;
  gameStats: {
    tournamentsPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPoints: number;
    rank: number;
  };
  violations: UserViolation[];
  activityLevel: 'low' | 'medium' | 'high';
  verified: boolean;
  achievements: string[];
}

interface UserViolation {
  id: string;
  type: 'cheating' | 'harassment' | 'spam' | 'inappropriate_content' | 'account_sharing';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  date: string;
  status: 'pending' | 'resolved' | 'dismissed';
  actionTaken?: string;
}

interface ActivityEntry {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  ipAddress: string;
}

interface UserDetailProps {
  user: UserProfile | null;
  open: boolean;
  onClose: () => void;
  onSave?: (updatedUser: UserProfile) => void;
  onUserAction?: (action: string, userId: string, data?: any) => void;
}

const UserDetailModal: React.FC<UserDetailProps> = ({
  user,
  open,
  onClose,
  onSave,
  onUserAction,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);
  const [violations, setViolations] = useState<UserViolation[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityEntry[]>([]);

  React.useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
      setViolations(user.violations || []);
      
      // Generate mock activity history
      const mockActivity: ActivityEntry[] = [
        {
          id: '1',
          action: 'Login',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          details: 'Successful login from web browser',
          ipAddress: user.ipAddress,
        },
        {
          id: '2',
          action: 'Tournament Join',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          details: 'Joined "Friday Night Championship"',
          ipAddress: user.ipAddress,
        },
        {
          id: '3',
          action: 'Profile Update',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          details: 'Updated profile information',
          ipAddress: user.ipAddress,
        },
        {
          id: '4',
          action: 'Achievement Earned',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          details: 'Earned "First Win" achievement',
          ipAddress: user.ipAddress,
        },
      ];
      setActivityHistory(mockActivity);
    }
  }, [user]);

  if (!user) return null;

  const handleSave = () => {
    if (editedUser && onSave) {
      onSave(editedUser);
    }
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setEditMode(false);
  };

  const handleUserStatusChange = (newStatus: UserProfile['status']) => {
    if (onUserAction) {
      onUserAction('changeStatus', user.id, { status: newStatus });
    }
  };

  const handleViolationAction = (violationId: string, action: 'resolve' | 'dismiss') => {
    setViolations(prev => 
      prev.map(v => v.id === violationId ? { ...v, status: action === 'resolve' ? 'resolved' : 'dismissed' } : v)
    );
  };

  const getStatusColor = (status: UserProfile['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'banned': return 'error';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getViolationSeverityColor = (severity: UserViolation['severity']) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'major': return 'warning';
      case 'minor': return 'info';
      default: return 'default';
    }
  };

  const renderProfileTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge 
                color={user.verified ? 'success' : 'default'} 
                variant={user.verified ? 'dot' : undefined}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: '3rem' }}>
                  {user.fullName.charAt(0)}
                </Avatar>
              </Badge>
              <Typography variant="h5" gutterBottom>
                {editMode ? (
                  <TextField
                    fullWidth
                    value={editedUser?.fullName || ''}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, fullName: e.target.value } : null)}
                  />
                ) : (
                  user.fullName
                )}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {editMode ? (
                  <TextField
                    fullWidth
                    value={editedUser?.email || ''}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                ) : (
                  user.email
                )}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2, flexWrap: 'wrap' }}>
                <Chip label={user.status} color={getStatusColor(user.status) as any} />
                <Chip label={user.role} color="primary" />
                <Chip label={`Level ${user.level}`} color="secondary" />
              </Box>
              
              {user.verified && (
                <Chip icon={<Verified />} label="Verified Account" color="success" size="small" />
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Person sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Full Name</Typography>
                      <Typography variant="body1">
                        {editMode ? (
                          <TextField
                            size="small"
                            value={editedUser?.fullName || ''}
                            onChange={(e) => setEditedUser(prev => prev ? { ...prev, fullName: e.target.value } : null)}
                          />
                        ) : (
                          user.fullName
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Email sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body1">
                        {editMode ? (
                          <TextField
                            size="small"
                            value={editedUser?.email || ''}
                            onChange={(e) => setEditedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                          />
                        ) : (
                          user.email
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOn sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Location</Typography>
                      <Typography variant="body1">{user.location}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Schedule sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Registration Date</Typography>
                      <Typography variant="body1">
                        {new Date(user.registrationDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Last Login</Typography>
                      <Typography variant="body1">
                        {new Date(user.lastLogin).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmojiEvents sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Credits</Typography>
                      <Typography variant="body1">{user.credits.toLocaleString()}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {user.achievements.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Achievements
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {user.achievements.map((achievement, index) => (
                    <Chip
                      key={index}
                      icon={<Star />}
                      label={achievement}
                      color="warning"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderGameStatsTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Game Statistics</Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" color="primary.main">
                  {user.gameStats.tournamentsPlayed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Tournaments Played
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="h5" color="success.main">
                    {user.gameStats.wins}
                  </Typography>
                  <Typography variant="caption">Wins</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h5" color="error.main">
                    {user.gameStats.losses}
                  </Typography>
                  <Typography variant="caption">Losses</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h5" color="info.main">
                    {user.gameStats.winRate}%
                  </Typography>
                  <Typography variant="caption">Win Rate</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Win Rate Progress
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={user.gameStats.winRate} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total Points"
                    secondary={user.gameStats.totalPoints.toLocaleString()}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Assessment color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Global Rank"
                    secondary={`#${user.gameStats.rank}`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Star color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Activity Level"
                    secondary={
                      <Chip 
                        size="small" 
                        label={user.activityLevel} 
                        color={user.activityLevel === 'high' ? 'success' : user.activityLevel === 'medium' ? 'warning' : 'default'}
                      />
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <EmojiEvents color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Current Level"
                    secondary={`Level ${user.level}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderViolationsTab = () => (
    <Box sx={{ p: 2 }}>
      {violations.length === 0 ? (
        <Alert severity="success" icon={<CheckCircle />}>
          This user has no violations on record. Clean account!
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {violations.map((violation) => (
                <TableRow key={violation.id}>
                  <TableCell>{violation.type.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={violation.severity} 
                      color={getViolationSeverityColor(violation.severity) as any} 
                    />
                  </TableCell>
                  <TableCell>{violation.description}</TableCell>
                  <TableCell>{new Date(violation.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={violation.status} 
                      color={violation.status === 'resolved' ? 'success' : violation.status === 'dismissed' ? 'default' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    {violation.status === 'pending' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          onClick={() => handleViolationAction(violation.id, 'resolve')}
                          color="success"
                        >
                          Resolve
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => handleViolationAction(violation.id, 'dismiss')}
                        >
                          Dismiss
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  const renderActivityTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Recent Activity</Typography>
      
      <List>
        {activityHistory.map((activity, index) => (
          <React.Fragment key={activity.id}>
            <ListItem>
              <ListItemIcon>
                <Timeline color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={activity.action}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {activity.details}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(activity.timestamp).toLocaleString()} • IP: {activity.ipAddress}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < activityHistory.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  const renderAccountSettingsTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Account Controls</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Status Management</Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Button
                  variant={user.status === 'active' ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => handleUserStatusChange('active')}
                  startIcon={<CheckCircle />}
                >
                  Activate
                </Button>
                <Button
                  variant={user.status === 'suspended' ? 'contained' : 'outlined'}
                  color="warning"
                  onClick={() => handleUserStatusChange('suspended')}
                  startIcon={<Block />}
                >
                  Suspend
                </Button>
                <Button
                  variant={user.status === 'banned' ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => handleUserStatusChange('banned')}
                  startIcon={<Security />}
                >
                  Ban
                </Button>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>User Role</InputLabel>
                <Select
                  value={editedUser?.role || user.role}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, role: e.target.value as UserProfile['role'] } : null)}
                  disabled={!editMode}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="moderator">Moderator</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={editedUser?.verified || user.verified}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, verified: e.target.checked } : null)}
                    disabled={!editMode}
                  />
                }
                label="Verified Account"
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Danger Zone</Typography>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                These actions are irreversible. Please be careful.
              </Alert>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => onUserAction?.('resetPassword', user.id)}
                >
                  Force Password Reset
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => onUserAction?.('deleteAccount', user.id)}
                >
                  Delete Account
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          User Details - {user.fullName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {editMode ? (
            <>
              <Button startIcon={<Save />} onClick={handleSave} color="primary">
                Save
              </Button>
              <Button startIcon={<Cancel />} onClick={handleCancel}>
                Cancel
              </Button>
            </>
          ) : (
            <Button startIcon={<Edit />} onClick={() => setEditMode(true)}>
              Edit
            </Button>
          )}
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Profile Info" />
          <Tab label="Game Statistics" />
          <Tab label="Violations" />
          <Tab label="Activity Timeline" />
          <Tab label="Account Settings" />
        </Tabs>
      </Box>
      
      <DialogContent sx={{ p: 0, flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && renderProfileTab()}
        {activeTab === 1 && renderGameStatsTab()}
        {activeTab === 2 && renderViolationsTab()}
        {activeTab === 3 && renderActivityTab()}
        {activeTab === 4 && renderAccountSettingsTab()}
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;