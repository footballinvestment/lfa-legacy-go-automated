import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  Security, 
  Fingerprint, 
  VpnKey,
  ArrowBack
} from '@mui/icons-material';

const MFAVerification = ({ 
  userInfo, 
  mfaMethod, 
  onVerificationSuccess, 
  onGoBack 
}) => {
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const input = document.getElementById('mfa-code-input');
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
  }, []);

  const verifyMFA = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('temp_token') || localStorage.getItem('auth_token');
      
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: mfaCode,
          method: mfaMethod
        })
      });

      if (!response.ok) {
        throw new Error('Invalid MFA code');
      }

      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.removeItem('temp_token');
        onVerificationSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'MFA verification failed');
    }

    setLoading(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && mfaCode.length >= 6 && !loading) {
      verifyMFA();
    }
  };

  return (
    <Box sx={{ maxWidth: 450, margin: '0 auto', p: 3 }}>
      <Paper elevation={8} sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {mfaMethod === 'totp' ? (
            <VpnKey sx={{ fontSize: 60, color: '#10b981', mb: 2 }} />
          ) : (
            <Fingerprint sx={{ fontSize: 60, color: '#3b82f6', mb: 2 }} />
          )}
          
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Two-Factor Authentication
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            Welcome back, {userInfo?.username}! 
            {mfaMethod === 'totp' 
              ? ' Please enter your 6-digit authentication code.'
              : ' Please use your biometric authentication.'
            }
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {mfaMethod === 'totp' ? (
          <>
            <TextField
              id="mfa-code-input"
              fullWidth
              label="Authentication Code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              onKeyPress={handleKeyPress}
              inputProps={{ 
                maxLength: 8,
                style: { 
                  textAlign: 'center', 
                  fontSize: '24px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.3em'
                }
              }}
              sx={{ mb: 3 }}
              placeholder="123456"
              disabled={loading}
              helperText="Enter code from your authenticator app or backup code"
            />
            
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={verifyMFA}
              disabled={mfaCode.length < 6 || loading}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669, #2563eb)',
                },
                mb: 2
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify Code'}
            </Button>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Touch your device's sensor or use your security key
            </Typography>
            {loading && <CircularProgress sx={{ color: '#3b82f6' }} />}
            <Button
              variant="outlined"
              onClick={() => {
                // Trigger WebAuthn authentication
                // This would call the WebAuthn API
              }}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Use Biometric Authentication
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />
        
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          onClick={onGoBack}
          disabled={loading}
          fullWidth
        >
          Back to Login
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          🔐 Secure authentication powered by industry standards
        </Typography>
      </Paper>
    </Box>
  );
};

export default MFAVerification;