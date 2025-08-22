import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Button,
  Typography,
  Divider,
  Collapse,
  Menu,
  MenuItem,
  Badge,
  CircularProgress,
  Fade,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Search,
  FilterList,
  Clear,
  Sort,
  Bookmark,
  History,
  ExpandMore,
  ExpandLess,
  Tune,
  Save,
  GetApp,
  Share,
  Refresh,
  Close,
} from "@mui/icons-material";
import { useSearch } from "../../contexts/SearchContext";
import { SearchCategory } from "../../types/search";
import SearchResults from "./SearchResults";
import SearchFilters from "./SearchFilters";
import SearchSuggestions from "./SearchSuggestions";
import SavedSearches from "./SavedSearches";
import SearchHistory from "./SearchHistory";
import useMobileViewport from "../../hooks/useMobileViewport";

interface AdvancedSearchComponentProps {
  defaultCategory?: SearchCategory;
  placeholder?: string;
  showCategories?: boolean;
  showFilters?: boolean;
  showSavedSearches?: boolean;
  showHistory?: boolean;
  compact?: boolean;
  onResultSelect?: (result: any) => void;
}

const AdvancedSearchComponent: React.FC<AdvancedSearchComponentProps> = ({
  defaultCategory = "all",
  placeholder = "Search tournaments, users, locations...",
  showCategories = true,
  showFilters = true,
  showSavedSearches = true,
  showHistory = true,
  compact = false,
  onResultSelect,
}) => {
  const theme = useTheme();
  const { isMobile } = useMobileViewport();
  const {
    criteria,
    results,
    isSearching,
    error,
    updateQuery,
    updateCategory,
    executeSearch,
    clearSearch,
    savedSearches,
    searchHistory,
    suggestions,
    getSuggestions,
  } = useSearch();

  // Component state
  const [activeTab, setActiveTab] = useState(0);
  const [filtersExpanded, setFiltersExpanded] = useState(!compact);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [localQuery, setLocalQuery] = useState(criteria.query);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout>();

  // Search categories
  const categories: { value: SearchCategory; label: string; count?: number }[] =
    [
      { value: "all", label: "All", count: results?.totalCount },
      { value: "tournaments", label: "Tournaments", count: 12 },
      { value: "users", label: "Users", count: 8 },
      { value: "locations", label: "Locations", count: 5 },
      { value: "matches", label: "Matches", count: 3 },
    ];

  // Sort options
  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "date_created", label: "Date Created" },
    { value: "name", label: "Name" },
    { value: "popularity", label: "Popularity" },
    { value: "rating", label: "Rating" },
  ];

  // Initialize with default category
  useEffect(() => {
    if (criteria.category !== defaultCategory) {
      updateCategory(defaultCategory);
    }
  }, [defaultCategory, criteria.category, updateCategory]);

  // Debounced search execution
  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      searchDebounceRef.current = setTimeout(() => {
        updateQuery(query);
        if (query.trim()) {
          executeSearch();
          getSuggestions(query);
        }
      }, 300);
    },
    [updateQuery, executeSearch, getSuggestions]
  );

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setLocalQuery(newQuery);
    debouncedSearch(newQuery);

    if (newQuery.length >= 2) {
      setShowSuggestions(true);
      getSuggestions(newQuery);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle search submission
  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateQuery(localQuery);
    executeSearch();
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  // Handle category change
  const handleCategoryChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    updateCategory(categories[newValue].value);
    if (criteria.query) {
      executeSearch();
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setLocalQuery("");
    clearSearch();
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  // Handle sort menu
  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortMenuAnchor(null);
  };

  // Handle suggestion select
  const handleSuggestionSelect = (suggestion: string) => {
    setLocalQuery(suggestion);
    updateQuery(suggestion);
    executeSearch();
    setShowSuggestions(false);
  };

  // Handle result select
  const handleResultSelect = (result: any) => {
    onResultSelect?.(result);
  };

  // Clear search debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ width: "100%", maxWidth: "100%" }}>
      {/* Search Header */}
      <Card sx={{ mb: 2, borderRadius: compact ? 1 : 2 }}>
        <CardContent
          sx={{ p: compact ? 2 : 3, "&:last-child": { pb: compact ? 2 : 3 } }}
        >
          {/* Search Input */}
          <Box
            sx={{
              position: "relative",
              mb: showCategories && !compact ? 2 : 0,
            }}
          >
            <form onSubmit={handleSearchSubmit}>
              <TextField
                ref={searchInputRef}
                fullWidth
                value={localQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  setSearchFocused(true);
                  if (localQuery.length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setSearchFocused(false);
                  // Delay hiding suggestions to allow clicks
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                placeholder={placeholder}
                variant="outlined"
                size={compact ? "small" : "medium"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {isSearching && (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      )}
                      {localQuery && (
                        <IconButton
                          size="small"
                          onClick={handleClearSearch}
                          sx={{ mr: 0.5 }}
                        >
                          <Clear />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={handleSearchSubmit}
                        color="primary"
                      >
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: searchFocused
                      ? alpha(theme.palette.primary.main, 0.02)
                      : "background.paper",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: compact ? 1 : 2,
                  },
                }}
              />
            </form>

            {/* Search Suggestions */}
            <SearchSuggestions
              open={showSuggestions && suggestions.length > 0}
              suggestions={suggestions}
              onSelect={handleSuggestionSelect}
              onClose={() => setShowSuggestions(false)}
            />
          </Box>

          {/* Search Categories */}
          {showCategories && !compact && (
            <Box sx={{ mb: 2 }}>
              <Tabs
                value={activeTab}
                onChange={handleCategoryChange}
                variant={isMobile ? "scrollable" : "fullWidth"}
                scrollButtons="auto"
                sx={{
                  "& .MuiTab-root": {
                    minHeight: 40,
                    textTransform: "none",
                    fontWeight: 500,
                  },
                }}
              >
                {categories.map((category, index) => (
                  <Tab
                    key={category.value}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        {category.label}
                        {category.count !== undefined && (
                          <Chip
                            label={category.count}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.75rem" }}
                          />
                        )}
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            </Box>
          )}

          {/* Action Bar */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
          >
            {/* Left Actions */}
            <Box display="flex" alignItems="center" gap={1}>
              {showFilters && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterList />}
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  endIcon={filtersExpanded ? <ExpandLess /> : <ExpandMore />}
                  sx={{ borderRadius: 2 }}
                >
                  Filters
                  {criteria.filters.length > 0 && (
                    <Badge
                      badgeContent={criteria.filters.length}
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Button>
              )}

              <Button
                variant="outlined"
                size="small"
                startIcon={<Sort />}
                onClick={handleSortClick}
                sx={{ borderRadius: 2 }}
              >
                Sort
              </Button>
            </Box>

            {/* Right Actions */}
            <Box display="flex" alignItems="center" gap={1}>
              {showSavedSearches && savedSearches.length > 0 && (
                <IconButton size="small" title="Saved Searches">
                  <Badge badgeContent={savedSearches.length} color="primary">
                    <Bookmark />
                  </Badge>
                </IconButton>
              )}

              {showHistory && searchHistory.length > 0 && (
                <IconButton size="small" title="Search History">
                  <History />
                </IconButton>
              )}

              <IconButton size="small" title="Advanced Options">
                <Tune />
              </IconButton>

              {criteria.query && (
                <IconButton
                  size="small"
                  onClick={executeSearch}
                  title="Refresh"
                >
                  <Refresh />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Active Filters */}
          {criteria.filters.length > 0 && (
            <Box mt={2}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: "block" }}
              >
                Active Filters:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {criteria.filters.map((filter) => (
                  <Chip
                    key={filter.id}
                    label={filter.label}
                    size="small"
                    variant="outlined"
                    onDelete={() => {
                      // Remove filter logic handled by SearchFilters component
                    }}
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>

        {/* Expandable Filters */}
        <Collapse in={filtersExpanded}>
          <Divider />
          <CardContent sx={{ pt: 2 }}>
            <SearchFilters compact={compact} />
          </CardContent>
        </Collapse>
      </Card>

      {/* Search Results */}
      <Fade in={!!results || isSearching}>
        <Box>
          <SearchResults
            results={results}
            isLoading={isSearching}
            error={error}
            onResultSelect={handleResultSelect}
            compact={compact}
          />
        </Box>
      </Fade>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortClose}
        PaperProps={{
          sx: { minWidth: 200, borderRadius: 2 },
        }}
      >
        {sortOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={criteria.sortBy === option.value}
            onClick={() => {
              // Handle sort selection
              handleSortClose();
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Saved Searches & History Panels */}
      {showSavedSearches && (
        <SavedSearches
          searches={savedSearches}
          onSelect={(search) => {
            // Load saved search logic
          }}
          compact={compact}
        />
      )}

      {showHistory && (
        <SearchHistory
          history={searchHistory}
          onSelect={(historyItem) => {
            setLocalQuery(historyItem.query);
            updateQuery(historyItem.query);
            updateCategory(historyItem.category);
            executeSearch();
          }}
          compact={compact}
        />
      )}
    </Box>
  );
};

export default AdvancedSearchComponent;
