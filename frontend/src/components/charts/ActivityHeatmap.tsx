import React from "react";
import { Box, Typography, useTheme, Tooltip, Grid } from "@mui/material";
import ChartWrapper, { BaseChartProps } from "./ChartWrapper";

export interface ActivityData {
  day: string;
  hour: number;
  value: number;
  date?: string;
  details?: {
    activeUsers?: number;
    tournaments?: number;
    registrations?: number;
  };
}

export interface ActivityHeatmapProps extends BaseChartProps {
  data: ActivityData[];
  maxValue?: number;
  colorScheme?: "blue" | "green" | "red" | "purple";
  showValues?: boolean;
  cellSize?: number;
  showDayLabels?: boolean;
  showHourLabels?: boolean;
  onCellClick?: (data: ActivityData) => void;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data,
  config = {},
  height = 300,
  loading = false,
  error = null,
  maxValue,
  colorScheme = "blue",
  showValues = false,
  cellSize = 20,
  showDayLabels = true,
  showHourLabels = true,
  onCellClick,
}) => {
  const theme = useTheme();

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const maxDataValue = maxValue || Math.max(...data.map((d) => d.value));

  const colorSchemes = {
    blue: {
      low: theme.palette.primary.light,
      high: theme.palette.primary.dark,
    },
    green: {
      low: theme.palette.success.light,
      high: theme.palette.success.dark,
    },
    red: {
      low: theme.palette.error.light,
      high: theme.palette.error.dark,
    },
    purple: {
      low: theme.palette.secondary.light,
      high: theme.palette.secondary.dark,
    },
  };

  const getIntensityColor = (value: number) => {
    if (value === 0) return theme.palette.grey[100];

    const intensity = value / maxDataValue;
    const colors = colorSchemes[colorScheme];

    // Create gradient effect
    const r1 = parseInt(colors.low.slice(1, 3), 16);
    const g1 = parseInt(colors.low.slice(3, 5), 16);
    const b1 = parseInt(colors.low.slice(5, 7), 16);
    const r2 = parseInt(colors.high.slice(1, 3), 16);
    const g2 = parseInt(colors.high.slice(3, 5), 16);
    const b2 = parseInt(colors.high.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * intensity);
    const g = Math.round(g1 + (g2 - g1) * intensity);
    const b = Math.round(b1 + (b2 - b1) * intensity);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const getDataForCell = (
    day: string,
    hour: number
  ): ActivityData | undefined => {
    return data.find((d) => d.day === day && d.hour === hour);
  };

  const handleCellClick = (cellData: ActivityData) => {
    if (onCellClick) {
      onCellClick(cellData);
    }
  };

  const HeatmapTooltip: React.FC<{
    children: React.ReactElement;
    data: ActivityData;
  }> = ({ children, data }) => (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {data.day} at {data.hour}:00
          </Typography>
          <Typography variant="body2">Activity Level: {data.value}</Typography>
          {data.details && (
            <Box sx={{ mt: 1 }}>
              {data.details.activeUsers && (
                <Typography variant="caption" display="block">
                  Active Users: {data.details.activeUsers}
                </Typography>
              )}
              {data.details.tournaments && (
                <Typography variant="caption" display="block">
                  Tournaments: {data.details.tournaments}
                </Typography>
              )}
              {data.details.registrations && (
                <Typography variant="caption" display="block">
                  New Registrations: {data.details.registrations}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      }
      placement="top"
      arrow
    >
      {children}
    </Tooltip>
  );

  const renderHeatmap = () => (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {/* Hour labels */}
      {showHourLabels && (
        <Box sx={{ display: "flex", mb: 1, ml: showDayLabels ? 5 : 0 }}>
          {hours
            .filter((_, i) => i % 2 === 0)
            .map((hour) => (
              <Box
                key={hour}
                sx={{
                  width: cellSize * 2,
                  textAlign: "center",
                  fontSize: "0.75rem",
                  color: theme.palette.text.secondary,
                }}
              >
                {hour}
              </Box>
            ))}
        </Box>
      )}

      {/* Heatmap grid */}
      <Box sx={{ display: "flex" }}>
        {/* Day labels */}
        {showDayLabels && (
          <Box sx={{ display: "flex", flexDirection: "column", mr: 1 }}>
            {days.map((day) => (
              <Box
                key={day}
                sx={{
                  height: cellSize + 2,
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.75rem",
                  color: theme.palette.text.secondary,
                  width: 40,
                  justifyContent: "flex-end",
                  pr: 1,
                }}
              >
                {day}
              </Box>
            ))}
          </Box>
        )}

        {/* Heatmap cells */}
        <Box>
          {days.map((day) => (
            <Box key={day} sx={{ display: "flex", mb: "2px" }}>
              {hours.map((hour) => {
                const cellData = getDataForCell(day, hour);
                const value = cellData?.value || 0;

                return (
                  <HeatmapTooltip
                    key={`${day}-${hour}`}
                    data={cellData || { day, hour, value: 0 }}
                  >
                    <Box
                      sx={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: getIntensityColor(value),
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 0.5,
                        mr: "2px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.6rem",
                        fontWeight: 600,
                        color:
                          value > maxDataValue * 0.5
                            ? "white"
                            : theme.palette.text.primary,
                        transition: "transform 0.2s ease",
                        "&:hover": {
                          transform: "scale(1.1)",
                          zIndex: 1,
                        },
                      }}
                      onClick={() => cellData && handleCellClick(cellData)}
                    >
                      {showValues && value > 0 ? value : ""}
                    </Box>
                  </HeatmapTooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Less
        </Typography>
        {Array.from({ length: 5 }, (_, i) => (
          <Box
            key={i}
            sx={{
              width: 12,
              height: 12,
              backgroundColor: getIntensityColor((i / 4) * maxDataValue),
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 0.5,
            }}
          />
        ))}
        <Typography variant="caption" color="text.secondary">
          More
        </Typography>
      </Box>
    </Box>
  );

  return (
    <ChartWrapper
      title="Activity Heatmap"
      subtitle="Visualize user activity patterns by day and hour"
      loading={loading}
      error={error}
      height={height}
      onExport={(format) =>
        console.log(`Exporting activity heatmap as ${format}`)
      }
    >
      {renderHeatmap()}
    </ChartWrapper>
  );
};

export default ActivityHeatmap;

// Sample data generator
export const generateSampleActivityData = (): ActivityData[] => {
  const data: ActivityData[] = [];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  days.forEach((day) => {
    hours.forEach((hour) => {
      // Simulate realistic activity patterns
      let baseValue = 0;

      // Higher activity during business hours and evenings
      if (hour >= 9 && hour <= 17) {
        baseValue = 30 + Math.random() * 40;
      } else if (hour >= 18 && hour <= 23) {
        baseValue = 40 + Math.random() * 60;
      } else {
        baseValue = Math.random() * 20;
      }

      // Weekend patterns
      if (day === "Sat" || day === "Sun") {
        if (hour >= 10 && hour <= 22) {
          baseValue = 50 + Math.random() * 50;
        } else {
          baseValue = Math.random() * 25;
        }
      }

      const value = Math.floor(baseValue);

      data.push({
        day,
        hour,
        value,
        details: {
          activeUsers: Math.floor(value * 10),
          tournaments: Math.floor(value / 10),
          registrations: Math.floor(value / 5),
        },
      });
    });
  });

  return data;
};
