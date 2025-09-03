import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Fade,
  Backdrop,
  LinearProgress,
} from '@mui/material';
import {
  SportsFootball as FootballIcon,
} from '@mui/icons-material';

interface LoadingScreenProps {
  message?: string;
  showBackdrop?: boolean;
  variant?: 'circular' | 'linear' | 'football';
  size?: 'small' | 'medium' | 'large';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  showBackdrop = false,
  variant = 'circular',
  size = 'medium',
}) => {
  const getSizeValue = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 64;
      default: return 40;
    }
  };

  const renderLoader = () => {
    switch (variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <LinearProgress />
          </Box>
        );
      
      case 'football':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <FootballIcon 
              sx={{ 
                fontSize: getSizeValue() * 1.5,
                color: 'primary.main',
                mb: 2,
                animation: 'spin 2s linear infinite',
                '@keyframes spin': {
                  '0%': {
                    transform: 'rotate(0deg)',
                  },
                  '100%': {
                    transform: 'rotate(360deg)',
                  },
                },
              }} 
            />
          </Box>
        );
      
      default:
        return (
          <CircularProgress 
            size={getSizeValue()}
            sx={{ color: 'primary.main' }}
          />
        );
    }
  };

  const content = (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 3,
        }}
      >
        {renderLoader()}
        <Typography 
          variant={size === 'large' ? 'h6' : 'body1'}
          color="text.secondary"
          textAlign="center"
        >
          {message}
        </Typography>
      </Box>
    </Fade>
  );

  if (showBackdrop) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        open
      >
        {content}
      </Backdrop>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: size === 'large' ? '400px' : '200px',
        width: '100%',
      }}
    >
      {content}
    </Box>
  );
};

export default LoadingScreen;