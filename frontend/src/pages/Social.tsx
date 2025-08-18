import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack,
  People,
  PersonAdd,
  EmojiEvents,
  Mail,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FriendsList from '../components/social/FriendsList';
import UserSearch from '../components/social/UserSearch';
import ChallengeSystem from '../components/social/ChallengeSystem';
import FriendRequests from '../components/social/FriendRequests';

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
      id={`social-tabpanel-${index}`}
      aria-labelledby={`social-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Social: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: 'My Friends', icon: <People />, component: <FriendsList /> },
    { label: 'Find Players', icon: <PersonAdd />, component: <UserSearch /> },
    { label: 'Challenges', icon: <EmojiEvents />, component: <ChallengeSystem /> },
    { label: 'Requests', icon: <Mail />, component: <FriendRequests /> },
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
          Social Hub 👥
        </Typography>
      </Box>

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
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
      </Paper>

      {/* Tab Content */}
      {tabs.map((tab, index) => (
        <TabPanel key={index} value={activeTab} index={index}>
          {tab.component}
        </TabPanel>
      ))}
    </Box>
  );
};

export default Social;