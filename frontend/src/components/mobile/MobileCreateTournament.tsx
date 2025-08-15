import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Slide,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Container,
  TextField,
  Button,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  Paper,
  Grid,
  Avatar,
  Fab,
  LinearProgress,
  Slider,
  InputAdornment,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  ArrowBack,
  Check,
  ArrowForward,
  LocationOn,
  Schedule,
  People,
  Payment,
  EmojiEvents,
  PhotoCamera,
  Add,
  Remove,
  Info,
  Rule,
  Share,
  Visibility,
  VisibilityOff,
  Edit,
  Save,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Tournament, TournamentCreateRequest, TournamentFormat } from '../../types/tournament';
import { useAuth } from '../../contexts/AuthContext';
import ErrorBoundary from '../common/ErrorBoundary';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface MobileCreateTournamentProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (tournament: TournamentCreateRequest) => Promise<void>;
}

const MobileCreateTournament: React.FC<MobileCreateTournamentProps> = ({
  open,
  onClose,
  onSubmit
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<TournamentCreateRequest>>({
    name: '',
    description: '',
    location: '',
    startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    maxParticipants: 8,
    entryFee: 0,
    prizePool: 0,
    rules: '',
    format: 'single_elimination',
    isPublic: true,
    skillLevel: 'intermediate',
    tags: [],
    minParticipants: 4
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customRules, setCustomRules] = useState(false);

  const steps = [
    'Basic Info',
    'Details',
    'Rules & Settings',
    'Review'
  ];

  const tournamentFormats: { value: TournamentFormat; label: string; description: string }[] = [
    { 
      value: 'single_elimination', 
      label: 'Single Elimination', 
      description: 'One loss and you\'re out' 
    },
    { 
      value: 'double_elimination', 
      label: 'Double Elimination', 
      description: 'Get a second chance' 
    },
    { 
      value: 'round_robin', 
      label: 'Round Robin', 
      description: 'Everyone plays everyone' 
    },
    { 
      value: 'swiss', 
      label: 'Swiss System', 
      description: 'Balanced tournament' 
    }
  ];

  const skillLevels = [
    { value: 'beginner', label: '🟢 Beginner', description: 'New to the game' },
    { value: 'intermediate', label: '🟡 Intermediate', description: 'Some experience' },
    { value: 'advanced', label: '🟠 Advanced', description: 'Experienced player' },
    { value: 'professional', label: '🔴 Professional', description: 'Pro level skills' }
  ];

  const popularTags = [
    'competitive', 'casual', 'weekly', 'monthly', 'indoor', 'outdoor',
    '7v7', '5v5', '11v11', 'youth', 'adult', 'mixed', 'beginner-friendly'
  ];

  // Handle form field changes
  const handleChange = (field: keyof TournamentCreateRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target ? event.target.value : event;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle date change
  const handleDateChange = (field: keyof TournamentCreateRequest) => (date: Date | null) => {
    if (date) {
      setFormData(prev => ({ ...prev, [field]: date.toISOString() }));
    }
  };

  // Handle tag selection
  const handleTagToggle = (tag: string) => {
    const currentTags = formData.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    setFormData(prev => ({ ...prev, tags: newTags }));
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.name?.trim()) newErrors.name = 'Tournament name is required';
        if (!formData.description?.trim()) newErrors.description = 'Description is required';
        if (!formData.location?.trim()) newErrors.location = 'Location is required';
        break;
      
      case 1: // Details
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if ((formData.maxParticipants || 0) < 2) newErrors.maxParticipants = 'At least 2 participants required';
        if ((formData.entryFee || 0) < 0) newErrors.entryFee = 'Entry fee cannot be negative';
        break;
      
      case 2: // Rules & Settings
        if (customRules && !formData.rules?.trim()) {
          newErrors.rules = 'Custom rules are required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === steps.length - 1) {
        handleSubmit();
      } else {
        setActiveStep(prev => prev + 1);
      }
    }
  };

  // Handle previous step
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.location || !formData.startDate) {
      return;
    }

    setLoading(true);
    try {
      const tournamentData: TournamentCreateRequest = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxParticipants: formData.maxParticipants || 8,
        entryFee: formData.entryFee || 0,
        prizePool: formData.prizePool,
        rules: customRules ? formData.rules || '' : getDefaultRules(),
        format: formData.format as TournamentFormat || 'single_elimination',
        isPublic: formData.isPublic ?? true,
        registrationDeadline: formData.registrationDeadline,
        minParticipants: formData.minParticipants,
        ageRestriction: formData.ageRestriction,
        skillLevel: formData.skillLevel as any,
        tags: formData.tags,
        imageUrl: formData.imageUrl
      };

      await onSubmit(tournamentData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to create tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setActiveStep(0);
    setFormData({
      name: '',
      description: '',
      location: '',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      maxParticipants: 8,
      entryFee: 0,
      prizePool: 0,
      rules: '',
      format: 'single_elimination',
      isPublic: true,
      skillLevel: 'intermediate',
      tags: [],
      minParticipants: 4
    });
    setErrors({});
    setImagePreview(null);
    setCustomRules(false);
  };

  // Get default rules
  const getDefaultRules = () => {
    return `1. All FIFA rules apply unless noted otherwise
2. Match duration: 30 minutes (15 min halves)
3. Maximum 3 substitutions per team
4. Yellow and red cards carry standard penalties
5. Disputes resolved by tournament organizer
6. Players must arrive 15 minutes before scheduled time
7. Forfeit if team doesn't show within 10 minutes
8. Good sportsmanship expected from all participants`;
  };

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Basic Info
        return (
          <Container maxWidth="sm" sx={{ py: 3 }}>
            <Box mb={3}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Let's start with the basics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Give your tournament a name and description that attracts players
              </Typography>
            </Box>

            <Box mb={3}>
              <TextField
                fullWidth
                label="Tournament Name"
                value={formData.name || ''}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="e.g., Friday Night Championship"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description || ''}
                onChange={handleChange('description')}
                error={!!errors.description}
                helperText={errors.description}
                placeholder="Tell players what makes this tournament special..."
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Location"
                value={formData.location || ''}
                onChange={handleChange('location')}
                error={!!errors.location}
                helperText={errors.location}
                placeholder="e.g., Central Park, NYC"
                InputProps={{
                  startAdornment: <LocationOn color="action" sx={{ mr: 1 }} />
                }}
              />
            </Box>

            {/* Tournament Image Upload */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Tournament Image (Optional)
                </Typography>
                
                {imagePreview ? (
                  <Box position="relative">
                    <Avatar
                      src={imagePreview}
                      sx={{ width: '100%', height: 200, borderRadius: 2 }}
                      variant="rounded"
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'background.paper'
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Edit />
                    </IconButton>
                  </Box>
                ) : (
                  <Paper
                    sx={{
                      height: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: `2px dashed ${theme.palette.divider}`,
                      bgcolor: 'background.default'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Box textAlign="center">
                      <PhotoCamera color="action" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Add a tournament image
                      </Typography>
                    </Box>
                  </Paper>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </CardContent>
            </Card>
          </Container>
        );

      case 1: // Details
        return (
          <Container maxWidth="sm" sx={{ py: 3 }}>
            <Box mb={3}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Tournament Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set the date, participants, and fees
              </Typography>
            </Box>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Date & Time"
                value={formData.startDate ? new Date(formData.startDate) : null}
                onChange={handleDateChange('startDate')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.startDate,
                    helperText: errors.startDate,
                    sx: { mb: 2 }
                  }
                }}
              />
            </LocalizationProvider>

            <Box mb={2}>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                Number of Participants: {formData.maxParticipants}
              </Typography>
              <Slider
                value={formData.maxParticipants || 8}
                onChange={(_, value) => handleChange('maxParticipants')({ target: { value } })}
                min={2}
                max={64}
                step={2}
                marks={[
                  { value: 4, label: '4' },
                  { value: 16, label: '16' },
                  { value: 32, label: '32' },
                  { value: 64, label: '64' }
                ]}
                sx={{ mb: 3 }}
              />
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Entry Fee"
                  type="number"
                  value={formData.entryFee || 0}
                  onChange={handleChange('entryFee')}
                  error={!!errors.entryFee}
                  helperText={errors.entryFee}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Prize Pool"
                  type="number"
                  value={formData.prizePool || 0}
                  onChange={handleChange('prizePool')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mb: 2 }}>
              Prize pool is automatically calculated as 80% of total entry fees collected
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Skill Level</InputLabel>
              <Select
                value={formData.skillLevel || 'intermediate'}
                onChange={handleChange('skillLevel')}
                label="Skill Level"
              >
                {skillLevels.map(level => (
                  <MenuItem key={level.value} value={level.value}>
                    <Box>
                      <Typography variant="body1">{level.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {level.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Container>
        );

      case 2: // Rules & Settings
        return (
          <Container maxWidth="sm" sx={{ py: 3 }}>
            <Box mb={3}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Rules & Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure tournament format and rules
              </Typography>
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Tournament Format</InputLabel>
              <Select
                value={formData.format || 'single_elimination'}
                onChange={handleChange('format')}
                label="Tournament Format"
              >
                {tournamentFormats.map(format => (
                  <MenuItem key={format.value} value={format.value}>
                    <Box>
                      <Typography variant="body1">{format.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Tournament Rules
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={customRules}
                        onChange={(e) => setCustomRules(e.target.checked)}
                      />
                    }
                    label="Custom"
                  />
                </Box>

                <Collapse in={!customRules}>
                  <Alert severity="info" icon={<Rule />}>
                    <Typography variant="body2">
                      Standard tournament rules will be applied automatically
                    </Typography>
                  </Alert>
                </Collapse>

                <Collapse in={customRules}>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Custom Rules"
                    value={formData.rules || ''}
                    onChange={handleChange('rules')}
                    error={!!errors.rules}
                    helperText={errors.rules || 'Enter your custom tournament rules'}
                    placeholder={getDefaultRules()}
                  />
                </Collapse>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Tags (Optional)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Help players find your tournament
                </Typography>
                
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {popularTags.map(tag => (
                    <Chip
                      key={tag}
                      label={tag}
                      onClick={() => handleTagToggle(tag)}
                      color={formData.tags?.includes(tag) ? 'primary' : 'default'}
                      variant={formData.tags?.includes(tag) ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic ?? true}
                  onChange={(e) => handleChange('isPublic')(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Public Tournament</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Anyone can find and join this tournament
                  </Typography>
                </Box>
              }
            />
          </Container>
        );

      case 3: // Review
        return (
          <Container maxWidth="sm" sx={{ py: 3 }}>
            <Box mb={3}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Review & Create
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Double-check your tournament details
              </Typography>
            </Box>

            {formData.imageUrl && (
              <Avatar
                src={formData.imageUrl}
                sx={{ width: '100%', height: 150, borderRadius: 2, mb: 3 }}
                variant="rounded"
              />
            )}

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>{formData.name}</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {formData.description}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">{formData.location}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formData.startDate ? 
                          new Date(formData.startDate).toLocaleDateString() : ''
                        }
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <People fontSize="small" color="action" />
                      <Typography variant="body2">
                        Max {formData.maxParticipants} players
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Payment fontSize="small" color="action" />
                      <Typography variant="body2">
                        ${formData.entryFee} entry
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {formData.tags && formData.tags.length > 0 && (
                  <Box mt={2}>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {formData.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Alert severity="success">
              <Typography variant="body2">
                Ready to create your tournament! Players will be able to join immediately after creation.
              </Typography>
            </Alert>
          </Container>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <ErrorBoundary>
        {/* App Bar */}
        <AppBar position="sticky" sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onClose}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
            
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
              Create Tournament
            </Typography>
            
            {activeStep < steps.length - 1 && (
              <Typography variant="body2" color="text.secondary">
                {activeStep + 1} of {steps.length}
              </Typography>
            )}
          </Toolbar>
          
          {loading && <LinearProgress />}
        </AppBar>

        {/* Stepper */}
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', pb: 10 }}>
          {renderStepContent(activeStep)}
        </Box>

        {/* Navigation Buttons */}
        <Paper 
          elevation={8} 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            p: 2,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }}
        >
          <Box display="flex" gap={2}>
            {activeStep > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={loading}
                sx={{ minWidth: 100 }}
              >
                Back
              </Button>
            )}
            
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              sx={{ flex: 1, py: 1.5 }}
              startIcon={activeStep === steps.length - 1 ? <Check /> : <ArrowForward />}
            >
              {loading ? 'Creating...' : activeStep === steps.length - 1 ? 'Create Tournament' : 'Next'}
            </Button>
          </Box>
        </Paper>
      </ErrorBoundary>
    </Dialog>
  );
};

export default MobileCreateTournament;