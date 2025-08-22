import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Chip,
  CircularProgress,
  InputAdornment,
  Fade,
  Zoom,
} from "@mui/material";
import {
  LocalOffer,
  Check,
  Error as ErrorIcon,
  Redeem,
} from "@mui/icons-material";
import { creditService, CouponRedemptionResponse } from "../../services/api";

interface CouponRedemptionProps {
  onSuccess?: (response: CouponRedemptionResponse) => void;
  onBalanceUpdate?: (newBalance: number) => void;
}

const CouponRedemption: React.FC<CouponRedemptionProps> = ({
  onSuccess,
  onBalanceUpdate,
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<CouponRedemptionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await creditService.redeemCoupon(
        couponCode.trim().toUpperCase()
      );

      setSuccess(response);
      setCouponCode("");

      // Call callbacks
      if (onSuccess) {
        onSuccess(response);
      }
      if (onBalanceUpdate) {
        onBalanceUpdate(response.new_balance);
      }

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message || "Failed to redeem coupon");
    } finally {
      setLoading(false);
    }
  };

  const validateCouponCode = async (code: string) => {
    if (!code.trim() || code.length < 3) return;

    setValidating(true);
    try {
      const validation = await creditService.validateCoupon(
        code.trim().toUpperCase()
      );
      if (!validation.valid && validation.message) {
        setError(validation.message);
      } else {
        setError(null);
      }
    } catch (err) {
      // Ignore validation errors to avoid spam
    } finally {
      setValidating(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCouponCode(value);
    setError(null);
    setSuccess(null);

    // Debounced validation
    const timeoutId = setTimeout(() => {
      validateCouponCode(value);
    }, 800);

    return () => clearTimeout(timeoutId);
  };

  return (
    <Card sx={{ maxWidth: 500, mx: "auto" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <LocalOffer color="primary" />
          <Typography variant="h6" component="h2" fontWeight="bold">
            Redeem Coupon
          </Typography>
        </Box>

        {success && (
          <Zoom in>
            <Alert severity="success" sx={{ mb: 3 }} icon={<Check />}>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {success.coupon_name} Redeemed!
                </Typography>
                <Typography variant="body2">{success.message}</Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={`+${success.credits_awarded} Credits`}
                    color="success"
                    size="small"
                    icon={<Redeem />}
                  />
                  <Chip
                    label={`Balance: ${success.new_balance}`}
                    color="primary"
                    size="small"
                  />
                </Box>
              </Box>
            </Alert>
          </Zoom>
        )}

        {error && (
          <Fade in>
            <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
              {error}
            </Alert>
          </Fade>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Coupon Code"
            value={couponCode}
            onChange={handleCodeChange}
            placeholder="Enter coupon code (e.g., WELCOME50)"
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocalOffer color="action" />
                </InputAdornment>
              ),
              endAdornment: validating && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
            helperText="Enter your coupon code to get free credits"
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !couponCode.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <Redeem />}
            sx={{
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: "bold",
            }}
          >
            {loading ? "Redeeming..." : "Redeem Coupon"}
          </Button>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            💡 <strong>Tip:</strong> Coupon codes are case-insensitive and can
            include letters and numbers.
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 0.5 }}
          >
            🎁 Look for special coupon codes in tournaments, newsletters, and
            social media!
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CouponRedemption;
