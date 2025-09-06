// src/styles/theme.ts
// LFA Legacy GO - Material-UI Theme Configuration

import { createTheme, ThemeOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Theme {
    status: {
      danger: string;
    };
  }

  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }
}

// LFA Legacy GO Color Palette
const colors = {
  primary: {
    main: "#10b981", // LFA Green
    light: "#34d399",
    dark: "#059669",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#3b82f6", // Blue
    light: "#60a5fa",
    dark: "#1d4ed8",
    contrastText: "#ffffff",
  },
  accent: {
    main: "#f59e0b", // Orange/Yellow
    light: "#fbbf24",
    dark: "#d97706",
  },
  error: {
    main: "#ef4444",
    light: "#f87171",
    dark: "#dc2626",
  },
  warning: {
    main: "#eab308",
    light: "#facc15",
    dark: "#ca8a04",
  },
  success: {
    main: "#22c55e",
    light: "#4ade80",
    dark: "#16a34a",
  },
};

// Light Theme Configuration
const lightTheme: ThemeOptions = {
  palette: {
    mode: "light",
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    warning: colors.warning,
    success: colors.success,
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 24px",
          fontSize: "0.95rem",
          fontWeight: 500,
          textTransform: "none",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            transform: "translateY(-1px)",
          },
          transition: "all 0.2s ease",
        },
        contained: {
          background: "linear-gradient(135deg, #10b981, #059669)",
          "&:hover": {
            background: "linear-gradient(135deg, #059669, #047857)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          "&:hover": {
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            transform: "translateY(-2px)",
          },
          transition: "all 0.3s ease",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.primary.main,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(90deg, #1e293b, #334155)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        },
      },
    },
  },
  status: {
    danger: colors.error.main,
  },
};

// Dark Theme Configuration
const darkTheme: ThemeOptions = {
  ...lightTheme,
  palette: {
    mode: "dark",
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    warning: colors.warning,
    success: colors.success,
    background: {
      default: "#0f172a",
      paper: "#1e293b",
    },
    text: {
      primary: "#f1f5f9",
      secondary: "#cbd5e1",
    },
  },
  components: {
    ...lightTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: "linear-gradient(145deg, #1e293b, #334155)",
          border: "1px solid rgba(71, 85, 105, 0.3)",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
          "&:hover": {
            boxShadow: "0 8px 25px rgba(16, 185, 129, 0.2)",
            transform: "translateY(-2px)",
          },
          transition: "all 0.3s ease",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(90deg, #0f172a, #1e293b)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
        },
      },
    },
  },
};

// Create theme instances
export const createAppTheme = (isDark: boolean) => {
  return createTheme(isDark ? darkTheme : lightTheme);
};

// Default themes
export const lightAppTheme = createTheme(lightTheme);
export const darkAppTheme = createTheme(darkTheme);

// Breakpoints for responsive design
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

// Animation configurations
export const animations = {
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
};

// Custom spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Weather condition colors
export const weatherColors = {
  clear: "#fbbf24",
  cloudy: "#6b7280",
  rainy: "#3b82f6",
  stormy: "#6366f1",
  snowy: "#e5e7eb",
  foggy: "#9ca3af",
};

// Game type colors
export const gameColors = {
  GAME1: colors.primary.main,
  GAME2: colors.secondary.main,
  GAME3: colors.accent.main,
  accuracy: "#8b5cf6",
  speed: "#ef4444",
  technique: "#06b6d4",
};

// Status colors
export const statusColors = {
  scheduled: "#6b7280",
  confirmed: colors.success.main,
  in_progress: colors.accent.main,
  completed: colors.primary.main,
  cancelled: colors.error.main,
  no_show: "#94a3b8",
};
