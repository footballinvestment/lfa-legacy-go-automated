// src/components/auth/AuthForm.tsx
// LFA Legacy GO - Modern Authentication Forms

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Alert,
  IconButton,
  InputAdornment,
  Fade,
  CircularProgress,
  Divider,
  Link,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  SportsSoccer,
  Email,
  Person,
  Lock,
  Login as LoginIcon,
  PersonAdd,
} from "@mui/icons-material";
import { useAuthForm } from "../../contexts/AuthContext";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const AuthForm: React.FC = () => {
  const {
    formData,
    handleInputChange,
    handleLogin,
    handleRegister,
    resetForm,
    isLoading,
    error,
    clearError,
  } = useAuthForm();

  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    resetForm();
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!formData.password.trim()) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    // Registration-specific validation
    if (activeTab === 1) {
      if (!formData.full_name.trim()) {
        errors.full_name = "Full name is required";
      }

      if (!formData.email.trim()) {
        errors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Please enter a valid email address";
      }

      if (!formData.confirmPassword.trim()) {
        errors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    let success = false;
    if (activeTab === 0) {
      success = await handleLogin();
    } else {
      success = await handleRegister();
    }

    if (success) {
      // Redirect will be handled by AuthContext
      window.location.href = "/dashboard";
    }
  };

  const handleInputChangeWrapper =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      handleInputChange(field, event.target.value);

      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 450,
          width: "100%",
          borderRadius: 3,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          background: "linear-gradient(145deg, #1e293b, #334155)",
          border: "1px solid rgba(71, 85, 105, 0.3)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                mb: 2,
              }}
            >
              <SportsSoccer sx={{ fontSize: 32, color: "white" }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(135deg, #10b981, #3b82f6)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
              }}
            >
              LFA Legacy GO
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your Football Gaming Platform
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Fade in={Boolean(error)}>
              <Alert
                severity="error"
                onClose={clearError}
                sx={{ mb: 3, borderRadius: 2 }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              mb: 2,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                fontSize: "1rem",
              },
            }}
          >
            <Tab
              icon={<LoginIcon />}
              iconPosition="start"
              label="Login"
              disabled={isLoading}
            />
            <Tab
              icon={<PersonAdd />}
              iconPosition="start"
              label="Register"
              disabled={isLoading}
            />
          </Tabs>

          {/* Forms */}
          <form onSubmit={handleSubmit}>
            {/* Login Form */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  label="Username"
                  value={formData.username}
                  onChange={handleInputChangeWrapper("username")}
                  error={Boolean(validationErrors.username)}
                  helperText={validationErrors.username}
                  disabled={isLoading}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChangeWrapper("password")}
                  error={Boolean(validationErrors.password)}
                  helperText={validationErrors.password}
                  disabled={isLoading}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </TabPanel>

            {/* Register Form */}
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  label="Full Name"
                  value={formData.full_name}
                  onChange={handleInputChangeWrapper("full_name")}
                  error={Boolean(validationErrors.full_name)}
                  helperText={validationErrors.full_name}
                  disabled={isLoading}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Username"
                  value={formData.username}
                  onChange={handleInputChangeWrapper("username")}
                  error={Boolean(validationErrors.username)}
                  helperText={validationErrors.username}
                  disabled={isLoading}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChangeWrapper("email")}
                  error={Boolean(validationErrors.email)}
                  helperText={validationErrors.email}
                  disabled={isLoading}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChangeWrapper("password")}
                  error={Boolean(validationErrors.password)}
                  helperText={validationErrors.password}
                  disabled={isLoading}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChangeWrapper("confirmPassword")}
                  error={Boolean(validationErrors.confirmPassword)}
                  helperText={validationErrors.confirmPassword}
                  disabled={isLoading}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={isLoading}
                          edge="end"
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </TabPanel>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoading}
              sx={{
                mt: 3,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                background: "linear-gradient(135deg, #10b981, #059669)",
                "&:hover": {
                  background: "linear-gradient(135deg, #059669, #047857)",
                  transform: "translateY(-1px)",
                },
                "&:disabled": {
                  background: "rgba(16, 185, 129, 0.3)",
                },
              }}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : activeTab === 0 ? (
                  <LoginIcon />
                ) : (
                  <PersonAdd />
                )
              }
            >
              {isLoading
                ? activeTab === 0
                  ? "Signing In..."
                  : "Creating Account..."
                : activeTab === 0
                ? "Sign In"
                : "Create Account"}
            </Button>
          </form>

          {/* Footer */}
          <Divider sx={{ my: 3 }} />
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 0
                ? "Don't have an account? "
                : "Already have an account? "}
              <Link
                component="button"
                type="button"
                onClick={() =>
                  handleTabChange(
                    {} as React.SyntheticEvent,
                    activeTab === 0 ? 1 : 0
                  )
                }
                disabled={isLoading}
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                {activeTab === 0 ? "Sign Up" : "Sign In"}
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthForm;
