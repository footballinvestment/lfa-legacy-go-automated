import React, { useState, useEffect } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  Box,
  Fab,
  Zoom,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Home,
  EmojiEvents,
  Search,
  Person,
  Notifications,
  Add,
  SportsSoccer,
  Timeline,
  Group,
  Settings,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSafeAuth } from '../../SafeAuthContext';

interface MobileBottomNavigationProps {
  onAddTournament?: () => void;
  notificationCount?: number;
  hideOnScroll?: boolean;
}

const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  onAddTournament,
  notificationCount = 0,
  hideOnScroll = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSafeAuth();
  const isAuthenticated = user !== null;
  
  const [value, setValue] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Navigation items for authenticated users
  const authenticatedItems = [
    {
      label: 'Tournaments',
      icon: <EmojiEvents />,
      path: '/tournaments',
      value: 0
    },
    {
      label: 'My Games',
      icon: <SportsSoccer />,
      path: '/my-tournaments',
      value: 1
    },
    {
      label: 'Search',
      icon: <Search />,
      path: '/search',
      value: 2
    },
    {
      label: 'Activity',
      icon: notificationCount > 0 ? 
        <Badge badgeContent={notificationCount} color="error">
          <Timeline />
        </Badge> : <Timeline />,
      path: '/activity',
      value: 3
    },
    {
      label: 'Profile',
      icon: <Person />,
      path: '/profile',
      value: 4
    }
  ];

  // Navigation items for non-authenticated users
  const guestItems = [
    {
      label: 'Tournaments',
      icon: <EmojiEvents />,
      path: '/tournaments',
      value: 0
    },
    {
      label: 'Search',
      icon: <Search />,
      path: '/search',
      value: 1
    },
    {
      label: 'About',
      icon: <Group />,
      path: '/about',
      value: 2
    },
    {
      label: 'Sign In',
      icon: <Person />,
      path: '/signin',
      value: 3
    }
  ];

  const items = isAuthenticated ? authenticatedItems : guestItems;

  // Handle scroll to show/hide navigation
  useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        // Scrolling up or near top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past threshold
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    const throttledHandleScroll = throttle(handleScroll, 100);
    window.addEventListener('scroll', throttledHandleScroll);
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [lastScrollY, hideOnScroll]);

  // Set active tab based on current route
  useEffect(() => {
    const currentItem = items.find(item => 
      location.pathname === item.path || 
      location.pathname.startsWith(item.path + '/')
    );
    
    if (currentItem) {
      setValue(currentItem.value);
    } else {
      // Default to tournaments tab
      setValue(0);
    }
  }, [location.pathname, items]);

  // Handle navigation change
  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    const selectedItem = items[newValue];
    if (selectedItem) {
      navigate(selectedItem.path);
    }
  };

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation */}
      <Zoom in={isVisible} timeout={200}>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
          }}
          elevation={8}
        >
          <BottomNavigation
            value={value}
            onChange={handleChange}
            showLabels
            sx={{
              height: 70,
              '& .MuiBottomNavigationAction-root': {
                minWidth: 'auto',
                padding: '8px 4px 12px',
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }
                },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.7rem',
                  marginTop: 2,
                }
              }
            }}
          >
            {items.map((item) => (
              <BottomNavigationAction
                key={item.value}
                label={item.label}
                icon={item.icon}
                value={item.value}
              />
            ))}
          </BottomNavigation>
        </Paper>
      </Zoom>

      {/* Floating Action Button for Adding Tournaments */}
      {isAuthenticated && onAddTournament && (
        <Zoom in={isVisible} timeout={200}>
          <Fab
            color="primary"
            onClick={onAddTournament}
            sx={{
              position: 'fixed',
              bottom: 85, // Above bottom navigation
              right: 16,
              zIndex: 1001,
              boxShadow: theme.shadows[8],
              '&:hover': {
                transform: 'scale(1.1)',
                transition: 'transform 0.2s ease-in-out',
              }
            }}
          >
            <Add />
          </Fab>
        </Zoom>
      )}

      {/* Bottom padding spacer for content */}
      <Box sx={{ height: 70 }} />
    </>
  );
};

// Utility function to throttle scroll events
function throttle(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default MobileBottomNavigation;