import React from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Divider,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search,
  FilterList,
  Category,
  TrendingUp,
  History,
  AutoAwesome,
  EmojiEvents,
  Person,
  LocationOn,
  SportsSoccer,
} from '@mui/icons-material';
import { SearchSuggestion, SearchCategory } from '../../types/search';

interface SearchSuggestionsProps {
  open: boolean;
  suggestions: SearchSuggestion[];
  onSelect: (suggestion: string) => void;
  onClose: () => void;
  maxItems?: number;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  open,
  suggestions,
  onSelect,
  onClose,
  maxItems = 8
}) => {
  const theme = useTheme();

  // Get icon for suggestion type
  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'query':
        return <Search fontSize="small" />;
      case 'filter':
        return <FilterList fontSize="small" />;
      case 'category':
        return getCategoryIcon(suggestion.category);
      default:
        return <Search fontSize="small" />;
    }
  };

  // Get category-specific icon
  const getCategoryIcon = (category?: SearchCategory) => {
    switch (category) {
      case 'tournaments':
        return <EmojiEvents fontSize="small" />;
      case 'users':
        return <Person fontSize="small" />;
      case 'locations':
        return <LocationOn fontSize="small" />;
      case 'matches':
        return <SportsSoccer fontSize="small" />;
      default:
        return <Category fontSize="small" />;
    }
  };

  // Get suggestion color based on type
  const getSuggestionColor = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'query':
        return 'primary';
      case 'filter':
        return 'secondary';
      case 'category':
        return 'success';
      default:
        return 'default';
    }
  };

  // Format suggestion text with highlights
  const formatSuggestionText = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'category') {
      return `Search in ${suggestion.text}`;
    }
    if (suggestion.type === 'filter') {
      return `Filter by ${suggestion.text}`;
    }
    return suggestion.text;
  };

  // Group suggestions by type
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.type]) {
      acc[suggestion.type] = [];
    }
    acc[suggestion.type].push(suggestion);
    return acc;
  }, {} as Record<string, SearchSuggestion[]>);

  // Sort suggestions by popularity within each group
  Object.keys(groupedSuggestions).forEach(type => {
    groupedSuggestions[type].sort((a, b) => b.popularity - a.popularity);
  });

  if (!open || suggestions.length === 0) {
    return null;
  }

  return (
    <Fade in={open}>
      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: theme.zIndex.modal,
          maxHeight: 400,
          overflow: 'auto',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper',
          boxShadow: theme.shadows[8],
        }}
      >
        <List disablePadding>
          {/* Query Suggestions */}
          {groupedSuggestions.query && (
            <>
              <ListItem
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <ListItemIcon>
                  <TrendingUp color="primary" fontSize="small" />
                </ListItemIcon>
                <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                  Popular Searches
                </Typography>
              </ListItem>
              {groupedSuggestions.query.slice(0, 4).map((suggestion, index) => (
                <ListItemButton
                  key={`query-${index}`}
                  onClick={() => onSelect(suggestion.text)}
                  sx={{
                    py: 1,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getSuggestionIcon(suggestion)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2">
                          {formatSuggestionText(suggestion)}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={`${suggestion.popularity}%`}
                            size="small"
                            variant="outlined"
                            color={getSuggestionColor(suggestion) as any}
                            sx={{ 
                              fontSize: '0.7rem',
                              height: 20,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                          <AutoAwesome 
                            fontSize="small" 
                            sx={{ 
                              color: 'text.disabled',
                              opacity: suggestion.popularity > 80 ? 1 : 0
                            }} 
                          />
                        </Box>
                      </Box>
                    }
                  />
                </ListItemButton>
              ))}
            </>
          )}

          {/* Category Suggestions */}
          {groupedSuggestions.category && (
            <>
              {groupedSuggestions.query && <Divider />}
              <ListItem
                sx={{
                  backgroundColor: alpha(theme.palette.success.main, 0.04),
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <ListItemIcon>
                  <Category color="success" fontSize="small" />
                </ListItemIcon>
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                  Categories
                </Typography>
              </ListItem>
              {groupedSuggestions.category.slice(0, 3).map((suggestion, index) => (
                <ListItemButton
                  key={`category-${index}`}
                  onClick={() => onSelect(suggestion.text)}
                  sx={{
                    py: 1,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.success.main, 0.04),
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getSuggestionIcon(suggestion)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2">
                          {formatSuggestionText(suggestion)}
                        </Typography>
                        <Chip
                          label={suggestion.category?.toUpperCase()}
                          size="small"
                          variant="filled"
                          color="success"
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 20,
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                    }
                  />
                </ListItemButton>
              ))}
            </>
          )}

          {/* Filter Suggestions */}
          {groupedSuggestions.filter && (
            <>
              {(groupedSuggestions.query || groupedSuggestions.category) && <Divider />}
              <ListItem
                sx={{
                  backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <ListItemIcon>
                  <FilterList color="secondary" fontSize="small" />
                </ListItemIcon>
                <Typography variant="caption" color="secondary.main" sx={{ fontWeight: 600 }}>
                  Quick Filters
                </Typography>
              </ListItem>
              {groupedSuggestions.filter.slice(0, 3).map((suggestion, index) => (
                <ListItemButton
                  key={`filter-${index}`}
                  onClick={() => onSelect(suggestion.text)}
                  sx={{
                    py: 1,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getSuggestionIcon(suggestion)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2">
                          {formatSuggestionText(suggestion)}
                        </Typography>
                        <Chip
                          label="Filter"
                          size="small"
                          variant="outlined"
                          color="secondary"
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      </Box>
                    }
                  />
                </ListItemButton>
              ))}
            </>
          )}

          {/* Footer with tip */}
          <Divider />
          <ListItem
            sx={{
              backgroundColor: alpha(theme.palette.text.primary, 0.02),
              py: 1,
            }}
          >
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontStyle: 'italic'
              }}
            >
              <AutoAwesome fontSize="small" />
              Press Tab to select • Enter to search
            </Typography>
          </ListItem>
        </List>
      </Paper>
    </Fade>
  );
};

export default SearchSuggestions;