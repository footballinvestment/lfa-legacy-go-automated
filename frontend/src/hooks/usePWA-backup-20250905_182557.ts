import { useState, useEffect, useCallback } from "react";

export interface PWACapabilities {
  isSupported: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  isStandalone: boolean;
  hasServiceWorker: boolean;
  supportsNotifications: boolean;
  supportsBackgroundSync: boolean;
  supportsShare: boolean;
  supportsBadgeAPI: boolean;
}

export interface PWAPrompt {
  show: () => Promise<void>;
  dismiss: () => void;
}

export interface NotificationPermission {
  status: "default" | "granted" | "denied";
  request: () => Promise<"granted" | "denied" | "default">;
}

const usePWA = () => {
  const [capabilities, setCapabilities] = useState<PWACapabilities>({
    isSupported: false,
    isInstalled: false,
    canInstall: false,
    isStandalone: false,
    hasServiceWorker: false,
    supportsNotifications: false,
    supportsBackgroundSync: false,
    supportsShare: false,
    supportsBadgeAPI: false,
  });

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission["status"]>("default");

  // Check PWA capabilities
  const checkCapabilities = useCallback(() => {
    const newCapabilities: PWACapabilities = {
      isSupported: "serviceWorker" in navigator && "PushManager" in window,
      isInstalled: false,
      canInstall: false,
      isStandalone:
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true,
      hasServiceWorker: "serviceWorker" in navigator,
      supportsNotifications: "Notification" in window,
      supportsBackgroundSync:
        "serviceWorker" in navigator &&
        "sync" in window.ServiceWorkerRegistration.prototype,
      supportsShare: "share" in navigator,
      supportsBadgeAPI: "setAppBadge" in navigator,
    };

    // Check if already installed
    newCapabilities.isInstalled = newCapabilities.isStandalone;
    newCapabilities.canInstall =
      installPrompt !== null && !newCapabilities.isInstalled;

    setCapabilities(newCapabilities);
  }, [installPrompt]);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      console.log("PWA: Install prompt available");
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      console.log("PWA: App installed");
      setInstallPrompt(null);
      setCapabilities((prev) => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
      }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Check capabilities when component mounts or install prompt changes
  useEffect(() => {
    checkCapabilities();
  }, [checkCapabilities]);

  // Check notification permission
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Install PWA
  const installPWA = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      console.log("PWA: No install prompt available");
      return false;
    }

    try {
      setIsInstalling(true);

      // Show install prompt
      const result = await installPrompt.prompt();
      console.log("PWA: Install prompt result:", result);

      // Wait for user choice
      const choiceResult = await installPrompt.userChoice;
      console.log("PWA: User choice:", choiceResult.outcome);

      if (choiceResult.outcome === "accepted") {
        setInstallPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error("PWA: Install failed:", error);
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [installPrompt]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<
    NotificationPermission["status"]
  > => {
    if (!("Notification" in window)) {
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    } catch (error) {
      console.error("PWA: Notification permission request failed:", error);
      return "denied";
    }
  }, []);

  // Show notification
  const showNotification = useCallback(
    async (
      title: string,
      options: NotificationOptions = {}
    ): Promise<boolean> => {
      if (!capabilities.supportsNotifications) {
        console.log("PWA: Notifications not supported");
        return false;
      }

      if (notificationPermission !== "granted") {
        console.log("PWA: Notification permission not granted");
        return false;
      }

      try {
        // If service worker is available, use it for better reliability
        if (capabilities.hasServiceWorker && "serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            icon: "/logo192.png",
            badge: "/logo192.png",
            tag: "lfa-notification",
            requireInteraction: false,
            ...options,
          });
        } else {
          // Fallback to regular notification
          new Notification(title, {
            icon: "/logo192.png",
            ...options,
          });
        }

        return true;
      } catch (error) {
        console.error("PWA: Show notification failed:", error);
        return false;
      }
    },
    [capabilities, notificationPermission]
  );

  // Set app badge (for supported browsers)
  const setAppBadge = useCallback(
    async (count?: number): Promise<boolean> => {
      if (!capabilities.supportsBadgeAPI) {
        return false;
      }

      try {
        if (count && count > 0) {
          await (navigator as any).setAppBadge(count);
        } else {
          await (navigator as any).clearAppBadge();
        }
        return true;
      } catch (error) {
        console.error("PWA: Set app badge failed:", error);
        return false;
      }
    },
    [capabilities]
  );

  // Share content (using Web Share API)
  const shareContent = useCallback(
    async (data: ShareData): Promise<boolean> => {
      if (!capabilities.supportsShare) {
        console.log("PWA: Web Share API not supported");
        return false;
      }

      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("PWA: Share failed:", error);
        }
        return false;
      }
    },
    [capabilities]
  );

  // Register for background sync
  const registerBackgroundSync = useCallback(
    async (tag: string): Promise<boolean> => {
      if (
        !capabilities.supportsBackgroundSync ||
        !capabilities.hasServiceWorker
      ) {
        return false;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register(tag);
        console.log("PWA: Background sync registered:", tag);
        return true;
      } catch (error) {
        console.error("PWA: Background sync registration failed:", error);
        return false;
      }
    },
    [capabilities]
  );

  // Subscribe to push notifications
  const subscribeToPushNotifications = useCallback(
    async (publicKey: string): Promise<PushSubscription | null> => {
      if (
        !capabilities.supportsNotifications ||
        !capabilities.hasServiceWorker
      ) {
        return null;
      }

      if (notificationPermission !== "granted") {
        const permission = await requestNotificationPermission();
        if (permission !== "granted") {
          return null;
        }
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        console.log("PWA: Push subscription created");
        return subscription;
      } catch (error) {
        console.error("PWA: Push subscription failed:", error);
        return null;
      }
    },
    [capabilities, notificationPermission, requestNotificationPermission]
  );

  // Get current push subscription
  const getPushSubscription =
    useCallback(async (): Promise<PushSubscription | null> => {
      if (!capabilities.hasServiceWorker) {
        return null;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
      } catch (error) {
        console.error("PWA: Get push subscription failed:", error);
        return null;
      }
    }, [capabilities]);

  // Unsubscribe from push notifications
  const unsubscribeFromPushNotifications =
    useCallback(async (): Promise<boolean> => {
      try {
        const subscription = await getPushSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          console.log("PWA: Push subscription removed");
          return true;
        }
        return false;
      } catch (error) {
        console.error("PWA: Push unsubscribe failed:", error);
        return false;
      }
    }, [getPushSubscription]);

  // Check if app update is available
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    if (!capabilities.hasServiceWorker) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        return registration.waiting !== null;
      }
      return false;
    } catch (error) {
      console.error("PWA: Update check failed:", error);
      return false;
    }
  }, [capabilities]);

  // Apply app update
  const applyUpdate = useCallback(async (): Promise<boolean> => {
    if (!capabilities.hasServiceWorker) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
        return true;
      }
      return false;
    } catch (error) {
      console.error("PWA: Update apply failed:", error);
      return false;
    }
  }, [capabilities]);

  return {
    // State
    capabilities,
    installPrompt: installPrompt !== null,
    isInstalling,
    notificationPermission,

    // Actions
    installPWA,
    requestNotificationPermission,
    showNotification,
    setAppBadge,
    shareContent,
    registerBackgroundSync,
    subscribeToPushNotifications,
    getPushSubscription,
    unsubscribeFromPushNotifications,
    checkForUpdates,
    applyUpdate,

    // Utilities
    isSupported: capabilities.isSupported,
    isInstalled: capabilities.isInstalled,
    canInstall: capabilities.canInstall,
    isStandalone: capabilities.isStandalone,
  };
};

// Utility function to convert base64 string to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default usePWA;
