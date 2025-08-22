import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Skeleton,
  Alert,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
  Fade,
  useTheme,
  alpha,
} from "@mui/material";
import {
  ViewList,
  ViewModule,
  Launch,
  Bookmark,
  BookmarkBorder,
  Share,
  MoreVert,
  LocationOn,
  Schedule,
  People,
  Star,
  EmojiEvents,
  Person,
  SportsSoccer,
} from "@mui/icons-material";
import {
  SearchResponse,
  SearchResult,
  SearchCategory,
} from "../../types/search";
import useMobileViewport from "../../hooks/useMobileViewport";

interface SearchResultsProps {
  results: SearchResponse | null;
  isLoading: boolean;
  error: string | null;
  onResultSelect?: (result: SearchResult) => void;
  compact?: boolean;
  showPagination?: boolean;
  viewMode?: "list" | "grid";
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  error,
  onResultSelect,
  compact = false,
  showPagination = true,
  viewMode: initialViewMode = "list",
}) => {
  const theme = useTheme();
  const { isMobile } = useMobileViewport();
  const [viewMode, setViewMode] = useState<"list" | "grid">(initialViewMode);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedResults, setBookmarkedResults] = useState<Set<string>>(
    new Set()
  );

  // Handle view mode change
  const handleViewModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newViewMode: "list" | "grid" | null
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = (resultId: string) => {
    const newBookmarked = new Set(bookmarkedResults);
    if (newBookmarked.has(resultId)) {
      newBookmarked.delete(resultId);
    } else {
      newBookmarked.add(resultId);
    }
    setBookmarkedResults(newBookmarked);
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
  };

  // Get icon for result type
  const getResultIcon = (type: SearchCategory) => {
    switch (type) {
      case "tournaments":
        return <EmojiEvents color="primary" />;
      case "users":
        return <Person color="secondary" />;
      case "locations":
        return <LocationOn color="success" />;
      case "matches":
        return <SportsSoccer color="info" />;
      default:
        return <SportsSoccer />;
    }
  };

  // Format metadata for display
  const formatMetadata = (result: SearchResult) => {
    switch (result.type) {
      case "tournaments":
        return [
          result.metadata.status && (
            <Chip
              key="status"
              label={result.metadata.status}
              size="small"
              color={
                result.metadata.status === "active" ? "success" : "default"
              }
              variant="outlined"
            />
          ),
          result.metadata.entryFee && (
            <Chip
              key="fee"
              label={`$${result.metadata.entryFee}`}
              size="small"
              variant="outlined"
            />
          ),
          result.metadata.participants && result.metadata.maxParticipants && (
            <Chip
              key="participants"
              label={`${result.metadata.participants}/${result.metadata.maxParticipants}`}
              size="small"
              variant="outlined"
              icon={<People />}
            />
          ),
        ].filter(Boolean);

      case "users":
        return [
          result.metadata.level && (
            <Chip
              key="level"
              label={`Level ${result.metadata.level}`}
              size="small"
              variant="outlined"
            />
          ),
          result.metadata.gamesPlayed && (
            <Chip
              key="games"
              label={`${result.metadata.gamesPlayed} games`}
              size="small"
              variant="outlined"
            />
          ),
          result.metadata.winRate && (
            <Chip
              key="winRate"
              label={`${(result.metadata.winRate * 100).toFixed(0)}% win rate`}
              size="small"
              variant="outlined"
              color="success"
            />
          ),
        ].filter(Boolean);

      case "locations":
        return [
          result.metadata.type && (
            <Chip
              key="type"
              label={result.metadata.type}
              size="small"
              variant="outlined"
            />
          ),
          result.metadata.rating && (
            <Chip
              key="rating"
              label={`${result.metadata.rating} ★`}
              size="small"
              variant="outlined"
              color="warning"
            />
          ),
          result.metadata.fields && (
            <Chip
              key="fields"
              label={`${result.metadata.fields} fields`}
              size="small"
              variant="outlined"
            />
          ),
        ].filter(Boolean);

      default:
        return [];
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="rectangular" width={120} height={32} />
          </Box>

          {viewMode === "list" ? (
            <List>
              {[1, 2, 3, 4, 5].map((i) => (
                <ListItem key={i} divider>
                  <ListItemAvatar>
                    <Skeleton variant="circular" width={40} height={40} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Skeleton variant="text" width="60%" />}
                    secondary={<Skeleton variant="text" width="40%" />}
                  />
                  <ListItemSecondaryAction>
                    <Skeleton variant="rectangular" width={80} height={32} />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card variant="outlined">
                    <CardContent>
                      <Skeleton
                        variant="rectangular"
                        height={120}
                        sx={{ mb: 2 }}
                      />
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="60%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Search Error
        </Typography>
        {error}
      </Alert>
    );
  }

  // No results
  if (!results || results.results.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <SportsSoccer sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No results found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search terms or filters
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Results Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Search Results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {results.totalCount.toLocaleString()} results found in{" "}
              {results.executionTime}ms
            </Typography>
          </Box>

          {!compact && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="list">
                <ViewList />
              </ToggleButton>
              <ToggleButton value="grid">
                <ViewModule />
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>

        {/* Results List */}
        {viewMode === "list" ? (
          <List disablePadding>
            {results.results.map((result, index) => (
              <Fade
                in
                key={result.id}
                timeout={300}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <ListItem
                  divider={index < results.results.length - 1}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      transform: "translateY(-1px)",
                      boxShadow: 1,
                    },
                  }}
                  onClick={() => handleResultClick(result)}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={result.thumbnail}
                      sx={{
                        width: compact ? 40 : 48,
                        height: compact ? 40 : 48,
                      }}
                    >
                      {getResultIcon(result.type)}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography
                          variant={compact ? "body2" : "body1"}
                          sx={{ fontWeight: 600 }}
                        >
                          {result.title}
                        </Typography>
                        <Chip
                          label={result.type}
                          size="small"
                          variant="outlined"
                          sx={{
                            textTransform: "capitalize",
                            fontSize: "0.7rem",
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        {result.subtitle && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {result.subtitle}
                          </Typography>
                        )}
                        {result.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 0.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {result.description}
                          </Typography>
                        )}
                        {formatMetadata(result).length > 0 && (
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                            {formatMetadata(result)}
                          </Box>
                        )}
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmarkToggle(result.id.toString());
                        }}
                      >
                        {bookmarkedResults.has(result.id.toString()) ? (
                          <Bookmark color="primary" />
                        ) : (
                          <BookmarkBorder />
                        )}
                      </IconButton>

                      <IconButton size="small">
                        <Share />
                      </IconButton>

                      <IconButton size="small">
                        <Launch />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              </Fade>
            ))}
          </List>
        ) : (
          // Grid View
          <Grid container spacing={2}>
            {results.results.map((result, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={result.id}>
                <Fade
                  in
                  timeout={300}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        boxShadow: 4,
                        transform: "translateY(-2px)",
                      },
                    }}
                    onClick={() => handleResultClick(result)}
                  >
                    <CardContent>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={2}
                      >
                        <Avatar src={result.thumbnail}>
                          {getResultIcon(result.type)}
                        </Avatar>
                        <Chip
                          label={result.type}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </Box>

                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ fontWeight: 600 }}
                      >
                        {result.title}
                      </Typography>

                      {result.subtitle && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          gutterBottom
                        >
                          {result.subtitle}
                        </Typography>
                      )}

                      {result.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            mb: 2,
                          }}
                        >
                          {result.description}
                        </Typography>
                      )}

                      {formatMetadata(result).length > 0 && (
                        <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                          {formatMetadata(result)}
                        </Box>
                      )}

                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="caption" color="text.secondary">
                          Relevance: {(result.relevanceScore * 100).toFixed(0)}%
                        </Typography>

                        <Box display="flex" gap={0.5}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookmarkToggle(result.id.toString());
                            }}
                          >
                            {bookmarkedResults.has(result.id.toString()) ? (
                              <Bookmark color="primary" />
                            ) : (
                              <BookmarkBorder />
                            )}
                          </IconButton>

                          <IconButton size="small">
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {showPagination && results.hasMore && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={Math.ceil(results.totalCount / 10)} // Assuming 10 results per page
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
              size={isMobile ? "small" : "medium"}
            />
          </Box>
        )}

        {/* Load More Button */}
        {results.hasMore && !showPagination && (
          <Box textAlign="center" mt={3}>
            <Button
              variant="outlined"
              size="large"
              sx={{ borderRadius: 2, minWidth: 200 }}
            >
              Load More Results
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchResults;
