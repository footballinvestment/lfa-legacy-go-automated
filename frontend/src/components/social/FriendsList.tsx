// src/components/social/FriendsList.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  Button,
  Grid,
  TextField,
  IconButton,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

const FriendsList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <IconButton onClick={() => navigate("/dashboard")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Social Hub 👥
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Find Friends
            </Typography>
            <TextField
              fullWidth
              placeholder="Search players..."
              sx={{ mb: 2 }}
            />
            <Button variant="contained" fullWidth>
              Search Players
            </Button>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Your Friends
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You haven't added any friends yet. Start connecting with other
              players!
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FriendsList;
