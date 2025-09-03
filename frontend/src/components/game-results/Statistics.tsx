// src/components/game-results/GameResults.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Card, Grid, IconButton, Button } from "@mui/material";
import {
  ArrowBack,
  SportsScore,
  TrendingUp,
  EmojiEvents,
} from "@mui/icons-material";

const GameResults: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <IconButton onClick={() => navigate("/dashboard")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Game Results 📊
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Matches
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              No recent matches to display. Play some games to see your results
              here!
            </Typography>

            {/* Empty State with Call to Action */}
            <Box sx={{ textAlign: "center", py: 4 }}>
              <SportsScore
                sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Start Your Football Journey
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Join a tournament or play a friendly match to see your results
                here.
              </Typography>
              <Button
                variant="contained"
                startIcon={<EmojiEvents />}
                onClick={() => navigate("/tournaments")}
              >
                Join Tournament
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Statistics
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Win Rate
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  0%
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Total Games
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  0
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Goals Scored
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  0
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Goals Conceded
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  0
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Current Streak
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  None
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Performance Card */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              <TrendingUp sx={{ verticalAlign: "middle", mr: 1 }} />
              Performance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your performance metrics will appear here after playing some
              games.
            </Typography>

            <Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                💡 Tip: Regular play helps improve your ranking and unlock
                achievements!
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GameResults;
