import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import {
  LocationOn,
  Schedule,
  Map,
  EmojiEvents,
} from "@mui/icons-material";
import { useSafeAuth } from "../SafeAuthContext";
import LocationManager from "../components/locations/LocationManager";
import AvailabilityCalendar from "../components/locations/AvailabilityCalendar";
import GameBookingIntegration from "../components/locations/GameBookingIntegration";

const LocationManagement: React.FC = () => {
  const { user } = useSafeAuth();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");

  const handleLocationSelect = (locationId: number, locationName: string) => {
    setSelectedLocationId(locationId);
    setSelectedLocationName(locationName);
    setSelectedTab(1); // Switch to availability tab
  };

  const userRole = user?.user_type === 'admin' || user?.user_type === 'moderator' ? 'admin' : 'user';

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
      >
        <LocationOn color="primary" />
        Location Services
      </Typography>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Locations" icon={<LocationOn />} />
          <Tab 
            label={selectedLocationId ? `Availability - ${selectedLocationName}` : "Select Location First"} 
            icon={<Schedule />}
            disabled={!selectedLocationId}
          />
          <Tab label="Game Booking" icon={<EmojiEvents />} />
          <Tab label="Map View" icon={<Map />} disabled />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {selectedTab === 0 && (
          <LocationManager 
            userRole={userRole}
            onLocationSelect={handleLocationSelect}
          />
        )}
        
        {selectedTab === 1 && selectedLocationId && (
          <AvailabilityCalendar
            locationId={selectedLocationId}
            locationName={selectedLocationName}
          />
        )}
        
        {selectedTab === 2 && (
          <GameBookingIntegration />
        )}
        
        {selectedTab === 3 && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Map View Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Interactive map with location markers will be available in the next update.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LocationManagement;