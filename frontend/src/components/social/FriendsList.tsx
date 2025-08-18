import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  EmojiEvents,
  PersonRemove,
  MoreVert,
  Refresh,
  Search,
  Message,
  Star,
  TrendingUp,
  Block,
  Report,
  Visibility,
} from '@mui/icons-material';
import { socialService, Friend } from '../../services/api';

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    friendId: number | null;
    friendName: string;
  }>({
    open: false,
    friendId: null,
    friendName: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const loadFriends = async () => {
    setLoading(true);
    setError(null);
    try {
      const friendsData = await socialService.getFriends();
      setFriends(friendsData);
      setFilteredFriends(friendsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    // Filter friends based on search query
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  const handleRemoveFriend = async (friendId: number) => {
    try {
      await socialService.removeFriend(friendId);
      setFriends(prev => prev.filter(friend => friend.user_id !== friendId));
      setConfirmDialog({ open: false, friendId: null, friendName: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to remove friend');
    }
  };

  const handleSendChallenge = async (friendId: number) => {
    try {
      await socialService.sendChallenge(friendId, 'football');
      // Show success message or navigate to challenge details
    } catch (err: any) {
      setError(err.message || 'Failed to send challenge');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, friend: Friend) => {
    setAnchorEl(event.currentTarget);
    setSelectedFriend(friend);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFriend(null);
  };

  const getOnlineStatusColor = (isOnline: boolean) => {
    return isOnline ? 'success' : 'default';
  };

  const getOnlineStatusText = (isOnline: boolean, lastActive: string) => {
    if (isOnline) return 'Online';
    try {
      const lastActiveDate = new Date(lastActive);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Active recently';
      if (diffHours < 24) return `Active ${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `Active ${diffDays}d ago`;
    } catch {
      return 'Offline';
    }
  };

  return (
    <Box>
      {/* Header with Search */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">My Friends ({friends.length})</Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={loadFriends} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
        
        <TextField
          fullWidth
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Friends Grid */}
      {filteredFriends.length > 0 ? (
        <Grid container spacing={2}>
          {filteredFriends.map((friend) => (
            <Grid key={friend.user_id} size={{ xs: 12, sm: 6, md: 4 }}>
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
                  {/* Friend Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{ 
                        width: 48, 
                        height: 48,
                        bgcolor: 'primary.main',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {friend.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ ml: 2, flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {friend.full_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        @{friend.username}
                      </Typography>
                    </Box>
                    <IconButton 
                      onClick={(e) => handleMenuClick(e, friend)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  {/* Online Status */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={getOnlineStatusText(friend.is_online, friend.last_active)}
                      color={getOnlineStatusColor(friend.is_online)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {/* Friend Stats */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Star sx={{ color: 'warning.main', mr: 1, fontSize: 16 }} />
                      <Typography variant="body2" color="text.secondary">
                        Level {friend.level}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUp sx={{ color: 'success.main', mr: 1, fontSize: 16 }} />
                      <Typography variant="body2" color="text.secondary">
                        {friend.win_rate.toFixed(1)}% Win Rate
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {friend.games_played} games played
                    </Typography>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<EmojiEvents />}
                      onClick={() => handleSendChallenge(friend.user_id)}
                      sx={{ flex: 1 }}
                      size="small"
                    >
                      Challenge
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Message />}
                      sx={{ flex: 1 }}
                      size="small"
                    >
                      Message
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : friends.length === 0 && !loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
            👥
          </Avatar>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No friends yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start connecting with other players to build your network!
          </Typography>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No friends found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search terms
          </Typography>
        </Box>
      )}

      {/* Friend Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Visibility sx={{ mr: 1 }} />
          View Profile
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Message sx={{ mr: 1 }} />
          Send Message
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EmojiEvents sx={{ mr: 1 }} />
          Send Challenge
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Report sx={{ mr: 1 }} />
          Report User
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Block sx={{ mr: 1 }} />
          Block User
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedFriend) {
              setConfirmDialog({
                open: true,
                friendId: selectedFriend.user_id,
                friendName: selectedFriend.full_name,
              });
            }
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <PersonRemove sx={{ mr: 1 }} />
          Remove Friend
        </MenuItem>
      </Menu>

      {/* Remove Friend Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, friendId: null, friendName: '' })}>
        <DialogTitle>Remove Friend</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove {confirmDialog.friendName} from your friends list?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, friendId: null, friendName: '' })}>
            Cancel
          </Button>
          <Button 
            onClick={() => confirmDialog.friendId && handleRemoveFriend(confirmDialog.friendId)} 
            color="error"
            variant="contained"
          >
            Remove Friend
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FriendsList;
