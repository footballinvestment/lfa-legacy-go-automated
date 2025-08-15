import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  IconButton,
  Slider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Autocomplete,
  Card,
  CardContent,
  Divider,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  Add,
  Remove,
  Clear,
  ExpandMore,
  FilterList,
  Tune,
  LocationOn,
  CalendarToday,
  AttachMoney,
  Star,
  Group,
} from '@mui/icons-material';
// Using standard TextField for date input instead of MUI X DatePickers to avoid additional dependencies
import { useSearch } from '../../contexts/SearchContext';
import { FilterOperator, FilterType, SearchFilter } from '../../types/search';

interface SearchFiltersProps {
  compact?: boolean;
  showAdvanced?: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  compact = false,
  showAdvanced = true
}) => {
  const theme = useTheme();
  const {
    criteria,
    addFilter,
    removeFilter,
    clearFilters,
    filterSchema
  } = useSearch();

  const [newFilter, setNewFilter] = useState({
    field: '',
    operator: 'contains' as FilterOperator,
    value: '' as any, // Allow any type for value to accommodate arrays, strings, numbers, etc.
    type: 'text' as FilterType
  });
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [quickFiltersExpanded, setQuickFiltersExpanded] = useState(true);

  // Get available fields for current category
  const getAvailableFields = () => {
    const categorySchema = filterSchema[criteria.category] || {};
    return Object.entries(categorySchema).map(([field, config]) => ({
      value: field,
      label: config.label,
      type: config.type,
      operators: config.operators,
      options: config.options
    }));
  };

  // Get operators for field type
  const getOperatorsForType = (type: FilterType): FilterOperator[] => {
    switch (type) {
      case 'text':
        return ['contains', 'equals', 'starts_with', 'ends_with', 'not_contains'];
      case 'number':
      case 'range':
        return ['equals', 'greater_than', 'less_than', 'between'];
      case 'date':
        return ['equals', 'greater_than', 'less_than', 'between'];
      case 'select':
      case 'multiselect':
        return ['equals', 'in', 'not_in'];
      case 'boolean':
        return ['equals'];
      default:
        return ['equals', 'contains'];
    }
  };

  // Handle add filter
  const handleAddFilter = () => {
    if (newFilter.field && newFilter.value) {
      addFilter(newFilter.field, newFilter.operator, newFilter.value);
      setNewFilter({
        field: '',
        operator: 'contains',
        value: '',
        type: 'text'
      });
      setShowAddFilter(false);
    }
  };

  // Handle field selection
  const handleFieldChange = (field: string) => {
    const fieldConfig = getAvailableFields().find(f => f.value === field);
    if (fieldConfig) {
      setNewFilter({
        ...newFilter,
        field,
        type: fieldConfig.type,
        operator: fieldConfig.operators[0] || 'equals',
        value: ''
      });
    }
  };

  // Render filter value input based on type
  const renderValueInput = () => {
    const fieldConfig = getAvailableFields().find(f => f.value === newFilter.field);

    switch (newFilter.type) {
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>Value</InputLabel>
            <Select
              value={newFilter.value}
              onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
              label="Value"
            >
              {fieldConfig?.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        return (
          <Autocomplete
            multiple
            options={fieldConfig?.options || []}
            getOptionLabel={(option) => option.label}
            value={fieldConfig?.options?.filter(opt => 
              Array.isArray(newFilter.value) && newFilter.value.includes(opt.value)
            ) || []}
            onChange={(_, value) => {
              setNewFilter({ 
                ...newFilter, 
                value: value.map((v: any) => v.value) 
              });
            }}
            renderInput={(params) => (
              <TextField {...params} label="Values" size="small" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.label}
                  {...getTagProps({ index })}
                  key={option.value}
                />
              ))
            }
          />
        );

      case 'number':
      case 'range':
        return (
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Value"
            value={newFilter.value}
            onChange={(e) => setNewFilter({ ...newFilter, value: Number(e.target.value) })}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Date"
            value={newFilter.value ? new Date(newFilter.value).toISOString().split('T')[0] : ''}
            onChange={(e) => setNewFilter({ ...newFilter, value: new Date(e.target.value).toISOString() })}
            InputLabelProps={{
              shrink: true,
            }}
          />
        );

      case 'boolean':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>Value</InputLabel>
            <Select
              value={newFilter.value}
              onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value === 'true' })}
              label="Value"
            >
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>
        );

      default:
        return (
          <TextField
            fullWidth
            size="small"
            label="Value"
            value={newFilter.value}
            onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
          />
        );
    }
  };

  // Quick filters for common use cases
  const renderQuickFilters = () => {
    if (criteria.category === 'tournaments') {
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value=""
                onChange={(e) => addFilter('status', 'equals', e.target.value)}
                label="Status"
              >
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Max Entry Fee"
              placeholder="25"
              onChange={(e) => {
                if (e.target.value) {
                  addFilter('entry_fee', 'less_than', Number(e.target.value));
                }
              }}
              InputProps={{
                startAdornment: <AttachMoney sx={{ color: 'action.active', mr: 0.5 }} />
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Skill Level</InputLabel>
              <Select
                value=""
                onChange={(e) => addFilter('skill_level', 'equals', e.target.value)}
                label="Skill Level"
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
                <MenuItem value="professional">Professional</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Location"
              placeholder="New York"
              onChange={(e) => {
                if (e.target.value) {
                  addFilter('location', 'contains', e.target.value);
                }
              }}
              InputProps={{
                startAdornment: <LocationOn sx={{ color: 'action.active', mr: 0.5 }} />
              }}
            />
          </Grid>
        </Grid>
      );
    }

    if (criteria.category === 'users') {
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Min Level"
              placeholder="10"
              onChange={(e) => {
                if (e.target.value) {
                  addFilter('level', 'greater_than', Number(e.target.value));
                }
              }}
              InputProps={{
                startAdornment: <Star sx={{ color: 'action.active', mr: 0.5 }} />
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Min Games Played"
              placeholder="50"
              onChange={(e) => {
                if (e.target.value) {
                  addFilter('games_played', 'greater_than', Number(e.target.value));
                }
              }}
              InputProps={{
                startAdornment: <Group sx={{ color: 'action.active', mr: 0.5 }} />
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Joined After"
              onChange={(e) => {
                if (e.target.value) {
                  addFilter('join_date', 'greater_than', new Date(e.target.value).toISOString());
                }
              }}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: <CalendarToday sx={{ color: 'action.active', mr: 0.5 }} />
              }}
            />
          </Grid>
        </Grid>
      );
    }

    return null;
  };

  return (
    <Box>
      {/* Active Filters */}
      {criteria.filters.length > 0 && (
        <Box mb={3}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Active Filters ({criteria.filters.length})
            </Typography>
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={clearFilters}
              color="error"
            >
              Clear All
            </Button>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={1}>
            {criteria.filters.map((filter) => (
              <Chip
                key={filter.id}
                label={filter.label}
                onDelete={() => removeFilter(filter.id)}
                color="primary"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Quick Filters */}
      <Accordion 
        expanded={quickFiltersExpanded} 
        onChange={() => setQuickFiltersExpanded(!quickFiltersExpanded)}
        sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <FilterList color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Quick Filters
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {renderQuickFilters()}
        </AccordionDetails>
      </Accordion>

      {/* Add Custom Filter */}
      {showAdvanced && (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Tune color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Custom Filter
                </Typography>
              </Box>
              <Button
                size="small"
                startIcon={showAddFilter ? <Remove /> : <Add />}
                onClick={() => setShowAddFilter(!showAddFilter)}
                variant="outlined"
              >
                {showAddFilter ? 'Cancel' : 'Add Filter'}
              </Button>
            </Box>

            <Collapse in={showAddFilter}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Field</InputLabel>
                    <Select
                      value={newFilter.field}
                      onChange={(e) => handleFieldChange(e.target.value)}
                      label="Field"
                    >
                      {getAvailableFields().map((field) => (
                        <MenuItem key={field.value} value={field.value}>
                          {field.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={newFilter.operator}
                      onChange={(e) => setNewFilter({ 
                        ...newFilter, 
                        operator: e.target.value as FilterOperator 
                      })}
                      label="Operator"
                      disabled={!newFilter.field}
                    >
                      {getOperatorsForType(newFilter.type).map((operator) => (
                        <MenuItem key={operator} value={operator}>
                          {operator.replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  {renderValueInput()}
                </Grid>

                <Grid item xs={12} sm={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddFilter}
                    disabled={!newFilter.field || !newFilter.value}
                    sx={{ height: '40px' }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SearchFilters;