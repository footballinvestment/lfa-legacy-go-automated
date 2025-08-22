import { useState, useCallback, useRef, useEffect } from "react";

export interface TouchGestureEvent {
  type: "swipe" | "tap" | "longPress" | "pinch";
  direction?: "left" | "right" | "up" | "down";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  duration: number;
  target: EventTarget | null;
}

export interface TouchGestureOptions {
  swipeThreshold?: number;
  tapThreshold?: number;
  longPressThreshold?: number;
  pinchThreshold?: number;
  preventScroll?: boolean;
  enabledGestures?: Array<"swipe" | "tap" | "longPress" | "pinch">;
}

export interface TouchGestureHandlers {
  onSwipeLeft?: (event: TouchGestureEvent) => void;
  onSwipeRight?: (event: TouchGestureEvent) => void;
  onSwipeUp?: (event: TouchGestureEvent) => void;
  onSwipeDown?: (event: TouchGestureEvent) => void;
  onTap?: (event: TouchGestureEvent) => void;
  onLongPress?: (event: TouchGestureEvent) => void;
  onPinchIn?: (event: TouchGestureEvent) => void;
  onPinchOut?: (event: TouchGestureEvent) => void;
}

const useTouchGestures = (
  handlers: TouchGestureHandlers,
  options: TouchGestureOptions = {}
) => {
  const {
    swipeThreshold = 50,
    tapThreshold = 10,
    longPressThreshold = 500,
    pinchThreshold = 10,
    preventScroll = false,
    enabledGestures = ["swipe", "tap", "longPress"],
  } = options;

  // Touch tracking state
  const [isTracking, setIsTracking] = useState(false);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    touches: number;
  } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDistanceRef = useRef<number>(0);

  // Calculate distance between two touches (for pinch gestures)
  const getTouchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0;

    const touch1 = touches[0];
    const touch2 = touches[1];

    const deltaX = touch1.clientX - touch2.clientX;
    const deltaY = touch1.clientY - touch2.clientY;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }, []);

  // Create gesture event
  const createGestureEvent = useCallback(
    (
      type: TouchGestureEvent["type"],
      direction?: TouchGestureEvent["direction"],
      target?: EventTarget | null
    ): TouchGestureEvent => {
      const start = touchStartRef.current;
      const end = touchEndRef.current;

      if (!start || !end) {
        return {
          type,
          direction,
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
          deltaX: 0,
          deltaY: 0,
          distance: 0,
          duration: 0,
          target: target || null,
        };
      }

      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = end.time - start.time;

      return {
        type,
        direction,
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
        deltaX,
        deltaY,
        distance,
        duration,
        target: target || null,
      };
    },
    []
  );

  // Handle touch start
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      const touch = event.touches[0];
      const now = Date.now();

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: now,
        touches: event.touches.length,
      };

      setIsTracking(true);

      // Handle pinch gesture initialization
      if (enabledGestures.includes("pinch") && event.touches.length === 2) {
        initialDistanceRef.current = getTouchDistance(event.touches);
      }

      // Handle long press
      if (enabledGestures.includes("longPress") && event.touches.length === 1) {
        longPressTimerRef.current = setTimeout(() => {
          const gestureEvent = createGestureEvent(
            "longPress",
            undefined,
            event.target
          );
          handlers.onLongPress?.(gestureEvent);
          setIsTracking(false);
        }, longPressThreshold);
      }

      if (preventScroll) {
        event.preventDefault();
      }
    },
    [
      enabledGestures,
      handlers,
      longPressThreshold,
      preventScroll,
      getTouchDistance,
      createGestureEvent,
    ]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!isTracking || !touchStartRef.current) return;

      // Handle pinch gesture
      if (enabledGestures.includes("pinch") && event.touches.length === 2) {
        const currentDistance = getTouchDistance(event.touches);
        const deltaDistance = currentDistance - initialDistanceRef.current;

        if (Math.abs(deltaDistance) > pinchThreshold) {
          const gestureEvent = createGestureEvent(
            "pinch",
            undefined, // Pinch gestures don't have directional values like swipe gestures
            event.target
          );

          if (deltaDistance > 0) {
            handlers.onPinchOut?.(gestureEvent);
          } else {
            handlers.onPinchIn?.(gestureEvent);
          }
        }
      }

      // Clear long press timer on move
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (preventScroll) {
        event.preventDefault();
      }
    },
    [
      isTracking,
      enabledGestures,
      pinchThreshold,
      preventScroll,
      getTouchDistance,
      createGestureEvent,
      handlers,
    ]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!isTracking || !touchStartRef.current) return;

      const touch = event.changedTouches[0];
      const now = Date.now();

      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: now,
      };

      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const start = touchStartRef.current;
      const end = touchEndRef.current;

      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = end.time - start.time;

      // Handle tap gesture
      if (
        enabledGestures.includes("tap") &&
        distance < tapThreshold &&
        duration < 300
      ) {
        const gestureEvent = createGestureEvent("tap", undefined, event.target);
        handlers.onTap?.(gestureEvent);
      }
      // Handle swipe gestures
      else if (enabledGestures.includes("swipe") && distance > swipeThreshold) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        let direction: "left" | "right" | "up" | "down";
        let handler: ((event: TouchGestureEvent) => void) | undefined;

        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0) {
            direction = "right";
            handler = handlers.onSwipeRight;
          } else {
            direction = "left";
            handler = handlers.onSwipeLeft;
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            direction = "down";
            handler = handlers.onSwipeDown;
          } else {
            direction = "up";
            handler = handlers.onSwipeUp;
          }
        }

        if (handler) {
          const gestureEvent = createGestureEvent(
            "swipe",
            direction,
            event.target
          );
          handler(gestureEvent);
        }
      }

      setIsTracking(false);
      touchStartRef.current = null;
      touchEndRef.current = null;

      if (preventScroll) {
        event.preventDefault();
      }
    },
    [
      isTracking,
      enabledGestures,
      tapThreshold,
      swipeThreshold,
      preventScroll,
      createGestureEvent,
      handlers,
    ]
  );

  // Attach event listeners
  const attachListeners = useCallback(
    (element: HTMLElement) => {
      element.addEventListener("touchstart", handleTouchStart, {
        passive: !preventScroll,
      });
      element.addEventListener("touchmove", handleTouchMove, {
        passive: !preventScroll,
      });
      element.addEventListener("touchend", handleTouchEnd, {
        passive: !preventScroll,
      });

      return () => {
        element.removeEventListener("touchstart", handleTouchStart);
        element.removeEventListener("touchmove", handleTouchMove);
        element.removeEventListener("touchend", handleTouchEnd);
      };
    },
    [handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    attachListeners,
    isTracking,
  };
};

export default useTouchGestures;
