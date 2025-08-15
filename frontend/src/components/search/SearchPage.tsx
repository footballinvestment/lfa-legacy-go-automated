import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Search,
  TrendingUp,
  Analytics,
  Bookmark,
  History,
} from '@mui/icons-material';
import AdvancedSearchComponent from './AdvancedSearchComponent';
import { useSearch } from '../../contexts/SearchContext';
import { SearchCategory } from '../../types/search';

const SearchPage: React.FC = () => {
  const theme = useTheme();
  const { criteria, results, savedSearches, searchHistory } = useSearch();
  const [activeTab, setActiveTab] = useState(0);

  // Sample popular searches
  const popularSearches = [
    { query: 'football tournament', category: 'tournaments', count: 156 },
    { query: 'beginner friendly', category: 'tournaments', count: 89 },
    { query: 'new york', category: 'locations', count: 78 },
    { query: 'weekend matches', category: 'matches', count: 65 },
    { query: 'intermediate players', category: 'users', count: 43 }
  ];

  // Sample trending searches
  const trendingSearches = [
    { query: 'championship final', trend: '+45%' },
    { query: 'local leagues', trend: '+32%' },
    { query: 'practice matches', trend: '+28%' },
    { query: 'youth tournaments', trend: '+21%' }
  ];

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle popular search click
  const handlePopularSearchClick = (query: string, category: SearchCategory) => {
    // This would trigger a search with the clicked query
    console.log('Search for:', query, 'in', category);
  };

  const renderOverviewTab = () => (
    <Box>
      {/* Main Search Component */}
      <AdvancedSearchComponent
        defaultCategory="all"
        placeholder="Search tournaments, users, locations, and more..."
        showCategories={true}
        showFilters={true}
        showSavedSearches={true}
        showHistory={true}
        onResultSelect={(result) => {
          console.log('Selected result:', result);
        }}
      />

      {/* Popular & Trending Searches */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Popular Searches */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <TrendingUp color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Popular Searches
                </Typography>
              </Box>

              <Box display="flex" flexDirection="column" gap={2}>
                {popularSearches.map((search, index) => (
                  <Box
                    key={index}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: theme.palette.action.hover,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.action.selected,
                        transform: 'translateY(-1px)'
                      }
                    }}
                    onClick={() => handlePopularSearchClick(search.query, search.category as SearchCategory)}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {search.query}
                      </Typography>
                      <Chip
                        label={search.category}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', textTransform: 'capitalize', mt: 0.5 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {search.count} searches
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Trending Searches */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Analytics color="success" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Trending Now
                </Typography>
              </Box>

              <Box display="flex" flexDirection="column" gap={2}>
                {trendingSearches.map((search, index) => (
                  <Box
                    key={index}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: theme.palette.action.hover,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.action.selected,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {search.query}
                    </Typography>
                    <Chip
                      label={search.trend}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Grid container spacing={3}>
      {/* Search Statistics */}
      <Grid item xs={12} md={6} lg={3}>
        <Card sx={{ borderRadius: 2, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
              {results?.totalCount || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search Results
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card sx={{ borderRadius: 2, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
              {savedSearches.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Saved Searches
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card sx={{ borderRadius: 2, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
              {searchHistory.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search History
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card sx={{ borderRadius: 2, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
              {criteria.filters.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Filters
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Current Search Status */}
      <Grid item xs={12}>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Current Search Configuration
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Query
                </Typography>
                <Typography variant="body2">
                  {criteria.query || 'No query'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Category
                </Typography>
                <Chip 
                  label={criteria.category} 
                  size="small" 
                  variant="outlined"
                  sx={{ textTransform: 'capitalize' }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Sort By
                </Typography>
                <Typography variant="body2">
                  {criteria.sortBy} ({criteria.sortOrder})
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Filters
                </Typography>
                <Typography variant="body2">
                  {criteria.filters.length} active
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Search color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Advanced Search
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Find tournaments, users, locations, and matches with powerful search and filtering capabilities
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            icon={<Search />} 
            label="Search" 
            iconPosition="start"
          />
          <Tab 
            icon={<Analytics />} 
            label="Analytics" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && renderOverviewTab()}
      {activeTab === 1 && renderAnalyticsTab()}
    </Container>
  );
};

export default SearchPage;