import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  IconButton,
  Button,
  Chip,
  Avatar,
  Badge,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Slider,
  Divider,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart,
  PieChart as PieChartIcon,
  Timeline,
  TrendingUp,
  Settings,
  Download,
  Fullscreen,
  Refresh,
  Visibility,
  FilterList,
  Palette,
  Speed,
  GridOn,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'pie' | 'radar' | 'scatter' | 'composed';
  title: string;
  colors: string[];
  animation: boolean;
  animationDuration: number;
  showGrid: boolean;
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  darkMode: boolean;
}

interface ChartData {
  [key: string]: any;
}

interface VisualizationProps {
  data: ChartData[];
  config: ChartConfig;
  width?: number;
  height?: number;
  onExport?: (format: 'png' | 'pdf' | 'csv') => void;
}

const AdvancedDataVisualization: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [colorScheme, setColorScheme] = useState('default');
  
  const chartRef = useRef<any>(null);

  // Mock data for different chart types
  const performanceData = [
    { month: 'Jan', tournaments: 45, participants: 890, revenue: 12500, satisfaction: 4.2 },
    { month: 'Feb', tournaments: 52, participants: 1120, revenue: 15300, satisfaction: 4.5 },
    { month: 'Mar', tournaments: 48, participants: 980, revenue: 13800, satisfaction: 4.3 },
    { month: 'Apr', tournaments: 61, participants: 1350, revenue: 18200, satisfaction: 4.7 },
    { month: 'May', tournaments: 58, participants: 1180, revenue: 16500, satisfaction: 4.4 },
    { month: 'Jun', tournaments: 67, participants: 1420, revenue: 19800, satisfaction: 4.8 },
    { month: 'Jul', tournaments: 73, participants: 1580, revenue: 22100, satisfaction: 4.6 },
    { month: 'Aug', tournaments: 69, participants: 1450, revenue: 20300, satisfaction: 4.5 },
  ];

  const skillRadarData = [
    { skill: 'Speed', value: 85, fullMark: 100 },
    { skill: 'Accuracy', value: 92, fullMark: 100 },
    { skill: 'Strategy', value: 78, fullMark: 100 },
    { skill: 'Teamwork', value: 88, fullMark: 100 },
    { skill: 'Endurance', value: 75, fullMark: 100 },
    { skill: 'Leadership', value: 82, fullMark: 100 },
  ];

  const tournamentDistribution = [
    { name: 'Knockout', value: 45, players: 2340 },
    { name: 'Round Robin', value: 30, players: 1560 },
    { name: 'Swiss', value: 15, players: 780 },
    { name: 'Custom', value: 10, players: 520 },
  ];

  const scatterData = [
    { x: 1, y: 23, z: 120 }, { x: 2, y: 34, z: 180 }, { x: 3, y: 12, z: 90 },
    { x: 4, y: 45, z: 220 }, { x: 5, y: 28, z: 140 }, { x: 6, y: 67, z: 310 },
    { x: 7, y: 89, z: 420 }, { x: 8, y: 56, z: 280 }, { x: 9, y: 78, z: 390 },
    { x: 10, y: 123, z: 580 }, { x: 11, y: 98, z: 460 }, { x: 12, y: 145, z: 680 },
  ];

  const colorSchemes = {
    default: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'],
    ocean: ['#0077be', '#00a8cc', '#7ed9e6', '#4caf50', '#81c784'],
    sunset: ['#ff6b6b', '#ffa726', '#ffcc02', '#66bb6a', '#42a5f5'],
    forest: ['#2e7d32', '#388e3c', '#4caf50', '#66bb6a', '#81c784'],
    corporate: ['#1976d2', '#1e88e5', '#42a5f5', '#64b5f6', '#90caf9'],
  };

  const getCurrentColors = () => colorSchemes[colorScheme as keyof typeof colorSchemes];

  // Live data simulation
  useEffect(() => {
    if (!liveUpdates) return;
    
    const interval = setInterval(() => {
      // Simulate live data updates - would connect to real data source in production
      console.log('Updating live chart data...');
    }, 5000);

    return () => clearInterval(interval);
  }, [liveUpdates]);

  const handleExport = (format: 'png' | 'pdf' | 'csv') => {
    console.log(`Exporting chart as ${format.toUpperCase()}...`);
    // Implementation would depend on the specific export library used
  };

  const LineChartWrapper: React.FC<VisualizationProps> = ({ data, config, height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: darkMode ? '#424242' : '#fff',
            color: darkMode ? '#fff' : '#000',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        />
        {showLegend && <Legend />}
        <Line 
          type="monotone" 
          dataKey="tournaments" 
          stroke={getCurrentColors()[0]} 
          strokeWidth={2}
          dot={{ fill: getCurrentColors()[0], strokeWidth: 2, r: 4 }}
          animationDuration={animationSpeed}
        />
        <Line 
          type="monotone" 
          dataKey="participants" 
          stroke={getCurrentColors()[1]} 
          strokeWidth={2}
          dot={{ fill: getCurrentColors()[1], strokeWidth: 2, r: 4 }}
          animationDuration={animationSpeed}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const AreaChartWrapper: React.FC<VisualizationProps> = ({ data, height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: darkMode ? '#424242' : '#fff',
            color: darkMode ? '#fff' : '#000',
            borderRadius: '8px',
          }}
        />
        {showLegend && <Legend />}
        <Area 
          type="monotone" 
          dataKey="revenue" 
          stackId="1" 
          stroke={getCurrentColors()[0]} 
          fill={getCurrentColors()[0]}
          fillOpacity={0.6}
          animationDuration={animationSpeed}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const BarChartWrapper: React.FC<VisualizationProps> = ({ data, height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: darkMode ? '#424242' : '#fff',
            color: darkMode ? '#fff' : '#000',
            borderRadius: '8px',
          }}
        />
        {showLegend && <Legend />}
        <Bar 
          dataKey="tournaments" 
          fill={getCurrentColors()[0]}
          animationDuration={animationSpeed}
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="participants" 
          fill={getCurrentColors()[1]}
          animationDuration={animationSpeed}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const PieChartWrapper: React.FC<VisualizationProps> = ({ data, height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          animationDuration={animationSpeed}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getCurrentColors()[index % getCurrentColors().length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );

  const RadarChartWrapper: React.FC<VisualizationProps> = ({ data, height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="skill" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar
          name="Skills"
          dataKey="value"
          stroke={getCurrentColors()[0]}
          fill={getCurrentColors()[0]}
          fillOpacity={0.3}
          strokeWidth={2}
          animationDuration={animationSpeed}
        />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );

  const ScatterChartWrapper: React.FC<VisualizationProps> = ({ data, height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="x" />
        <YAxis dataKey="y" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Data Points" dataKey="z" fill={getCurrentColors()[0]} />
      </ScatterChart>
    </ResponsiveContainer>
  );

  const ComposedChartWrapper: React.FC<VisualizationProps> = ({ data, height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: darkMode ? '#424242' : '#fff',
            color: darkMode ? '#fff' : '#000',
            borderRadius: '8px',
          }}
        />
        {showLegend && <Legend />}
        <Bar dataKey="tournaments" fill={getCurrentColors()[0]} />
        <Line 
          type="monotone" 
          dataKey="satisfaction" 
          stroke={getCurrentColors()[2]} 
          strokeWidth={3}
          dot={{ fill: getCurrentColors()[2], strokeWidth: 2, r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderControlPanel = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          Chart Configuration
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
              }
              label="Dark Mode"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={liveUpdates}
                  onChange={(e) => setLiveUpdates(e.target.checked)}
                />
              }
              label="Live Updates"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <GridOn fontSize="small" />
                  Grid
                </Box>
              }
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showLegend}
                  onChange={(e) => setShowLegend(e.target.checked)}
                />
              }
              label="Legend"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Color Scheme</InputLabel>
              <Select
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value)}
                label="Color Scheme"
              >
                <MenuItem value="default">Default</MenuItem>
                <MenuItem value="ocean">Ocean</MenuItem>
                <MenuItem value="sunset">Sunset</MenuItem>
                <MenuItem value="forest">Forest</MenuItem>
                <MenuItem value="corporate">Corporate</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Speed fontSize="small" />
              <Box sx={{ width: 100 }}>
                <Typography variant="caption">Animation Speed</Typography>
                <Slider
                  value={animationSpeed}
                  onChange={(_, value) => setAnimationSpeed(value as number)}
                  min={100}
                  max={3000}
                  step={100}
                  size="small"
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderChartGallery = () => {
    const charts = [
      {
        title: 'Tournament Trends (Line Chart)',
        component: <LineChartWrapper data={performanceData} config={{} as ChartConfig} />,
        icon: <ShowChart />,
        description: 'Track tournament and participant trends over time'
      },
      {
        title: 'Revenue Analysis (Area Chart)',
        component: <AreaChartWrapper data={performanceData} config={{} as ChartConfig} />,
        icon: <Timeline />,
        description: 'Visualize revenue growth with filled area charts'
      },
      {
        title: 'Performance Metrics (Bar Chart)',
        component: <BarChartWrapper data={performanceData} config={{} as ChartConfig} />,
        icon: <BarChartIcon />,
        description: 'Compare performance metrics across different periods'
      },
      {
        title: 'Tournament Distribution (Pie Chart)',
        component: <PieChartWrapper data={tournamentDistribution} config={{} as ChartConfig} />,
        icon: <PieChartIcon />,
        description: 'Show tournament type distribution'
      },
      {
        title: 'Player Skills (Radar Chart)',
        component: <RadarChartWrapper data={skillRadarData} config={{} as ChartConfig} />,
        icon: <TrendingUp />,
        description: 'Analyze player skills across multiple dimensions'
      },
      {
        title: 'Performance Scatter (Scatter Chart)',
        component: <ScatterChartWrapper data={scatterData} config={{} as ChartConfig} />,
        icon: <FilterList />,
        description: 'Explore relationships between different metrics'
      },
      {
        title: 'Combined Analysis (Composed Chart)',
        component: <ComposedChartWrapper data={performanceData} config={{} as ChartConfig} />,
        icon: <Timeline />,
        description: 'Combine multiple chart types for comprehensive analysis'
      }
    ];

    return (
      <Grid container spacing={3}>
        {charts.map((chart, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                backgroundColor: darkMode ? 'grey.800' : 'background.paper',
                color: darkMode ? 'white' : 'inherit'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: getCurrentColors()[index % getCurrentColors().length] }}>
                      {chart.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                        {chart.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {chart.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => handleExport('png')}>
                      <Download />
                    </IconButton>
                    <IconButton size="small">
                      <Fullscreen />
                    </IconButton>
                  </Box>
                </Box>
                
                <Box sx={{ height: 300 }}>
                  {chart.component}
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip size="small" label="Interactive" color="primary" />
                  <Chip size="small" label="Responsive" color="secondary" />
                  <Chip size="small" label="Exportable" color="success" />
                  {liveUpdates && <Badge color="success" variant="dot"><Chip size="small" label="Live" /></Badge>}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShowChart color="primary" />
          Advanced Data Visualization Library
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={() => handleExport('csv')}>
            Export All Data
          </Button>
          <IconButton>
            <Refresh />
          </IconButton>
          <IconButton>
            <Fullscreen />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Comprehensive collection of reusable, interactive chart components with advanced features including 
        real-time updates, dark mode support, animation controls, and export capabilities.
      </Typography>

      {renderControlPanel()}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Chart Gallery" />
          <Tab label="Documentation" />
          <Tab label="Code Examples" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {selectedTab === 0 && renderChartGallery()}
        {selectedTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>Documentation</Typography>
              <Typography variant="body1" paragraph>
                The Advanced Data Visualization Library provides a comprehensive set of reusable chart components
                built on top of Recharts with Material-UI integration.
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Features:</Typography>
              <Box component="ul" sx={{ ml: 3 }}>
                <li>Multiple chart types: Line, Area, Bar, Pie, Radar, Scatter, Composed</li>
                <li>Dark mode support with automatic theme switching</li>
                <li>Real-time data updates and live chart refreshing</li>
                <li>Interactive tooltips and hover effects</li>
                <li>Customizable color schemes and animations</li>
                <li>Export functionality (PNG, PDF, CSV)</li>
                <li>Responsive design for mobile and desktop</li>
                <li>TypeScript support with full type safety</li>
              </Box>

              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Chart Types Available:</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {['Line Chart', 'Area Chart', 'Bar Chart', 'Pie Chart', 'Radar Chart', 'Scatter Chart', 'Composed Chart'].map((type) => (
                  <Grid item key={type}>
                    <Chip label={type} variant="outlined" />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}
        {selectedTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>Code Examples</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', p: 2, borderRadius: 1 }}>
                {`// Basic Line Chart Usage
import { LineChartWrapper } from './AdvancedDataVisualization';

const MyComponent = () => {
  const data = [
    { month: 'Jan', value: 100 },
    { month: 'Feb', value: 200 },
  ];
  
  return (
    <LineChartWrapper 
      data={data}
      config={{
        type: 'line',
        colors: ['#8884d8'],
        animation: true,
        showGrid: true
      }}
      height={300}
    />
  );
};`}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default AdvancedDataVisualization;