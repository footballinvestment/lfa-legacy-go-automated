import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
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
import { useSafeAuth } from '../../SafeAuthContext';

interface OptimizedCreditBalanceProps {
  showRefreshButton?: boolean;
  showHistoryButton?: boolean;
  showAddButton?: boolean;
  onAddCredits?: () => void;
  onViewHistory?: () => void;
  refreshInterval?: number; // in milliseconds
}

const OptimizedCreditBalance: React.FC<OptimizedCreditBalanceProps> = ({
  showRefreshButton = true,
  showHistoryButton = false,
  showAddButton = true,
  onAddCredits,
  onViewHistory,
  refreshInterval = 60000, // 60 seconds default (increased from 30s)
}) => {
  const { state, refreshStats } = useSafeAuth();
  const [balance, setBalance] = useState<number>(state.user?.credits || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [animateBalance, setAnimateBalance] = useState(false);
  
  // Ref to prevent multiple simultaneous refreshes
  const isRefreshingRef = React.useRef(false);

  console.log('💰 OptimizedCreditBalance rendering - balance:', balance);

  // Optimized refresh that uses SafeAuth instead of direct API call
  const refreshBalance = useCallback(async (showLoading = true) => {
    if (isRefreshingRef.current) {
      console.log('🚫 CreditBalance refresh skipped - already refreshing');
      return;
    }

    isRefreshingRef.current = true;
    
    if (showLoading) setLoading(true);
    setError(null);

    try {
      console.log('💰 Refreshing balance via SafeAuth context...');
      
      // Use the SafeAuth context refresh instead of direct API call
      await refreshStats();
      
      // The balance will be updated via the useEffect below
      setLastUpdated(new Date());
      console.log('✅ CreditBalance refresh completed');
    } catch (err: any) {
      console.error('❌ CreditBalance refresh failed:', err);
      setError('Unable to refresh balance');
    } finally {
      if (showLoading) setLoading(false);
      isRefreshingRef.current = false;
    }
  }, [refreshStats]);

  // Update balance when user context changes
  useEffect(() => {
    const newBalance = state.user?.credits || 0;
    
    if (newBalance !== balance) {
      console.log('💰 Balance updated from context:', balance, '->', newBalance);
      
      // Animate if balance changed significantly
      if (Math.abs(newBalance - balance) > 0) {
        setAnimateBalance(true);
        setTimeout(() => setAnimateBalance(false), 600);
      }
      
      setBalance(newBalance);
      setLastUpdated(new Date());
    }
  }, [state.user?.credits, balance]);

  // REMOVED automatic periodic refresh to prevent API spam
  // Only manual refresh is available now
  
  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    console.log('💰 Manual refresh triggered');
    refreshBalance(true);
  }, [refreshBalance]);

  const formatLastUpdated = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  const getBalanceColor = () => {
    if (balance >= 100) return 'success';
    if (balance >= 50) return 'warning';
    return 'error';
  };

  const getBalanceIcon = () => {
    if (balance >= 100) return '💎';
    if (balance >= 50) return '💰';
    if (balance >= 10) return '🪙';
    return '💸';
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        border: '1px solid #e2e8f0',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 2
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Credits Balance
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {showRefreshButton && (
              <Tooltip title="Refresh balance">
                <IconButton
                  size="small"
                  onClick={handleManualRefresh}
                  disabled={loading}
                  sx={{ 
                    opacity: loading ? 0.5 : 1,
                    '&:hover': { backgroundColor: 'primary.light', opacity: 0.1 }
                  }}
                >
                  <Refresh sx={{ fontSize: 20, color: loading ? 'text.secondary' : 'primary.main' }} />
                </IconButton>
              </Tooltip>
            )}
            
            {showHistoryButton && onViewHistory && (
              <Tooltip title="View history">
                <IconButton size="small" onClick={onViewHistory}>
                  <History sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        <Fade in>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Zoom in={animateBalance} timeout={300}>
              <Typography 
                variant="h3" 
                component="div" 
                fontWeight="bold"
                color={`${getBalanceColor()}.main`}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 1,
                  fontSize: { xs: '2rem', sm: '2.5rem' }
                }}
              >
                <span style={{ fontSize: '1.2em' }}>{getBalanceIcon()}</span>
                {balance.toLocaleString()}
              </Typography>
            </Zoom>
            
            <Chip
              label={`${balance >= 100 ? 'Excellent' : balance >= 50 ? 'Good' : balance >= 10 ? 'Low' : 'Critical'} Balance`}
              color={getBalanceColor()}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        </Fade>

        {error && (
          <Typography 
            variant="caption" 
            color="error" 
            sx={{ 
              display: 'block', 
              textAlign: 'center', 
              mb: 1,
              p: 1,
              backgroundColor: 'error.light',
              borderRadius: 1,
              opacity: 0.8
            }}
          >
            {error}
          </Typography>
        )}

        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            display: 'block', 
            textAlign: 'center', 
            mb: 2,
            opacity: 0.7 
          }}
        >
          Last updated: {formatLastUpdated()}
        </Typography>

        {(showAddButton || showHistoryButton) && (
          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
            {showAddButton && onAddCredits && (
              <Box sx={{ flex: 1 }}>
                <IconButton
                  fullWidth
                  onClick={onAddCredits}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderRadius: 2,
                    py: 1,
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  }}
                >
                  <Add sx={{ mr: 1 }} />
                  <Typography variant="button" sx={{ fontSize: '0.875rem' }}>
                    Add Credits
                  </Typography>
                </IconButton>
              </Box>
            )}

            {showHistoryButton && onViewHistory && (
              <Box sx={{ flex: 1 }}>
                <IconButton
                  fullWidth
                  onClick={onViewHistory}
                  sx={{
                    backgroundColor: 'secondary.main',
                    color: 'white',
                    borderRadius: 2,
                    py: 1,
                    '&:hover': {
                      backgroundColor: 'secondary.dark',
                    }
                  }}
                >
                  <History sx={{ mr: 1 }} />
                  <Typography variant="button" sx={{ fontSize: '0.875rem' }}>
                    History
                  </Typography>
                </IconButton>
              </Box>
            )}
          </Box>
        )}

        {/* Performance Mode Indicator */}
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            textAlign: 'center', 
            mt: 1,
            p: 0.5,
            backgroundColor: '#ecfeff',
            color: '#0891b2',
            borderRadius: 0.5,
            fontSize: '0.75rem'
          }}
        >
          🚀 Performance Mode: No automatic API calls
        </Typography>
      </CardContent>
    </Card>
  );
};

export default OptimizedCreditBalance;