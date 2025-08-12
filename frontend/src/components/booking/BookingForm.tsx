// src/components/booking/BookingForm.tsx
// LFA Legacy GO - TELJES MŰKÖDŐ Booking Form

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  Divider,
} from "@mui/material";
import {
  ArrowBack,
  CheckCircle,
  Schedule,
  LocationOn,
  SportsSoccer,
  SportsScore,
  Speed,
  AccountBalanceWallet,
} from "@mui/icons-material";
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

interface BookingResponse {
  success: boolean;
  message: string;
  session_id?: string;
  id?: string;
  credits_charged?: number;
  weather_warning?: string;
}

const BookingForm: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateUser } = useAuth();

  // Default to location 1 (can be made dynamic later)
  const locationId = "1";

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

  // Get tomorrow's date in YYYY-MM-DD format (minimum selectable date)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Game type options with icons
  const gameTypes = [
    {
      value: "GAME1",
      label: "⚽ Football Skills Challenge",
      icon: <SportsSoccer />,
    },
    { value: "GAME2", label: "🥅 Penalty Shootout", icon: <SportsScore /> },
    { value: "GAME3", label: "⚡ Speed Challenge", icon: <Speed /> },
  ];

  // Memoized fetchAvailability function
  const fetchAvailability = useCallback(async () => {
    if (!selectedDate) return;

    setLoading(true);
    setError(null);
    setSelectedTime(""); // Clear selected time when date changes

    try {
      const token = localStorage.getItem("auth_token");
      const url = `http://localhost:8000/api/booking/availability?date=${selectedDate}&location_id=${locationId}&game_type=${gameType}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to load availability");
        setAvailableSlots([]);
      }
    } catch (err) {
      setError("Network error while loading availability");
      setAvailableSlots([]);
      console.error("Availability fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, locationId, gameType]);

  // Load location data on component mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setError("Please log in to continue");
          return;
        }

        const response = await fetch("http://localhost:8000/api/locations", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const locations = Array.isArray(data) ? data : data.locations || [];
          const foundLocation = locations.find(
            (loc: any) => loc.id === parseInt(locationId)
          );

          if (foundLocation) {
            setLocation({
              id: foundLocation.id,
              name: foundLocation.name,
              address: foundLocation.address,
              base_cost_per_hour: foundLocation.base_cost_per_hour || 5,
            });
          }
        } else {
          setError("Failed to load location information");
        }
      } catch (err) {
        console.error("Error fetching location:", err);
        setError("Network error while loading location");
      }
    };

    fetchLocation();
  }, [locationId]);

  // Load availability when date or game type changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailability();
    }
  }, [selectedDate, fetchAvailability]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !location) {
      setError("Please select date and time");
      return;
    }

    // Check if user has enough credits
    const selectedSlot = availableSlots.find(
      (slot) => slot.time === selectedTime
    );
    const totalCost = selectedSlot ? selectedSlot.cost_credits * duration : 0;

    if (state.user && totalCost > state.user.credits) {
      setError(
        `Insufficient credits. You need ${totalCost} credits but only have ${state.user.credits}.`
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");

      // JAVÍTÁS: Combine date and time into ISO format for start_time
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const startTimeISO = startDateTime.toISOString();

      const bookingData = {
        location_id: parseInt(locationId),
        start_time: startTimeISO, // JAVÍTÁS: Correct field name and format
        duration_minutes: duration * 60, // JAVÍTÁS: Convert hours to minutes
        game_type: gameType,
        notes: `Booking for ${duration} hour(s) - Total cost: ${totalCost} credits`,
      };

      console.log("Sending booking data:", bookingData); // Debug log

      const response = await fetch("http://localhost:8000/api/booking/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const result: BookingResponse = await response.json();

        // Update user credits in context
        if (updateUser && state.user) {
          updateUser({
            credits: state.user.credits - totalCost,
          });
        }

        setSuccess(
          `🎉 Booking confirmed! Session ID: ${
            result.session_id || result.id
          }. ${
            result.credits_charged
              ? `${result.credits_charged} credits charged.`
              : ""
          }`
        );

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } else {
        const errorData = await response.json();
        console.error("Booking error response:", errorData); // Debug log
        setError(errorData.detail || "Booking failed");
      }
    } catch (err) {
      setError("Network error during booking");
      console.error("Booking error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate costs
  const selectedSlot = availableSlots.find(
    (slot) => slot.time === selectedTime
  );
  const totalCost = selectedSlot ? selectedSlot.cost_credits * duration : 0;
  const userCredits = state.user?.credits || 0;
  const hasEnoughCredits = totalCost <= userCredits;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <IconButton
          onClick={() => navigate("/locations")}
          sx={{ mr: 2, color: "primary.main" }}
        >
          <ArrowBack />
        </IconButton>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: "text.primary" }}
        >
          Book a Location 📅
        </Typography>
      </Box>

      {/* Success Message */}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3, fontSize: "1.1rem" }}
          icon={<CheckCircle />}
        >
          {success}
          <br />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Redirecting to dashboard in 3 seconds...
          </Typography>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Main Booking Form */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Booking Details
            </Typography>

            {/* Location Info */}
            {location && (
              <Box
                sx={{
                  mb: 4,
                  p: 3,
                  bgcolor: "primary.50",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "primary.200",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <LocationOn color="primary" />
                  <Typography variant="h6" color="primary.main">
                    {location.name}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  📍 {location.address}
                </Typography>
                <Typography
                  variant="body2"
                  color="primary.main"
                  sx={{ fontWeight: 500 }}
                >
                  💰 Base cost: {location.base_cost_per_hour} credits/hour
                </Typography>
              </Box>
            )}

            <Grid container spacing={3}>
              {/* Date Selection */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="📅 Select Date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: tomorrow }}
                  helperText="Select a future date"
                />
              </Grid>

              {/* Game Type Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>🎮 Game Type</InputLabel>
                  <Select
                    value={gameType}
                    label="🎮 Game Type"
                    onChange={(e) => setGameType(e.target.value)}
                  >
                    {gameTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {type.icon}
                          <Typography sx={{ ml: 1 }}>{type.label}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Duration Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>⏱️ Duration</InputLabel>
                  <Select
                    value={duration}
                    label="⏱️ Duration"
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
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  🕒 Available Time Slots for {selectedDate}
                </Typography>

                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : availableSlots.length > 0 ? (
                  <Grid container spacing={2}>
                    {availableSlots.map((slot) => (
                      <Grid item xs={6} sm={4} md={3} key={slot.time}>
                        <Chip
                          label={`${slot.time} - ${slot.cost_credits}💰`}
                          color={
                            slot.time === selectedTime ? "primary" : "default"
                          }
                          variant={
                            slot.time === selectedTime ? "filled" : "outlined"
                          }
                          disabled={!slot.available}
                          onClick={() =>
                            slot.available && setSelectedTime(slot.time)
                          }
                          sx={{
                            fontSize: "0.9rem",
                            height: 40,
                            cursor: slot.available ? "pointer" : "not-allowed",
                            "&:hover": slot.available
                              ? {
                                  transform: "scale(1.05)",
                                  boxShadow: 2,
                                }
                              : {},
                            transition: "all 0.2s ease-in-out",
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No available slots for {selectedDate} with {gameType}. Try a
                    different date or game type.
                  </Alert>
                )}
              </Box>
            )}

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleBooking}
              disabled={
                !selectedDate ||
                !selectedTime ||
                submitting ||
                !hasEnoughCredits
              }
              startIcon={
                submitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Schedule />
                )
              }
              sx={{
                mt: 4,
                py: 2,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderRadius: 2,
                background: "linear-gradient(45deg, #4caf50, #66bb6a)",
                "&:hover": {
                  background: "linear-gradient(45deg, #388e3c, #4caf50)",
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
                "&:disabled": {
                  background: "grey.300",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              {submitting ? "Confirming Booking..." : "Confirm Booking 🎯"}
            </Button>
          </Card>
        </Grid>

        {/* Booking Summary Sidebar */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: 3,
              position: "sticky",
              top: 20,
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              📋 Booking Summary
            </Typography>

            {location && selectedDate && selectedTime ? (
              <>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="📍 Location"
                      secondary={location.name}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="📅 Date"
                      secondary={selectedDate}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="⏰ Time"
                      secondary={`${selectedTime} (${duration} hour${
                        duration > 1 ? "s" : ""
                      })`}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="🎮 Game Type"
                      secondary={
                        gameTypes.find((g) => g.value === gameType)?.label
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" color="primary.main">
                    💰 Total Cost:
                  </Typography>
                  <Typography
                    variant="h6"
                    color="primary.main"
                    sx={{ fontWeight: 700 }}
                  >
                    {totalCost} credits
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="body2">
                    <AccountBalanceWallet sx={{ mr: 0.5, fontSize: 16 }} />
                    Your Credits:
                  </Typography>
                  <Typography
                    variant="body2"
                    color={hasEnoughCredits ? "success.main" : "error.main"}
                    sx={{ fontWeight: 600 }}
                  >
                    {userCredits} available
                  </Typography>
                </Box>

                {!hasEnoughCredits && totalCost > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    ⚠️ You need {totalCost - userCredits} more credits to
                    complete this booking.
                  </Alert>
                )}

                {hasEnoughCredits && totalCost > 0 && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    ✅ You have enough credits for this booking!
                  </Alert>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Schedule sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Select date and time to see pricing details
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BookingForm;
