import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';

interface MFASetupProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MFAResponse {
  success: boolean;
  secret?: string;
  qr_code_url?: string;
  backup_codes?: string[];
  message?: string;
}

const MFASetup: React.FC<MFASetupProps> = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const steps = ['Setup Authenticator', 'Verify Code', 'Save Backup Codes'];

  const setupMFA = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        'https://lfa-legacy-go-backend-376491487980.us-central1.run.app/api/auth/mfa/setup-totp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({})
        }
      );

      const data: MFAResponse = await response.json();

      if (data.success && data.qr_code_url && data.secret) {
        setQrCodeUrl(data.qr_code_url);
        setSecret(data.secret);
        setActiveStep(1);
      } else {
        setError(data.message || 'Failed to setup MFA');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        'https://lfa-legacy-go-backend-376491487980.us-central1.run.app/api/auth/mfa/verify-setup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ code: verificationCode })
        }
      );

      const data: MFAResponse = await response.json();

      if (data.success) {
        setBackupCodes(data.backup_codes || []);
        setActiveStep(2);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = () => {
    if (!qrCodeUrl) return null;

    // Use a QR code generation service
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`;
    
    return (
      <Box sx={{ textAlign: 'center', my: 2 }}>
        <img 
          src={qrImageUrl} 
          alt="QR Code for authenticator setup"
          style={{ maxWidth: '200px', height: 'auto' }}
        />
      </Box>
    );
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
    setActiveStep(0);
    setQrCodeUrl('');
    setSecret('');
    setVerificationCode('');
    setBackupCodes([]);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Set up two-factor authentication using an authenticator app like Google Authenticator or Authy.
            </Typography>
            
            {qrCodeUrl && (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  1. Scan this QR code with your authenticator app:
                </Typography>
                {generateQRCode()}
                
                <Typography variant="h6" sx={{ mb: 1 }}>
                  2. Or manually enter this secret key:
                </Typography>
                <TextField
                  fullWidth
                  value={secret}
                  variant="outlined"
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
                
                <Button 
                  variant="contained" 
                  onClick={() => setActiveStep(1)}
                  disabled={loading}
                >
                  I've Added the Account
                </Button>
              </>
            )}
            
            {!qrCodeUrl && (
              <Button 
                variant="contained" 
                onClick={setupMFA}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Setup Two-Factor Authentication'}
              </Button>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Enter the 6-digit code from your authenticator app to verify the setup:
            </Typography>
            
            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              variant="outlined"
              size="small"
              placeholder="123456"
              sx={{ mb: 2 }}
            />
            
            <Button 
              variant="contained" 
              onClick={verifyMFA}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify Code'}
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Two-Factor Authentication Enabled Successfully!
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              Please save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device:
            </Typography>
            
            <Box sx={{ 
              backgroundColor: '#f5f5f5', 
              p: 2, 
              borderRadius: 1, 
              mb: 2,
              fontFamily: 'monospace' 
            }}>
              {backupCodes.map((code, index) => (
                <Typography key={index} variant="body2">
                  {code}
                </Typography>
              ))}
            </Box>
            
            <Button 
              variant="contained" 
              onClick={handleComplete}
              color="success"
            >
              I've Saved My Backup Codes
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Two-Factor Authentication Setup
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MFASetup;