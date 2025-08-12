import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  IconButton,
  LinearProgress,
  Chip,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  TrendingUp,
  People,
  EmojiEvents,
  Timeline,
  Refresh,
  Download,
  FilterList,
  Assessment,
  ShowChart,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

interface TournamentStats {
  totalTournaments: number;
  activeTournaments: number;
  totalParticipants: number;
  completionRate: number;
  averageParticipants: number;
  totalRevenue: number;
  monthlyGrowth: number;
  retentionRate: number;
}

interface PerformanceMetrics {
  tournamentCompletions: number;
  playerEngagement: number;
  averageMatchDuration: number;
  customerSatisfaction: number;
  revenuePerTournament: number;
  participantGrowth: number;
}

interface TrendData {
  month: string;
  tournaments: number;
  participants: number;
  revenue: number;
  completions: number;
}

interface PlayerAnalytics {
  topPlayers: Array<{
    id: string;
    name: string;
    tournaments: number;
    winRate: number;
    level: number;
    avatar?: string;
  }>;
  levelDistribution: Array<{
    level: string;
    count: number;
    percentage: number;
  }>;
  activityData: Array<{
    day: string;
    activeUsers: number;
    newRegistrations: number;
  }>;
}

const TournamentAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [tournamentStats, setTournamentStats] = useState<TournamentStats>({
    totalTournaments: 1247,
    activeTournaments: 23,
    totalParticipants: 8934,
    completionRate: 87.5,
    averageParticipants: 18.7,
    totalRevenue: 125430,
    monthlyGrowth: 12.3,
    retentionRate: 73.2,
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    tournamentCompletions: 89.2,
    playerEngagement: 76.8,
    averageMatchDuration: 24.5,
    customerSatisfaction: 4.6,
    revenuePerTournament: 185.7,
    participantGrowth: 15.4,
  });

  const trendData: TrendData[] = [
    { month: 'Jan', tournaments: 85, participants: 1520, revenue: 8900, completions: 74 },
    { month: 'Feb', tournaments: 92, participants: 1680, revenue: 9850, completions: 81 },
    { month: 'Mar', tournaments: 108, participants: 1890, revenue: 11200, completions: 95 },
    { month: 'Apr', tournaments: 126, participants: 2150, revenue: 12800, completions: 109 },
    { month: 'May', tournaments: 134, participants: 2380, revenue: 14100, completions: 118 },
    { month: 'Jun', tournaments: 145, participants: 2620, revenue: 15600, completions: 127 },
    { month: 'Jul', tournaments: 152, participants: 2890, revenue: 16900, completions: 134 },
    { month: 'Aug', tournaments: 168, participants: 3150, revenue: 18500, completions: 147 },
    { month: 'Sep', tournaments: 175, participants: 3420, revenue: 19800, completions: 156 },
    { month: 'Oct', tournaments: 189, participants: 3680, revenue: 21200, completions: 167 },
    { month: 'Nov', tournaments: 196, participants: 3950, revenue: 22800, completions: 174 },
    { month: 'Dec', tournaments: 203, participants: 4200, revenue: 24300, completions: 182 },
  ];

  const playerAnalytics: PlayerAnalytics = {
    topPlayers: [
      { id: '1', name: 'Alex Chen', tournaments: 47, winRate: 78.5, level: 15 },
      { id: '2', name: 'Maria Garcia', tournaments: 42, winRate: 82.1, level: 14 },
      { id: '3', name: 'David Johnson', tournaments: 39, winRate: 75.3, level: 13 },
      { id: '4', name: 'Sarah Wilson', tournaments: 35, winRate: 80.0, level: 12 },
      { id: '5', name: 'Mike Thompson', tournaments: 33, winRate: 73.8, level: 11 },
    ],
    levelDistribution: [
      { level: '1-5', count: 2845, percentage: 32 },
      { level: '6-10', count: 2687, percentage: 30 },
      { level: '11-15', count: 1789, percentage: 20 },
      { level: '16-20', count: 982, percentage: 11 },
      { level: '20+', count: 631, percentage: 7 },
    ],
    activityData: [
      { day: 'Mon', activeUsers: 1250, newRegistrations: 45 },
      { day: 'Tue', activeUsers: 1380, newRegistrations: 52 },
      { day: 'Wed', activeUsers: 1420, newRegistrations: 38 },
      { day: 'Thu', activeUsers: 1560, newRegistrations: 67 },
      { day: 'Fri', activeUsers: 1890, newRegistrations: 89 },
      { day: 'Sat', activeUsers: 2340, newRegistrations: 134 },
      { day: 'Sun', activeUsers: 2180, newRegistrations: 112 },
    ],
  };

  const tournamentTypeData = [
    { name: 'Knockout', value: 45, color: '#8884d8' },
    { name: 'Round Robin', value: 30, color: '#82ca9d' },
    { name: 'Swiss', value: 15, color: '#ffc658' },
    { name: 'Custom', value: 10, color: '#ff7c7c' },
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        handleRefresh();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setTournamentStats(prev => ({
        ...prev,
        activeTournaments: prev.activeTournaments + Math.floor(Math.random() * 3 - 1),
        totalParticipants: prev.totalParticipants + Math.floor(Math.random() * 20),
        completionRate: Math.max(80, Math.min(95, prev.completionRate + (Math.random() - 0.5) * 2)),
      }));
      setLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    console.log('Exporting analytics data...');
  };

  const renderKPICard = (title: string, value: string | number, icon: React.ReactNode, color: string, change?: string) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, mr: 2 }}>
            {icon}
          </Avatar>
          <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          {value}
        </Typography>
        {change && (
          <Chip
            size="small"
            label={change}
            color={change.startsWith('+') ? 'success' : 'error'}
            sx={{ fontSize: '0.75rem' }}
          />
        )}
      </CardContent>
    </Card>
  );

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        {renderKPICard(
          'Total Tournaments',
          tournamentStats.totalTournaments.toLocaleString(),
          <EmojiEvents />,
          '#1976d2',
          `+${tournamentStats.monthlyGrowth}%`
        )}
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        {renderKPICard(
          'Active Tournaments',
          tournamentStats.activeTournaments,
          <Timeline />,
          '#2e7d32',
          '+5.2%'
        )}
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        {renderKPICard(
          'Total Participants',
          tournamentStats.totalParticipants.toLocaleString(),
          <People />,
          '#ed6c02',
          '+8.7%'
        )}
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        {renderKPICard(
          'Completion Rate',
          `${tournamentStats.completionRate}%`,
          <TrendingUp />,
          '#9c27b0',
          '+2.1%'
        )}
      </Grid>

      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Tournament Trends</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="tournaments" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="participants" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Tournament Types</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tournamentTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tournamentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Revenue Trends</Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderPerformanceTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        {renderKPICard(
          'Tournament Completions',
          `${performanceMetrics.tournamentCompletions}%`,
          <EmojiEvents />,
          '#1976d2',
          '+3.2%'
        )}
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        {renderKPICard(
          'Player Engagement',
          `${performanceMetrics.playerEngagement}%`,
          <People />,
          '#2e7d32',
          '+1.8%'
        )}
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        {renderKPICard(
          'Avg Match Duration',
          `${performanceMetrics.averageMatchDuration}min`,
          <Timeline />,
          '#ed6c02',
          '-2.1%'
        )}
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Tournament Completions Over Time</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completions" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Performance Metrics</Typography>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Customer Satisfaction</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {performanceMetrics.customerSatisfaction}/5.0
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(performanceMetrics.customerSatisfaction / 5) * 100} 
              sx={{ mb: 2 }} 
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Revenue per Tournament</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ${performanceMetrics.revenuePerTournament}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={75} 
              sx={{ mb: 2 }} 
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Participant Growth</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                +{performanceMetrics.participantGrowth}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={performanceMetrics.participantGrowth * 5} 
              color="success"
            />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderPlayersTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Top Players</Typography>
          {playerAnalytics.topPlayers.map((player, index) => (
            <Box key={player.id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {player.name.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {player.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {player.tournaments} tournaments • {player.winRate}% win rate • Level {player.level}
                </Typography>
              </Box>
              <Chip size="small" label={`#${index + 1}`} color="primary" />
            </Box>
          ))}
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Player Level Distribution</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={playerAnalytics.levelDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Daily Player Activity</Typography>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={playerAnalytics.activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" strokeWidth={2} name="Active Users" />
              <Line type="monotone" dataKey="newRegistrations" stroke="#82ca9d" strokeWidth={2} name="New Registrations" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderTournamentsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        {renderKPICard(
          'Average Participants',
          tournamentStats.averageParticipants.toFixed(1),
          <People />,
          '#1976d2',
          '+4.3%'
        )}
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        {renderKPICard(
          'Total Revenue',
          `$${tournamentStats.totalRevenue.toLocaleString()}`,
          <TrendingUp />,
          '#2e7d32',
          '+12.8%'
        )}
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        {renderKPICard(
          'Retention Rate',
          `${tournamentStats.retentionRate}%`,
          <Assessment />,
          '#ed6c02',
          '+1.5%'
        )}
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        {renderKPICard(
          'Monthly Growth',
          `+${tournamentStats.monthlyGrowth}%`,
          <ShowChart />,
          '#9c27b0',
          '+2.7%'
        )}
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Tournament Participation Trends</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="participants" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment color="primary" />
          Tournament Analytics Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
          
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
          
          <IconButton>
            <FilterList />
          </IconButton>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Performance" />
          <Tab label="Players" />
          <Tab label="Tournaments" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {selectedTab === 0 && renderOverviewTab()}
        {selectedTab === 1 && renderPerformanceTab()}
        {selectedTab === 2 && renderPlayersTab()}
        {selectedTab === 3 && renderTournamentsTab()}
      </Box>
    </Box>
  );
};

export default TournamentAnalyticsDashboard;