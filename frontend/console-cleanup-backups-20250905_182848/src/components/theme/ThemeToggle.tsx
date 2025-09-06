import React, { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Typography,
  Divider,
  useTheme,
  Fade,
} from "@mui/material";
import {
  LightMode,
  DarkMode,
  SettingsBrightness,
  Settings,
  Palette,
  Schedule,
  AutoAwesome,
} from "@mui/icons-material";
import { useAppTheme } from "../../contexts/ThemeContext";
import ThemeSettings from "./ThemeSettings";

interface ThemeToggleProps {
  showLabel?: boolean;
  variant?: "icon" | "chip" | "button";
  size?: "small" | "medium" | "large";
  showQuickActions?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  variant = "icon",
  size = "medium",
  showQuickActions = true,
}) => {
  const theme = useTheme();
  const { config, toggleTheme, setThemeMode, setSystemTheme, setColorScheme } =
    useAppTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const open = Boolean(anchorEl);

  // Get current theme icon and label
  const getThemeInfo = () => {
    if (config.systemTheme) {
      return {
        icon: <SettingsBrightness />,
        label: "System",
        description: "Follows system setting",
      };
    }

    if (theme.palette.mode === "dark") {
      return {
        icon: <DarkMode />,
        label: "Dark",
        description: "Dark mode active",
      };
    }

    return {
      icon: <LightMode />,
      label: "Light",
      description: "Light mode active",
    };
  };

  const themeInfo = getThemeInfo();

  // Handle menu open
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (showQuickActions) {
      setAnchorEl(event.currentTarget);
    } else {
      toggleTheme();
    }
  };

  // Handle menu close
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle theme mode selection
  const handleThemeMode = (mode: "light" | "dark" | "system") => {
    if (mode === "system") {
      setSystemTheme(true);
    } else {
      setSystemTheme(false);
      setThemeMode(mode);
    }
    handleClose();
  };

  // Handle quick color scheme change
  const handleColorScheme = (scheme: "blue" | "green" | "purple") => {
    setColorScheme(scheme);
    handleClose();
  };

  // Handle settings open
  const handleSettingsOpen = () => {
    setSettingsOpen(true);
    handleClose();
  };

  // Render based on variant
  const renderToggle = () => {
    switch (variant) {
      case "chip":
        return (
          <Box
            onClick={handleClick}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              borderRadius: 2,
              cursor: "pointer",
              backgroundColor: theme.palette.action.hover,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: theme.palette.action.selected,
                transform: "scale(1.02)",
              },
            }}
          >
            {themeInfo.icon}
            {showLabel && (
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {themeInfo.label}
              </Typography>
            )}
          </Box>
        );

      case "button":
        return (
          <Box
            onClick={handleClick}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.5,
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              cursor: "pointer",
              backgroundColor: "background.paper",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "primary.main",
                boxShadow: 1,
              },
            }}
          >
            {themeInfo.icon}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {themeInfo.label} Theme
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {themeInfo.description}
              </Typography>
            </Box>
          </Box>
        );

      default: // icon
        return (
          <Tooltip title={`Current: ${themeInfo.label} theme`}>
            <IconButton
              onClick={handleClick}
              size={size}
              sx={{
                color: "text.primary",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  transform: "rotate(180deg)",
                },
              }}
            >
              <Fade in key={theme.palette.mode} timeout={300}>
                {themeInfo.icon}
              </Fade>
            </IconButton>
          </Tooltip>
        );
    }
  };

  return (
    <>
      {renderToggle()}

      {/* Quick Actions Menu */}
      {showQuickActions && (
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              "& .MuiMenuItem-root": {
                borderRadius: 1,
                margin: "2px 8px",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              },
            },
          }}
        >
          {/* Theme Mode Options */}
          <MenuItem
            onClick={() => handleThemeMode("light")}
            selected={!config.systemTheme && theme.palette.mode === "light"}
          >
            <ListItemIcon>
              <LightMode fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2">Light Mode</Typography>
            </ListItemText>
          </MenuItem>

          <MenuItem
            onClick={() => handleThemeMode("dark")}
            selected={!config.systemTheme && theme.palette.mode === "dark"}
          >
            <ListItemIcon>
              <DarkMode fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2">Dark Mode</Typography>
            </ListItemText>
          </MenuItem>

          <MenuItem
            onClick={() => handleThemeMode("system")}
            selected={config.systemTheme}
          >
            <ListItemIcon>
              <SettingsBrightness fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2">System Default</Typography>
            </ListItemText>
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          {/* Quick Color Schemes */}
          <MenuItem onClick={() => handleColorScheme("blue")}>
            <ListItemIcon>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: "#1976d2",
                }}
              />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2">Ocean Blue</Typography>
            </ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleColorScheme("green")}>
            <ListItemIcon>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: "#2e7d32",
                }}
              />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2">Forest Green</Typography>
            </ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleColorScheme("purple")}>
            <ListItemIcon>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: "#7b1fa2",
                }}
              />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2">Royal Purple</Typography>
            </ListItemText>
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          {/* Auto-Schedule Quick Toggle */}
          {config.autoSchedule && (
            <MenuItem disabled>
              <ListItemIcon>
                <Schedule fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2" color="primary">
                  Auto-Schedule Active
                </Typography>
              </ListItemText>
              <AutoAwesome fontSize="small" color="primary" />
            </MenuItem>
          )}

          {/* Settings */}
          <MenuItem onClick={handleSettingsOpen}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2">Theme Settings</Typography>
            </ListItemText>
          </MenuItem>
        </Menu>
      )}

      {/* Theme Settings Dialog */}
      <ThemeSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};

export default ThemeToggle;
