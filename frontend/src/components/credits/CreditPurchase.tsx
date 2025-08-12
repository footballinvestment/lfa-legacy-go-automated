// src/components/credits/CreditPurchase.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  Button,
  Grid,
  Chip,
  IconButton,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

const CreditPurchase: React.FC = () => {
  const navigate = useNavigate();

  const creditPackages = [
    { credits: 100, price: 10, bonus: 0 },
    { credits: 250, price: 20, bonus: 25 },
    { credits: 500, price: 35, bonus: 75 },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <IconButton onClick={() => navigate("/dashboard")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Buy Credits 💰
        </Typography>
      </Box>
      <Grid container spacing={3} justifyContent="center">
        {creditPackages.map((pkg, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                p: 4,
                textAlign: "center",
                border: index === 1 ? "2px solid" : "1px solid",
                borderColor: index === 1 ? "primary.main" : "divider",
              }}
            >
              {index === 1 && (
                <Chip label="Best Value" color="primary" sx={{ mb: 2 }} />
              )}
              <Typography
                variant="h3"
                color="primary.main"
                sx={{ fontWeight: 700 }}
              >
                {pkg.credits}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Credits
              </Typography>
              {pkg.bonus > 0 && (
                <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                  +{pkg.bonus} Bonus Credits!
                </Typography>
              )}
              <Typography variant="h5" sx={{ mb: 3 }}>
                ${pkg.price}
              </Typography>
              <Button variant="contained" fullWidth size="large">
                Purchase
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CreditPurchase;
