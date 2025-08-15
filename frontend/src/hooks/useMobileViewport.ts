import { useState, useEffect, useCallback } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

export interface MobileViewportInfo {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isDarkMode: boolean;
  isFullscreen: boolean;
  devicePixelRatio: number;
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: 'iOS' | 'Android' | 'unknown';
  hasTouch: boolean;
  isStandalone: boolean; // PWA standalone mode
  networkStatus: 'online' | 'offline';
}

const useMobileViewport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  const [viewport, setViewport] = useState<MobileViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 375,
        height: 667,
        orientation: 'portrait',
        isDarkMode: false,
        isFullscreen: false,
        devicePixelRatio: 1,
        safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
        deviceType: 'mobile',
        platform: 'unknown',
        hasTouch: false,
        isStandalone: false,
        networkStatus: 'online'
      };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      isDarkMode: prefersDarkMode,
      isFullscreen: (document as any).fullscreenElement !== null,
      devicePixelRatio: window.devicePixelRatio || 1,
      safeArea: getSafeAreaInsets(),
      deviceType: getDeviceType(),
      platform: getPlatform(),
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isStandalone: isStandaloneMode(),
      networkStatus: navigator.onLine ? 'online' : 'offline'
    };
  });

  // Get device type based on screen size
  function getDeviceType(): MobileViewportInfo['deviceType'] {
    if (typeof window === 'undefined') return 'mobile';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Detect platform
  function getPlatform(): MobileViewportInfo['platform'] {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
    if (/Android/.test(userAgent)) return 'Android';
    return 'unknown';
  }

  // Check if running in PWA standalone mode
  function isStandaloneMode(): boolean {
    if (typeof window === 'undefined') return false;
    
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      window.location.search.includes('standalone=true')
    );
  }

  // Get safe area insets (for devices with notches/safe areas)
  function getSafeAreaInsets() {
    if (typeof window === 'undefined' || !CSS.supports || typeof getComputedStyle !== 'function') {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }

    const element = document.documentElement;
    const style = getComputedStyle(element);
    
    // Try to get CSS env() values for safe area insets
    const getInsetValue = (property: string) => {
      const value = style.getPropertyValue(property);
      if (value && value !== 'auto') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    return {
      top: getInsetValue('--safe-area-inset-top') || 
           getInsetValue('env(safe-area-inset-top)') || 
           (isStandaloneMode() && getPlatform() === 'iOS' ? 20 : 0),
      bottom: getInsetValue('--safe-area-inset-bottom') || 
              getInsetValue('env(safe-area-inset-bottom)') || 0,
      left: getInsetValue('--safe-area-inset-left') || 
            getInsetValue('env(safe-area-inset-left)') || 0,
      right: getInsetValue('--safe-area-inset-right') || 
             getInsetValue('env(safe-area-inset-right)') || 0
    };
  }

  // Update viewport info
  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;

    setViewport(prev => ({
      ...prev,
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      isDarkMode: prefersDarkMode,
      isFullscreen: (document as any).fullscreenElement !== null,
      devicePixelRatio: window.devicePixelRatio || 1,
      safeArea: getSafeAreaInsets(),
      deviceType: getDeviceType(),
      platform: getPlatform(),
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isStandalone: isStandaloneMode(),
      networkStatus: navigator.onLine ? 'online' : 'offline'
    }));
  }, [prefersDarkMode]);

  // Handle orientation change
  const handleOrientationChange = useCallback(() => {
    // Delay to allow for browser reflow
    setTimeout(updateViewport, 100);
  }, [updateViewport]);

  // Handle network status change
  const handleOnlineStatusChange = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      networkStatus: navigator.onLine ? 'online' : 'offline'
    }));
  }, []);

  // Handle fullscreen change
  const handleFullscreenChange = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      isFullscreen: (document as any).fullscreenElement !== null
    }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Throttle resize events
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateViewport, 150);
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Handle safe area changes (for dynamic island, etc.)
    if (CSS.supports && CSS.supports('padding: env(safe-area-inset-top)')) {
      const observer = new ResizeObserver(() => {
        updateViewport();
      });
      observer.observe(document.documentElement);

      return () => {
        observer.disconnect();
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
        window.removeEventListener('online', handleOnlineStatusChange);
        window.removeEventListener('offline', handleOnlineStatusChange);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        clearTimeout(resizeTimer);
      };
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearTimeout(resizeTimer);
    };
  }, [updateViewport, handleOrientationChange, handleOnlineStatusChange, handleFullscreenChange]);

  // Utility functions
  const isPortrait = viewport.orientation === 'portrait';
  const isLandscape = viewport.orientation === 'landscape';
  const isSmallScreen = viewport.width < 400;
  const isVerySmallScreen = viewport.width < 350;
  const isTallScreen = viewport.height > 800;
  const isShortScreen = viewport.height < 600;
  const hasNotch = viewport.safeArea.top > 0;
  const hasHomeIndicator = viewport.safeArea.bottom > 0;

  // Get optimal spacing based on device
  const getSpacing = useCallback((base: number = 8) => {
    const density = viewport.devicePixelRatio;
    const isSmall = viewport.width < 380;
    
    let multiplier = 1;
    if (isSmall) multiplier = 0.8;
    if (density > 2) multiplier *= 1.1;
    
    return base * multiplier;
  }, [viewport.devicePixelRatio, viewport.width]);

  // Get font scaling based on device
  const getFontScale = useCallback(() => {
    if (viewport.deviceType === 'mobile' && viewport.width < 380) return 0.9;
    if (viewport.deviceType === 'tablet') return 1.1;
    return 1;
  }, [viewport.deviceType, viewport.width]);

  // Check if device supports hover (not touch-only)
  const supportsHover = !viewport.hasTouch || viewport.deviceType === 'desktop';

  return {
    viewport,
    isPortrait,
    isLandscape,
    isSmallScreen,
    isVerySmallScreen,
    isTallScreen,
    isShortScreen,
    hasNotch,
    hasHomeIndicator,
    supportsHover,
    getSpacing,
    getFontScale,
    isMobile: viewport.deviceType === 'mobile',
    isTablet: viewport.deviceType === 'tablet',
    isDesktop: viewport.deviceType === 'desktop'
  };
};

export default useMobileViewport;