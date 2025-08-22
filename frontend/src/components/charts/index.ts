// Chart Components Export File
// This file provides a centralized export for all reusable chart components

import type { ChartConfig } from "./ChartWrapper";
import TournamentLineChart from "./TournamentLineChart";
import PlayerRadarChart from "./PlayerRadarChart";
import RevenueBarChart from "./RevenueBarChart";
import ActivityHeatmap from "./ActivityHeatmap";

// Base wrapper component
export { default as ChartWrapper } from "./ChartWrapper";
export type {
  ChartWrapperProps,
  ChartConfig,
  BaseChartProps,
} from "./ChartWrapper";
export { getChartColors, defaultConfig } from "./ChartWrapper";

// Specialized chart components
export { default as TournamentLineChart } from "./TournamentLineChart";
export type {
  TournamentLineChartProps,
  TournamentTrendData,
} from "./TournamentLineChart";
export { generateSampleTournamentData } from "./TournamentLineChart";

export { default as PlayerRadarChart } from "./PlayerRadarChart";
export type {
  PlayerRadarChartProps,
  PlayerSkillData,
  PlayerData,
} from "./PlayerRadarChart";
export {
  generateSamplePlayerSkills,
  generateSamplePlayerData,
} from "./PlayerRadarChart";

export { default as RevenueBarChart } from "./RevenueBarChart";
export type { RevenueBarChartProps, RevenueData } from "./RevenueBarChart";
export { generateSampleRevenueData } from "./RevenueBarChart";

export { default as ActivityHeatmap } from "./ActivityHeatmap";
export type { ActivityHeatmapProps, ActivityData } from "./ActivityHeatmap";
export { generateSampleActivityData } from "./ActivityHeatmap";

// Chart utility functions and constants
export const CHART_COLORS = {
  default: ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1"],
  ocean: ["#0077be", "#00a8cc", "#7ed9e6", "#4caf50", "#81c784"],
  sunset: ["#ff6b6b", "#ffa726", "#ffcc02", "#66bb6a", "#42a5f5"],
  forest: ["#2e7d32", "#388e3c", "#4caf50", "#66bb6a", "#81c784"],
  corporate: ["#1976d2", "#1e88e5", "#42a5f5", "#64b5f6", "#90caf9"],
} as const;

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  colors: [...CHART_COLORS.default],
  animation: true,
  animationDuration: 1000,
  showGrid: true,
  showLegend: true,
  legendPosition: "bottom",
  darkMode: false,
};

// Chart type definitions for easy imports
export type ChartType =
  | "line"
  | "area"
  | "bar"
  | "pie"
  | "radar"
  | "scatter"
  | "heatmap";
export type ColorScheme = keyof typeof CHART_COLORS;
export type LegendPosition = "top" | "bottom" | "left" | "right";
export type ExportFormat = "png" | "pdf" | "csv";

// Utility functions
export const formatChartData = (data: any[], xKey: string, yKey: string) => {
  return data.map((item) => ({
    [xKey]: item[xKey],
    [yKey]: item[yKey],
    ...item,
  }));
};

export const calculateGrowthRate = (
  current: number,
  previous: number
): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const aggregateDataByPeriod = (
  data: any[],
  groupBy: "day" | "week" | "month" | "year",
  valueKey: string
) => {
  // Implementation would depend on specific requirements
  // This is a placeholder for the actual aggregation logic
  return data;
};

// Sample data generators for testing
export const generateTimeSeriesData = (
  days: number = 30,
  baseValue: number = 100,
  variance: number = 20
) => {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    value: baseValue + (Math.random() - 0.5) * variance,
    index: i,
  }));
};

export const generateCategoryData = (
  categories: string[],
  minValue: number = 0,
  maxValue: number = 100
) => {
  return categories.map((category) => ({
    name: category,
    value: Math.floor(Math.random() * (maxValue - minValue) + minValue),
  }));
};

// Chart component registry for dynamic loading
export const CHART_REGISTRY = {
  line: TournamentLineChart,
  radar: PlayerRadarChart,
  bar: RevenueBarChart,
  heatmap: ActivityHeatmap,
} as const;

// Export everything for convenience
export * from "./ChartWrapper";
export * from "./TournamentLineChart";
export * from "./PlayerRadarChart";
export * from "./RevenueBarChart";
export * from "./ActivityHeatmap";
