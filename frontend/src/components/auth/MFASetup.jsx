import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  Security, 
  Smartphone, 
  Fingerprint, 
  QrCode, 
  CheckCircle,
  VpnKey
} from '@mui/icons-material';

const MFASetup = ({ onComplete, onCancel }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [mfaData, setMfaData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupMethod, setSetupMethod] = useState(''); // 'totp' or 'webauthn'

  const steps = ['Choose Method', 'Setup Authentication', 'Verify & Complete'];

  useEffect(() => {
    // Auto-focus verification input when step changes
    if (activeStep === 2) {
      const input = document.getElementById('verification-code');
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
    }
  }, [activeStep]);

  const setupTOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/mfa/setup-totp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to setup TOTP');
      }

      const data = await response.json();
      setMfaData(data);
      setActiveStep(1);
    } catch (err) {
      setError('Failed to setup TOTP authenticator. Please try again.');
      console.error('TOTP setup error:', err);
    }
    
    setLoading(false);
  };

  const setupWebAuthn = async () => {
    setLoading(true);
    setError('');

    try {
      // Check WebAuthn support
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported in this browser');
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/mfa/setup-webauthn', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get WebAuthn options');
      }

      const options = await response.json();
      
      // Convert base64 challenge to ArrayBuffer
      const challengeBuffer = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0));
      const userIdBuffer = Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0));
      
      const credentialCreationOptions = {
        ...options,
        challenge: challengeBuffer,
        user: {
          ...options.user,
          id: userIdBuffer
        }
      };

      const credential = await navigator.credentials.create({
        publicKey: credentialCreationOptions
      });

      if (credential) {
        // Send credential to server for verification
        const credentialJson = {
          id: credential.id,
          rawId: Array.from(new Uint8Array(credential.rawId)),
          response: {
            attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
            clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
          },
          type: credential.type
        };

        const verifyResponse = await fetch('/api/auth/mfa/verify-webauthn-setup', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ credential: credentialJson })
        });

        if (verifyResponse.ok) {
          setActiveStep(2);
          setMfaData({ method: 'webauthn', success: true });
        } else {
          throw new Error('Failed to verify WebAuthn credential');
        }
      }
    } catch (err) {
      setError(`WebAuthn setup failed: ${err.message}`);
      console.error('WebAuthn setup error:', err);
    }
    
    setLoading(false);
  };

  const verifySetup = async () => {
    if (setupMethod === 'webauthn') {
      // WebAuthn already verified
      await completeMFASetup();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/mfa/verify-totp-setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret: mfaData.secret,
          code: verificationCode
        })
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      await completeMFASetup();
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    }

    setLoading(false);
  };

  const completeMFASetup = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ method: setupMethod })
      });

      if (response.ok) {
        setActiveStep(2);
        setTimeout(() => {
          onComplete && onComplete();
        }, 2000);
      }
    } catch (err) {
      setError('Failed to complete MFA setup');
    }
  };

  const chooseMethod = (method) => {
    setSetupMethod(method);
    if (method === 'totp') {
      setupTOTP();
    } else {
      setupWebAuthn();
    }
  };

  return (
    <Box sx={{ maxWidth: 600, margin: '0 auto', p: 3 }}>
      <Paper elevation={8} sx={{ p: 4, borderRadius: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Security sx={{ fontSize: 60, color: '#10b981', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Enable Two-Factor Authentication
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add an extra layer of security to your account
          </Typography>
        </Box>

        {/* Progress Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
              Choose Your Authentication Method
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => chooseMethod('totp')}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Smartphone sx={{ fontSize: 50, color: '#10b981', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Authenticator App
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use Google Authenticator, Authy, or similar apps
                    </Typography>
                    <Chip 
                      label="Recommended" 
                      color="primary" 
                      size="small" 
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => chooseMethod('webauthn')}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Fingerprint sx={{ fontSize: 50, color: '#3b82f6', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Biometric / Security Key
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use fingerprint, Face ID, or hardware security key
                    </Typography>
                    <Chip 
                      label="Modern" 
                      color="secondary" 
                      size="small" 
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TOTP Setup */}
        {activeStep === 1 && setupMethod === 'totp' && mfaData && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
              Scan QR Code with Your Authenticator App
            </Typography>
            
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <img 
                src={mfaData.qr_code} 
                alt="MFA QR Code" 
                style={{ 
                  maxWidth: '250px',
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '16px',
                  background: 'white'
                }}
              />
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Instructions:</strong>
                <br />1. Open your authenticator app (Google Authenticator, Authy, etc.)
                <br />2. Tap "Add Account" or "+"
                <br />3. Scan this QR code
                <br />4. Enter the 6-digit code to verify setup
              </Typography>
            </Alert>

            <Typography variant="h6" sx={{ mb: 2 }}>
              🔑 Backup Codes
            </Typography>
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                Save these backup codes in a safe place. You can use them if you lose access to your authenticator app:
              </Typography>
              <Grid container spacing={1}>
                {mfaData.backup_codes?.map((code, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        p: 1,
                        bgcolor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: 1
                      }}
                    >
                      {code}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => setActiveStep(2)}
              sx={{ mt: 2 }}
            >
              I've Scanned the QR Code - Continue
            </Button>
          </Box>
        )}

        {/* WebAuthn Setup */}
        {activeStep === 1 && setupMethod === 'webauthn' && (
          <Box sx={{ textAlign: 'center' }}>
            <Fingerprint sx={{ fontSize: 80, color: '#3b82f6', mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Setting up Biometric Authentication
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Follow your device's prompts to register your fingerprint, Face ID, or security key
            </Typography>
            {loading && <CircularProgress sx={{ color: '#3b82f6' }} />}
          </Box>
        )}

        {/* Verification Step */}
        {activeStep === 2 && setupMethod === 'totp' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
              Verify Your Setup
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
              Enter the 6-digit code from your authenticator app:
            </Typography>
            
            <TextField
              id="verification-code"
              fullWidth
              label="6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              inputProps={{ 
                maxLength: 6,
                style: { 
                  textAlign: 'center', 
                  fontSize: '24px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5em'
                }
              }}
              sx={{ mb: 3 }}
              placeholder="123456"
            />
            
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={verifySetup}
              disabled={verificationCode.length !== 6 || loading}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669, #2563eb)',
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify & Complete Setup'}
            </Button>
          </Box>
        )}

        {/* Success State */}
        {activeStep === 2 && setupMethod === 'webauthn' && mfaData?.success && (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: '#10b981', mb: 3 }} />
            <Typography variant="h5" sx={{ color: '#10b981', fontWeight: 600, mb: 2 }}>
              MFA Successfully Enabled! 🎉
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Your account is now protected with biometric authentication.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={onComplete}
              sx={{
                background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                px: 4,
                py: 1.5
              }}
            >
              Complete Setup
            </Button>
          </Box>
        )}

        {/* Navigation Buttons */}
        {activeStep < 2 && !loading && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={activeStep === 0 ? onCancel : () => setActiveStep(activeStep - 1)}
              disabled={loading}
            >
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            
            {activeStep === 1 && setupMethod === 'totp' && (
              <Button
                variant="outlined"
                onClick={() => setActiveStep(2)}
              >
                Skip to Verification
              </Button>
            )}
          </Box>
        )}

        {/* Help Text */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          🔐 Two-factor authentication significantly improves your account security
        </Typography>
      </Paper>
    </Box>
  );
};

export default MFASetup;