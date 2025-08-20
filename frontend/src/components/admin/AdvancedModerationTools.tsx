import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Badge,
  Menu,
  Divider,
  LinearProgress,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Security,
  Report,
  Gavel,
  Timeline,
  Assessment,
  Settings,
  Visibility,
  Edit,
  Delete,
  Check,
  Close,
  Warning,
  Info,
  Error,
  CheckCircle,
  Block,
  Flag,
  AccessTime,
  Person,
  Assignment,
  TrendingUp,
  FilterList,
  Search,
  Refresh,
  MoreVert,
  Dashboard,
  Analytics,
  History,
} from '@mui/icons-material';
import { useSafeAuth } from '../../SafeAuthContext';
import { moderationApi } from '../../services/moderationApi';
import type { 
  UserReport, 
  Violation, 
  ModerationLog
} from '../../types/moderation';

// Response interfaces for API calls
interface ViolationListResponse {
  items: Violation[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface UserReportListResponse {
  items: UserReport[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface ModerationLogListResponse {
  items: ModerationLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`moderation-tabpanel-${index}`}
      aria-labelledby={`moderation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdvancedModerationTools: React.FC = () => {
  const { user } = useSafeAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Reports state
  const [reports, setReports] = useState<UserReport[]>([]);
  const [reportsPage, setReportsPage] = useState(0);
  const [reportsRowsPerPage, setReportsRowsPerPage] = useState(25);
  const [reportsFilter, setReportsFilter] = useState<'all' | 'open' | 'resolved' | 'dismissed'>('open');

  // Violations state
  const [recentViolations, setRecentViolations] = useState<Violation[]>([]);
  const [violationsPage, setViolationsPage] = useState(0);
  const [violationsRowsPerPage, setViolationsRowsPerPage] = useState(25);

  // Moderation logs state
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [logsPage, setLogsPage] = useState(0);
  const [logsRowsPerPage, setLogsRowsPerPage] = useState(25);

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalReports: 0,
    openReports: 0,
    resolvedToday: 0,
    activeViolations: 0,
    moderationActions: 0,
    averageResponseTime: '2.3 hours',
    resolutionRate: 87.5,
    falsePositiveRate: 12.3,
  });

  // Settings state
  const [autoAssignReports, setAutoAssignReports] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [strictModeEnabled, setStrictModeEnabled] = useState(false);

  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [reportActionDialog, setReportActionDialog] = useState(false);
  const [reportAction, setReportAction] = useState<'dismiss' | 'create_violation' | 'escalate'>('dismiss');
  const [reportActionNotes, setReportActionNotes] = useState('');

  useEffect(() => {
    loadModerationData();
  }, [currentTab]);

  const loadModerationData = async () => {
    setLoading(true);
    try {
      // Load data based on current tab
      switch (currentTab) {
        case 0: // Dashboard
          await loadAnalytics();
          break;
        case 1: // Reports
          await loadReports();
          break;
        case 2: // Violations
          await loadViolations();
          break;
        case 3: // Logs
          await loadModerationLogs();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to load moderation data:', error);
      showSnackbar('Failed to load moderation data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    // In a real implementation, this would fetch analytics from the API
    // For now, we'll simulate with mock data
    const mockAnalytics = {
      totalReports: Math.floor(Math.random() * 500) + 100,
      openReports: Math.floor(Math.random() * 50) + 10,
      resolvedToday: Math.floor(Math.random() * 20) + 5,
      activeViolations: Math.floor(Math.random() * 100) + 25,
      moderationActions: Math.floor(Math.random() * 30) + 10,
      averageResponseTime: `${(Math.random() * 5 + 1).toFixed(1)} hours`,
      resolutionRate: Math.round((Math.random() * 20 + 75) * 10) / 10,
      falsePositiveRate: Math.round((Math.random() * 10 + 5) * 10) / 10,
    };
    setAnalytics(mockAnalytics);
  };

  const loadReports = async () => {
    try {
      const reportsData = await moderationApi.getReports(reportsFilter !== 'all' ? reportsFilter : undefined);
      setReports(reportsData);
    } catch (error) {
      console.error('Failed to load reports:', error);
      // Fallback to mock data
      setReports([]);
    }
  };

  const loadViolations = async () => {
    try {
      // Since there's no general violations endpoint, we'll create mock data
      // In a real implementation, you'd have an endpoint like /api/admin/violations
      const mockViolations: Violation[] = [];
      for (let i = 1; i <= 20; i++) {
        mockViolations.push({
          id: i,
          user_id: Math.floor(Math.random() * 100) + 1,
          type: ['warning', 'suspension', 'inappropriate_conduct', 'cheating', 'harassment'][Math.floor(Math.random() * 5)] as any,
          reason: `Mock violation ${i}`,
          notes: `Additional notes for violation ${i}`,
          created_by: 1,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          status: ['active', 'resolved', 'dismissed'][Math.floor(Math.random() * 3)] as any
        });
      }
      setRecentViolations(mockViolations);
    } catch (error) {
      console.error('Failed to load violations:', error);
    }
  };

  const loadModerationLogs = async () => {
    try {
      const logsResponse = await moderationApi.getModerationLogs({
        page: logsPage + 1,
        limit: logsRowsPerPage
      });
      setModerationLogs(logsResponse.logs);
    } catch (error) {
      console.error('Failed to load moderation logs:', error);
      setModerationLogs([]);
    }
  };

  const showSnackbar = (message: string, severity: typeof snackbarSeverity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleReportAction = async () => {
    if (!selectedReport) return;
    
    setLoading(true);
    try {
      await moderationApi.updateReport(
        selectedReport.id,
        reportAction,
        reportActionNotes ? { notes: reportActionNotes } : undefined
      );
      
      showSnackbar(`Report ${reportAction}ed successfully`, 'success');
      setReportActionDialog(false);
      setSelectedReport(null);
      setReportAction('dismiss');
      setReportActionNotes('');
      await loadReports(); // Refresh reports list
    } catch (error) {
      console.error('Failed to update report:', error);
      showSnackbar('Failed to update report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getReportSeverityColor = (type: string) => {
    const severityMap: { [key: string]: 'error' | 'warning' | 'info' } = {
      'harassment': 'error',
      'cheating': 'error',
      'inappropriate_conduct': 'warning',
      'spam': 'warning',
      'terms_violation': 'info',
      'other': 'info'
    };
    return severityMap[type] || 'info';
  };

  const getViolationStatusColor = (status: string) => {
    const colorMap: { [key: string]: 'success' | 'warning' | 'error' | 'info' } = {
      'active': 'warning',
      'resolved': 'success',
      'dismissed': 'info'
    };
    return colorMap[status] || 'info';
  };

  const renderDashboard = () => (
    <Grid container spacing={3}>
      {/* Key Metrics */}
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Dashboard color="primary" />
          Moderation Overview
        </Typography>
      </Grid>
      
      {/* Stats Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Report color="primary" />
              <Box>
                <Typography variant="h4">{analytics.totalReports}</Typography>
                <Typography variant="body2" color="text.secondary">Total Reports</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Flag color="warning" />
              <Box>
                <Typography variant="h4">{analytics.openReports}</Typography>
                <Typography variant="body2" color="text.secondary">Open Reports</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Gavel color="error" />
              <Box>
                <Typography variant="h4">{analytics.activeViolations}</Typography>
                <Typography variant="body2" color="text.secondary">Active Violations</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircle color="success" />
              <Box>
                <Typography variant="h4">{analytics.resolvedToday}</Typography>
                <Typography variant="body2" color="text.secondary">Resolved Today</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Performance Metrics */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Analytics color="primary" />
              Performance Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Avg Response Time</Typography>
                <Typography variant="h6">{analytics.averageResponseTime}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Resolution Rate</Typography>
                <Typography variant="h6">{analytics.resolutionRate}%</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={analytics.resolutionRate} 
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">False Positive Rate</Typography>
                <Typography variant="h6">{analytics.falsePositiveRate}%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Actions Today</Typography>
                <Typography variant="h6">{analytics.moderationActions}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Recent Activity */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History color="primary" />
              Recent Activity
            </Typography>
            <List dense>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Flag />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="New report: Harassment"
                  secondary="2 minutes ago"
                />
                <ListItemSecondaryAction>
                  <Chip label="High" size="small" color="error" />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <Check />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Report resolved: Spam"
                  secondary="15 minutes ago"
                />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <Gavel />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Violation created: Cheating"
                  secondary="1 hour ago"
                />
                <ListItemSecondaryAction>
                  <Chip label="Critical" size="small" color="error" />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderReports = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Report color="primary" />
          User Reports
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={reportsFilter}
              label="Filter"
              onChange={(e) => setReportsFilter(e.target.value as any)}
            >
              <MenuItem value="all">All Reports</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="dismissed">Dismissed</MenuItem>
            </Select>
          </FormControl>
          <Button startIcon={<Refresh />} onClick={() => loadReports()}>
            Refresh
          </Button>
        </Box>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Reporter</TableCell>
              <TableCell>Reported User</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports
              .slice(reportsPage * reportsRowsPerPage, (reportsPage + 1) * reportsRowsPerPage)
              .map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {report.reporter_id}
                      </Avatar>
                      <Typography variant="body2">User {report.reporter_id}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {report.reported_user_id}
                      </Avatar>
                      <Typography variant="body2">User {report.reported_user_id}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={report.type} 
                      size="small" 
                      color={getReportSeverityColor(report.type)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={report.status} 
                      size="small" 
                      color={report.status === 'open' ? 'warning' : report.status === 'resolved' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(report.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {report.assigned_to ? (
                      <Typography variant="body2">Moderator {report.assigned_to}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Unassigned</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {report.status === 'open' && (
                        <Tooltip title="Take Action">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setSelectedReport(report);
                              setReportActionDialog(true);
                            }}
                          >
                            <Gavel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={reports.length}
          page={reportsPage}
          onPageChange={(_, newPage) => setReportsPage(newPage)}
          rowsPerPage={reportsRowsPerPage}
          onRowsPerPageChange={(e) => setReportsRowsPerPage(parseInt(e.target.value, 10))}
        />
      </TableContainer>
    </Box>
  );

  const renderViolations = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Gavel color="primary" />
          Recent Violations
        </Typography>
        <Button startIcon={<Refresh />} onClick={() => loadViolations()}>
          Refresh
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentViolations
              .slice(violationsPage * violationsRowsPerPage, (violationsPage + 1) * violationsRowsPerPage)
              .map((violation) => (
                <TableRow key={violation.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {violation.user_id}
                      </Avatar>
                      <Typography variant="body2">User {violation.user_id}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={violation.type} 
                      size="small" 
                      color="warning"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                      {violation.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">Moderator {violation.created_by}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={violation.status} 
                      size="small" 
                      color={getViolationStatusColor(violation.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(violation.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={recentViolations.length}
          page={violationsPage}
          onPageChange={(_, newPage) => setViolationsPage(newPage)}
          rowsPerPage={violationsRowsPerPage}
          onRowsPerPageChange={(e) => setViolationsRowsPerPage(parseInt(e.target.value, 10))}
        />
      </TableContainer>
    </Box>
  );

  const renderLogs = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timeline color="primary" />
          Moderation Logs
        </Typography>
        <Button startIcon={<Refresh />} onClick={() => loadModerationLogs()}>
          Refresh
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Actor</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Target User</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>IP Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {moderationLogs
              .slice(logsPage * logsRowsPerPage, (logsPage + 1) * logsRowsPerPage)
              .map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Typography variant="body2">Moderator {log.actor_id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={log.action} 
                      size="small" 
                      color="info"
                    />
                  </TableCell>
                  <TableCell>
                    {log.target_user_id ? (
                      <Typography variant="body2">User {log.target_user_id}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ maxWidth: 200 }} noWrap>
                      {JSON.stringify(log.details)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(log.created_at).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {log.ip_address || 'N/A'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={moderationLogs.length}
          page={logsPage}
          onPageChange={(_, newPage) => setLogsPage(newPage)}
          rowsPerPage={logsRowsPerPage}
          onRowsPerPageChange={(e) => setLogsRowsPerPage(parseInt(e.target.value, 10))}
        />
      </TableContainer>
    </Box>
  );

  const renderSettings = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings color="primary" />
        Moderation Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Automation Settings
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Auto-assign reports"
                    secondary="Automatically assign new reports to available moderators"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={autoAssignReports}
                      onChange={(e) => setAutoAssignReports(e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Email notifications"
                    secondary="Send email alerts for high-priority reports"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Strict mode"
                    secondary="Enable stricter moderation rules"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={strictModeEnabled}
                      onChange={(e) => setStrictModeEnabled(e.target.checked)}
                      color="warning"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="outlined" startIcon={<Assessment />}>
                  Generate Weekly Report
                </Button>
                <Button variant="outlined" startIcon={<Timeline />}>
                  Export Moderation Logs
                </Button>
                <Button variant="outlined" startIcon={<Security />} color="warning">
                  Backup User Data
                </Button>
                <Button variant="outlined" startIcon={<Refresh />}>
                  Reset Analytics
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security color="primary" />
          Advanced Moderation Tools
        </Typography>
        {user && (
          <Chip 
            label={`Moderator: ${user.username}`} 
            color="primary" 
            avatar={<Avatar>{user.username?.charAt(0).toUpperCase()}</Avatar>}
          />
        )}
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab 
            label="Dashboard" 
            icon={<Dashboard />} 
            iconPosition="start"
            id="moderation-tab-0"
            aria-controls="moderation-tabpanel-0"
          />
          <Tab 
            label={`Reports (${reports.filter(r => r.status === 'open').length})`}
            icon={<Report />} 
            iconPosition="start"
            id="moderation-tab-1"
            aria-controls="moderation-tabpanel-1"
          />
          <Tab 
            label="Violations" 
            icon={<Gavel />} 
            iconPosition="start"
            id="moderation-tab-2"
            aria-controls="moderation-tabpanel-2"
          />
          <Tab 
            label="Logs" 
            icon={<Timeline />} 
            iconPosition="start"
            id="moderation-tab-3"
            aria-controls="moderation-tabpanel-3"
          />
          <Tab 
            label="Settings" 
            icon={<Settings />} 
            iconPosition="start"
            id="moderation-tab-4"
            aria-controls="moderation-tabpanel-4"
          />
        </Tabs>
      </Box>

      {/* Loading indicator */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tab Panels */}
      <TabPanel value={currentTab} index={0}>
        {renderDashboard()}
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        {renderReports()}
      </TabPanel>
      <TabPanel value={currentTab} index={2}>
        {renderViolations()}
      </TabPanel>
      <TabPanel value={currentTab} index={3}>
        {renderLogs()}
      </TabPanel>
      <TabPanel value={currentTab} index={4}>
        {renderSettings()}
      </TabPanel>

      {/* Report Action Dialog */}
      <Dialog 
        open={reportActionDialog} 
        onClose={() => setReportActionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Take Action on Report
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Report #{selectedReport.id}</strong> - {selectedReport.type}
                </Typography>
                <Typography variant="body2">
                  Reported User: {selectedReport.reported_user_id} | Reporter: {selectedReport.reporter_id}
                </Typography>
              </Alert>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Description:</strong> {selectedReport.description}
              </Typography>
              
              {selectedReport.evidence && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Evidence:</strong> {selectedReport.evidence}
                </Typography>
              )}
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={reportAction}
                  label="Action"
                  onChange={(e) => setReportAction(e.target.value as any)}
                >
                  <MenuItem value="dismiss">Dismiss Report</MenuItem>
                  <MenuItem value="create_violation">Create Violation</MenuItem>
                  <MenuItem value="escalate">Escalate</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={reportActionNotes}
                onChange={(e) => setReportActionNotes(e.target.value)}
                placeholder="Add any additional notes about this action..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportActionDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleReportAction} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm Action'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdvancedModerationTools;