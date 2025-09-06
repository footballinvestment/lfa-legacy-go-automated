import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Snackbar,
  Alert,
  AlertColor,
  Slide,
  SlideProps,
} from '@mui/material';

interface Notification {
  id: string;
  message: string;
  severity: AlertColor;
  duration?: number;
  action?: ReactNode;
}

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor, duration?: number, action?: ReactNode) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  const showNotification = (
    message: string,
    severity: AlertColor = 'info',
    duration: number = 5000,
    action?: ReactNode
  ) => {
    const id = Date.now().toString() + Math.random().toString(36);
    const notification: Notification = {
      id,
      message,
      severity,
      duration,
      action,
    };

    // If no notification is currently showing, show immediately
    if (!currentNotification) {
      setCurrentNotification(notification);
    } else {
      // Queue the notification
      setNotifications(prev => [...prev, notification]);
    }
  };

  const showSuccess = (message: string, duration?: number) => {
    showNotification(message, 'success', duration);
  };

  const showError = (message: string, duration?: number) => {
    showNotification(message, 'error', duration || 7000); // Errors stay longer by default
  };

  const showWarning = (message: string, duration?: number) => {
    showNotification(message, 'warning', duration);
  };

  const showInfo = (message: string, duration?: number) => {
    showNotification(message, 'info', duration);
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setCurrentNotification(null);
  };

  const handleExited = () => {
    // Show next notification in queue
    if (notifications.length > 0) {
      const nextNotification = notifications[0];
      setNotifications(prev => prev.slice(1));
      setCurrentNotification(nextNotification);
    }
  };

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={!!currentNotification}
        autoHideDuration={currentNotification?.duration || 5000}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        TransitionProps={{
          onExited: handleExited,
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiSnackbar-root': {
            maxWidth: { xs: '90%', sm: '600px' },
          },
        }}
      >
        {currentNotification && (
          <Alert
            onClose={handleClose}
            severity={currentNotification.severity}
            variant="filled"
            action={currentNotification.action}
            sx={{
              width: '100%',
              maxWidth: { xs: '90vw', sm: '600px' },
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            {currentNotification.message}
          </Alert>
        )}
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;