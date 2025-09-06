import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Switch,
  Slider,
  Tabs,
  Tab,
  Grid,
  Chip,
  Alert,
  IconButton,
  Divider,
  Paper,
  TextField,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  useTheme,
} from "@mui/material";
import {
  Close,
  Palette,
  Schedule,
  Accessibility,
  Tune,
  Download,
  Upload,
  Restore,
  Preview,
  LightMode,
  DarkMode,
  SettingsBrightness,
  Contrast,
  FormatSize,
  RoundedCorner,
  Animation,
  LocationOn,
  AccessTime,
  ColorLens,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
// Using standard TextField for time input instead of MUI X DatePickers to avoid additional dependencies
import {
  useAppTheme,
  ColorScheme,
  ContrastLevel,
  FontSize,
  BorderRadius,
  ScheduleSettings,
} from "../../contexts/ThemeContext";
import useMobileViewport from "../../hooks/useMobileViewport";

interface ThemeSettingsProps {
  open: boolean;
  onClose: () => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const { isMobile } = useMobileViewport();
  const {
    config,
    toggleTheme,
    setThemeMode,
    setColorScheme,
    setContrastLevel,
    setFontSize,
    setBorderRadius,
    setReducedMotion,
    setAutoSchedule,
    setScheduleSettings,
    setSystemTheme,
    resetToDefaults,
    exportConfig,
    importConfig,
  } = useAppTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [exportedConfig, setExportedConfig] = useState("");
  const [importedConfig, setImportedConfig] = useState("");
  const [importError, setImportError] = useState("");

  // Color scheme options
  const colorSchemes: Array<{
    value: ColorScheme;
    label: string;
    primary: string;
    secondary: string;
  }> = [
    {
      value: "blue",
      label: "Ocean Blue",
      primary: "#1976d2",
      secondary: "#dc004e",
    },
    {
      value: "green",
      label: "Forest Green",
      primary: "#2e7d32",
      secondary: "#ed6c02",
    },
    {
      value: "purple",
      label: "Royal Purple",
      primary: "#7b1fa2",
      secondary: "#d32f2f",
    },
    {
      value: "orange",
      label: "Sunset Orange",
      primary: "#ed6c02",
      secondary: "#1976d2",
    },
    {
      value: "red",
      label: "Crimson Red",
      primary: "#d32f2f",
      secondary: "#2e7d32",
    },
    {
      value: "teal",
      label: "Ocean Teal",
      primary: "#00695c",
      secondary: "#7b1fa2",
    },
    {
      value: "pink",
      label: "Rose Pink",
      primary: "#c2185b",
      secondary: "#00695c",
    },
  ];

  // Check geolocation permission
  const checkLocationPermission = useCallback(async () => {
    if (!navigator.permissions) {
      setLocationPermission("denied");
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      setLocationPermission(result.state);

      result.onchange = () => {
        setLocationPermission(result.state);
      };
    } catch (error) {
      setLocationPermission("denied");
    }
  }, []);

  // Request location permission and get coordinates
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationPermission("denied");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          });
        }
      );

      setLocationPermission("granted");
      setScheduleSettings({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        useLocation: true,
      });
    } catch (error) {
      setLocationPermission("denied");
      console.error("Failed to get location:", error);
    }
  }, [setScheduleSettings]);

  // Handle time change
  const handleTimeChange =
    (field: "darkStart" | "darkEnd") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const timeString = event.target.value;
      setScheduleSettings({ [field]: timeString });
    };

  // Handle config export
  const handleExport = () => {
    const config = exportConfig();
    setExportedConfig(config);

    // Copy to clipboard
    navigator.clipboard.writeText(config).then(() => {
      console.log("Config copied to clipboard");
    });
  };

  // Handle config import
  const handleImport = () => {
    setImportError("");
    const success = importConfig(importedConfig);

    if (success) {
      setImportedConfig("");
      onClose();
    } else {
      setImportError("Invalid configuration format");
    }
  };

  // Reset all settings
  const handleReset = () => {
    resetToDefaults();
  };

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, [checkLocationPermission]);

  // Tab panels
  const TabPanel: React.FC<{
    value: number;
    index: number;
    children: React.ReactNode;
  }> = ({ value, index, children }) => (
    <Box hidden={value !== index} sx={{ py: 3 }}>
      {value === index && children}
    </Box>
  );

  // Render appearance tab
  const renderAppearanceTab = () => (
    <Box>
      {/* Theme Mode */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Palette color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Theme Mode
            </Typography>
          </Box>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={config.systemTheme ? "system" : config.mode}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "system") {
                  setSystemTheme(true);
                } else {
                  setSystemTheme(false);
                  setThemeMode(value as "light" | "dark");
                }
              }}
            >
              <FormControlLabel
                value="system"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <SettingsBrightness />
                    <Box>
                      <Typography variant="body1">System Default</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Follow your device settings
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              <FormControlLabel
                value="light"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <LightMode />
                    <Box>
                      <Typography variant="body1">Light Mode</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Bright and clean interface
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              <FormControlLabel
                value="dark"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <DarkMode />
                    <Box>
                      <Typography variant="body1">Dark Mode</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Easy on the eyes
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* Color Scheme */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <ColorLens color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Color Scheme
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {colorSchemes.map((scheme) => (
              <Grid item xs={6} sm={4} key={scheme.value}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    border: config.colorScheme === scheme.value ? 2 : 1,
                    borderColor:
                      config.colorScheme === scheme.value
                        ? "primary.main"
                        : "divider",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => setColorScheme(scheme.value)}
                >
                  <Box display="flex" gap={1} mb={1}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: scheme.primary,
                      }}
                    />
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: scheme.secondary,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {scheme.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Preview */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Preview color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Preview
            </Typography>
          </Box>

          <Box
            sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}
          >
            <Typography variant="h6" gutterBottom>
              Sample Tournament
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Join this exciting football tournament
            </Typography>
            <Box display="flex" gap={1} mb={2}>
              <Chip label="Upcoming" color="primary" size="small" />
              <Chip label="$25 Entry" variant="outlined" size="small" />
            </Box>
            <Button variant="contained" size="small">
              Join Tournament
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  // Render scheduling tab
  const renderSchedulingTab = () => (
    <Box>
      {/* Auto-Schedule Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Schedule color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Auto-Schedule
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={config.autoSchedule}
                onChange={(e) => setAutoSchedule(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body1">Enable Auto-Schedule</Typography>
                <Typography variant="caption" color="text.secondary">
                  Automatically switch themes based on time
                </Typography>
              </Box>
            }
          />

          <Collapse in={config.autoSchedule}>
            <Box mt={3}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Theme will automatically switch between light and dark modes
                based on your schedule
              </Alert>

              {/* Location-based scheduling */}
              <FormControlLabel
                control={
                  <Switch
                    checked={config.scheduleSettings.useLocation}
                    onChange={(e) =>
                      setScheduleSettings({ useLocation: e.target.checked })
                    }
                    disabled={locationPermission === "denied"}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Use Sunrise/Sunset</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Switch based on your location's sunrise and sunset
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2 }}
              />

              {config.scheduleSettings.useLocation && (
                <Box mb={3}>
                  {locationPermission === "prompt" && (
                    <Button
                      variant="outlined"
                      startIcon={<LocationOn />}
                      onClick={requestLocation}
                      sx={{ mb: 2 }}
                    >
                      Allow Location Access
                    </Button>
                  )}

                  {locationPermission === "denied" && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Location access is required for sunrise/sunset scheduling
                    </Alert>
                  )}

                  {locationPermission === "granted" &&
                    config.scheduleSettings.latitude && (
                      <Typography variant="body2" color="text.secondary">
                        Location: {config.scheduleSettings.latitude.toFixed(2)},{" "}
                        {config.scheduleSettings.longitude?.toFixed(2)}
                      </Typography>
                    )}
                </Box>
              )}

              {/* Manual time scheduling */}
              <Collapse in={!config.scheduleSettings.useLocation}>
                <Box>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Manual Schedule
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="time"
                        label="Dark Mode Start"
                        value={config.scheduleSettings.darkStart}
                        onChange={handleTimeChange("darkStart")}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="time"
                        label="Dark Mode End"
                        value={config.scheduleSettings.darkEnd}
                        onChange={handleTimeChange("darkEnd")}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );

  // Render accessibility tab
  const renderAccessibilityTab = () => (
    <Box>
      {/* Contrast Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Contrast color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Contrast
            </Typography>
          </Box>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={config.contrastLevel}
              onChange={(e) =>
                setContrastLevel(e.target.value as ContrastLevel)
              }
            >
              <FormControlLabel
                value="low"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">Low Contrast</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Softer, easier on sensitive eyes
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="normal"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">Normal Contrast</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Standard contrast levels
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="high"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">High Contrast</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Maximum contrast for better readability
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <FormatSize color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Font Size
            </Typography>
          </Box>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={config.fontSize}
              onChange={(e) => setFontSize(e.target.value as FontSize)}
            >
              <FormControlLabel
                value="small"
                control={<Radio />}
                label="Small - Compact text for more content"
              />
              <FormControlLabel
                value="medium"
                control={<Radio />}
                label="Medium - Standard readable size"
              />
              <FormControlLabel
                value="large"
                control={<Radio />}
                label="Large - Easier to read for accessibility"
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* Motion Settings */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Animation color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Motion & Animation
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={config.reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body1">Reduce Motion</Typography>
                <Typography variant="caption" color="text.secondary">
                  Minimize animations for better accessibility
                </Typography>
              </Box>
            }
          />
        </CardContent>
      </Card>
    </Box>
  );

  // Render advanced tab
  const renderAdvancedTab = () => (
    <Box>
      {/* Border Radius */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <RoundedCorner color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Border Radius
            </Typography>
          </Box>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={config.borderRadius}
              onChange={(e) => setBorderRadius(e.target.value as BorderRadius)}
            >
              <FormControlLabel
                value="sharp"
                control={<Radio />}
                label="Sharp - No rounded corners"
              />
              <FormControlLabel
                value="normal"
                control={<Radio />}
                label="Normal - Subtle rounded corners"
              />
              <FormControlLabel
                value="rounded"
                control={<Radio />}
                label="Rounded - More pronounced curves"
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* Import/Export */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Tune color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Configuration
            </Typography>
          </Box>

          <Box display="flex" gap={2} mb={3}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
              fullWidth
            >
              Export Settings
            </Button>
            <Button
              variant="outlined"
              startIcon={<Restore />}
              onClick={handleReset}
              fullWidth
              color="warning"
            >
              Reset All
            </Button>
          </Box>

          <Collapse in={!!exportedConfig}>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={exportedConfig}
              label="Exported Configuration"
              variant="outlined"
              sx={{ mb: 2 }}
              InputProps={{ readOnly: true }}
            />
          </Collapse>

          <TextField
            fullWidth
            multiline
            rows={3}
            value={importedConfig}
            onChange={(e) => setImportedConfig(e.target.value)}
            label="Import Configuration"
            placeholder="Paste exported configuration here..."
            variant="outlined"
            error={!!importError}
            helperText={importError}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={handleImport}
            disabled={!importedConfig.trim()}
            fullWidth
          >
            Import Settings
          </Button>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Theme Settings
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons="auto"
          >
            <Tab icon={<Palette />} label="Appearance" iconPosition="start" />
            <Tab icon={<Schedule />} label="Scheduling" iconPosition="start" />
            <Tab
              icon={<Accessibility />}
              label="Accessibility"
              iconPosition="start"
            />
            <Tab icon={<Tune />} label="Advanced" iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            {renderAppearanceTab()}
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            {renderSchedulingTab()}
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            {renderAccessibilityTab()}
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            {renderAdvancedTab()}
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button onClick={toggleTheme} variant="contained">
          Toggle Theme
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThemeSettings;
