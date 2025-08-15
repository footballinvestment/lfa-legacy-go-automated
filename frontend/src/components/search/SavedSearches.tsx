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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Bookmark,
  BookmarkBorder,
  MoreVert,
  Edit,
  Delete,
  Share,
  Download,
  Refresh,
  Search,
  ExpandMore,
  ExpandLess,
  Star,
  StarBorder,
} from '@mui/icons-material';
import { SavedSearch } from '../../types/search';
import { useSearch } from '../../contexts/SearchContext';

interface SavedSearchesProps {
  searches: SavedSearch[];
  onSelect: (search: SavedSearch) => void;
  compact?: boolean;
  maxItems?: number;
}

const SavedSearches: React.FC<SavedSearchesProps> = ({
  searches,
  onSelect,
  compact = false,
  maxItems = 5
}) => {
  const theme = useTheme();
  const { loadSavedSearch, deleteSavedSearch, saveCurrentSearch } = useSearch();
  
  const [expanded, setExpanded] = useState(!compact);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSearch, setSelectedSearch] = useState<SavedSearch | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, search: SavedSearch) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedSearch(search);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedSearch(null);
  };

  // Handle edit
  const handleEdit = () => {
    if (selectedSearch) {
      setEditName(selectedSearch.name);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  // Handle delete
  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = (search: SavedSearch) => {
    // This would typically update the bookmark status in the backend
    console.log('Toggle bookmark for:', search.name);
    handleMenuClose();
  };

  // Handle share
  const handleShare = () => {
    if (selectedSearch) {
      // This would typically generate a shareable link
      navigator.clipboard.writeText(`Shared search: ${selectedSearch.name}`);
    }
    handleMenuClose();
  };

  // Confirm edit
  const confirmEdit = () => {
    if (selectedSearch && editName.trim()) {
      // Update search name (would typically call API)
      console.log('Update search name:', editName);
      setEditDialogOpen(false);
      setEditName('');
      setSelectedSearch(null);
    }
  };

  // Confirm delete
  const confirmDelete = () => {
    if (selectedSearch) {
      deleteSavedSearch(selectedSearch.id);
      setDeleteDialogOpen(false);
      setSelectedSearch(null);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get search description
  const getSearchDescription = (search: SavedSearch) => {
    const { criteria } = search;
    const parts = [];
    
    if (criteria.query) {
      parts.push(`"${criteria.query}"`);
    }
    
    if (criteria.category !== 'all') {
      parts.push(`in ${criteria.category}`);
    }
    
    if (criteria.filters.length > 0) {
      parts.push(`${criteria.filters.length} filter${criteria.filters.length > 1 ? 's' : ''}`);
    }
    
    return parts.join(' • ') || 'All results';
  };

  if (searches.length === 0) {
    return null;
  }

  const displayedSearches = compact ? searches.slice(0, maxItems) : searches;

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
            <Bookmark color="primary" />
            <Typography variant={compact ? "body2" : "h6"} sx={{ fontWeight: 600 }}>
              Saved Searches
            </Typography>
            <Chip
              label={searches.length}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>

          {compact && (
            <IconButton size="small">
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Box>

        <Collapse in={expanded}>
          <List sx={{ mt: 1 }}>
            {displayedSearches.map((search, index) => (
              <ListItem
                key={search.id}
                disablePadding
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  '&:last-child': { mb: 0 }
                }}
              >
                <ListItemButton
                  onClick={() => {
                    loadSavedSearch(search.id);
                    onSelect(search);
                  }}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {search.name}
                        </Typography>
                        {search.isBookmarked && (
                          <Star color="warning" sx={{ fontSize: 16 }} />
                        )}
                        <Chip
                          label={search.criteria.category}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 20,
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {getSearchDescription(search)}
                        </Typography>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mt={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            Last used: {formatDate(search.lastUsed)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Used {search.useCount} time{search.useCount !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, search)}
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
              </ListItem>
            ))}

            {compact && searches.length > maxItems && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
                      +{searches.length - maxItems} more saved searches
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </Collapse>
      </CardContent>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200, borderRadius: 2 }
        }}
      >
        <MenuItem onClick={() => selectedSearch && loadSavedSearch(selectedSearch.id)}>
          <Search sx={{ mr: 2 }} />
          Run Search
        </MenuItem>
        
        <MenuItem onClick={() => selectedSearch && handleBookmarkToggle(selectedSearch)}>
          {selectedSearch?.isBookmarked ? (
            <StarBorder sx={{ mr: 2 }} />
          ) : (
            <Star sx={{ mr: 2 }} />
          )}
          {selectedSearch?.isBookmarked ? 'Remove Star' : 'Add Star'}
        </MenuItem>
        
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 2 }} />
          Rename
        </MenuItem>
        
        <MenuItem onClick={handleShare}>
          <Share sx={{ mr: 2 }} />
          Share
        </MenuItem>
        
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rename Saved Search</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Search Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            variant="outlined"
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Saved Search</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedSearch?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SavedSearches;