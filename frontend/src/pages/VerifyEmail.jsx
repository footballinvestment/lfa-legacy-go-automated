import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, CircularProgress, Box } from '@mui/material';
import { CheckCircle, Error, Email } from '@mui/icons-material';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link - no token provided');
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        setUserEmail(data.email || '');
      } else {
        setStatus('error');
        setMessage(data.detail || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error occurred while verifying email');
    }
  };

  const handleResendEmail = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Please log in to resend verification email');
        return;
      }

      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setMessage('New verification email sent! Please check your inbox.');
      } else {
        const data = await response.json();
        setMessage(data.detail || 'Failed to send verification email');
      }
    } catch (error) {
      setMessage('Failed to send verification email');
    }
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Paper 
        elevation={8} 
        style={{ 
          padding: '40px', 
          textAlign: 'center',
          borderRadius: '12px',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
        }}
      >
        {status === 'verifying' && (
          <>
            <CircularProgress size={60} sx={{ color: '#10b981' }} />
            <Typography variant="h5" style={{ marginTop: '20px', fontWeight: 600 }}>
              Verifying your email...
            </Typography>
            <Typography variant="body1" style={{ marginTop: '10px', color: '#666' }}>
              Please wait while we verify your email address
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle style={{ fontSize: 80, color: '#10b981', marginBottom: '16px' }} />
            <Typography variant="h4" style={{ marginTop: '20px', color: '#10b981', fontWeight: 700 }}>
              Email Verified! 🎉
            </Typography>
            <Typography variant="body1" style={{ marginTop: '16px', fontSize: '18px' }}>
              {message}
            </Typography>
            {userEmail && (
              <Typography variant="body2" style={{ marginTop: '8px', color: '#666' }}>
                Verified: {userEmail}
              </Typography>
            )}
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/dashboard')}
                sx={{
                  background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669, #2563eb)',
                  },
                  px: 4,
                  py: 1.5,
                  mr: 2
                }}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/profile')}
                sx={{ 
                  borderColor: '#10b981', 
                  color: '#10b981',
                  px: 4,
                  py: 1.5
                }}
              >
                View Profile
              </Button>
            </Box>
          </>
        )}

        {status === 'error' && (
          <>
            <Error style={{ fontSize: 80, color: '#f44336', marginBottom: '16px' }} />
            <Typography variant="h4" style={{ marginTop: '20px', color: '#f44336', fontWeight: 700 }}>
              Verification Failed
            </Typography>
            <Typography variant="body1" style={{ marginTop: '16px', fontSize: '16px' }}>
              {message}
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleResendEmail}
                startIcon={<Email />}
                sx={{
                  background: '#f44336',
                  '&:hover': {
                    background: '#d32f2f',
                  },
                  px: 4,
                  py: 1.5,
                  mr: 2
                }}
              >
                Resend Email
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ px: 4, py: 1.5 }}
              >
                Back to Login
              </Button>
            </Box>
          </>
        )}

        <Typography 
          variant="caption" 
          style={{ 
            display: 'block', 
            marginTop: '30px', 
            color: '#888',
            fontSize: '12px'
          }}
        >
          🔐 Enhanced security with NIST 2024 compliance
        </Typography>
      </Paper>
    </Container>
  );
};

export default VerifyEmail;