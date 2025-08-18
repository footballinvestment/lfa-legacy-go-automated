import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Collapse,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  ContentCopy,
  LocalOffer,
  Code,
  Visibility,
  VisibilityOff,
  Star,
  Schedule,
  People,
} from '@mui/icons-material';
import { creditService, Coupon } from '../../services/api';

interface AvailableCouponsProps {
  developmentMode?: boolean;
  onCouponSelect?: (couponCode: string) => void;
}

const AvailableCoupons: React.FC<AvailableCouponsProps> = ({
  developmentMode = process.env.NODE_ENV === 'development',
  onCouponSelect,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(developmentMode);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Hardcoded development coupons for testing
  const devCoupons: Coupon[] = [
    {
      id: 1,
      code: 'FOOTBALL25',
      name: 'Football Starter Pack',
      description: 'Get 25 free credits to start your football journey!',
      coupon_type: 'fixed',
      credits_reward: 25,
      is_active: true,
      current_uses: 15,
      per_user_limit: 1,
      created_at: '2025-01-01T00:00:00Z',
      max_uses: 100,
    },
    {
      id: 2,
      code: 'WEEKEND50',
      name: 'Weekend Warrior',
      description: 'Double your fun with 50 weekend credits!',
      coupon_type: 'fixed',
      credits_reward: 50,
      is_active: true,
      expires_at: '2025-12-31T23:59:59Z',
      current_uses: 8,
      per_user_limit: 1,
      created_at: '2025-01-01T00:00:00Z',
      max_uses: 50,
    },
    {
      id: 3,
      code: 'CHAMPION100',
      name: 'Champion\'s Reward',
      description: 'For the true champions - 100 premium credits!',
      coupon_type: 'fixed',
      credits_reward: 100,
      is_active: true,
      current_uses: 3,
      per_user_limit: 1,
      created_at: '2025-01-01T00:00:00Z',
      max_uses: 25,
    },
    {
      id: 4,
      code: 'NEWBIE10',
      name: 'New Player Bonus',
      description: 'Welcome gift for new players',
      coupon_type: 'fixed',
      credits_reward: 10,
      is_active: true,
      current_uses: 45,
      per_user_limit: 1,
      created_at: '2025-01-01T00:00:00Z',
      max_uses: 200,
    },
    {
      id: 5,
      code: 'TESTING5',
      name: 'Quick Test Coupon',
      description: 'Fast testing with 5 credits',
      coupon_type: 'fixed',
      credits_reward: 5,
      is_active: true,
      current_uses: 2,
      per_user_limit: 5,
      created_at: '2025-01-01T00:00:00Z',
      max_uses: 1000,
    },
  ];

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const fetchedCoupons = await creditService.getAvailableCoupons();
      setCoupons(fetchedCoupons);
    } catch (error) {
      // In development mode, use hardcoded coupons if API fails
      if (developmentMode) {
        setCoupons(devCoupons);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCoupons();
    }
  }, [visible]);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setSnackbarOpen(true);
      
      // Auto-select coupon if callback provided
      if (onCouponSelect) {
        onCouponSelect(code);
      }
      
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getCouponColor = (coupon: Coupon) => {
    if (coupon.credits_reward >= 100) return 'error'; // Premium
    if (coupon.credits_reward >= 50) return 'warning'; // High value
    if (coupon.credits_reward >= 25) return 'primary'; // Medium value
    return 'secondary'; // Low value
  };

  const getCouponIcon = (coupon: Coupon) => {
    if (coupon.credits_reward >= 100) return <Star />;
    if (coupon.credits_reward >= 50) return <LocalOffer />;
    return <Code />;
  };

  const getUsagePercentage = (coupon: Coupon) => {
    if (!coupon.max_uses) return 0;
    return (coupon.current_uses / coupon.max_uses) * 100;
  };

  const displayCoupons = coupons.length > 0 ? coupons : (developmentMode ? devCoupons : []);

  if (!developmentMode && !visible) {
    return null;
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalOffer color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Available Coupons
              </Typography>
              {developmentMode && (
                <Chip label="DEV" color="warning" size="small" />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={visible ? "Hide coupons" : "Show coupons"}>
                <IconButton size="small" onClick={() => setVisible(!visible)}>
                  {visible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title={expanded ? "Collapse" : "Expand all"}>
                <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Collapse in={visible}>
            {developmentMode && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  🧪 <strong>Development Mode:</strong> Click any coupon code to copy it for testing!
                </Typography>
              </Alert>
            )}

            <Grid container spacing={2}>
              {displayCoupons.map((coupon) => (
                <Grid key={coupon.code || coupon.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                      },
                    }}
                    onClick={() => copyToClipboard(coupon.code)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getCouponIcon(coupon)}
                        <Typography variant="subtitle2" fontWeight="bold" noWrap>
                          {coupon.name}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Chip
                          label={coupon.code}
                          color={getCouponColor(coupon)}
                          sx={{ 
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                          }}
                          icon={copiedCode === coupon.code ? <ContentCopy /> : undefined}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40 }}>
                        {coupon.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={`+${coupon.credits_reward}`}
                          color="success"
                          size="small"
                        />
                        {coupon.expires_at && (
                          <Tooltip title="Expires">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Schedule fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(coupon.expires_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                      
                      {coupon.max_uses && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <People fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {coupon.current_uses}/{coupon.max_uses} used ({getUsagePercentage(coupon).toFixed(0)}%)
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Button
                        size="small"
                        fullWidth
                        startIcon={<ContentCopy />}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(coupon.code);
                        }}
                      >
                        Copy Code
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {displayCoupons.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LocalOffer sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No coupons available at the moment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check back later for new coupon codes!
                </Typography>
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={`Coupon code "${copiedCode}" copied to clipboard!`}
      />
    </>
  );
};

export default AvailableCoupons;