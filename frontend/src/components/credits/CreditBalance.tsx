import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Fade,
  Zoom,
  LinearProgress,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Refresh,
  TrendingUp,
  History,
  Add,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { creditService } from '../../services/api';

interface CreditBalanceProps {
  showRefreshButton?: boolean;
  showHistoryButton?: boolean;
  showAddButton?: boolean;
  onAddCredits?: () => void;
  onViewHistory?: () => void;
  refreshInterval?: number; // in milliseconds
}

const CreditBalance: React.FC<CreditBalanceProps> = ({
  showRefreshButton = true,
  showHistoryButton = false,
  showAddButton = true,
  onAddCredits,
  onViewHistory,
  refreshInterval = 30000, // 30 seconds default
}) => {
  const { state } = useAuth();
  const [balance, setBalance] = useState<number>(state.user?.credits || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [animateBalance, setAnimateBalance] = useState(false);

  const fetchBalance = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const response = await creditService.getCurrentBalance();
      const newBalance = response.credits;
      
      // Animate if balance changed
      if (newBalance !== balance) {
        setAnimateBalance(true);
        setTimeout(() => setAnimateBalance(false), 600);
      }
      
      setBalance(newBalance);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch balance');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    fetchBalance();
    
    const interval = setInterval(() => {
      fetchBalance(false); // Background refresh without loading indicator
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Update balance when user context changes
  useEffect(() => {
    if (state.user?.credits !== undefined && state.user.credits !== balance) {
      setBalance(state.user.credits);
    }
  }, [state.user?.credits]);

  const formatLastUpdated = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  const getBalanceColor = () => {
    if (balance >= 100) return 'success';
    if (balance >= 50) return 'primary';
    if (balance >= 20) return 'warning';
    return 'error';
  };

  const getBalanceLevel = () => {
    if (balance >= 100) return 'Wealthy';
    if (balance >= 50) return 'Well-off';
    if (balance >= 20) return 'Moderate';
    if (balance >= 10) return 'Low';
    return 'Critical';
  };

  return (
    <Card 
      sx={{ 
        position: 'relative',
        overflow: 'visible',
        background: animateBalance 
          ? 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)'
          : undefined,
        transition: 'background 0.6s ease-in-out',
      }}
    >
      {loading && (
        <LinearProgress 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0,
            borderRadius: '4px 4px 0 0'
          }} 
        />
      )}
      
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Credit Balance
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {showRefreshButton && (
              <Tooltip title="Refresh balance">
                <IconButton 
                  size="small" 
                  onClick={() => fetchBalance()}
                  disabled={loading}
                >
                  <Refresh sx={{ 
                    transform: loading ? 'rotate(360deg)' : 'none',
                    transition: 'transform 1s linear'
                  }} />
                </IconButton>
              </Tooltip>
            )}
            
            {showHistoryButton && onViewHistory && (
              <Tooltip title="View transaction history">
                <IconButton size="small" onClick={onViewHistory}>
                  <History />
                </IconButton>
              </Tooltip>
            )}
            
            {showAddButton && onAddCredits && (
              <Tooltip title="Buy more credits">
                <IconButton size="small" onClick={onAddCredits} color="primary">
                  <Add />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Zoom in={!loading} timeout={300}>
            <Typography 
              variant="h2" 
              component="div" 
              fontWeight="bold"
              color={`${getBalanceColor()}.main`}
              sx={{ 
                fontSize: { xs: '2.5rem', sm: '3rem' },
                transition: 'color 0.3s ease',
                textShadow: animateBalance ? '0 0 20px rgba(255,255,255,0.8)' : 'none',
              }}
            >
              {balance}
            </Typography>
          </Zoom>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Available Credits
          </Typography>
          
          <Chip 
            label={getBalanceLevel()}
            color={getBalanceColor()}
            size="small"
            icon={<TrendingUp />}
          />
        </Box>

        {error && (
          <Fade in>
            <Typography 
              variant="caption" 
              color="error" 
              sx={{ display: 'block', textAlign: 'center', mb: 1 }}
            >
              {error}
            </Typography>
          </Fade>
        )}

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pt: 2,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {formatLastUpdated()}
          </Typography>
          
          {balance < 10 && (
            <Chip 
              label="Low Balance"
              color="warning"
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {balance < 20 && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="caption" color="warning.dark">
              💡 <strong>Tip:</strong> Your credit balance is running low. 
              {onAddCredits && (
                <>
                  {' '}
                  <Typography 
                    component="span" 
                    variant="caption" 
                    sx={{ 
                      color: 'primary.main', 
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                    onClick={onAddCredits}
                  >
                    Buy more credits
                  </Typography>
                  {' '}or redeem a coupon to continue playing!
                </>
              )}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditBalance;