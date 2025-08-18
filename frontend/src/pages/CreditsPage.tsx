import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  ArrowBack,
  Home,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { CouponRedemptionResponse } from '../services/api';
import CreditBalance from '../components/credits/CreditBalance';
import CouponRedemption from '../components/credits/CouponRedemption';
import AvailableCoupons from '../components/credits/AvailableCoupons';
import CreditPurchase from '../components/credits/CreditPurchase';

const CreditsPage: React.FC = () => {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCouponSuccess = (response: CouponRedemptionResponse) => {
    setSuccessMessage(`🎉 ${response.coupon_name} redeemed! +${response.credits_awarded} credits`);
    setSnackbarOpen(true);
  };

  const handleCreditBalanceUpdate = (newBalance: number) => {
    console.log('Credit balance updated:', newBalance);
  };

  return (
    <Box>
      {/* Header with navigation */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Back to Dashboard">
            <IconButton onClick={() => navigate('/dashboard')}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
          
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              💎 Credits & Coupons
            </Typography>
            
            <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
              <MuiLink
                component={Link}
                to="/dashboard"
                underline="hover"
                color="inherit"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <Home sx={{ mr: 0.5 }} fontSize="small" />
                Dashboard
              </MuiLink>
              <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalanceWallet sx={{ mr: 0.5 }} fontSize="small" />
                Credits
              </Typography>
            </Breadcrumbs>
          </Box>
        </Box>

        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Credit Balance Section */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            <CreditBalance 
              onAddCredits={() => {
                document.getElementById('purchase-section')?.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'center'
                });
              }}
              onViewHistory={() => console.log('View history clicked')}
              showHistoryButton={true}
              showRefreshButton={true}
              showAddButton={true}
            />
          </Box>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Coupon Redemption */}
            <Grid item xs={12}>
              <CouponRedemption 
                onSuccess={handleCouponSuccess}
                onBalanceUpdate={handleCreditBalanceUpdate}
              />
            </Grid>

            {/* Available Coupons for Development */}
            <Grid item xs={12}>
              <AvailableCoupons 
                developmentMode={process.env.NODE_ENV === 'development'}
                onCouponSelect={(code) => {
                  // Auto-fill the coupon code in redemption form
                  const couponInput = document.querySelector('input[placeholder*="coupon"]') as HTMLInputElement;
                  if (couponInput) {
                    couponInput.value = code;
                    couponInput.focus();
                    
                    // Trigger change event
                    const event = new Event('input', { bubbles: true });
                    couponInput.dispatchEvent(event);
                  }
                }}
              />
            </Grid>

            {/* Credit Purchase Section */}
            <Grid item xs={12} id="purchase-section">
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    💳 Purchase Credits
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Need more credits? Choose from our credit packages below.
                  </Typography>
                  <CreditPurchase />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Success Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreditsPage;