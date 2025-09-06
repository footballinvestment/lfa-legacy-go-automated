// src/contexts/ThemeContext.tsx
// TELJES JAVÍTOTT FÁJL - Material-UI Theme Context

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
  Theme,
  alpha,
} from "@mui/material/styles";
import { PaletteMode } from "@mui/material";
import { CssBaseline } from "@mui/material";

// Theme configuration types
export interface ThemeConfig {
  mode: PaletteMode;
  colorScheme: ColorScheme;
  accentColor: AccentColor;
  contrastLevel: ContrastLevel;
  reducedMotion: boolean;
  fontSize: FontSize;
  borderRadius: BorderRadius;
  autoSchedule: boolean;
  scheduleSettings: ScheduleSettings;
  systemTheme: boolean;
}

export type ColorScheme =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "red"
  | "teal"
  | "pink";
export type AccentColor =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info";
export type ContrastLevel = "low" | "normal" | "high";
export type FontSize = "small" | "medium" | "large";
export type BorderRadius = "sharp" | "normal" | "rounded";

export interface ScheduleSettings {
  darkStart: string;
  darkEnd: string;
  useLocation: boolean;
  latitude?: number;
  longitude?: number;
}

// Theme context type
export interface ThemeContextType {
  config: ThemeConfig;
  theme: Theme;
  toggleTheme: () => void;
  setThemeMode: (mode: PaletteMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setAccentColor: (color: AccentColor) => void;
  setContrastLevel: (level: ContrastLevel) => void;
  setFontSize: (size: FontSize) => void;
  setBorderRadius: (radius: BorderRadius) => void;
  setReducedMotion: (reduced: boolean) => void;
  setAutoSchedule: (enabled: boolean) => void;
  setScheduleSettings: (settings: Partial<ScheduleSettings>) => void;
  setSystemTheme: (enabled: boolean) => void;
  resetToDefaults: () => void;
  exportConfig: () => string;
  importConfig: (config: string) => boolean;
}

// Default theme configuration
const defaultConfig: ThemeConfig = {
  mode: "light",
  colorScheme: "blue",
  accentColor: "primary",
  contrastLevel: "normal",
  reducedMotion: false,
  fontSize: "medium",
  borderRadius: "normal",
  autoSchedule: false,
  scheduleSettings: {
    darkStart: "20:00",
    darkEnd: "06:00",
    useLocation: false,
  },
  systemTheme: true,
};

// Storage key
const THEME_STORAGE_KEY = "lfa-theme-config";

// Color scheme definitions
const colorSchemes: Record<
  ColorScheme,
  { primary: string; secondary: string }
> = {
  blue: { primary: "#1976d2", secondary: "#dc004e" },
  green: { primary: "#2e7d32", secondary: "#ed6c02" },
  purple: { primary: "#7b1fa2", secondary: "#d32f2f" },
  orange: { primary: "#ed6c02", secondary: "#1976d2" },
  red: { primary: "#d32f2f", secondary: "#2e7d32" },
  teal: { primary: "#00695c", secondary: "#7b1fa2" },
  pink: { primary: "#c2185b", secondary: "#00695c" },
};

// Contrast level adjustments
const contrastAdjustments: Record<
  ContrastLevel,
  { factor: number; textContrast: number }
> = {
  low: { factor: 0.8, textContrast: 0.87 },
  normal: { factor: 1, textContrast: 0.87 },
  high: { factor: 1.3, textContrast: 1 },
};

// Font size scales
const fontSizeScales: Record<FontSize, number> = {
  small: 0.875,
  medium: 1,
  large: 1.125,
};

// Border radius scales
const borderRadiusScales: Record<BorderRadius, number> = {
  sharp: 0,
  normal: 1,
  rounded: 2,
};

// ✅ FIXED: Helper functions defined before createMaterialTheme
const getSystemTheme = (): PaletteMode => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getScheduledTheme = (settings: ScheduleSettings): PaletteMode => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [darkStartHour, darkStartMin] = settings.darkStart
    .split(":")
    .map(Number);
  const [darkEndHour, darkEndMin] = settings.darkEnd.split(":").map(Number);

