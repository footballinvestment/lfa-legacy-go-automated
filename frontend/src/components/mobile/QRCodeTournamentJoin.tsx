import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Slide,
  Fade,
  useTheme,
  Container,
} from '@mui/material';
import {
  QrCode,
  QrCodeScanner,
  Close,
  Share,
  Download,
  ContentCopy,
  CheckCircle,
  Error,
  CameraAlt,
  PhotoLibrary,
  FlashOn,
  FlashOff,
  Refresh,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { Tournament } from '../../types/tournament';
import { useSafeAuth } from '../../SafeAuthContext';
import useMobileViewport from '../../hooks/useMobileViewport';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface QRCodeData {
  type: 'tournament_invite';
  tournamentId: number;
  tournamentName: string;
  organizerName: string;
  startDate: string;
  location: string;
  entryFee: number;
  joinUrl: string;
  expiresAt: string;
  inviteCode: string;
}

interface QRCodeTournamentJoinProps {
  open: boolean;
  onClose: () => void;
  mode: 'generate' | 'scan';
  tournament?: Tournament;
  onJoinTournament?: (tournamentId: number, inviteCode: string) => Promise<void>;
  onShareQRCode?: (tournament: Tournament, qrCodeUrl: string) => void;
}

const QRCodeTournamentJoin: React.FC<QRCodeTournamentJoinProps> = ({
  open,
  onClose,
  mode,
  tournament,
  onJoinTournament,
  onShareQRCode
}) => {
  const theme = useTheme();
  const { user } = useSafeAuth();
  const { viewport, isSmallScreen } = useMobileViewport();
  
  // QR Code generation state
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // QR Code scanning state
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<QRCodeData | null>(null);
  const [scanError, setScanError] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [processingJoin, setProcessingJoin] = useState(false);
  
  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate QR code data
  const generateQRData = useCallback((tournament: Tournament): QRCodeData => {
    const inviteCode = generateInviteCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    
    return {
      type: 'tournament_invite',
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      organizerName: tournament.organizerName,
      startDate: tournament.startDate,
      location: tournament.location,
      entryFee: tournament.entryFee,
      joinUrl: `${window.location.origin}/tournaments/${tournament.id}/join?invite=${inviteCode}`,
      expiresAt,
      inviteCode
    };
  }, []);

  // Generate invite code
  const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Generate QR code using a library (mock implementation)
  const generateQRCode = useCallback(async (data: QRCodeData): Promise<string> => {
    setGeneratingCode(true);
    
    try {
      // In a real implementation, you would use a QR code library like 'qrcode'
      // For now, we'll simulate the QR code generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dataString = JSON.stringify(data);
      
      // Mock QR code URL - in production, use a real QR code library
      const qrCodeUrl = `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="white"/>
          <rect x="20" y="20" width="160" height="160" fill="none" stroke="black" stroke-width="2"/>
          <text x="100" y="100" text-anchor="middle" fill="black" font-family="monospace" font-size="12">
            QR Code
          </text>
          <text x="100" y="120" text-anchor="middle" fill="black" font-family="monospace" font-size="8">
            ${data.tournamentName}
          </text>
        </svg>
      `)}`;
      
      return qrCodeUrl;
    } finally {
      setGeneratingCode(false);
    }
  }, []);

  // Initialize camera for scanning
  const initializeCamera = useCallback(async () => {
    try {
      setScanError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      setCameraPermission('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Start scanning
        startQRScanning();
      }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setCameraPermission('denied');
      setScanError('Camera access denied. Please enable camera permissions and try again.');
    }
  }, []);

  // Start QR code scanning
  const startQRScanning = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setScanning(true);
    
    scanIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context || video.videoWidth === 0) return;
      
      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data for QR scanning
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // In a real implementation, you would use a QR code scanning library here
      // For now, we'll simulate successful scanning after a few seconds
      if (!scannedData) {
        setTimeout(() => {
          const mockScannedData: QRCodeData = {
            type: 'tournament_invite',
            tournamentId: 1,
            tournamentName: 'Mock Tournament',
            organizerName: 'Mock Organizer',
            startDate: new Date().toISOString(),
            location: 'Mock Location',
            entryFee: 25,
            joinUrl: `${window.location.origin}/tournaments/1/join?invite=MOCK1234`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            inviteCode: 'MOCK1234'
          };
          
          setScannedData(mockScannedData);
          stopScanning();
        }, 3000);
      }
    }, 100);
  }, [scannedData]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    setScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Toggle flash (if supported)
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;
    
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any; // Type assertion for torch capability
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      }
    } catch (error) {
      console.error('Flash toggle failed:', error);
    }
  }, [flashEnabled]);

  // Copy QR code URL to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!qrData) return;
    
    try {
      await navigator.clipboard.writeText(qrData.joinUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
    }
  }, [qrData]);

  // Share QR code
  const shareQRCode = useCallback(async () => {
    if (!tournament || !qrCodeUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${tournament.name}`,
          text: `Join the tournament: ${tournament.name}`,
          url: qrData?.joinUrl
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      onShareQRCode?.(tournament, qrCodeUrl);
    }
  }, [tournament, qrCodeUrl, qrData, onShareQRCode]);

  // Join tournament from scanned QR
  const joinFromQR = useCallback(async () => {
    if (!scannedData || !onJoinTournament) return;
    
    setProcessingJoin(true);
    
    try {
      await onJoinTournament(scannedData.tournamentId, scannedData.inviteCode);
      onClose();
    } catch (error) {
      setScanError('Failed to join tournament. Please try again.');
    } finally {
      setProcessingJoin(false);
    }
  }, [scannedData, onJoinTournament, onClose]);

  // Generate QR code when component opens in generate mode
  useEffect(() => {
    if (open && mode === 'generate' && tournament && !qrData) {
      const data = generateQRData(tournament);
      setQrData(data);
      
      generateQRCode(data).then(url => {
        setQrCodeUrl(url);
      });
    }
  }, [open, mode, tournament, qrData, generateQRData, generateQRCode]);

  // Initialize camera when component opens in scan mode
  useEffect(() => {
    if (open && mode === 'scan') {
      initializeCamera();
    }
    
    return () => {
      if (mode === 'scan') {
        stopScanning();
      }
    };
  }, [open, mode, initializeCamera, stopScanning]);

  // Render generate mode
  const renderGenerateMode = () => {
    if (!tournament || !qrData) return null;
    
    return (
      <Container maxWidth="sm">
        <Box textAlign="center" py={2}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Share Tournament
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Scan this QR code to quickly join the tournament
          </Typography>
          
          {generatingCode ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Generating QR code...
              </Typography>
            </Box>
          ) : (
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              <Box
                sx={{
                  backgroundColor: 'white',
                  borderRadius: 2,
                  p: 2,
                  mb: 2
                }}
              >
                <img 
                  src={qrCodeUrl} 
                  alt="Tournament QR Code"
                  style={{ 
                    width: '100%', 
                    maxWidth: 200, 
                    height: 'auto',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              </Box>
              
              <Typography variant="body2" color="white" sx={{ fontWeight: 500 }}>
                {tournament.name}
              </Typography>
            </Paper>
          )}
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Tournament Details
              </Typography>
              <Box textAlign="left">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Location:</strong> {tournament.location}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Date:</strong> {new Date(tournament.startDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Entry Fee:</strong> ${tournament.entryFee}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Invite Code:</strong> 
                  <Chip 
                    label={qrData.inviteCode} 
                    size="small" 
                    sx={{ ml: 1, fontFamily: 'monospace' }}
                  />
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={copySuccess ? <CheckCircle /> : <ContentCopy />}
              onClick={copyToClipboard}
              color={copySuccess ? "success" : "primary"}
              disabled={generatingCode}
            >
              {copySuccess ? 'Copied!' : 'Copy Link'}
            </Button>
            
            <Button
              variant="contained"
              startIcon={<Share />}
              onClick={shareQRCode}
              disabled={generatingCode}
            >
              Share
            </Button>
          </Box>
        </Box>
      </Container>
    );
  };

  // Render scan mode
  const renderScanMode = () => (
    <Container maxWidth="sm">
      <Box py={2}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, textAlign: 'center' }}>
          Scan QR Code
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph textAlign="center">
          Point your camera at a tournament QR code to join
        </Typography>
        
        {scanError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {scanError}
          </Alert>
        )}
        
        {scannedData ? (
          <Fade in>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <CheckCircle color="success" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Tournament Found!
                  </Typography>
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  {scannedData.tournamentName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Organized by {scannedData.organizerName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Location: {scannedData.location}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Entry Fee: ${scannedData.entryFee}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Date: {new Date(scannedData.startDate).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        ) : (
          <Paper
            sx={{
              position: 'relative',
              borderRadius: 3,
              overflow: 'hidden',
              mb: 3,
              height: 300,
              backgroundColor: 'black'
            }}
          >
            {cameraPermission === 'denied' ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
                color="white"
                textAlign="center"
                p={2}
              >
                <Error sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Camera Access Required
                </Typography>
                <Typography variant="body2" paragraph>
                  Please enable camera permissions to scan QR codes
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={initializeCamera}
                >
                  Try Again
                </Button>
              </Box>
            ) : (
              <>
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
                
                {/* Scanning overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Box
                    sx={{
                      width: 200,
                      height: 200,
                      border: '2px solid white',
                      borderRadius: 2,
                      position: 'relative',
                      '&::before, &::after': {
                        content: '""',
                        position: 'absolute',
                        width: 20,
                        height: 20,
                        border: '3px solid',
                        borderColor: theme.palette.primary.main
                      },
                      '&::before': {
                        top: -3,
                        left: -3,
                        borderRight: 'none',
                        borderBottom: 'none'
                      },
                      '&::after': {
                        bottom: -3,
                        right: -3,
                        borderLeft: 'none',
                        borderTop: 'none'
                      }
                    }}
                  />
                  
                  {scanning && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: theme.palette.primary.main,
                        animation: 'scan 2s infinite',
                        '@keyframes scan': {
                          '0%': { transform: 'translateY(-100px)' },
                          '100%': { transform: 'translateY(100px)' }
                        }
                      }}
                    />
                  )}
                </Box>
                
                {/* Flash toggle */}
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)'
                    }
                  }}
                  onClick={toggleFlash}
                >
                  {flashEnabled ? <FlashOff /> : <FlashOn />}
                </IconButton>
              </>
            )}
          </Paper>
        )}
        
        {scanning && !scannedData && (
          <Box textAlign="center">
            <CircularProgress size={24} sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Looking for QR code...
            </Typography>
          </Box>
        )}
        
        {scannedData && (
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="outlined"
              onClick={() => {
                setScannedData(null);
                initializeCamera();
              }}
            >
              Scan Another
            </Button>
            
            <Button
              variant="contained"
              onClick={joinFromQR}
              disabled={processingJoin}
              startIcon={processingJoin ? <CircularProgress size={20} /> : undefined}
            >
              {processingJoin ? 'Joining...' : 'Join Tournament'}
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isSmallScreen}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Transition}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            {mode === 'generate' ? <QrCode /> : <QrCodeScanner />}
            <Typography variant="h6">
              {mode === 'generate' ? 'Share Tournament' : 'Join Tournament'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {mode === 'generate' ? renderGenerateMode() : renderScanMode()}
      </DialogContent>
      
      {mode === 'generate' && (
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} variant="outlined" fullWidth>
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default QRCodeTournamentJoin;