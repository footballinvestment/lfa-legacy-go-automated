import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Badge,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Skeleton,
  Alert,
  Snackbar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  EmojiEvents,
  Add,
  Menu as MenuIcon,
  Search,
  FilterList,
  LocationOn,
  Schedule,
  People,
  Star,
  Share,
  QrCode,
  Notifications,
  MoreVert,
  ArrowBack,
  Refresh,
  TrendingUp,
  SportsSoccer,
  Timer,
  CheckCircle,
  Cancel,
  Person,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { Tournament, TournamentStatus, MatchStatus } from '../../types/tournament';
import { useAuth } from '../../contexts/AuthContext';
import ErrorBoundary from '../common/ErrorBoundary';

// Slide transition for mobile dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Mobile-optimized tournament card component
interface MobileTournamentCardProps {
  tournament: Tournament;
  onJoin: (tournament: Tournament) => void;
  onView: (tournament: Tournament) => void;
  onShare: (tournament: Tournament) => void;
}

const MobileTournamentCard: React.FC<MobileTournamentCardProps> = ({
  tournament,
  onJoin,
  onView,
  onShare
}) => {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  
  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case 'upcoming': return theme.palette.info.main;
      case 'active': return theme.palette.success.main;
      case 'completed': return theme.palette.grey[500];
      default: return theme.palette.text.secondary;
    }
  };

  const getStatusIcon = (status: TournamentStatus) => {
    switch (status) {
      case 'upcoming': return <Schedule fontSize="small" />;
      case 'active': return <Timer fontSize="small" />;
      case 'completed': return <CheckCircle fontSize="small" />;
      default: return <Cancel fontSize="small" />;
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s ease-in-out',
        '&:active': {
          transform: 'scale(0.98)',
        },
        position: 'relative',
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography 
              variant="h6" 
              component="h3" 
              sx={{ 
                fontSize: '1.1rem',
                fontWeight: 600,
                lineHeight: 1.3,
                mb: 0.5
              }}
            >
              {tournament.name}
            </Typography>
            
            <Chip
              icon={getStatusIcon(tournament.status)}
              label={tournament.status.toUpperCase()}
              size="small"
              sx={{
                backgroundColor: getStatusColor(tournament.status),
                color: 'white',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            />
          </Box>
          
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{ mt: -1, mr: -1 }}
          >
            <MoreVert />
          </IconButton>
          
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem onClick={() => { onShare(tournament); setMenuAnchor(null); }}>
              <Share sx={{ mr: 1 }} fontSize="small" />
              Share
            </MenuItem>
            <MenuItem onClick={() => { setMenuAnchor(null); }}>
              <QrCode sx={{ mr: 1 }} fontSize="small" />
              QR Code
            </MenuItem>
          </Menu>
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={1.5} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={0.5}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {tournament.location}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={0.5}>
            <People fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {tournament.currentParticipants}/{tournament.maxParticipants}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={0.5}>
            <Star fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              ${tournament.entryFee}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {new Date(tournament.startDate).toLocaleDateString()} at{' '}
            {new Date(tournament.startDate).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
          
          {tournament.prizePool && (
            <Chip
              label={`$${tournament.prizePool} Prize`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => onView(tournament)}
          sx={{ mr: 1, borderRadius: 2 }}
        >
          View Details
        </Button>
        
        {tournament.status === 'upcoming' && (
          <Button
            variant="contained"
            size="small"
            onClick={() => onJoin(tournament)}
            disabled={tournament.currentParticipants >= tournament.maxParticipants}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {tournament.currentParticipants >= tournament.maxParticipants ? 'Full' : 'Join'}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

// Main mobile tournament interface component
const MobileTournamentInterface: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const isAuthenticated = user !== null;
  
  // State management
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');

  // Mock tournament data - replace with API call
  const mockTournaments: Tournament[] = useMemo(() => [
    {
      id: 1,
      name: "Friday Night Football Championship",
      description: "Weekly competitive tournament for serious players",
      location: "Central Park, NYC",
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 172800000).toISOString(),
      maxParticipants: 16,
      currentParticipants: 12,
      entryFee: 25,
      prizePool: 300,
      status: 'upcoming' as TournamentStatus,
      organizerId: 1,
      organizerName: "NYC Football League",
      rules: "Standard tournament rules apply",
      format: "Single elimination",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Beginner Friendly Match",
      description: "Perfect for new players to get started",
      location: "Brooklyn Fields",
      startDate: new Date(Date.now() + 7200000).toISOString(),
      endDate: new Date(Date.now() + 21600000).toISOString(),
      maxParticipants: 8,
      currentParticipants: 6,
      entryFee: 10,
      prizePool: 60,
      status: 'active' as TournamentStatus,
      organizerId: 2,
      organizerName: "Brooklyn Sports Club",
      rules: "Beginner rules - no slide tackles",
      format: "Round robin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      name: "Elite Sunday Showdown",
      description: "High-stakes tournament for pro players",
      location: "Manhattan Sports Complex",
      startDate: new Date(Date.now() - 86400000).toISOString(),
      endDate: new Date(Date.now() - 43200000).toISOString(),
      maxParticipants: 32,
      currentParticipants: 32,
      entryFee: 50,
      prizePool: 1200,
      status: 'completed' as TournamentStatus,
      organizerId: 3,
      organizerName: "Elite Football Society",
      rules: "Professional tournament rules",
      format: "Double elimination",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ], []);

  // Filter tournaments based on active tab
  const filteredTournaments = useMemo(() => {
    if (filterType === 'all') return tournaments;
    return tournaments.filter(t => t.status === filterType);
  }, [tournaments, filterType]);

  // Load tournaments
  const loadTournaments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTournaments(mockTournaments);
    } catch (err) {
      setError('Failed to load tournaments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [mockTournaments]);

  // Refresh tournaments
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
    showSnackbar('Tournaments refreshed');
  }, [loadTournaments]);

  // Show snackbar message
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // Handle tournament join
  const handleJoinTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setJoinDialogOpen(true);
  };

  // Handle tournament view
  const handleViewTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setDetailsOpen(true);
  };

  // Handle tournament share
  const handleShareTournament = async (tournament: Tournament) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tournament.name,
          text: tournament.description,
          url: window.location.href + `/tournament/${tournament.id}`
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`Check out this tournament: ${tournament.name} - ${window.location.href}/tournament/${tournament.id}`);
      showSnackbar('Tournament link copied to clipboard!');
    }
  };

  // Confirm join tournament
  const confirmJoinTournament = () => {
    if (!selectedTournament) return;
    
    // Mock join logic
    showSnackbar(`Successfully joined ${selectedTournament.name}!`);
    setJoinDialogOpen(false);
    setSelectedTournament(null);
  };

  // Load tournaments on mount
  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  // Tab change handler
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    const filters: Array<'all' | 'upcoming' | 'active' | 'completed'> = ['all', 'upcoming', 'active', 'completed'];
    setFilterType(filters[newValue]);
  };

  // Mobile drawer menu items
  const drawerItems = [
    { text: 'My Tournaments', icon: <EmojiEvents />, action: () => {} },
    { text: 'Search', icon: <Search />, action: () => {} },
    { text: 'Notifications', icon: <Notifications />, badge: 3, action: () => {} },
    { text: 'Profile', icon: <Person />, action: () => {} },
  ];

  // Render skeleton loading
  const renderSkeleton = () => (
    <Box>
      {[1, 2, 3].map((i) => (
        <Card key={i} sx={{ mb: 2, borderRadius: 3 }}>
          <CardContent>
            <Skeleton variant="text" width="80%" height={32} />
            <Skeleton variant="rectangular" width={80} height={24} sx={{ mb: 1, borderRadius: 2 }} />
            <Box display="flex" gap={1} mb={1}>
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={80} />
              <Skeleton variant="text" width={60} />
            </Box>
            <Skeleton variant="text" width="60%" />
          </CardContent>
          <CardActions>
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 2 }} />
          </CardActions>
        </Card>
      ))}
    </Box>
  );

  return (
    <ErrorBoundary>
      <Box sx={{ pb: 8 }}> {/* Bottom padding for mobile navigation */}
        {/* Mobile App Bar */}
        <AppBar 
          position="sticky" 
          sx={{ 
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
                Tournaments
              </Typography>
            </Box>
            
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
            
            <IconButton>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Toolbar>
          
          {refreshing && <LinearProgress />}
        </AppBar>

        {/* Tournament Filter Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab label="All" />
            <Tab label="Upcoming" />
            <Tab label="Active" />
            <Tab label="Completed" />
          </Tabs>
        </Box>

        {/* Main Content */}
        <Container maxWidth="sm" sx={{ px: 2, py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            renderSkeleton()
          ) : filteredTournaments.length === 0 ? (
            <Box textAlign="center" py={8}>
              <SportsSoccer sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tournaments found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {filterType === 'all' 
                  ? 'Check back later for new tournaments!' 
                  : `No ${filterType} tournaments available.`
                }
              </Typography>
            </Box>
          ) : (
            <Box>
              {filteredTournaments.map((tournament) => (
                <MobileTournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onJoin={handleJoinTournament}
                  onView={handleViewTournament}
                  onShare={handleShareTournament}
                />
              ))}
            </Box>
          )}
        </Container>

        {/* Floating Action Button */}
        {isAuthenticated && (
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              zIndex: 1000
            }}
          >
            <Add />
          </Fab>
        )}

        {/* Mobile Navigation Drawer */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              borderTopRightRadius: 16,
              borderBottomRightRadius: 16,
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Avatar sx={{ width: 48, height: 48 }}>
                {user?.full_name?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {user?.full_name || 'Guest User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email || 'Not signed in'}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <List>
            {drawerItems.map((item) => (
              <ListItemButton key={item.text} onClick={item.action}>
                <ListItemIcon>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>

        {/* Join Tournament Dialog */}
        <Dialog
          open={joinDialogOpen}
          onClose={() => setJoinDialogOpen(false)}
          TransitionComponent={Transition}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            Join Tournament
          </DialogTitle>
          <DialogContent>
            {selectedTournament && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedTournament.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedTournament.description}
                </Typography>
                <Box display="flex" gap={2} mb={2}>
                  <Chip label={`Entry Fee: $${selectedTournament.entryFee}`} />
                  <Chip label={`Prize: $${selectedTournament.prizePool}`} color="primary" />
                </Box>
                <Alert severity="info">
                  By joining this tournament, you agree to pay the entry fee and follow all tournament rules.
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setJoinDialogOpen(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmJoinTournament}
              variant="contained"
              sx={{ minWidth: 120 }}
            >
              Confirm Join
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ mb: 8 }} // Above mobile navigation
        />
      </Box>
    </ErrorBoundary>
  );
};

export default MobileTournamentInterface;