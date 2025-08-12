import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTheme } from '@mui/material';
import ChartWrapper, { BaseChartProps, getChartColors } from './ChartWrapper';

export interface TournamentTrendData {
  period: string;
  tournaments: number;
  participants: number;
  completionRate: number;
  revenue?: number;
}

export interface TournamentLineChartProps extends BaseChartProps {
  data: TournamentTrendData[];
  showTournaments?: boolean;
  showParticipants?: boolean;
  showCompletionRate?: boolean;
  showRevenue?: boolean;
  colorScheme?: string;
}

const TournamentLineChart: React.FC<TournamentLineChartProps> = ({
  data,
  config = {},
  height = 300,
  loading = false,
  error = null,
  showTournaments = true,
  showParticipants = true,
  showCompletionRate = false,
  showRevenue = false,
  colorScheme = 'default',
  onDataPointClick,
}) => {
  const theme = useTheme();
  const colors = getChartColors(theme, colorScheme);

  const handleDataPointClick = (data: any) => {
    if (onDataPointClick) {
      onDataPointClick(data);
    }
  };

  const renderChart = () => (
    <LineChart 
      data={data} 
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      onClick={handleDataPointClick}
    >
      {config.showGrid !== false && (
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={theme.palette.divider}
        />
      )}
      <XAxis 
        dataKey="period" 
        stroke={theme.palette.text.secondary}
        fontSize={12}
      />
      <YAxis 
        stroke={theme.palette.text.secondary}
        fontSize={12}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 8,
          color: theme.palette.text.primary,
          fontSize: 12,
        }}
        labelStyle={{ color: theme.palette.text.primary }}
      />
      {config.showLegend !== false && <Legend />}
      
      {showTournaments && (
        <Line
          type="monotone"
          dataKey="tournaments"
          stroke={colors[0]}
          strokeWidth={2}
          dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
          name="Tournaments"
          animationDuration={config.animationDuration || 1000}
        />
      )}
      
      {showParticipants && (
        <Line
          type="monotone"
          dataKey="participants"
          stroke={colors[1]}
          strokeWidth={2}
          dot={{ fill: colors[1], strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: colors[1], strokeWidth: 2 }}
          name="Participants"
          animationDuration={config.animationDuration || 1000}
        />
      )}
      
      {showCompletionRate && (
        <Line
          type="monotone"
          dataKey="completionRate"
          stroke={colors[2]}
          strokeWidth={2}
          dot={{ fill: colors[2], strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: colors[2], strokeWidth: 2 }}
          name="Completion Rate (%)"
          animationDuration={config.animationDuration || 1000}
        />
      )}
      
      {showRevenue && (
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={colors[3]}
          strokeWidth={2}
          dot={{ fill: colors[3], strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: colors[3], strokeWidth: 2 }}
          name="Revenue"
          animationDuration={config.animationDuration || 1000}
        />
      )}
    </LineChart>
  );

  return (
    <ChartWrapper
      title="Tournament Trends"
      subtitle="Track tournament performance and participation over time"
      loading={loading}
      error={error}
      height={height}
      onExport={(format) => console.log(`Exporting tournament trends as ${format}`)}
    >
      {renderChart()}
    </ChartWrapper>
  );
};

export default TournamentLineChart;

// Sample data generator for testing
export const generateSampleTournamentData = (months: number = 12): TournamentTrendData[] => {
  const data: TournamentTrendData[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < months; i++) {
    const baseValue = 50 + i * 5;
    data.push({
      period: monthNames[i] || `Month ${i + 1}`,
      tournaments: baseValue + Math.floor(Math.random() * 20),
      participants: (baseValue * 20) + Math.floor(Math.random() * 200),
      completionRate: 75 + Math.floor(Math.random() * 20),
      revenue: (baseValue * 180) + Math.floor(Math.random() * 5000),
    });
  }
  
  return data;
};