import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell,
  ResponsiveContainer 
} from 'recharts';
import { useTheme, Box, Typography, Chip } from '@mui/material';
import ChartWrapper, { BaseChartProps, getChartColors } from './ChartWrapper';

export interface RevenueData {
  period: string;
  revenue: number;
  expenses?: number;
  profit?: number;
  tournamentFees?: number;
  subscriptions?: number;
  merchandise?: number;
  target?: number;
}

export interface RevenueBarChartProps extends BaseChartProps {
  data: RevenueData[];
  showProfit?: boolean;
  showExpenses?: boolean;
  showTarget?: boolean;
  chartType?: 'grouped' | 'stacked';
  colorScheme?: string;
  showTrendLine?: boolean;
  currencySymbol?: string;
}

const RevenueBarChart: React.FC<RevenueBarChartProps> = ({
  data,
  config = {},
  height = 350,
  loading = false,
  error = null,
  showProfit = true,
  showExpenses = false,
  showTarget = false,
  chartType = 'grouped',
  colorScheme = 'default',
  showTrendLine = false,
  currencySymbol = '$',
  onDataPointClick,
}) => {
  const theme = useTheme();
  const colors = getChartColors(theme, colorScheme);

  const formatCurrency = (value: number) => {
    return `${currencySymbol}${value.toLocaleString()}`;
  };

  const calculateTotals = () => {
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpenses = data.reduce((sum, item) => sum + (item.expenses || 0), 0);
    const totalProfit = data.reduce((sum, item) => sum + (item.profit || item.revenue - (item.expenses || 0)), 0);
    
    return { totalRevenue, totalExpenses, totalProfit };
  };

  const { totalRevenue, totalExpenses, totalProfit } = calculateTotals();

  const handleBarClick = (data: any, index: number) => {
    if (onDataPointClick) {
      onDataPointClick({ ...data, index });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1.5,
            boxShadow: theme.shadows[3],
            fontSize: '0.875rem',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ 
                color: entry.color,
                display: 'flex',
                justifyContent: 'space-between',
                minWidth: 120,
              }}
            >
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 600 }}>
                {formatCurrency(entry.value)}
              </span>
            </Typography>
          ))}
          
          {payload[0]?.payload?.target && showTarget && (
            <Typography
              variant="body2"
              sx={{ 
                color: theme.palette.warning.main,
                display: 'flex',
                justifyContent: 'space-between',
                mt: 0.5,
                borderTop: `1px solid ${theme.palette.divider}`,
                pt: 0.5,
              }}
            >
              <span>Target:</span>
              <span style={{ fontWeight: 600 }}>
                {formatCurrency(payload[0].payload.target)}
              </span>
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  const renderChart = () => (
    <BarChart 
      data={data} 
      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      onClick={handleBarClick}
    >
      {config.showGrid !== false && (
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
      )}
      
      <XAxis 
        dataKey="period" 
        stroke={theme.palette.text.secondary}
        fontSize={12}
      />
      
      <YAxis 
        stroke={theme.palette.text.secondary}
        fontSize={12}
        tickFormatter={formatCurrency}
      />
      
      <Tooltip content={<CustomTooltip />} />
      
      {config.showLegend !== false && <Legend />}
      
      <Bar
        dataKey="revenue"
        name="Revenue"
        fill={colors[0]}
        radius={[4, 4, 0, 0]}
        animationDuration={config.animationDuration || 1000}
      >
        {data.map((entry, index) => (
          <Cell key={`revenue-${index}`} fill={colors[0]} />
        ))}
      </Bar>
      
      {showExpenses && (
        <Bar
          dataKey="expenses"
          name="Expenses"
          fill={colors[1]}
          radius={[4, 4, 0, 0]}
          animationDuration={config.animationDuration || 1000}
        >
          {data.map((entry, index) => (
            <Cell key={`expenses-${index}`} fill={colors[1]} />
          ))}
        </Bar>
      )}
      
      {showProfit && (
        <Bar
          dataKey="profit"
          name="Profit"
          fill={colors[2]}
          radius={[4, 4, 0, 0]}
          animationDuration={config.animationDuration || 1000}
        >
          {data.map((entry, index) => (
            <Cell key={`profit-${index}`} fill={colors[2]} />
          ))}
        </Bar>
      )}
      
      {/* Revenue breakdown bars */}
      {data[0]?.tournamentFees && (
        <Bar
          dataKey="tournamentFees"
          stackId="breakdown"
          name="Tournament Fees"
          fill={colors[3]}
          animationDuration={config.animationDuration || 1000}
        />
      )}
      
      {data[0]?.subscriptions && (
        <Bar
          dataKey="subscriptions"
          stackId="breakdown"
          name="Subscriptions"
          fill={colors[4]}
          animationDuration={config.animationDuration || 1000}
        />
      )}
    </BarChart>
  );

  const renderSummaryCards = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
      <Chip
        label={`Total Revenue: ${formatCurrency(totalRevenue)}`}
        color="primary"
        sx={{ fontSize: '0.875rem', height: 32 }}
      />
      {showProfit && (
        <Chip
          label={`Total Profit: ${formatCurrency(totalProfit)}`}
          color="success"
          sx={{ fontSize: '0.875rem', height: 32 }}
        />
      )}
      {showExpenses && (
        <Chip
          label={`Total Expenses: ${formatCurrency(totalExpenses)}`}
          color="warning"
          sx={{ fontSize: '0.875rem', height: 32 }}
        />
      )}
    </Box>
  );

  return (
    <ChartWrapper
      title="Revenue Analytics"
      subtitle="Track revenue, expenses, and profit over time"
      loading={loading}
      error={error}
      height={height}
      onExport={(format) => console.log(`Exporting revenue chart as ${format}`)}
    >
      <Box>
        {renderSummaryCards()}
        {renderChart()}
      </Box>
    </ChartWrapper>
  );
};

export default RevenueBarChart;

// Sample data generator
export const generateSampleRevenueData = (months: number = 12): RevenueData[] => {
  const data: RevenueData[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < months; i++) {
    const baseRevenue = 15000 + (i * 1000) + Math.floor(Math.random() * 5000);
    const expenses = baseRevenue * 0.6 + Math.floor(Math.random() * 2000);
    const tournamentFees = baseRevenue * 0.7;
    const subscriptions = baseRevenue * 0.2;
    const merchandise = baseRevenue * 0.1;
    
    data.push({
      period: monthNames[i] || `Month ${i + 1}`,
      revenue: baseRevenue,
      expenses: expenses,
      profit: baseRevenue - expenses,
      tournamentFees: Math.floor(tournamentFees),
      subscriptions: Math.floor(subscriptions),
      merchandise: Math.floor(merchandise),
      target: baseRevenue + 2000,
    });
  }
  
  return data;
};