// src/components/tournaments/ScoreInputInterface.tsx
// LFA Legacy GO - Professional Score Input Interface with Material-UI

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  Chip,
  Alert,
  Slider,
  FormControlLabel,
  Switch,
  IconButton,
  Divider,
  Paper,
  Rating,
} from "@mui/material";
import {
  Save,
  Close,
  ArrowBack,
  ArrowForward,
  EmojiEvents,
  Timer,
  Edit,
  Add,
  Remove,
  RestartAlt,
  SportsScore,
} from "@mui/icons-material";

interface Player {
  id: number;
  username: string;
  full_name: string;
  level: number;
}

interface Match {
  id: string;
  match_id: string;
  round_number: number;
  match_number: number;
  player1: Player;
  player2: Player | null;
  status: string;
  player1_score?: number;
  player2_score?: number;
  scheduled_time: string;
  actual_start_time?: string;
}

interface FormData {
  player1Score: string;
  player2Score: string;
  actualStartTime: string;
  actualEndTime: string;
  matchNotes: string;
  duration: string;
  competitivenessScore: number;
}

interface ScoreInputInterfaceProps {
  match?: Match;
  onSave?: (matchId: string, result: any) => void;
  onCancel?: () => void;
  isVisible?: boolean;
}

const ScoreInputInterface: React.FC<ScoreInputInterfaceProps> = ({
  match,
  onSave,
  onCancel,
  isVisible = true,
}) => {
  const [formData, setFormData] = useState<FormData>({
    player1Score: "",
    player2Score: "",
    actualStartTime: "",
    actualEndTime: "",
    matchNotes: "",
    duration: "",
    competitivenessScore: 5,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [quickScoreMode, setQuickScoreMode] = useState(false);

  // Demo match data
  const demoMatch: Match = match || {
    id: "R1M2",
    match_id: "MATCH_002",
    round_number: 1,
    match_number: 2,
    player1: {
      id: 3,
      username: "charlie_b",
      full_name: "Charlie Brown",
      level: 7,
    },
    player2: {
      id: 4,
      username: "diana_p",
      full_name: "Diana Prince",
      level: 9,
    },
    status: "in_progress",
    player1_score: 2,
    player2_score: 2,
    scheduled_time: "2024-12-25T14:30:00",
    actual_start_time: "2024-12-25T14:32:00",
  };

  useEffect(() => {
    if (demoMatch) {
      setFormData({
        player1Score: demoMatch.player1_score?.toString() || "",
        player2Score: demoMatch.player2_score?.toString() || "",
        actualStartTime: demoMatch.actual_start_time || "",
        actualEndTime: "",
        matchNotes: "",
        duration: "",
        competitivenessScore: 5,
      });
    }
  }, [demoMatch]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.player1Score) {
      newErrors.player1Score = "Player 1 score is required";
    } else if (
      parseInt(formData.player1Score) < 0 ||
      parseInt(formData.player1Score) > 10
    ) {
      newErrors.player1Score = "Score must be between 0 and 10";
    }

    if (!formData.player2Score) {
      newErrors.player2Score = "Player 2 score is required";
    } else if (
      parseInt(formData.player2Score) < 0 ||
      parseInt(formData.player2Score) > 10
    ) {
      newErrors.player2Score = "Score must be between 0 and 10";
    }

    if (formData.player1Score === formData.player2Score) {
      newErrors.general =
        "Tie games require special handling. Please specify a winner.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleQuickScore = (player: 1 | 2, increment: number) => {
    const field = player === 1 ? "player1Score" : "player2Score";
    const currentScore = parseInt(formData[field]) || 0;
    const newScore = Math.max(0, Math.min(10, currentScore + increment));
    handleInputChange(field, newScore.toString());
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = {
        player1_score: parseInt(formData.player1Score),
        player2_score: parseInt(formData.player2Score),
        winner_id:
          parseInt(formData.player1Score) > parseInt(formData.player2Score)
            ? demoMatch.player1.id
            : demoMatch.player2?.id,
        actual_start_time: formData.actualStartTime,
        actual_end_time: formData.actualEndTime || new Date().toISOString(),
        match_notes: formData.matchNotes,
        duration_minutes: formData.duration
          ? parseInt(formData.duration)
          : null,
        competitiveness_score: formData.competitivenessScore,
        status: "completed",
      };

      if (onSave) {
        onSave(demoMatch.id, result);
      }
    } catch (error) {
      console.error("Error saving match result:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDuration = () => {
    if (formData.actualStartTime) {
      const start = new Date(formData.actualStartTime);
      const end = new Date(formData.actualEndTime || new Date());
      const durationMs = end.getTime() - start.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));

      if (durationMinutes > 0) {
        handleInputChange("duration", durationMinutes.toString());
      }
    }
  };

  const getWinner = () => {
    const score1 = parseInt(formData.player1Score) || 0;
    const score2 = parseInt(formData.player2Score) || 0;

    if (score1 > score2) return demoMatch.player1;
    if (score2 > score1) return demoMatch.player2;
    return null;
  };

  const steps = [
    {
      label: "Score Entry",
      description: "Enter match scores",
      icon: <SportsScore />,
    },
    {
      label: "Match Details",
      description: "Additional information",
      icon: <Timer />,
    },
    {
      label: "Review & Save",
      description: "Confirm results",
      icon: <Save />,
    },
  ];

  if (!isVisible) return null;

  return (
    <Dialog
      open={isVisible}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "70vh" },
      }}
    >
      {/* Header */}
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <EmojiEvents sx={{ mr: 2, color: "warning.main" }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Match Result Entry
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Round {demoMatch.round_number} - Match {demoMatch.match_number}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={quickScoreMode}
                  onChange={(e) => setQuickScoreMode(e.target.checked)}
                  size="small"
                />
              }
              label="Quick Mode"
            />
            <Chip
              label={demoMatch.status.replace("_", " ").toUpperCase()}
              color="primary"
              size="small"
            />
            <IconButton onClick={onCancel}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Progress Stepper */}
        <Stepper
          activeStep={activeStep}
          orientation="horizontal"
          sx={{ mb: 4 }}
        >
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                icon={step.icon}
                onClick={() => setActiveStep(index)}
                sx={{ cursor: "pointer" }}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Score Entry */}
        {activeStep === 0 && (
          <Box>
            {quickScoreMode ? (
              /* Quick Score Mode */
              <Grid container spacing={4}>
                {[demoMatch.player1, demoMatch.player2].map((player, index) => (
                  <Grid item xs={12} md={6} key={player?.id || index}>
                    <Card
                      sx={{
                        border: "2px solid",
                        borderColor:
                          index === 0 ? "primary.main" : "secondary.main",
                        backgroundColor:
                          index === 0 ? "primary.light" : "secondary.light",
                        opacity: 0.9,
                      }}
                    >
                      <CardContent sx={{ textAlign: "center" }}>
                        <Avatar
                          sx={{
                            width: 64,
                            height: 64,
                            mx: "auto",
                            mb: 2,
                            bgcolor:
                              index === 0 ? "primary.main" : "secondary.main",
                            fontSize: "1.5rem",
                          }}
                        >
                          {player?.full_name?.charAt(0) || "?"}
                        </Avatar>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, mb: 1 }}
                        >
                          {player?.full_name || "TBD"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 3 }}
                        >
                          Level {player?.level || "-"}
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                          }}
                        >
                          <IconButton
                            onClick={() =>
                              handleQuickScore((index + 1) as 1 | 2, -1)
                            }
                            sx={{
                              bgcolor: "error.main",
                              color: "white",
                              "&:hover": { bgcolor: "error.dark" },
                            }}
                          >
                            <Remove />
                          </IconButton>

                          <Typography
                            variant="h2"
                            sx={{
                              fontWeight: 700,
                              minWidth: 80,
                              textAlign: "center",
                              color: "text.primary",
                            }}
                          >
                            {index === 0
                              ? formData.player1Score || "0"
                              : formData.player2Score || "0"}
                          </Typography>

                          <IconButton
                            onClick={() =>
                              handleQuickScore((index + 1) as 1 | 2, 1)
                            }
                            sx={{
                              bgcolor: "success.main",
                              color: "white",
                              "&:hover": { bgcolor: "success.dark" },
                            }}
                          >
                            <Add />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              /* Standard Score Mode */
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      border: "1px solid",
                      borderColor: "primary.main",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                        {demoMatch.player1.full_name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {demoMatch.player1.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Level {demoMatch.player1.level}
                        </Typography>
                      </Box>
                    </Box>
                    <TextField
                      label="Score"
                      type="number"
                      inputProps={{ min: 0, max: 10 }}
                      value={formData.player1Score}
                      onChange={(e) =>
                        handleInputChange("player1Score", e.target.value)
                      }
                      error={!!errors.player1Score}
                      helperText={errors.player1Score}
                      fullWidth
                      sx={{
                        "& .MuiInputBase-input": {
                          fontSize: "1.5rem",
                          textAlign: "center",
                          fontWeight: 700,
                        },
                      }}
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      border: "1px solid",
                      borderColor: "secondary.main",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: "secondary.main" }}>
                        {demoMatch.player2?.full_name?.charAt(0) || "?"}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {demoMatch.player2?.full_name || "TBD"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Level {demoMatch.player2?.level || "-"}
                        </Typography>
                      </Box>
                    </Box>
                    <TextField
                      label="Score"
                      type="number"
                      inputProps={{ min: 0, max: 10 }}
                      value={formData.player2Score}
                      onChange={(e) =>
                        handleInputChange("player2Score", e.target.value)
                      }
                      error={!!errors.player2Score}
                      helperText={errors.player2Score}
                      fullWidth
                      sx={{
                        "& .MuiInputBase-input": {
                          fontSize: "1.5rem",
                          textAlign: "center",
                          fontWeight: 700,
                        },
                      }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Winner Preview */}
            {formData.player1Score && formData.player2Score && (
              <Alert
                severity="success"
                sx={{ mt: 3, display: "flex", alignItems: "center" }}
                icon={<EmojiEvents />}
              >
                <Typography sx={{ fontWeight: 600 }}>
                  Winner: {getWinner()?.full_name || "Tie Game"}
                </Typography>
              </Alert>
            )}

            {/* General Errors */}
            {errors.general && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.general}
              </Alert>
            )}
          </Box>
        )}

        {/* Step 2: Match Details */}
        {activeStep === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Timing Information
              </Typography>

              <TextField
                label="Actual Start Time"
                type="datetime-local"
                value={
                  formData.actualStartTime
                    ? new Date(formData.actualStartTime)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  handleInputChange("actualStartTime", e.target.value)
                }
                fullWidth
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />

              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  label="Actual End Time"
                  type="datetime-local"
                  value={
                    formData.actualEndTime
                      ? new Date(formData.actualEndTime)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    handleInputChange("actualEndTime", e.target.value)
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  variant="outlined"
                  onClick={() =>
                    handleInputChange("actualEndTime", new Date().toISOString())
                  }
                  sx={{ minWidth: "auto", px: 2 }}
                >
                  Now
                </Button>
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  label="Duration (minutes)"
                  type="number"
                  inputProps={{ min: 1, max: 120 }}
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange("duration", e.target.value)
                  }
                  fullWidth
                />
                <Button
                  variant="outlined"
                  onClick={calculateDuration}
                  startIcon={<RestartAlt />}
                  sx={{ minWidth: "auto", px: 2 }}
                >
                  Calc
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Match Quality
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Competitiveness Score: {formData.competitivenessScore}/10
                </Typography>
                <Slider
                  value={formData.competitivenessScore}
                  onChange={(_, value) =>
                    handleInputChange("competitivenessScore", value as number)
                  }
                  min={1}
                  max={10}
                  marks
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="text.secondary">
                  Rate how competitive and engaging this match was
                </Typography>
              </Box>

              <TextField
                label="Match Notes"
                multiline
                rows={4}
                value={formData.matchNotes}
                onChange={(e) =>
                  handleInputChange("matchNotes", e.target.value)
                }
                placeholder="Optional notes about the match (highlights, issues, etc.)"
                fullWidth
              />
            </Grid>
          </Grid>
        )}

        {/* Step 3: Review & Save */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Review Match Result
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    border: "1px solid",
                    borderColor: "warning.main",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Final Score
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">
                      {demoMatch.player1.full_name}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {formData.player1Score}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="h6">
                      {demoMatch.player2?.full_name || "TBD"}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {formData.player2Score}
                    </Typography>
                  </Box>

                  {getWinner() && (
                    <Alert
                      severity="success"
                      sx={{ mt: 2 }}
                      icon={<EmojiEvents />}
                    >
                      Winner: {getWinner()?.full_name}
                    </Alert>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Match Details
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Duration:
                    </Typography>
                    <Typography variant="body2">
                      {formData.duration || "Not set"} minutes
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Competitiveness:
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Rating
                        value={formData.competitivenessScore / 2}
                        readOnly
                        size="small"
                      />
                      <Typography variant="body2">
                        {formData.competitivenessScore}/10
                      </Typography>
                    </Box>
                  </Box>

                  {formData.matchNotes && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Notes:
                      </Typography>
                      <Paper sx={{ p: 1, backgroundColor: "grey.50" }}>
                        <Typography variant="body2">
                          {formData.matchNotes}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      {/* Navigation */}
      <DialogActions sx={{ justifyContent: "space-between", p: 3 }}>
        <Box>
          {activeStep > 0 && (
            <Button
              onClick={() => setActiveStep(activeStep - 1)}
              startIcon={<ArrowBack />}
            >
              Previous
            </Button>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onCancel}>Cancel</Button>

          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => {
                if (activeStep === 0 && !validateForm()) return;
                setActiveStep(activeStep + 1);
              }}
              endIcon={<ArrowForward />}
              disabled={
                activeStep === 0 &&
                (!formData.player1Score || !formData.player2Score)
              }
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={<Save />}
            >
              {isSubmitting ? "Saving..." : "Save Result"}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ScoreInputInterface;
