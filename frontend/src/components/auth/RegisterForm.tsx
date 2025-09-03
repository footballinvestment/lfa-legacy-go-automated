// === frontend/src/components/auth/RegisterForm.tsx ===
// TELJES MUNKÁLÓ REGISZTRÁCIÓS FORM - full_name mezővel

import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock,
  AccountCircle,
} from "@mui/icons-material";
import { useSafeAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PasswordStrengthMeter from './PasswordStrengthMeter';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

// ✅ JAVÍTOTT: Form state with full_name
interface FormData {
  username: string;
  email: string;
  full_name: string; // ✅ KÖTELEZŐ MEZŐ
  password: string;
  confirmPassword: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register, state } = useSafeAuth();
  const navigate = useNavigate();

  // ✅ JAVÍTOTT: Form state
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    full_name: "", // ✅ HOZZÁADVA
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [passwordValid, setPasswordValid] = useState(false);

  // ✅ JAVÍTOTT: Form validation
  const validateForm = (): string | null => {
    if (!formData.username.trim()) {
      return "Username is required";
    }
    if (formData.username.length < 3) {
      return "Username must be at least 3 characters long";
    }
    if (!formData.email.trim()) {
      return "Email is required";
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return "Email is invalid";
    }
    if (!formData.full_name.trim()) {
      // ✅ VALIDÁCIÓ
      return "Full name is required";
    }
    if (formData.full_name.length < 2) {
      return "Full name must be at least 2 characters long";
    }
    if (!formData.password) {
      return "Password is required";
    }
    if (formData.password.length < 12) {
      return "Password must be at least 12 characters long";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  const handleInputChange =
    (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
      // Clear errors when user starts typing
      if (localError) setLocalError(null);
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Clear previous errors
    setLocalError(null);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      // ✅ JAVÍTOTT: Send full_name to backend
      const success = await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim(), // ✅ KÜLDÉS
        password: formData.password,
      });

      if (success) {
        console.log("✅ Registration successful!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("❌ Registration failed:", error);
      setLocalError("Registration failed. Please try again.");
    }
  };

  const displayError = localError || state.error;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          padding: 4,
          maxWidth: 500,
          width: "100%",
          borderRadius: 3,
          background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
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
          <Typography variant="h6" color="text.secondary">
            Create your account
          </Typography>
        </Box>

        {/* Error Alert */}
        {displayError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {displayError}
          </Alert>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Username Field */}
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={formData.username}
              onChange={handleInputChange("username")}
              required
              inputProps={{
                minLength: 3,
                maxLength: 50,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
              helperText="Choose a unique username (3-50 characters)"
            />

            {/* Email Field */}
            <TextField
              fullWidth
              label="Email"
              type="email"
              variant="outlined"
              value={formData.email}
              onChange={handleInputChange("email")}
              required
              inputProps={{
                maxLength: 100,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              helperText="We'll use this for important notifications"
            />

            {/* ✅ FULL NAME FIELD - KÖTELEZŐ */}
            <TextField
              fullWidth
              label="Full Name"
              variant="outlined"
              value={formData.full_name}
              onChange={handleInputChange("full_name")}
              required
              inputProps={{
                minLength: 2,
                maxLength: 100,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle color="action" />
                  </InputAdornment>
                ),
              }}
              helperText="Enter your real name as it will appear on your profile"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: "#10b981",
                  },
                },
              }}
            />

            {/* Password Field */}
            <Box>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                value={formData.password}
                onChange={handleInputChange("password")}
                required
                inputProps={{
                  minLength: 12,
                  maxLength: 100,
                }}
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
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="Minimum 12 characters (NIST 2024 standard)"
              />
              <PasswordStrengthMeter 
                password={formData.password}
                onValidationChange={setPasswordValid}
              />
            </Box>

            {/* Confirm Password Field */}
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              variant="outlined"
              value={formData.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              required
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
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Must match your password"
              error={
                formData.confirmPassword !== "" &&
                formData.password !== formData.confirmPassword
              }
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={state.loading || !passwordValid}
              sx={{
                mt: 2,
                py: 1.5,
                background: "linear-gradient(135deg, #10b981, #3b82f6)",
                "&:hover": {
                  background: "linear-gradient(135deg, #059669, #2563eb)",
                },
                "&:disabled": {
                  background: "#e0e0e0",
                },
              }}
            >
              {state.loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Creating Account...
                </Box>
              ) : (
                "Create Account"
              )}
            </Button>
          </Box>
        </form>

        {/* Login Link */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <Link
              component="button"
              variant="body2"
              onClick={onSwitchToLogin || (() => navigate("/login"))}
              sx={{
                color: "#10b981",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Sign In
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterForm;
