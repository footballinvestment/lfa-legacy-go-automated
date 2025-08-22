import React, { useState, useCallback } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
} from "@mui/material";
import {
  Search,
  PersonAdd,
  EmojiEvents,
  Block,
  MoreVert,
  Star,
  TrendingUp,
} from "@mui/icons-material";
import { debounce } from "lodash";
import { socialService, User } from "../../services/api";

const UserSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await socialService.searchUsers(query);
        setSearchResults(results);
      } catch (err: any) {
        setError(err.message || "Failed to search users");
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleAddFriend = async (userId: number) => {
    try {
      await socialService.sendFriendRequest(userId);
      // Update the UI to show request sent
      setSearchResults((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, friendship_status: "request_sent" }
            : user
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to send friend request");
    }
  };

  const handleSendChallenge = async (userId: number) => {
    try {
      await socialService.sendChallenge(userId, "football");
      // Show success message or navigate to challenge details
    } catch (err: any) {
      setError(err.message || "Failed to send challenge");
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    user: User
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const getUserLevel = (user: User) => {
    return user.level || 1;
  };

  const getUserWinRate = (user: User) => {
    if (!user.games_played || user.games_played === 0) return 0;
    return ((user.games_won || 0) / user.games_played) * 100;
  };

  const getFriendshipStatusColor = (status?: string) => {
    switch (status) {
      case "friends":
        return "success";
      case "request_sent":
        return "warning";
      case "request_received":
        return "info";
      default:
        return "default";
    }
  };

  const getFriendshipStatusText = (status?: string) => {
    switch (status) {
      case "friends":
        return "Friends";
      case "request_sent":
        return "Request Sent";
      case "request_received":
        return "Request Received";
      default:
        return "Not Connected";
    }
  };

  return (
    <Box>
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search players by username or name..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {loading && <LinearProgress />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Search Results */}
      {searchQuery.length >= 2 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Search Results ({searchResults.length})
          </Typography>

          {loading ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Skeleton variant="circular" width={48} height={48} />
                        <Box sx={{ ml: 2, flex: 1 }}>
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" width="40%" />
                        </Box>
                      </Box>
                      <Skeleton variant="rectangular" height={36} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : searchResults.length > 0 ? (
            <Grid container spacing={2}>
              {searchResults.map((user) => (
                <Grid key={user.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: "100%",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: 3,
                      },
                    }}
                  >
                    <CardContent>
                      {/* User Header */}
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: "primary.main",
                            fontSize: "1.2rem",
                            fontWeight: "bold",
                          }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ ml: 2, flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold" noWrap>
                            {user.full_name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            @{user.username}
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={(e) => handleMenuClick(e, user)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>

                      {/* User Stats */}
                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <Star
                            sx={{ color: "warning.main", mr: 1, fontSize: 20 }}
                          />
                          <Typography variant="body2">
                            Level {getUserLevel(user)}
                          </Typography>
                          <Chip
                            label={`${getUserWinRate(user).toFixed(1)}% Win Rate`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ ml: "auto" }}
                          />
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <TrendingUp
                            sx={{ color: "success.main", mr: 1, fontSize: 20 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {user.games_played || 0} games played
                          </Typography>
                        </Box>
                      </Box>

                      {/* Friendship Status */}
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={getFriendshipStatusText(
                            user.friendship_status
                          )}
                          color={getFriendshipStatusColor(
                            user.friendship_status
                          )}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {user.friendship_status === "friends" ? (
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<EmojiEvents />}
                            onClick={() => handleSendChallenge(user.id)}
                            color="secondary"
                          >
                            Challenge
                          </Button>
                        ) : user.friendship_status === "request_sent" ? (
                          <Button variant="outlined" fullWidth disabled>
                            Request Sent
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<PersonAdd />}
                            onClick={() => handleAddFriend(user.id)}
                          >
                            Add Friend
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Search sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No players found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try searching with a different username or name
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Empty State */}
      {searchQuery.length < 2 && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <PersonAdd sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Find New Players
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search for players by username or name to connect and challenge
            them!
          </Typography>
        </Box>
      )}

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>View Profile</MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Block sx={{ mr: 1 }} />
          Block User
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserSearch;
