import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack,
  History,
  Analytics,
  EmojiEvents,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import GameHistory from '../components/game-results/GameHistory';
import Statistics from '../components/game-results/Statistics';
import MatchResults from '../components/game-results/MatchResults';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gameresults-tabpanel-${index}`}
      aria-labelledby={`gameresults-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const GameResults: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { 
      label: 'Match History', 
      icon: <History />, 
      component: <GameHistory /> 
    },
    { 
      label: 'Statistics', 
      icon: <Analytics />, 
      component: <Statistics /> 
    },
    { 
      label: 'Recent Results', 
      icon: <EmojiEvents />, 
      component: <MatchResults /> 
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton 
          onClick={() => navigate('/dashboard')} 
          sx={{ mr: 2 }}
          aria-label="Back to dashboard"
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Game Results 📊
        </Typography>
      </Box>

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={isMobile ? undefined : tab.label}
              icon={tab.icon}
              iconPosition={isMobile ? 'top' : 'start'}
              aria-label={tab.label}
              sx={{
                '& .MuiTab-iconWrapper': {
                  mb: isMobile ? 0.5 : 0,
                  mr: isMobile ? 0 : 1,
                },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabs.map((tab, index) => (
        <TabPanel key={index} value={activeTab} index={index}>
          {tab.component}
        </TabPanel>
      ))}
    </Box>
  );
};

export default GameResults;