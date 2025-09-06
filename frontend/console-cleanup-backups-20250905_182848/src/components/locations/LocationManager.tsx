import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
  LinearProgress,
} from "@mui/material";
import {
  LocationOn,
  Edit,
  Delete,
  Visibility,
  Add,
  Search,
  FilterList,
  Refresh,
  Map,
  Star,
  People,
  AccessTime,
} from "@mui/icons-material";
import { useSafeAuth } from "../../SafeAuthContext";
import { locationService, Location } from "../../services/api";

interface LocationManagerProps {
  userRole: 'admin' | 'user';
  showMap?: boolean;
  onLocationSelect?: (locationId: number, locationName: string) => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({ userRole, showMap = false, onLocationSelect }) => {
  const { user } = useSafeAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" as "success" | "error" | "info" });
  const [newLocation, setNewLocation] = useState({
    name: "",
    address: "",
    city: "",
    description: "",
    latitude: 0,
    longitude: 0,
    capacity: 10,
    location_type: "outdoor" as "indoor" | "outdoor" | "hybrid",
    base_cost_per_hour: 50,
    weather_protected: false,
  });

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const locationsData = await locationService.getLocations();
      setLocations(locationsData);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      setSnackbar({ open: true, message: "Failed to load locations", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreateLocation = async () => {
    if (!user || !['admin', 'moderator'].includes(user.user_type)) {
      setSnackbar({ open: true, message: "Admin access required", severity: "error" });
      return;
    }

    try {
      await locationService.createLocation(newLocation);
      setSnackbar({ open: true, message: "Location created successfully", severity: "success" });
      setCreateDialogOpen(false);
      setNewLocation({
        name: "",
        address: "",
        city: "",
        description: "",
        latitude: 0,
        longitude: 0,
        capacity: 10,
        location_type: "outdoor",
        base_cost_per_hour: 50,
        weather_protected: false,
      });
      fetchLocations();
    } catch (error) {
      console.error("Failed to create location:", error);
      setSnackbar({ open: true, message: "Failed to create location", severity: "error" });
    }
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         location.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = !cityFilter || (location.city && location.city.toLowerCase().includes(cityFilter.toLowerCase()));
    return matchesSearch && matchesCity;
  });

  const uniqueCities = Array.from(new Set(locations.map(l => l.city).filter(Boolean)));

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Loading Locations...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocationOn color="primary" />
          Location Management
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button startIcon={<Refresh />} onClick={fetchLocations}>
            Refresh
          </Button>
          {userRole === 'admin' && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
              Add Location
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <Search /> }}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>City</InputLabel>
              <Select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                label="City"
              >
                <MenuItem value="">All Cities</MenuItem>
                {uniqueCities.map(city => (
                  <MenuItem key={city} value={city}>{city}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Chip 
              label={`${filteredLocations.length} locations`} 
              color="primary" 
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Locations Grid */}
      <Grid container spacing={3}>
        {filteredLocations.map((location) => (
          <Grid item xs={12} sm={6} md={4} key={location.id}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Typography variant="h6" component="h3">
                    {location.name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Star sx={{ color: "gold", fontSize: 16 }} />
                    <Typography variant="body2">{location.rating}</Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {location.address}
                </Typography>
                
                {location.city && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    📍 {location.city}
                  </Typography>
                )}

                <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                  <Chip size="small" icon={<People />} label={`${location.capacity} capacity`} />
                  <Chip size="small" label={`${location.price_per_hour} HUF/hr`} color="secondary" />
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  {location.amenities?.map((amenity, index) => (
                    <Chip key={index} size="small" label={amenity} variant="outlined" />
                  ))}
                </Box>
              </CardContent>

              <Box sx={{ p: 2, pt: 0, display: "flex", justifyContent: "space-between" }}>
                <Button
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => {
                    setSelectedLocation(location);
                    if (onLocationSelect) {
                      onLocationSelect(location.id, location.name);
                    }
                  }}
                >
                  View Details
                </Button>
                
                {userRole === 'admin' && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton size="small" color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Location Details Dialog */}
      <Dialog
        open={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocationOn />
            {selectedLocation?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLocation && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body1"><strong>Address:</strong> {selectedLocation.address}</Typography>
                </Grid>
                {selectedLocation.city && (
                  <Grid item xs={6}>
                    <Typography variant="body1"><strong>City:</strong> {selectedLocation.city}</Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="body1"><strong>Capacity:</strong> {selectedLocation.capacity} people</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1"><strong>Price:</strong> {selectedLocation.price_per_hour} HUF/hour</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1"><strong>Rating:</strong> {selectedLocation.rating} ⭐</Typography>
                </Grid>
                {selectedLocation.latitude && selectedLocation.longitude && (
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      <strong>Coordinates:</strong> {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="body1"><strong>Amenities:</strong></Typography>
                  <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {selectedLocation.amenities?.length ? (
                      selectedLocation.amenities.map((amenity, index) => (
                        <Chip key={index} label={amenity} size="small" />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">No amenities listed</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLocation(null)}>Close</Button>
          <Button variant="contained" startIcon={<AccessTime />}>
            Check Availability
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Location Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Location</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location Name"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={newLocation.city}
                  onChange={(e) => setNewLocation({...newLocation, city: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  value={newLocation.latitude}
                  onChange={(e) => setNewLocation({...newLocation, latitude: parseFloat(e.target.value)})}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  value={newLocation.longitude}
                  onChange={(e) => setNewLocation({...newLocation, longitude: parseFloat(e.target.value)})}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Capacity"
                  type="number"
                  value={newLocation.capacity}
                  onChange={(e) => setNewLocation({...newLocation, capacity: parseInt(e.target.value)})}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Price/Hour (HUF)"
                  type="number"
                  value={newLocation.base_cost_per_hour}
                  onChange={(e) => setNewLocation({...newLocation, base_cost_per_hour: parseFloat(e.target.value)})}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Location Type</InputLabel>
                  <Select
                    value={newLocation.location_type}
                    onChange={(e) => setNewLocation({...newLocation, location_type: e.target.value as "indoor" | "outdoor" | "hybrid"})}
                    label="Location Type"
                  >
                    <MenuItem value="outdoor">Outdoor</MenuItem>
                    <MenuItem value="indoor">Indoor</MenuItem>
                    <MenuItem value="hybrid">Hybrid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateLocation}>
            Create Location
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LocationManager;