import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  History,
  Clear,
  Search,
  Bookmark,
  ExpandMore,
  ExpandLess,
  AccessTime,
} from '@mui/icons-material';
import { SearchHistory as SearchHistoryType } from '../../types/search';

interface SearchHistoryProps {
  history: SearchHistoryType[];
  onSelect: (historyItem: SearchHistoryType) => void;
  onClear?: () => void;
  compact?: boolean;
  maxItems?: number;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelect,
  onClear,
  compact = false,
  maxItems = 5
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(!compact);

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tournaments':
        return 'primary';
      case 'users':
        return 'secondary';
      case 'locations':
        return 'success';
      case 'matches':
        return 'info';
      default:
        return 'default';
    }
  };

  // Handle save search
  const handleSaveSearch = (historyItem: SearchHistoryType) => {
    // This would typically save the search for future use
    console.log('Save search:', historyItem.query);
  };

  if (history.length === 0) {
    return null;
  }

  const displayedHistory = compact ? history.slice(0, maxItems) : history;

  return (
    <Card sx={{ mt: 2, borderRadius: 2 }}>
      <CardContent sx={{ p: compact ? 2 : 3, '&:last-child': { pb: compact ? 2 : 3 } }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ cursor: compact ? 'pointer' : 'default' }}
          onClick={() => compact && setExpanded(!expanded)}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <History color="action" />
            <Typography variant={compact ? "body2" : "h6"} sx={{ fontWeight: 600 }}>
              Search History
            </Typography>
            <Chip
              label={history.length}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {onClear && (
              <Button
                size="small"
                startIcon={<Clear />}
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                color="error"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              >
                Clear
              </Button>
            )}

            {compact && (
              <IconButton size="small">
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </Box>
        </Box>

        <Collapse in={expanded}>
          <List sx={{ mt: 1 }}>
            {displayedHistory.map((item, index) => (
              <ListItem
                key={item.id}
                disablePadding
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  '&:last-child': { mb: 0 }
                }}
              >
                <ListItemButton
                  onClick={() => onSelect(item)}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.5),
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Search sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.query || 'Empty search'}
                        </Typography>
                        <Chip
                          label={item.category}
                          size="small"
                          variant="outlined"
                          color={getCategoryColor(item.category) as any}
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 20,
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box display="flex" alignItems="center" justifyContent="space-between" mt={0.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTime sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(item.timestamp)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary">
                          {item.resultCount} result{item.resultCount !== 1 ? 's' : ''}
                          {item.clicked && ' • Clicked'}
                        </Typography>
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveSearch(item);
                      }}
                      title="Save this search"
                    >
                      <Bookmark sx={{ fontSize: 16 }} />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
              </ListItem>
            ))}

            {compact && history.length > maxItems && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      +{history.length - maxItems} more searches in history
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>

          {!compact && history.length > 10 && (
            <Box textAlign="center" mt={2}>
              <Typography variant="caption" color="text.secondary">
                Showing last {Math.min(history.length, 10)} searches
              </Typography>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SearchHistory;