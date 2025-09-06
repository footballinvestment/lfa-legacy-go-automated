// src/components/credits/CreditPurchase.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  Button,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { creditService } from "../../services/api";
import { useSafeAuth } from "../../SafeAuthContext";

const CreditPurchase: React.FC = () => {
  const navigate = useNavigate();
  const { refreshStats } = useSafeAuth();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const creditPackages = [
    { 
      id: "starter_10", 
      name: "Starter Pack",
      credits: 10, 
      bonus_credits: 2,
      price_huf: 2500,
      price: 2500,
      popular: false,
      description: "Perfect for getting started"
    },
    { 
      id: "popular_25", 
      name: "Popular Pack",
      credits: 25, 
      bonus_credits: 7,
      price_huf: 5500,
      price: 5500,
      popular: true,
      description: "Most popular choice"
    },
    { 
      id: "value_50", 
      name: "Value Pack",
      credits: 50, 
      bonus_credits: 18,
      price_huf: 9500,
      price: 9500,
      popular: false,
      description: "Great value for dedicated players"
    },
    { 
      id: "premium_100", 
      name: "Premium Pack",
      credits: 100, 
      bonus_credits: 40,
      price_huf: 16500,
      price: 16500,
      popular: false,
      description: "Maximum value for serious competitors"
    }
  ];

  const handlePurchase = async (packageData: any) => {
    setPurchasing(packageData.id);
    setError(null);
    setSuccess(null);

    try {
      await creditService.purchaseCredits({
        package_id: packageData.id,
        payment_method: "card"
      });

      // Refresh user data to get updated balance
      if (refreshStats) {
        await refreshStats();
      }

      const totalCredits = packageData.credits + packageData.bonus_credits;
      setSuccess(`Successfully purchased ${totalCredits} credits! (${packageData.credits} + ${packageData.bonus_credits} bonus)`);
    } catch (err: any) {
      console.error('Credit purchase failed:', err);
      setError(err.message || "Purchase failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <IconButton onClick={() => navigate("/dashboard")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Buy Credits 💰
        </Typography>
      </Box>
      <Grid container spacing={3} justifyContent="center">
        {creditPackages.map((pkg) => (
          <Grid item xs={12} sm={6} md={3} key={pkg.id}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                position: "relative",
                border: pkg.popular ? "2px solid" : "1px solid",
                borderColor: pkg.popular ? "primary.main" : "divider",
              }}
            >
              {pkg.popular && (
                <Chip 
                  label="Most Popular" 
                  color="primary" 
                  size="small"
                  sx={{ position: "absolute", top: 16, right: 16 }}
                />
              )}
              
              <Typography variant="h6" sx={{ mb: 2 }}>
                {pkg.name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {pkg.description}
              </Typography>
              
              <Typography variant="h4" sx={{ mb: 1 }}>
                {pkg.credits}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                + {pkg.bonus_credits} bonus credits
              </Typography>
              
              <Typography variant="h5" sx={{ mb: 3 }}>
                {pkg.price_huf} HUF
              </Typography>
              
              <Button 
                variant="contained" 
                fullWidth 
                size="large"
                onClick={() => handlePurchase(pkg)}
                disabled={purchasing === pkg.id}
                startIcon={purchasing === pkg.id ? <CircularProgress size={16} /> : null}
              >
                {purchasing === pkg.id ? "Processing..." : "Purchase"}
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CreditPurchase;
