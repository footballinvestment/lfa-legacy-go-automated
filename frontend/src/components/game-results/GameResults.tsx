// src/components/game-results/GameResults.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Card, Grid, IconButton } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

const GameResults: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <IconButton onClick={() => navigate("/dashboard")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Game Results 📊
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Matches
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No recent matches to display. Play some games to see your results
              here!
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Statistics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Win Rate: 0%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Games: 0
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Goals Scored: 0
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GameResults;
