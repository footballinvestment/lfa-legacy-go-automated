// src/components/locations/LocationList.tsx
// LFA Legacy GO - Location Listing with Weather Integration

import React, { useState, useEffect } from "react";
import config from "../../config/environment";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Rating,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  LocationOn,
  Sports,
  FilterList,
  Search,
  BookOnline,
  ArrowBack,
  WbSunny,
  ExpandMore,
} from "@mui/icons-material";
import WeatherWidget from "../weather/WeatherWidget";

// Location interface (should match backend)
interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  price_per_hour: number;
  rating: number;
  amenities: string[];
  available_slots: string[];
  image_url?: string;
  latitude?: number;
  longitude?: number;
}

const LocationList: React.FC = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [weatherEnabled, setWeatherEnabled] = useState(false);

  // Check if weather is available
  useEffect(() => {
    checkWeatherAvailability();
  }, []);

  // Fetch locations from backend
  useEffect(() => {
    fetchLocations();
  }, []);

  const checkWeatherAvailability = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/weather/health`);
      if (response.ok) {
        const data = await response.json();
        setWeatherEnabled(data.api_service_available);
      }
    } catch (err) {
      console.log("Weather service not available");
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      const response = await fetch(`${config.API_URL}/api/locations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch locations (${response.status})`);
      }

      const data = await response.json();
      console.log("Raw API Response:", data);

      // Handle multiple possible response formats
      let locationsArray: Location[] = [];

      if (Array.isArray(data)) {
        locationsArray = data;
      } else if (data && Array.isArray(data.locations)) {
        locationsArray = data.locations;
      } else if (data && Array.isArray(data.data)) {
        locationsArray = data.data;
      } else if (data && typeof data === "object") {
        for (const key in data) {
          if (Array.isArray(data[key])) {
            locationsArray = data[key];
            break;
          }
        }
      }

      console.log("Processed locations array:", locationsArray);

      if (!Array.isArray(locationsArray)) {
        throw new Error("Invalid response format: expected array of locations");
      }

      setLocations(locationsArray);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching locations:", err);
      setError(err.message || "Failed to load locations");
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter locations based on search and filters
  const filteredLocations = React.useMemo(() => {
    const safeLocations = Array.isArray(locations) ? locations : [];

    return safeLocations.filter((location) => {
      // Search term filter
      const matchesSearch =
        !searchTerm ||
        location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address?.toLowerCase().includes(searchTerm.toLowerCase());

      // City filter
      const matchesCity = !selectedCity || location.city === selectedCity;

      // Price filter
      const matchesPrice = (() => {
        if (!priceRange) return true;
        const price = location.price_per_hour || 0;

        switch (priceRange) {
          case "low":
            return price < 50;
          case "medium":
            return price >= 50 && price <= 100;
          case "high":
            return price > 100;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesCity && matchesPrice;
    });
  }, [locations, searchTerm, selectedCity, priceRange]);

  // Get unique cities for filter
  const cities = React.useMemo(() => {
    const safeLocations = Array.isArray(locations) ? locations : [];
    return Array.from(
      new Set(safeLocations.map((location) => location.city).filter(Boolean))
    );
  }, [locations]);

  const handleBookLocation = (locationId: number) => {
    navigate(`/booking/${locationId}`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate("/dashboard")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Football Locations
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton onClick={() => setFilterOpen(true)}>
            <FilterList />
          </IconButton>
          {weatherEnabled && (
            <Chip
              icon={<WbSunny />}
              label="Weather Available"
              color="success"
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search locations by name, city, or address..."
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <Search sx={{ color: "action.active", mr: 1 }} />,
        }}
        sx={{ mb: 3 }}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Weather Preview (if enabled) */}
      {weatherEnabled && filteredLocations.length > 0 && (
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <WbSunny />
              Weather Preview for Top Locations
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current weather conditions at featured locations
            </Typography>
            <Grid container spacing={2}>
              {filteredLocations.slice(0, 3).map((location) => (
                <Grid size={{ xs: 12, md: 4 }} key={`weather-${location.id}`}>
                  <WeatherWidget
                    locationId={location.id}
                    locationName={location.name}
                    compact={true}
                  />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Debug: Found {locations.length} locations, showing{" "}
          {filteredLocations.length} after filters
          {weatherEnabled && " | Weather service: Active"}
        </Alert>
      )}

      {/* Locations Grid */}
      {filteredLocations.length === 0 ? (
        <Card sx={{ p: 6, textAlign: "center" }}>
          <Sports sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {locations.length === 0
              ? "No locations available"
              : "No locations found"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {locations.length === 0
              ? "Check your connection or try refreshing the page"
              : "Try adjusting your search criteria or clear filters"}
          </Typography>
          {locations.length === 0 && (
            <Button onClick={fetchLocations} sx={{ mt: 2 }}>
              Reload Locations
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredLocations.map((location) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={location.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                {/* Location Image Placeholder */}
                <Box
                  sx={{
                    height: 200,
                    background: "linear-gradient(45deg, #1e293b, #334155)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "3rem",
                  }}
                >
                  ⚽
                </Box>

                {/* Weather Widget Integration */}
                {weatherEnabled && (
                  <Box sx={{ p: 1 }}>
                    <WeatherWidget
                      locationId={location.id}
                      compact={true}
                      showAlerts={false}
                    />
                  </Box>
                )}

                {/* Location Info */}
                <Box
                  sx={{
                    p: 3,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {location.name || "Unknown Location"}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <LocationOn
                        sx={{ fontSize: 16, color: "text.secondary", mr: 0.5 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {location.address || "No address"},{" "}
                        {location.city || "Unknown city"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <Rating
                        value={location.rating || 0}
                        readOnly
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {location.rating || 0}
                      </Typography>
                      <Chip
                        label={`${location.capacity || 0} players`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {/* Amenities */}
                  {location.amenities &&
                    Array.isArray(location.amenities) &&
                    location.amenities.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            maxHeight: 60,
                            overflow: "hidden",
                          }}
                        >
                          {location.amenities
                            .slice(0, 3)
                            .map((amenity, index) => (
                              <Chip
                                key={`${location.id}-amenity-${index}`}
                                label={amenity}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.7rem" }}
                              />
                            ))}
                          {location.amenities.length > 3 && (
                            <Chip
                              label={`+${location.amenities.length - 3} more`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: "0.7rem" }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                  {/* Price and Availability */}
                  <Box sx={{ mt: "auto" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" color="primary">
                        ${location.price_per_hour || 0}/hour
                      </Typography>
                      <Chip
                        label={`${
                          Array.isArray(location.available_slots)
                            ? location.available_slots.length
                            : 0
                        } slots`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<BookOnline />}
                      onClick={() => handleBookLocation(location.id)}
                      sx={{
                        background: "linear-gradient(135deg, #10b981, #3b82f6)",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #059669, #2563eb)",
                        },
                      }}
                    >
                      Book Now
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filter Dialog */}
      <Dialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Locations</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>City</InputLabel>
              <Select
                value={selectedCity}
                label="City"
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <MenuItem value="">All Cities</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>
                    {city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Price Range</InputLabel>
              <Select
                value={priceRange}
                label="Price Range"
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <MenuItem value="">All Prices</MenuItem>
                <MenuItem value="low">Under $50/hour</MenuItem>
                <MenuItem value="medium">$50 - $100/hour</MenuItem>
                <MenuItem value="high">Over $100/hour</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterOpen(false)}>Cancel</Button>
          <Button onClick={() => setFilterOpen(false)} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationList;
