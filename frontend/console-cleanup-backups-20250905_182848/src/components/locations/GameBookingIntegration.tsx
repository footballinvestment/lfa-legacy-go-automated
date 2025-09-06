// src/components/locations/GameBookingIntegration.tsx
// LFA Legacy GO - Game Booking Integration with Location and Time Management

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  LocationOn,
  Schedule,
  People,
  Sports,
  Event,
  Add,
  Edit,
  Close,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

interface Location {
  id: number;
  name: string;
  address: string;
  capacity: number;
  hourly_rate: number;
  amenities: string[];
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_booked?: boolean;
}

interface BookedSlot {
  id: string;
  tournament_name: string;
  participants: number;
  max_participants: number;
  entry_fee: number;
  status: "draft" | "published" | "ongoing" | "completed";
  start_time: string;
  end_time: string;
}

interface NewBooking {
  tournament_name: string;
  max_participants: number;
  entry_fee: number;
  description: string;
  status: "draft" | "published";
}

const GameBookingIntegration: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [newBooking, setNewBooking] = useState<NewBooking>({
    tournament_name: "",
    max_participants: 8,
    entry_fee: 10,
    description: "",
    status: "draft",
  });

  // Load locations on mount
  useEffect(() => {
    const sampleLocations: Location[] = [
      {
        id: 1,
        name: "Downtown Sports Center",
        address: "123 Main St, Budapest",
        capacity: 32,
        hourly_rate: 50,
        amenities: ["Parking", "WiFi", "Snacks", "Lockers"],
      },
      {
        id: 2,
        name: "Riverside Football Club",
        address: "456 River Rd, Budapest",
        capacity: 24,
        hourly_rate: 40,
        amenities: ["Parking", "Changing Rooms", "Equipment Rental"],
      },
    ];
    setLocations(sampleLocations);
    setSelectedLocation(sampleLocations[0]);
  }, []);

  // Generate time slots for selected date
  useEffect(() => {
    if (selectedLocation && selectedDate) {
      generateTimeSlots();
      loadBookedSlots();
    }
  }, [selectedLocation, selectedDate]);

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 21; // 9 PM

    for (let hour = startHour; hour < endHour; hour += 2) {
      const startTime = `${hour.toString().padStart(2, "0")}:00`;
      const endTime = `${(hour + 2).toString().padStart(2, "0")}:00`;

      slots.push({
        id: `slot-${hour}`,
        start_time: startTime,
        end_time: endTime,
        is_available: Math.random() > 0.3, // 70% availability
      });
    }

    setTimeSlots(slots);
  };

  const loadBookedSlots = () => {
    // Simulate booked tournaments
    const booked: BookedSlot[] = [
      {
        id: "booking-1",
        tournament_name: "Evening Championship",
        participants: 8,
        max_participants: 16,
        entry_fee: 15,
        status: "published",
        start_time: "18:00",
        end_time: "20:00",
      },
    ];
    setBookedSlots(booked);
  };

  const formatTimeSlot = (start: string, end: string) => {
    return `${start} - ${end}`;
  };

  const handleBookSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setBookingDialogOpen(true);
  };

  const handleCreateBooking = async () => {
    if (!selectedSlot || !selectedLocation) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newBookedSlot: BookedSlot = {
        id: `booking-${Date.now()}`,
        tournament_name: newBooking.tournament_name,
        participants: 0,
        max_participants: newBooking.max_participants,
        entry_fee: newBooking.entry_fee,
        status: newBooking.status,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
      };

      setBookedSlots((prev) => [...prev, newBookedSlot]);
      setBookingDialogOpen(false);

      // Reset form
      setNewBooking({
        tournament_name: "",
        max_participants: 8,
        entry_fee: 10,
        description: "",
        status: "draft",
      });
    } catch (error) {
      console.error("Booking failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          🏟️ Game Booking & Location Management
        </Typography>

        {/* Location and Date Selection */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Select Location</InputLabel>
              <Select
                value={selectedLocation?.id || ""}
                onChange={(e) => {
                  const location = locations.find(
                    (l) => l.id === Number(e.target.value)
                  );
                  setSelectedLocation(location || null);
                }}
                label="Select Location"
              >
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name} - ${location.hourly_rate}/hour
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate || new Date())}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </Grid>
        </Grid>

        {/* Location Stats */}
        {selectedLocation && (
          <Paper sx={{ p: 3, mb: 4, bgcolor: "background.default" }}>
            <Typography variant="h6" gutterBottom>
              📊 {selectedLocation.name} - Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {timeSlots.filter((s) => s.is_available).length}
                  </Typography>
                  <Typography variant="caption">Available Slots</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h6" color="secondary">
                    {bookedSlots.length}
                  </Typography>
                  <Typography variant="caption">Tournaments Today</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">
                    {bookedSlots.reduce((sum, b) => sum + b.participants, 0)}
                  </Typography>
                  <Typography variant="caption">Total Players</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h6" color="warning.main">
                    ${selectedLocation.hourly_rate}
                  </Typography>
                  <Typography variant="caption">Hourly Rate</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Time Slots and Bookings */}
        <Grid container spacing={3}>
          {/* Available Time Slots */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ⏰ Available Time Slots
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {selectedDate.toDateString()}
                </Typography>

                {timeSlots.length > 0 ? (
                  <List>
                    {timeSlots.map((slot) => (
                      <ListItem
                        key={slot.id}
                        sx={{
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: slot.is_available
                            ? "success.light"
                            : "grey.100",
                        }}
                      >
                        <ListItemIcon>
                          <Schedule
                            color={slot.is_available ? "success" : "disabled"}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={formatTimeSlot(
                            slot.start_time,
                            slot.end_time
                          )}
                          secondary={
                            slot.is_available ? "Available" : "Unavailable"
                          }
                        />
                        {slot.is_available && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => handleBookSlot(slot)}
                          >
                            Book
                          </Button>
                        )}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    No time slots available for selected date.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Booked Tournaments */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🏆 Booked Tournaments
                </Typography>

                {bookedSlots.length > 0 ? (
                  <List>
                    {bookedSlots.map((booking) => (
                      <ListItem
                        key={booking.id}
                        sx={{
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: "primary.light",
                        }}
                      >
                        <ListItemIcon>
                          <Sports color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography variant="subtitle2">
                                {booking.tournament_name}
                              </Typography>
                              <Chip
                                label={booking.status}
                                size="small"
                                color={
                                  booking.status === "published"
                                    ? "success"
                                    : "default"
                                }
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {formatTimeSlot(
                                  booking.start_time,
                                  booking.end_time
                                )}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {booking.participants}/
                                {booking.max_participants} players • $
                                {booking.entry_fee} entry
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    No tournaments booked for this date and location.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tournament Booking Dialog */}
        <Dialog
          open={bookingDialogOpen}
          onClose={() => setBookingDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                Book Tournament Slot
                {selectedSlot && (
                  <Typography variant="subtitle2" color="textSecondary">
                    {formatTimeSlot(
                      selectedSlot.start_time,
                      selectedSlot.end_time
                    )}{" "}
                    at {selectedLocation?.name}
                  </Typography>
                )}
              </Box>
              <IconButton onClick={() => setBookingDialogOpen(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Tournament Name"
                  value={newBooking.tournament_name}
                  onChange={(e) =>
                    setNewBooking((prev) => ({
                      ...prev,
                      tournament_name: e.target.value,
                    }))
                  }
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Max Participants"
                  type="number"
                  value={newBooking.max_participants}
                  onChange={(e) =>
                    setNewBooking((prev) => ({
                      ...prev,
                      max_participants: parseInt(e.target.value),
                    }))
                  }
                  fullWidth
                  inputProps={{ min: 2, max: selectedLocation?.capacity || 32 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Entry Fee (Credits)"
                  type="number"
                  value={newBooking.entry_fee}
                  onChange={(e) =>
                    setNewBooking((prev) => ({
                      ...prev,
                      entry_fee: parseInt(e.target.value),
                    }))
                  }
                  fullWidth
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Tournament Description"
                  value={newBooking.description}
                  onChange={(e) =>
                    setNewBooking((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newBooking.status}
                    onChange={(e) =>
                      setNewBooking((prev) => ({
                        ...prev,
                        status: e.target.value as any,
                      }))
                    }
                  >
                    <MenuItem value="draft">Draft (Private)</MenuItem>
                    <MenuItem value="published">
                      Published (Open for Registration)
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Booking Summary */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2, bgcolor: "background.default" }}>
                  <Typography variant="h6" gutterBottom>
                    Booking Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <LocationOn color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {selectedLocation?.name}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Schedule color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {selectedSlot &&
                            formatTimeSlot(
                              selectedSlot.start_time,
                              selectedSlot.end_time
                            )}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <People color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          Up to {newBooking.max_participants} players
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" fontWeight="bold">
                          Total Cost: ${selectedLocation?.hourly_rate || 0}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBookingDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreateBooking}
              disabled={loading || !newBooking.tournament_name}
            >
              {loading ? <CircularProgress size={20} /> : "Create Booking"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default GameBookingIntegration;
