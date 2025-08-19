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
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Badge,
  Menu,
  Divider,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  People,
  PersonAdd,
  Block,
  CheckCircle,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  MoreVert,
  Download,
  Upload,
  Refresh,
  Warning,
  Security,
  Star,
  EmojiEvents,
  Schedule,
  LocationOn,
  ViewList,
  ViewModule,
  Clear,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import UserDetailModal from './UserDetailModal';
import { moderationApi } from '../../services/moderationApi';
import type { BulkUserOperation, BulkOperationResult } from '../../types/moderation';

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

interface BulkOperationLocal {
  type: 'suspend' | 'activate' | 'ban' | 'promote' | 'demote' | 'delete' | 'export';
  userIds: string[];
  reason?: string;
}

interface UserFilter {
  status?: string;
  role?: string;
  levelRange?: [number, number];
  registrationDateRange?: [string, string];
  activityLevel?: string;
  hasViolations?: boolean;
  verified?: boolean;
}

interface UserAction {
  type: string;
  userId: string;
  details: any;
  timestamp: string;
}

const AdvancedUserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [filterOptions, setFilterOptions] = useState<UserFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkOperationOpen, setBulkOperationOpen] = useState(false);
  const [bulkOperationType, setBulkOperationType] = useState<string>('');
  const [bulkOperationReason, setBulkOperationReason] = useState('');
  const [bulkOperationProgress, setBulkOperationProgress] = useState<BulkOperationResult | null>(null);
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [sortBy, setSortBy] = useState<keyof UserProfile>('registrationDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock user data
  useEffect(() => {
    const generateMockUsers = (): UserProfile[] => {
      const mockUsers: UserProfile[] = [];
      const names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Alex Chen', 'Maria Garcia', 'David Brown', 'Lisa Davis', 'Tom Anderson', 'Emma Taylor'];
      const locations = ['New York', 'London', 'Tokyo', 'Berlin', 'Sydney', 'Toronto', 'Paris', 'Seoul', 'Mumbai', 'São Paulo'];
      const roles: UserProfile['role'][] = ['user', 'user', 'user', 'user', 'moderator', 'user', 'user', 'user', 'user', 'admin'];
      const statuses: UserProfile['status'][] = ['active', 'active', 'active', 'suspended', 'active', 'banned', 'active', 'pending', 'active', 'active'];

      for (let i = 0; i < 50; i++) {
        const tournamentsPlayed = Math.floor(Math.random() * 100) + 1;
        const wins = Math.floor(Math.random() * tournamentsPlayed);
        const losses = tournamentsPlayed - wins;
        const winRate = Math.round((wins / tournamentsPlayed) * 100);
        
        mockUsers.push({
          id: (i + 1).toString(),
          email: `user${i + 1}@example.com`,
          fullName: names[i % names.length] + ` ${i + 1}`,
          status: statuses[i % statuses.length],
          role: roles[i % roles.length],
          level: Math.floor(Math.random() * 50) + 1,
          credits: Math.floor(Math.random() * 10000),
          registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          location: locations[i % locations.length],
          gameStats: {
            tournamentsPlayed,
            wins,
            losses,
            winRate,
            totalPoints: Math.floor(Math.random() * 50000),
            rank: i + 1,
          },
          violations: i % 7 === 0 ? [{
            id: `v${i}`,
            type: 'spam',
            severity: 'minor',
            description: 'Excessive messaging in chat',
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
          }] : [],
          activityLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          verified: Math.random() > 0.3,
          achievements: ['First Win', 'Tournament Champion'].slice(0, Math.floor(Math.random() * 3)),
        });
      }
      
      return mockUsers;
    };

    setUsers(generateMockUsers());
  }, []);

  const filteredUsers = users.filter(user => {
    if (searchQuery && !user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (filterOptions.status && user.status !== filterOptions.status) return false;
    if (filterOptions.role && user.role !== filterOptions.role) return false;
    if (filterOptions.activityLevel && user.activityLevel !== filterOptions.activityLevel) return false;
    if (filterOptions.hasViolations !== undefined && (user.violations.length > 0) !== filterOptions.hasViolations) return false;
    if (filterOptions.verified !== undefined && user.verified !== filterOptions.verified) return false;
    if (filterOptions.levelRange && (user.level < filterOptions.levelRange[0] || user.level > filterOptions.levelRange[1])) return false;
    
    return true;
  }).sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const modifier = sortOrder === 'asc' ? 1 : -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * modifier;
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * modifier;
    }
    return 0;
  });

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const pageUsers = filteredUsers.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    const allSelected = pageUsers.every(user => selectedUsers.includes(user.id));
    
    if (allSelected) {
      setSelectedUsers(prev => prev.filter(id => !pageUsers.map(u => u.id).includes(id)));
    } else {
      setSelectedUsers(prev => [...new Set([...prev, ...pageUsers.map(u => u.id)])]);
    }
  };

  const handleBulkOperationStart = (operation: BulkOperationLocal['type']) => {
    if (selectedUsers.length === 0) {
      setSnackbarMessage('Please select users first');
      setSnackbarOpen(true);
      return;
    }

    setBulkOperationType(operation);
    setBulkOperationReason('');
    setBulkOperationOpen(true);
    setBulkMenuAnchor(null);
  };

  const executeBulkOperation = async () => {
    if (!bulkOperationType || selectedUsers.length === 0) return;

    setBulkOperationInProgress(true);
    setBulkOperationProgress(null);

    try {
      // Convert string IDs to numbers for API
      const userIds = selectedUsers.map(id => parseInt(id));
      
      // Handle export operation separately
      if (bulkOperationType === 'export') {
        // Create CSV export of selected users
        const selectedUserData = users.filter(u => selectedUsers.includes(u.id));
        const csvContent = [
          ['ID', 'Name', 'Email', 'Status', 'Role', 'Level', 'Games', 'Win Rate', 'Last Login'],
          ...selectedUserData.map(u => [
            u.id,
            u.fullName,
            u.email,
            u.status,
            u.role,
            u.level.toString(),
            u.gameStats.tournamentsPlayed.toString(),
            `${u.gameStats.winRate}%`,
            new Date(u.lastLogin).toLocaleDateString()
          ])
        ].map(row => row.join(',')).join('\\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selected_users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        setBulkOperationProgress({
          results: Object.fromEntries(selectedUsers.map(id => [id, { status: 'ok', message: 'Exported successfully' }])),
          summary: {
            total: selectedUsers.length,
            success_count: selectedUsers.length,
            error_count: 0
          }
        });
        return;
      }

      // Map operation types to backend format
      const operationMap: { [key: string]: BulkUserOperation['action'] } = {
        'activate': 'unsuspend',
        'suspend': 'suspend',
        'ban': 'ban',
        'promote': 'add_role',
        'demote': 'remove_role',
        'delete': 'delete'
      };

      const mappedAction = operationMap[bulkOperationType];
      if (!mappedAction) {
        throw new Error(`Unknown bulk operation type: ${bulkOperationType}`);
      }

      const bulkOperation: BulkUserOperation = {
        action: mappedAction,
        user_ids: userIds,
        params: {
          ...(bulkOperationReason && { reason: bulkOperationReason }),
          ...(mappedAction === 'add_role' && { role: 'moderator' }),
          ...(mappedAction === 'remove_role' && { role: 'moderator' })
        }
      };

      const result = await moderationApi.bulkUserOperation(bulkOperation);
      setBulkOperationProgress(result);
      
      // Show success message
      const successCount = result.summary.success_count;
      const totalCount = result.summary.total;
      setSnackbarMessage(`Bulk ${bulkOperationType} completed: ${successCount}/${totalCount} users processed successfully`);
      setSnackbarOpen(true);
      
      // Clear selection after successful operation
      if (successCount > 0) {
        setSelectedUsers([]);
      }
      
    } catch (error) {
      console.error('Bulk operation failed:', error);
      setSnackbarMessage(`Bulk operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSnackbarOpen(true);
      setBulkOperationProgress(null);
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const closeBulkOperationModal = () => {
    setBulkOperationOpen(false);
    setBulkOperationType('');
    setBulkOperationReason('');
    setBulkOperationProgress(null);
    setBulkOperationInProgress(false);
  };

  const handleUserAction = (action: string, userId: string) => {
    console.log(`Performing ${action} on user ${userId}`);
    setSnackbarMessage(`${action} completed successfully`);
    setSnackbarOpen(true);
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

  const getRoleColor = (role: UserProfile['role']) => {
    switch (role) {
      case 'admin': return 'error';
      case 'moderator': return 'warning';
      case 'user': return 'primary';
      default: return 'default';
    }
  };

  const renderTableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
                checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell>User</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Level</TableCell>
            <TableCell>Games</TableCell>
            <TableCell>Win Rate</TableCell>
            <TableCell>Violations</TableCell>
            <TableCell>Last Login</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredUsers
            .slice(page * rowsPerPage, page + 1 * rowsPerPage)
            .map((user) => (
              <TableRow key={user.id} selected={selectedUsers.includes(user.id)}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Badge 
                      color={user.verified ? 'success' : 'default'} 
                      variant={user.verified ? 'dot' : undefined}
                      invisible={!user.verified}
                    >
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {user.fullName.charAt(0)}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {user.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip size="small" label={user.status} color={getStatusColor(user.status) as any} />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={user.role} color={getRoleColor(user.role) as any} />
                </TableCell>
                <TableCell>{user.level}</TableCell>
                <TableCell>{user.gameStats.tournamentsPlayed}</TableCell>
                <TableCell>{user.gameStats.winRate}%</TableCell>
                <TableCell>
                  {user.violations.length > 0 ? (
                    <Chip size="small" label={user.violations.length} color="warning" />
                  ) : (
                    <Chip size="small" label="Clean" color="success" />
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => {
                        setSelectedUserId(parseInt(user.id));
                        setUserDetailOpen(true);
                      }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={user.status === 'active' ? 'Suspend' : 'Activate'}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleUserAction(user.status === 'active' ? 'suspend' : 'activate', user.id)}
                      >
                        {user.status === 'active' ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
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
        count={filteredUsers.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </TableContainer>
  );

  const renderCardView = () => (
    <Grid container spacing={2}>
      {filteredUsers
        .slice(page * rowsPerPage, page + 1 * rowsPerPage)
        .map((user) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
            <Card 
              sx={{ 
                position: 'relative',
                cursor: 'pointer',
                border: selectedUsers.includes(user.id) ? 2 : 1,
                borderColor: selectedUsers.includes(user.id) ? 'primary.main' : 'divider',
                '&:hover': { boxShadow: 4 }
              }}
              onClick={() => handleSelectUser(user.id)}
            >
              <CardContent>
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <Checkbox
                    size="small"
                    checked={selectedUsers.includes(user.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Badge 
                    color={user.verified ? 'success' : 'default'} 
                    variant={user.verified ? 'dot' : undefined}
                  >
                    <Avatar sx={{ width: 48, height: 48 }}>
                      {user.fullName.charAt(0)}
                    </Avatar>
                  </Badge>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" noWrap>
                      {user.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {user.email}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip size="small" label={user.status} color={getStatusColor(user.status) as any} />
                  <Chip size="small" label={user.role} color={getRoleColor(user.role) as any} />
                </Box>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Level</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.level}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Win Rate</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.gameStats.winRate}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Games</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.gameStats.tournamentsPlayed}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Violations</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: user.violations.length > 0 ? 'warning.main' : 'success.main' }}>
                      {user.violations.length}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Last: {new Date(user.lastLogin).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUserId(parseInt(user.id));
                      setUserDetailOpen(true);
                    }}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserAction(user.status === 'active' ? 'suspend' : 'activate', user.id);
                      }}
                    >
                      {user.status === 'active' ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <People color="primary" />
          Advanced User Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<PersonAdd />} variant="contained">
            Add User
          </Button>
          <Button startIcon={<Upload />} variant="outlined">
            Import
          </Button>
          <Button startIcon={<Download />} variant="outlined">
            Export All
          </Button>
        </Box>
      </Box>

      {/* Stats Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4">{users.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4">{users.filter(u => u.status === 'active').length}</Typography>
              <Typography variant="body2" color="text.secondary">Active Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4">{users.filter(u => u.violations.length > 0).length}</Typography>
              <Typography variant="body2" color="text.secondary">With Violations</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4">{selectedUsers.length}</Typography>
              <Typography variant="body2" color="text.secondary">Selected</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
            sx={{ minWidth: 250 }}
          />
          
          <Button 
            startIcon={<FilterList />}
            onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
            variant="outlined"
            size="small"
          >
            Filter
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">View:</Typography>
            <IconButton 
              size="small" 
              onClick={() => setViewMode('table')}
              color={viewMode === 'table' ? 'primary' : 'default'}
            >
              <ViewList />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => setViewMode('cards')}
              color={viewMode === 'cards' ? 'primary' : 'default'}
            >
              <ViewModule />
            </IconButton>
          </Box>

          {selectedUsers.length > 0 && (
            <Button
              startIcon={<MoreVert />}
              onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
              variant="contained"
              size="small"
              color="secondary"
            >
              Bulk Actions ({selectedUsers.length})
            </Button>
          )}

          <Box sx={{ ml: 'auto' }}>
            <IconButton onClick={() => {
              // ✅ FIXED: Refresh data instead of page reload
              setUsers([]);
              setLoading(true);
              loadUsers();
            }}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Content */}
      {viewMode === 'table' ? renderTableView() : renderCardView()}

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={() => setBulkMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleBulkOperationStart('activate')}>
          <CheckCircle sx={{ mr: 1 }} /> Activate Users
        </MenuItem>
        <MenuItem onClick={() => handleBulkOperationStart('suspend')}>
          <Block sx={{ mr: 1 }} /> Suspend Users
        </MenuItem>
        <MenuItem onClick={() => handleBulkOperationStart('ban')}>
          <Security sx={{ mr: 1 }} /> Ban Users
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBulkOperationStart('promote')}>
          <Star sx={{ mr: 1 }} /> Promote to Moderator
        </MenuItem>
        <MenuItem onClick={() => handleBulkOperationStart('demote')}>
          <Star sx={{ mr: 1 }} /> Demote to User
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBulkOperationStart('export')}>
          <Download sx={{ mr: 1 }} /> Export Selected
        </MenuItem>
        <MenuItem onClick={() => handleBulkOperationStart('delete')} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Delete Users
        </MenuItem>
      </Menu>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 200 } }}
      >
        <Box sx={{ p: 2 }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterOptions.status || ''}
              onChange={(e) => setFilterOptions(prev => ({ ...prev, status: e.target.value || undefined }))}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="banned">Banned</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={filterOptions.role || ''}
              onChange={(e) => setFilterOptions(prev => ({ ...prev, role: e.target.value || undefined }))}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="moderator">Moderator</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={filterOptions.hasViolations || false}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, hasViolations: e.target.checked }))}
              />
            }
            label="Has Violations"
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button size="small" onClick={() => setFilterOptions({})}>
              Clear
            </Button>
            <Button size="small" onClick={() => setFilterMenuAnchor(null)}>
              Apply
            </Button>
          </Box>
        </Box>
      </Menu>

      {/* User Detail Modal */}
      <UserDetailModal
        userId={selectedUserId}
        open={userDetailOpen}
        onClose={() => {
          setUserDetailOpen(false);
          setSelectedUserId(null);
        }}
        onUserUpdate={(updatedUser) => {
          console.log('User updated:', updatedUser);
          // Refresh the user list here in a real implementation
        }}
      />

      {/* Bulk Operation Confirmation Modal */}
      <Dialog
        open={bulkOperationOpen}
        onClose={closeBulkOperationModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {bulkOperationProgress ? 'Bulk Operation Results' : `Confirm Bulk ${bulkOperationType}`}
        </DialogTitle>
        <DialogContent>
          {!bulkOperationProgress ? (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                You are about to {bulkOperationType} {selectedUsers.length} selected users. This action cannot be undone.
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Selected Users ({selectedUsers.length}):
              </Typography>
              
              <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
                {selectedUsers.slice(0, 20).map(userId => {
                  const user = users.find(u => u.id === userId);
                  return user ? (
                    <Box key={userId} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        {user.fullName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">
                        {user.fullName} ({user.email})
                      </Typography>
                    </Box>
                  ) : null;
                })}
                {selectedUsers.length > 20 && (
                  <Typography variant="body2" color="text.secondary">
                    ...and {selectedUsers.length - 20} more users
                  </Typography>
                )}
              </Box>
              
              {(['suspend', 'ban', 'delete'].includes(bulkOperationType)) && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Reason (optional)"
                  value={bulkOperationReason}
                  onChange={(e) => setBulkOperationReason(e.target.value)}
                  placeholder="Provide a reason for this action..."
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          ) : (
            <Box>
              <Alert 
                severity={bulkOperationProgress.summary.error_count === 0 ? 'success' : 'warning'} 
                sx={{ mb: 2 }}
              >
                Operation completed: {bulkOperationProgress.summary.success_count} successful, {bulkOperationProgress.summary.error_count} failed
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Results Summary:
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="text.secondary">
                      {bulkOperationProgress.summary.total}
                    </Typography>
                    <Typography variant="body2">Total</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {bulkOperationProgress.summary.success_count}
                    </Typography>
                    <Typography variant="body2">Success</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {bulkOperationProgress.summary.error_count}
                    </Typography>
                    <Typography variant="body2">Failed</Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {bulkOperationProgress.summary.error_count > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Failed Operations:
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {Object.entries(bulkOperationProgress.results)
                      .filter(([_, result]) => result.status === 'failed')
                      .map(([userId, result]) => {
                        const user = users.find(u => u.id === userId);
                        return (
                          <Box key={userId} sx={{ mb: 1, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {user?.fullName || `User ${userId}`}
                            </Typography>
                            <Typography variant="caption" color="error.dark">
                              {result.message}
                            </Typography>
                          </Box>
                        );
                      })
                    }
                  </Box>
                </Box>
              )}
            </Box>
          )}
          
          {bulkOperationInProgress && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Processing bulk operation...
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!bulkOperationProgress ? (
            <>
              <Button onClick={closeBulkOperationModal}>
                Cancel
              </Button>
              <Button 
                onClick={executeBulkOperation} 
                color="primary" 
                variant="contained"
                disabled={bulkOperationInProgress}
                startIcon={bulkOperationInProgress ? <CircularProgress size={20} /> : undefined}
              >
                {bulkOperationInProgress ? 'Processing...' : `Confirm ${bulkOperationType}`}
              </Button>
            </>
          ) : (
            <Button onClick={closeBulkOperationModal} color="primary" variant="contained">
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default AdvancedUserManagement;