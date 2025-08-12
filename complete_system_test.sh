// src/components/booking/BookingForm.tsx
// LFA Legacy GO - WORKING Booking Form with Real API Integration

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { ArrowBack, CheckCircle, Schedule, LocationOn } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

interface AvailabilitySlot {
  time: string;
  available: boolean;
  cost_credits: number;
  weather_warning?: string;
}

interface Location {
  id: number;
  name: string;
  address: string;
  base_cost_per_hour: number;
}

const BookingForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useAuth();
  
  // Get location from URL params
  const locationId = searchParams.get('location') || '1';
  
  // Form state
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [gameType, setGameType] = useState("GAME1");
  const [duration, setDuration] = useState(1);
  
  // Data state
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Load location data
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`http://localhost:8000/api/locations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const locations = Array.isArray(data) ? data : data.locations || [];
          const foundLocation = locations.find((loc: any) => loc.id === parseInt(locationId));
          setLocation(foundLocation || locations[0]);
        }
      } catch (err) {
        console.error('Error fetching location:', err);
      }
    };

    fetchLocation();
  }, [locationId]);

  // Load availability when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailability();
    }
  }, [selectedDate, gameType]);

  const fetchAvailability = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const url = `http://localhost:8000/api/booking/availability?date=${selectedDate}&location_id=${locationId}&game_type=${gameType}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to load availability');
      }
    } catch (err) {
      setError('Network error while loading availability');
      console.error('Availability fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !location) {
      setError('Please select date and time');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      // Create booking request
      const bookingData = {
        location_id: parseInt(locationId),
        game_type: gameType,
        start_time: `${selectedDate}T${selectedTime}:00`,
        duration_minutes: duration * 60,
        notes: `Booking for ${gameType} at ${location.name}`
      };

      const response = await fetch('http://localhost:8000/api/booking/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Booking confirmed! Session ID: ${result.session_id || result.id}`);
        
        // Clear form
        setSelectedDate('');
        setSelectedTime('');
        setAvailableSlots([]);
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Booking failed');
      }
    } catch (err) {
      setError('Network error during booking');
      console.error('Booking error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSlot = availableSlots.find(slot => slot.time === selectedTime);
  const totalCost = selectedSlot ? selectedSlot.cost_credits * duration : 0;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <IconButton onClick={() => navigate("/locations")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Book a Location 📅
        </Typography>
      </Box>

      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
          {success}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Booking Details
            </Typography>

            {/* Location Info */}
            {location && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn color="primary" />
                  <Typography variant="h6">{location.name}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {location.address}
                </Typography>
                <Typography variant="body2" color="primary">
                  Base cost: {location.base_cost_per_hour || 5} credits/hour
                </Typography>
              </Box>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: tomorrow }} // Prevent past dates
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Game Type</InputLabel>
                  <Select
                    value={gameType}
                    label="Game Type"
                    onChange={(e) => setGameType(e.target.value)}
                  >
                    <MenuItem value="GAME1">⚽ Football Skills Challenge</MenuItem>
                    <MenuItem value="GAME2">🥅 Penalty Shootout</MenuItem>
                    <MenuItem value="GAME3">⚡ Speed Challenge</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Duration (hours)</InputLabel>
                  <Select
                    value={duration}
                    label="Duration (hours)"
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    <MenuItem value={1}>1 hour</MenuItem>
                    <MenuItem value={2}>2 hours</MenuItem>
                    <MenuItem value={3}>3 hours</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Available Time Slots */}
            {selectedDate && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Available Time Slots
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : availableSlots.length > 0 ? (
                  <Grid container spacing={1}>
                    {availableSlots.map((slot) => (
                      <Grid item key={slot.time}>
                        <Chip
                          label={`${slot.time} (${slot.cost_credits} credits)`}
                          color={selectedTime === slot.time ? "primary" : "default"}
                          variant={slot.available ? "outlined" : "filled"}
                          disabled={!slot.available}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          sx={{ 
                            cursor: slot.available ? 'pointer' : 'not-allowed',
                            '&:hover': slot.available ? { bgcolor: 'primary.light', color: 'white' } : {}
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="info">
                    No available slots for selected date and game type.
                  </Alert>
                )}
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleBooking}
              disabled={!selectedDate || !selectedTime || submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <Schedule />}
              sx={{ mt: 4 }}
            >
              {submitting ? 'Confirming Booking...' : 'Confirm Booking'}
            </Button>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Booking Summary
            </Typography>
            
            {location && selectedDate && selectedTime ? (
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Location" 
                    secondary={location.name} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Date" 
                    secondary={selectedDate} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Time" 
                    secondary={`${selectedTime} (${duration}h)`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Game Type" 
                    secondary={gameType} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Total Cost" 
                    secondary={`${totalCost} credits`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Your Credits" 
                    secondary={`${state.user?.credits || 0} available`}
                  />
                </ListItem>
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Select date and time to see pricing details
              </Typography>
            )}

            {totalCost > 0 && state.user && totalCost > state.user.credits && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Insufficient credits. You need {totalCost - state.user.credits} more credits.
              </Alert>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BookingForm;