  const darkStart = darkStartHour * 60 + darkStartMin;
  const darkEnd = darkEndHour * 60 + darkEndMin;

  if (darkStart > darkEnd) {
    return currentTime >= darkStart || currentTime <= darkEnd
      ? "dark"
      : "light";
  } else {
    return currentTime >= darkStart && currentTime <= darkEnd
      ? "dark"
      : "light";
  }
};

const determineThemeMode = (config: ThemeConfig): PaletteMode => {
  if (config.systemTheme) {
    return getSystemTheme();
  } else if (config.autoSchedule) {
    return getScheduledTheme(config.scheduleSettings);
  }
  return config.mode;
};

// ✅ FIXED: createMaterialTheme function - properly defined before use
const createMaterialTheme = (config: ThemeConfig): Theme => {
  const actualMode = determineThemeMode(config);
  const colorScheme = colorSchemes[config.colorScheme];
  const contrast = contrastAdjustments[config.contrastLevel];
  const fontScale = fontSizeScales[config.fontSize];
  const radiusScale = borderRadiusScales[config.borderRadius];

  return createTheme({
    palette: {
      mode: actualMode,
      primary: {
        main: colorScheme.primary,
        ...(actualMode === "dark" && {
          main: alpha(colorScheme.primary, 0.9),
        }),
      },
      secondary: {
        main: colorScheme.secondary,
        ...(actualMode === "dark" && {
          main: alpha(colorScheme.secondary, 0.9),
        }),
      },
      ...(actualMode === "dark" && {
        background: {
          default: config.contrastLevel === "high" ? "#000000" : "#0a0a0a",
          paper: config.contrastLevel === "high" ? "#1a1a1a" : "#1e1e1e",
        },
        text: {
          primary: alpha("#ffffff", contrast.textContrast),
          secondary: alpha("#ffffff", 0.7 * contrast.textContrast),
        },
      }),
      ...(actualMode === "light" &&
        config.contrastLevel === "high" && {
          background: {
            default: "#ffffff",
            paper: "#f8f9fa",
          },
          text: {
            primary: "#000000",
            secondary: alpha("#000000", 0.8),
          },
        }),
    },
    typography: {
      fontSize: 14 * fontScale,
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontSize: `${2.5 * fontScale}rem`, fontWeight: 600 },
      h2: { fontSize: `${2 * fontScale}rem`, fontWeight: 600 },
      h3: { fontSize: `${1.75 * fontScale}rem`, fontWeight: 600 },
      h4: { fontSize: `${1.5 * fontScale}rem`, fontWeight: 600 },
      h5: { fontSize: `${1.25 * fontScale}rem`, fontWeight: 600 },
      h6: { fontSize: `${1.1 * fontScale}rem`, fontWeight: 600 },
      body1: { fontSize: `${1 * fontScale}rem`, lineHeight: 1.6 },
      body2: { fontSize: `${0.875 * fontScale}rem`, lineHeight: 1.5 },
      button: { fontSize: `${0.875 * fontScale}rem`, fontWeight: 500 },
    },
    shape: {
      borderRadius: 8 * radiusScale,
    },
    transitions: {
      duration: {
        shortest: config.reducedMotion ? 0 : 150,
        shorter: config.reducedMotion ? 0 : 200,
        short: config.reducedMotion ? 0 : 250,
        standard: config.reducedMotion ? 0 : 300,
        complex: config.reducedMotion ? 0 : 375,
        enteringScreen: config.reducedMotion ? 0 : 225,
        leavingScreen: config.reducedMotion ? 0 : 195,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8 * radiusScale,
            textTransform: "none",
            fontWeight: 500,
            transition: config.reducedMotion ? "none" : "all 0.2s ease-in-out",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12 * radiusScale,
            transition: config.reducedMotion ? "none" : "all 0.3s ease-in-out",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16 * radiusScale,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 8 * radiusScale,
              transition: config.reducedMotion
                ? "none"
                : "all 0.2s ease-in-out",
            },
          },
        },
      },
    },
  });
};

// Create theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<ThemeConfig>(defaultConfig);
  const [theme, setTheme] = useState<Theme>(() =>
    createMaterialTheme(defaultConfig)
  );

  // Load theme configuration from localStorage
  const loadConfig = useCallback((): ThemeConfig => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        return { ...defaultConfig, ...parsedConfig };
      }
    } catch (error) {
    }
    return defaultConfig;
  }, []);

  // Save theme configuration to localStorage
  const saveConfig = useCallback((newConfig: ThemeConfig) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
    }
  }, []);

  // Update theme when config changes
  const updateTheme = useCallback(
    (newConfig: ThemeConfig) => {
      const newTheme = createMaterialTheme(newConfig);
      setConfig(newConfig);
      setTheme(newTheme);
      saveConfig(newConfig);
    },
    [saveConfig]
  );

  // Theme context actions
  const toggleTheme = useCallback(() => {
    const newMode: PaletteMode = config.mode === "light" ? "dark" : "light";
    updateTheme({ ...config, mode: newMode, systemTheme: false });
  }, [config, updateTheme]);

  const setThemeMode = useCallback(
    (mode: PaletteMode) => {
      updateTheme({ ...config, mode, systemTheme: false });
    },
    [config, updateTheme]
  );

  const setColorScheme = useCallback(
    (colorScheme: ColorScheme) => {
      updateTheme({ ...config, colorScheme });
    },
    [config, updateTheme]
  );

  const setAccentColor = useCallback(
    (accentColor: AccentColor) => {
      updateTheme({ ...config, accentColor });
    },
    [config, updateTheme]
  );

  const setContrastLevel = useCallback(
    (contrastLevel: ContrastLevel) => {
      updateTheme({ ...config, contrastLevel });
    },
    [config, updateTheme]
  );

  const setFontSize = useCallback(
    (fontSize: FontSize) => {
      updateTheme({ ...config, fontSize });
    },
    [config, updateTheme]
  );

  const setBorderRadius = useCallback(
    (borderRadius: BorderRadius) => {
      updateTheme({ ...config, borderRadius });
    },
    [config, updateTheme]
  );

  const setReducedMotion = useCallback(
    (reducedMotion: boolean) => {
      updateTheme({ ...config, reducedMotion });
    },
    [config, updateTheme]
  );

  const setAutoSchedule = useCallback(
    (autoSchedule: boolean) => {
      updateTheme({ ...config, autoSchedule });
    },
    [config, updateTheme]
  );

  const setScheduleSettings = useCallback(
    (scheduleSettings: Partial<ScheduleSettings>) => {
      updateTheme({
        ...config,
        scheduleSettings: { ...config.scheduleSettings, ...scheduleSettings },
      });
    },
    [config, updateTheme]
  );

  const setSystemTheme = useCallback(
    (systemTheme: boolean) => {
      updateTheme({ ...config, systemTheme });
    },
    [config, updateTheme]
  );

  const resetToDefaults = useCallback(() => {
    updateTheme(defaultConfig);
  }, [updateTheme]);

  const exportConfig = useCallback((): string => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  const importConfig = useCallback(
    (configString: string): boolean => {
      try {
        const importedConfig = JSON.parse(configString);
        const validatedConfig = { ...defaultConfig, ...importedConfig };
        updateTheme(validatedConfig);
        return true;
      } catch (error) {
        return false;
      }
    },
    [updateTheme]
  );

  // Initialize theme on mount
  useEffect(() => {
    const loadedConfig = loadConfig();
    updateTheme(loadedConfig);
  }, [loadConfig, updateTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!config.systemTheme) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (config.systemTheme) {
        updateTheme({ ...config });
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [config, updateTheme]);

  const contextValue: ThemeContextType = {
    config,
    theme,
    toggleTheme,
    setThemeMode,
    setColorScheme,
    setAccentColor,
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
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
