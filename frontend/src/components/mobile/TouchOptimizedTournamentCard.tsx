import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  Avatar,
  IconButton,
  Collapse,
  LinearProgress,
  Fade,
  Slide,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocationOn,
  Schedule,
  People,
  Star,
  MoreVert,
  Share,
  Favorite,
  FavoriteBorder,
  EmojiEvents,
  Visibility,
  Add,
  CheckCircle,
  Timer,
  SportsSoccer,
} from '@mui/icons-material';
import { Tournament, TournamentStatus } from '../../types/tournament';
import useTouchGestures, { TouchGestureEvent } from '../../hooks/useTouchGestures';
import useMobileViewport from '../../hooks/useMobileViewport';

interface TouchOptimizedTournamentCardProps {
  tournament: Tournament;
  onTap?: (tournament: Tournament) => void;
  onJoin?: (tournament: Tournament) => void;
  onShare?: (tournament: Tournament) => void;
  onWatchlist?: (tournament: Tournament, isWatchlisted: boolean) => void;
  onSwipeLeft?: (tournament: Tournament) => void;
  onSwipeRight?: (tournament: Tournament) => void;
  isWatchlisted?: boolean;
  showActions?: boolean;
  compact?: boolean;
  animationDelay?: number;
}

const TouchOptimizedTournamentCard: React.FC<TouchOptimizedTournamentCardProps> = ({
  tournament,
  onTap,
  onJoin,
  onShare,
  onWatchlist,
  onSwipeLeft,
  onSwipeRight,
  isWatchlisted = false,
  showActions = true,
  compact = false,
  animationDelay = 0
}) => {
  const theme = useTheme();
  const { viewport, isSmallScreen, getSpacing } = useMobileViewport();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Animation states
  const [isPressed, setIsPressed] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Touch gesture handlers
  const gestureHandlers = {
    onTap: useCallback((event: TouchGestureEvent) => {
      // Create ripple effect at touch position
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setRipplePosition({
          x: event.startX - rect.left,
          y: event.startY - rect.top
        });
        
        // Clear ripple after animation
        setTimeout(() => setRipplePosition(null), 600);
      }
      
      onTap?.(tournament);
    }, [onTap, tournament]),

    onSwipeLeft: useCallback((event: TouchGestureEvent) => {
      // Show quick actions on swipe left
      setShowQuickActions(true);
      setTimeout(() => setShowQuickActions(false), 2000);
      onSwipeLeft?.(tournament);
    }, [onSwipeLeft, tournament]),

    onSwipeRight: useCallback((event: TouchGestureEvent) => {
      // Join tournament on swipe right
      if (tournament.status === 'upcoming' && tournament.currentParticipants < tournament.maxParticipants) {
        onJoin?.(tournament);
      } else {
        onSwipeRight?.(tournament);
      }
    }, [onSwipeRight, onJoin, tournament]),

    onLongPress: useCallback(() => {
      // Show context menu or additional options
      setShowQuickActions(true);
      
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, [])
  };

  // Touch gesture setup
  const { attachListeners } = useTouchGestures(gestureHandlers, {
    swipeThreshold: 80,
    tapThreshold: 20,
    longPressThreshold: 600,
    enabledGestures: ['swipe', 'tap', 'longPress'],
    preventScroll: false
  });

  // Attach touch listeners to card
  useEffect(() => {
    if (cardRef.current) {
      const cleanup = attachListeners(cardRef.current);
      return cleanup;
    }
  }, [attachListeners]);

  // Animate card in on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [animationDelay]);

  // Get status color and icon
  const getStatusInfo = (status: TournamentStatus) => {
    switch (status) {
      case 'upcoming':
        return {
          color: theme.palette.info.main,
          icon: <Schedule fontSize="small" />,
          label: 'UPCOMING'
        };
      case 'active':
        return {
          color: theme.palette.success.main,
          icon: <Timer fontSize="small" />,
          label: 'LIVE'
        };
      case 'completed':
        return {
          color: theme.palette.grey[500],
          icon: <CheckCircle fontSize="small" />,
          label: 'COMPLETED'
        };
      default:
        return {
          color: theme.palette.text.secondary,
          icon: <SportsSoccer fontSize="small" />,
          label: status.toUpperCase()
        };
    }
  };

  const statusInfo = getStatusInfo(tournament.status);
  const canJoin = tournament.status === 'upcoming' && 
                 tournament.currentParticipants < tournament.maxParticipants;
  
  const participantsPercentage = (tournament.currentParticipants / tournament.maxParticipants) * 100;

  return (
    <Slide
      direction="up"
      in={isVisible}
      timeout={400}
      style={{ transitionDelay: `${animationDelay}ms` }}
    >
      <Card
        ref={cardRef}
        sx={{
          position: 'relative',
          mb: getSpacing(2),
          borderRadius: getSpacing(2),
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: `scale(${isPressed ? 0.98 : 1}) translateX(${swipeOffset}px)`,
          boxShadow: theme.shadows[isPressed ? 8 : 2],
          ...(isSmallScreen && {
            mx: 1,
            borderRadius: getSpacing(1.5)
          }),
          '&:active': {
            transform: 'scale(0.98)',
          }
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
      >
        {/* Ripple Effect */}
        {ripplePosition && (
          <Box
            sx={{
              position: 'absolute',
              top: ripplePosition.y - 25,
              left: ripplePosition.x - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.primary.main, 0.3),
              transform: 'scale(0)',
              animation: 'ripple 0.6s ease-out',
              pointerEvents: 'none',
              zIndex: 2,
              '@keyframes ripple': {
                to: {
                  transform: 'scale(4)',
                  opacity: 0
                }
              }
            }}
          />
        )}

        <CardContent sx={{ pb: compact ? 1 : 2 }}>
          {/* Header with status and actions */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box flex={1} minWidth={0}>
              <Typography 
                variant={compact ? "subtitle1" : "h6"}
                component="h3" 
                sx={{ 
                  fontWeight: 600,
                  lineHeight: 1.2,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {tournament.name}
              </Typography>
              
              <Chip
                icon={statusInfo.icon}
                label={statusInfo.label}
                size="small"
                sx={{
                  backgroundColor: statusInfo.color,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
                  ...(tournament.status === 'active' && {
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                      '100%': { opacity: 1 }
                    }
                  })
                }}
              />
            </Box>
            
            <Box display="flex" alignItems="center" gap={0.5}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onWatchlist?.(tournament, !isWatchlisted);
                }}
                sx={{ p: 0.5 }}
              >
                {isWatchlisted ? (
                  <Favorite fontSize="small" color="error" />
                ) : (
                  <FavoriteBorder fontSize="small" />
                )}
              </IconButton>
              
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(tournament);
                }}
                sx={{ p: 0.5 }}
              >
                <Share fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Tournament Details */}
          <Box display="flex" flexDirection="column" gap={1} mb={2}>
            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={0.5} minWidth={0} flex={1}>
                <LocationOn fontSize="small" color="action" />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tournament.location}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={0.5}>
                <Star fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  ${tournament.entryFee}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {new Date(tournament.startDate).toLocaleDateString()} at{' '}
                {new Date(tournament.startDate).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
              
              {tournament.prizePool && (
                <Chip
                  label={`$${tournament.prizePool}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  icon={<EmojiEvents fontSize="small" />}
                />
              )}
            </Box>
          </Box>

          {/* Participants Progress */}
          <Box mb={compact ? 1 : 2}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <People fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {tournament.currentParticipants}/{tournament.maxParticipants} players
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {Math.round(participantsPercentage)}%
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={participantsPercentage}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.grey[300], 0.3),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: participantsPercentage > 80 ? 
                    theme.palette.warning.main : 
                    theme.palette.primary.main
                }
              }}
            />
          </Box>
        </CardContent>

        {/* Actions */}
        {showActions && (
          <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Visibility />}
              onClick={(e) => {
                e.stopPropagation();
                onTap?.(tournament);
              }}
              sx={{ 
                borderRadius: getSpacing(1),
                textTransform: 'none'
              }}
            >
              Details
            </Button>
            
            {canJoin && (
              <Button
                size="small"
                variant="contained"
                startIcon={<Add />}
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin?.(tournament);
                }}
                sx={{ 
                  borderRadius: getSpacing(1),
                  textTransform: 'none',
                  fontWeight: 600,
                  ml: 1
                }}
              >
                Join
              </Button>
            )}
          </CardActions>
        )}

        {/* Quick Actions Overlay */}
        <Collapse in={showQuickActions}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: alpha(theme.palette.background.paper, 0.95),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              zIndex: 10
            }}
          >
            {canJoin && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin?.(tournament);
                  setShowQuickActions(false);
                }}
                sx={{ borderRadius: getSpacing(2) }}
              >
                Join Now
              </Button>
            )}
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<Share />}
              onClick={(e) => {
                e.stopPropagation();
                onShare?.(tournament);
                setShowQuickActions(false);
              }}
              sx={{ borderRadius: getSpacing(2) }}
            >
              Share
            </Button>
          </Box>
        </Collapse>

        {/* Swipe Indicators */}
        {tournament.status === 'upcoming' && (
          <>
            {/* Swipe Right Indicator */}
            <Box
              sx={{
                position: 'absolute',
                left: -100,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: theme.palette.success.main,
                transition: 'left 0.3s ease',
                ...(swipeOffset > 50 && { left: 16 })
              }}
            >
              <Add />
              <Typography variant="body2" fontWeight={600}>
                Join
              </Typography>
            </Box>

            {/* Swipe Left Indicator */}
            <Box
              sx={{
                position: 'absolute',
                right: -100,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: theme.palette.info.main,
                transition: 'right 0.3s ease',
                ...(swipeOffset < -50 && { right: 16 })
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                Options
              </Typography>
              <MoreVert />
            </Box>
          </>
        )}
      </Card>
    </Slide>
  );
};

export default TouchOptimizedTournamentCard;