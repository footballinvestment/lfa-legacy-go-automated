// src/components/weather/WeatherWidget.tsx
// LFA Legacy GO - Weather Widget Component (Fixed Version)

import React, { useState, useEffect, useCallback } from "react";
import config from "../../config/environment";
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  WbSunny,
  Cloud,
  CloudQueue,
  Umbrella,
  AcUnit,
  Visibility,
  Air,
  Thermostat,
  ExpandMore,
  Refresh,
  Warning,
} from "@mui/icons-material";

interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  visibility: number;
  condition: string;
  description: string;
  severity: string;
  precipitation_probability: number;
  precipitation_amount: number;
  weather_time: string;
}

interface WeatherAlert {
  id: number;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  issued_at: string;
  expires_at: string;
}

interface WeatherWidgetProps {
  locationId: number;
  locationName?: string;
  compact?: boolean;
  showAlerts?: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  locationId,
  locationName,
  compact = false,
  showAlerts = true,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      // Fetch current weather
      const weatherResponse = await fetch(
        `${config.API_URL}/api/weather/location/${locationId}/current`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        setWeather(weatherData);
        setLastUpdate(new Date());
      }

      // Fetch alerts if enabled
      if (showAlerts) {
        const alertsResponse = await fetch(
          `${config.API_URL}/api/weather/location/${locationId}/alerts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          setAlerts(alertsData.alerts || []);
        }
      }

      setError(null);
    } catch (err: any) {
      console.error("Weather data fetch error:", err);
      setError(err.message || "Failed to load weather data");
    } finally {
      setLoading(false);
    }
  }, [locationId, showAlerts]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  const getWeatherIcon = (condition: string) => {
    const iconProps = { sx: { fontSize: compact ? 24 : 32 } };

    switch (condition.toLowerCase()) {
      case "clear":
        return <WbSunny color="warning" {...iconProps} />;
      case "cloudy":
        return <Cloud color="action" {...iconProps} />;
      case "partly_cloudy":
        return <CloudQueue color="action" {...iconProps} />;
      case "light_rain":
      case "heavy_rain":
        return <Umbrella color="primary" {...iconProps} />;
      case "snow":
        return <AcUnit color="info" {...iconProps} />;
      default:
        return <WbSunny color="warning" {...iconProps} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "extreme":
        return "error";
      case "high":
        return "warning";
      case "moderate":
        return "info";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const formatTemperature = (temp: number) => `${Math.round(temp)}°C`;

  if (loading) {
    return (
      <Card sx={{ p: 2, textAlign: "center" }}>
        <CircularProgress size={compact ? 20 : 30} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading weather...
        </Typography>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ p: 2 }}>
        <Alert
          severity="warning"
          action={
            <IconButton size="small" onClick={fetchWeatherData}>
              <Refresh fontSize="small" />
            </IconButton>
          }
        >
          Weather unavailable
        </Alert>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No weather data available
        </Typography>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        {getWeatherIcon(weather.condition)}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatTemperature(weather.temperature)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {weather.description}
          </Typography>
        </Box>
        {alerts.length > 0 && (
          <Tooltip title={`${alerts.length} weather alert(s)`}>
            <Warning color="warning" fontSize="small" />
          </Tooltip>
        )}
      </Card>
    );
  }

  return (
    <Card sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Weather {locationName && `- ${locationName}`}
        </Typography>
        <IconButton size="small" onClick={fetchWeatherData}>
          <Refresh fontSize="small" />
        </IconButton>
      </Box>

      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              severity={getSeverityColor(alert.severity) as any}
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {alert.title}
              </Typography>
              <Typography variant="caption">{alert.description}</Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Main Weather Info */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        {getWeatherIcon(weather.condition)}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {formatTemperature(weather.temperature)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Feels like {formatTemperature(weather.feels_like)}
          </Typography>
          <Typography variant="body1" sx={{ textTransform: "capitalize" }}>
            {weather.description}
          </Typography>
        </Box>
        <Chip
          label={weather.severity}
          color={getSeverityColor(weather.severity) as any}
          size="small"
        />
      </Box>

      {/* Weather Details Toggle */}
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            "&:hover": { backgroundColor: "action.hover" },
            borderRadius: 1,
            p: 0.5,
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Typography variant="body2" color="primary.main" sx={{ flex: 1 }}>
            Weather Details
          </Typography>
          <ExpandMore
            sx={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          />
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ pt: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Thermostat fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Humidity
                  </Typography>
                  <Typography variant="body2">{weather.humidity}%</Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Air fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Wind
                  </Typography>
                  <Typography variant="body2">
                    {Math.round(weather.wind_speed)} km/h
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Visibility fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Visibility
                  </Typography>
                  <Typography variant="body2">
                    {weather.visibility} km
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Umbrella fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Precipitation
                  </Typography>
                  <Typography variant="body2">
                    {weather.precipitation_probability}%
                  </Typography>
                </Box>
              </Box>
            </Box>

            {lastUpdate && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: "block" }}
              >
                Last updated: {lastUpdate.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        </Collapse>
      </Box>
    </Card>
  );
};

export default WeatherWidget;
