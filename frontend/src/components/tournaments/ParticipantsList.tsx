import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Menu,
  MenuItem as MenuOption,
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Star,
  TrendingUp,
  EmojiEvents,
  Person,
  Close,
} from '@mui/icons-material';

interface Participant {
  user_id: number;
  username: string;
  full_name: string;
  level: number;
  games_played: number;
  games_won: number;
  win_rate: number;
  registration_date: string;
  seed?: number;
  is_online?: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
  tournamentId: number;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  tournamentId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('registration_date');
  const [filterLevel, setFilterLevel] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [profileDialog, setProfileDialog] = useState(false);

  // Filter and sort participants
  const filteredAndSortedParticipants = React.useMemo(() => {
    let filtered = participants.filter(participant => {
      const matchesSearch = !searchQuery || 
        participant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        participant.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLevel = !filterLevel || participant.level.toString() === filterLevel;
      
      return matchesSearch && matchesLevel;
    });

    // Sort participants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'level':
          return b.level - a.level;
        case 'win_rate':
          return b.win_rate - a.win_rate;
        case 'games_played':
          return b.games_played - a.games_played;
        case 'username':
          return a.username.localeCompare(b.username);
        case 'registration_date':
        default:
          return new Date(a.registration_date).getTime() - new Date(b.registration_date).getTime();
      }
    });

    return filtered;
  }, [participants, searchQuery, sortBy, filterLevel]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, participant: Participant) => {
    setAnchorEl(event.currentTarget);
    setSelectedParticipant(participant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedParticipant(null);
  };

  const handleViewProfile = () => {
    setProfileDialog(true);
    handleMenuClose();
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'success';
    if (winRate >= 50) return 'warning';
    return 'error';
  };

  const getLevelColor = (level: number) => {
    if (level >= 20) return 'error';
    if (level >= 10) return 'warning';
    return 'primary';
  };

  const uniqueLevels = [...new Set(participants.map(p => p.level))].sort((a, b) => a - b);

  return (
    <Box>
      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
            size="small"
          />
          
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            Filters
          </Button>
        </Box>

        {/* Filter Controls */}
        {showFilters && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="registration_date">Registration</MenuItem>
                <MenuItem value="level">Level</MenuItem>
                <MenuItem value="win_rate">Win Rate</MenuItem>
                <MenuItem value="games_played">Games Played</MenuItem>
                <MenuItem value="username">Username</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Level</InputLabel>
              <Select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                label="Level"
              >
                <MenuItem value="">All Levels</MenuItem>
                {uniqueLevels.map(level => (
                  <MenuItem key={level} value={level.toString()}>
                    Level {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="text"
              onClick={() => {
                setSearchQuery('');
                setFilterLevel('');
                setSortBy('registration_date');
              }}
              size="small"
            >
              Clear All
            </Button>
          </Box>
        )}
      </Box>

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {filteredAndSortedParticipants.length} of {participants.length} participants
      </Typography>

      {/* Participants Grid */}
      {filteredAndSortedParticipants.length > 0 ? (
        <Grid container spacing={2}>
          {filteredAndSortedParticipants.map((participant, index) => (
            <Grid key={participant.user_id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent>
                  {/* Participant Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{ 
                        width: 40, 
                        height: 40,
                        bgcolor: 'primary.main',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        mr: 2,
                      }}
                    >
                      {participant.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" noWrap>
                        {participant.full_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        @{participant.username}
                      </Typography>
                    </Box>
                    <IconButton 
                      onClick={(e) => handleMenuClick(e, participant)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  {/* Registration Order */}
                  {index < 3 && (
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={`#${index + 1} Early Bird`}
                        color="secondary"
                        size="small"
                        icon={<EmojiEvents />}
                      />
                    </Box>
                  )}

                  {/* Participant Stats */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip
                        label={`Level ${participant.level}`}
                        color={getLevelColor(participant.level)}
                        size="small"
                        icon={<Star />}
                      />
                      <Chip
                        label={`${participant.win_rate.toFixed(1)}%`}
                        color={getWinRateColor(participant.win_rate)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUp sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {participant.games_played} games • {participant.games_won} wins
                      </Typography>
                    </Box>
                  </Box>

                  {/* Win Rate Progress */}
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Win Rate
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={participant.win_rate}
                      color={getWinRateColor(participant.win_rate)}
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No participants found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      )}

      {/* Participant Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuOption onClick={handleViewProfile}>
          <Person sx={{ mr: 1 }} />
          View Profile
        </MenuOption>
        <MenuOption onClick={handleMenuClose}>
          <EmojiEvents sx={{ mr: 1 }} />
          Send Challenge
        </MenuOption>
      </Menu>

      {/* Profile Dialog */}
      <Dialog 
        open={profileDialog} 
        onClose={() => setProfileDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Player Profile
          <IconButton onClick={() => setProfileDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedParticipant && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{ 
                    width: 64, 
                    height: 64,
                    bgcolor: 'primary.main',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    mr: 3,
                  }}
                >
                  {selectedParticipant.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedParticipant.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{selectedParticipant.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Level {selectedParticipant.level}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="h4" color="primary">
                      {selectedParticipant.games_played}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Games Played
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="h4" color="success.main">
                      {selectedParticipant.win_rate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Win Rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ParticipantsList;