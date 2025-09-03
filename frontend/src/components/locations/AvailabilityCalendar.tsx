import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  IconButton,
  Paper,
} from "@mui/material";
import {
  AccessTime,
  CheckCircle,
  Cancel,
  Warning,
  Refresh,
  CalendarToday,
  Schedule,
  AttachMoney,
} from "@mui/icons-material";
import { locationService, LocationAvailability } from "../../services/api";

interface AvailabilityCalendarProps {
  locationId: number;
  locationName: string;
  onSlotSelect?: (slot: any) => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  locationId,
  locationName,
  onSlotSelect
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<LocationAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  const fetchAvailability = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const availabilityData = await locationService.checkAvailability(locationId, date);
      setAvailability(availabilityData);
    } catch (error) {
      console.error("Failed to fetch availability:", error);
      setError("Failed to load availability data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability(selectedDate);
  }, [locationId, selectedDate]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    setSelectedDate(newDate);
  };

  const handleSlotClick = (slot: any) => {
    if (!slot.available) return;
    
    setSelectedSlot(slot);
    if (onSlotSelect) {
      onSlotSelect(slot);
    } else {
      setBookingDialogOpen(true);
    }
  };

  const getSlotColor = (slot: any) => {
    if (!slot.available) return "error";
    if (slot.is_peak) return "warning";
    return "success";
  };

  const getSlotIcon = (slot: any) => {
    if (!slot.available) return <Cancel />;
    if (slot.is_peak) return <Warning />;
    return <CheckCircle />;
  };

  // Generate next 7 days for date selection
  const getDateOptions = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toDateString();
    const tomorrow = new Date(Date.now() + 86400000).toDateString();
    
    if (date.toDateString() === today) return "Today";
    if (date.toDateString() === tomorrow) return "Tomorrow";
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarToday color="primary" />
          Availability - {locationName}
        </Typography>
        <Button startIcon={<Refresh />} onClick={() => fetchAvailability(selectedDate)}>
          Refresh
        </Button>
      </Box>

      {/* Date Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Select Date</Typography>
          <Grid container spacing={1}>
            {getDateOptions().map((date) => (
              <Grid item key={date}>
                <Button
                  variant={selectedDate === date ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setSelectedDate(date)}
                  sx={{ minWidth: 100 }}
                >
                  {formatDate(date)}
                </Button>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
            Loading availability for {formatDate(selectedDate)}...
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Weather Warnings */}
      {availability?.weather_warnings && availability.weather_warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>Weather Warnings:</Typography>
          {availability.weather_warnings.map((warning, index) => (
            <Typography key={index} variant="body2">• {warning}</Typography>
          ))}
        </Alert>
      )}

      {/* Availability Summary */}
      {availability && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Availability Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="success.main">
                    {availability.available_slots}
                  </Typography>
                  <Typography variant="body2">Available Slots</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="text.secondary">
                    {availability.total_slots}
                  </Typography>
                  <Typography variant="body2">Total Slots</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="primary.main">
                    {Math.round((availability.available_slots / availability.total_slots) * 100)}%
                  </Typography>
                  <Typography variant="body2">Availability</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="warning.main">
                    {availability.slots.filter(s => s.is_peak && s.available).length}
                  </Typography>
                  <Typography variant="body2">Peak Available</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Time Slots */}
      {availability && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Available Time Slots</Typography>
            <Grid container spacing={1}>
              {availability.slots.map((slot, index) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      cursor: slot.available ? "pointer" : "not-allowed",
                      opacity: slot.available ? 1 : 0.5,
                      border: selectedSlot?.time === slot.time ? 2 : 1,
                      borderColor: selectedSlot?.time === slot.time ? "primary.main" : "divider",
                      "&:hover": {
                        backgroundColor: slot.available ? "action.hover" : "inherit",
                        transform: slot.available ? "translateY(-2px)" : "none",
                      },
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => handleSlotClick(slot)}
                  >
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                      {getSlotIcon(slot)}
                    </Box>
                    
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      {slot.time}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      {slot.cost} HUF
                    </Typography>
                    
                    {slot.is_peak && (
                      <Chip
                        size="small"
                        label="Peak"
                        color="warning"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                    
                    {!slot.weather_suitable && (
                      <Chip
                        size="small"
                        label="Weather Risk"
                        color="error"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Legend */}
            <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CheckCircle color="success" fontSize="small" />
                <Typography variant="body2">Available</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Warning color="warning" fontSize="small" />
                <Typography variant="body2">Peak Hours</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Cancel color="error" fontSize="small" />
                <Typography variant="body2">Unavailable</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Booking Confirmation Dialog */}
      <Dialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Time Slot</DialogTitle>
        <DialogContent>
          {selectedSlot && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Location:</strong> {locationName}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Date:</strong> {formatDate(selectedDate)}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Time:</strong> {selectedSlot.time}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Cost:</strong> {selectedSlot.cost} HUF
              </Typography>
              {selectedSlot.is_peak && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This is a peak hour slot with premium pricing.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Schedule />}>
            Proceed to Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AvailabilityCalendar;