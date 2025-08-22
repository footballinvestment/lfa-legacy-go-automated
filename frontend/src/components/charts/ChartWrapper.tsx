import React, { useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
} from "@mui/material";
import {
  Download,
  Fullscreen,
  Refresh,
  ZoomIn,
  ZoomOut,
} from "@mui/icons-material";
import { ResponsiveContainer } from "recharts";

export interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactElement;
  loading?: boolean;
  error?: string | null;
  height?: number;
  showControls?: boolean;
  onExport?: (format: "png" | "pdf" | "csv") => void;
  onRefresh?: () => void;
  className?: string;
}

export interface ChartConfig {
  colors: string[];
  animation: boolean;
  animationDuration: number;
  showGrid: boolean;
  showLegend: boolean;
  legendPosition: "top" | "bottom" | "left" | "right";
  darkMode: boolean;
}

export interface BaseChartProps {
  data: any[];
  config?: Partial<ChartConfig>;
  height?: number;
  width?: number;
  loading?: boolean;
  error?: string | null;
  onDataPointClick?: (data: any) => void;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  subtitle,
  children,
  loading = false,
  error = null,
  height = 300,
  showControls = true,
  onExport,
  onRefresh,
  className,
}) => {
  const theme = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExport = (format: "png" | "pdf" | "csv") => {
    if (onExport) {
      onExport(format);
    } else {
      console.log(`Exporting chart as ${format.toUpperCase()}...`);
      // Default export implementation would go here
    }
  };

  const handleFullscreen = () => {
    if (chartRef.current) {
      if (!isFullscreen) {
        chartRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const defaultConfig: ChartConfig = {
    colors: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
    ],
    animation: true,
    animationDuration: 1000,
    showGrid: true,
    showLegend: true,
    legendPosition: "bottom",
    darkMode: theme.palette.mode === "dark",
  };

  return (
    <Card
      ref={chartRef}
      className={className}
      sx={{
        height: isFullscreen ? "100vh" : "auto",
        position: isFullscreen ? "fixed" : "relative",
        top: isFullscreen ? 0 : "auto",
        left: isFullscreen ? 0 : "auto",
        width: isFullscreen ? "100vw" : "100%",
        zIndex: isFullscreen ? 9999 : "auto",
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <CardContent>
        {/* Chart Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" component="h3" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          {showControls && (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => handleExport("png")}
                title="Export as PNG"
              >
                <Download />
              </IconButton>
              <IconButton size="small" onClick={handleZoomIn} title="Zoom In">
                <ZoomIn />
              </IconButton>
              <IconButton size="small" onClick={handleZoomOut} title="Zoom Out">
                <ZoomOut />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleFullscreen}
                title="Fullscreen"
              >
                <Fullscreen />
              </IconButton>
              {onRefresh && (
                <IconButton size="small" onClick={onRefresh} title="Refresh">
                  <Refresh />
                </IconButton>
              )}
            </Box>
          )}
        </Box>

        {/* Chart Content */}
        <Box sx={{ position: "relative", height: height * zoom }}>
          {loading && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <Box
              sx={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
            >
              <ResponsiveContainer width="100%" height={height}>
                {children}
              </ResponsiveContainer>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Export defaultConfig separately to avoid circular dependency
export const defaultConfig: ChartConfig = {
  colors: ["#1976d2", "#dc004e", "#2e7d32", "#ed6c02", "#d32f2f"],
  animation: true,
  animationDuration: 1000,
  showGrid: true,
  showLegend: true,
  legendPosition: "bottom",
  darkMode: false,
};

export default ChartWrapper;

// Utility function to get theme-aware colors
export const getChartColors = (theme: any, colorScheme: string = "default") => {
  const schemes = {
    default: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
    ],
    ocean: ["#0077be", "#00a8cc", "#7ed9e6", "#4caf50", "#81c784"],
    sunset: ["#ff6b6b", "#ffa726", "#ffcc02", "#66bb6a", "#42a5f5"],
    forest: ["#2e7d32", "#388e3c", "#4caf50", "#66bb6a", "#81c784"],
    corporate: ["#1976d2", "#1e88e5", "#42a5f5", "#64b5f6", "#90caf9"],
  };

  return schemes[colorScheme as keyof typeof schemes] || schemes.default;
};
