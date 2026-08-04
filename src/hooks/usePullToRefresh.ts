import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEventHandler,
} from "react";

// Configuration constants
const CONFIG = {
  THRESHOLD: 80, // px - release here to trigger
  RESISTANCE: 0.5, // Drag distance multiplier
  SCROLL_BUFFER: 120, // px - detect when scrollY < this
  THROTTLE_MS: 16, // 60fps max
  RESET_DELAY_MS: 500, // Delay after refresh complete
  MAX_PULL_DISPLAY: 160, // Clamped max display distance
} as const;

// Types
interface TouchTracker {
  readonly startY: number;
  readonly startTime: number;
}

interface PullToRefreshState {
  readonly pullDistance: number;
  readonly isRefreshing: boolean;
  readonly error: string | null;
  readonly containerProps: {
    readonly onTouchStart: TouchEventHandler<HTMLElement>;
    readonly onTouchMove: TouchEventHandler<HTMLElement>;
    readonly onTouchEnd: TouchEventHandler<HTMLElement>;
    readonly onTouchCancel: TouchEventHandler<HTMLElement>;
  };
}

interface UsePullToRefreshOptions {
  readonly onRefresh: () => Promise<unknown> | void;
  readonly enabled?: boolean;
}

/**
 * Page-scoped pull-to-refresh gesture detection.
 * The page owns the actual refresh work through onRefresh.
 */
export const usePullToRefresh = ({
  onRefresh,
  enabled = true,
}: UsePullToRefreshOptions): PullToRefreshState => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const touchTrackerRef = useRef<TouchTracker | null>(null);
  const lastUpdateTimeRef = useRef(0);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const resetTimerRef = useRef<number | null>(null);

  const setDisplayDistance = useCallback((distance: number) => {
    pullDistanceRef.current = distance;
    setPullDistance(distance);
  }, []);

  const cleanup = useCallback(() => {
    touchTrackerRef.current = null;
    setDisplayDistance(0);
    setIsDragging(false);
  }, [setDisplayDistance]);

  const finishRefresh = useCallback(() => {
    resetTimerRef.current = window.setTimeout(() => {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
      cleanup();
    }, CONFIG.RESET_DELAY_MS);
  }, [cleanup]);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setError(null);
    setDisplayDistance(60);

    try {
      await onRefresh();
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : "Refresh failed";
      setError(message);
    } finally {
      finishRefresh();
    }
  }, [finishRefresh, onRefresh, setDisplayDistance]);

  const getScrollY = useCallback(() => {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }, []);

  const handleTouchStart: TouchEventHandler<HTMLElement> = useCallback(
    (e) => {
      const scrollY = getScrollY();

      if (
        enabled &&
        scrollY < CONFIG.SCROLL_BUFFER &&
        e.touches.length === 1 &&
        !isRefreshingRef.current &&
        !isDragging
      ) {
        touchTrackerRef.current = {
          startY: e.touches[0].clientY,
          startTime: Date.now(),
        };
      }
    },
    [enabled, getScrollY, isDragging]
  );

  const handleTouchMove: TouchEventHandler<HTMLElement> = useCallback(
    (e) => {
      const tracker = touchTrackerRef.current;
      if (!tracker) return;

      const scrollY = getScrollY();

      // Guard: cancel if scrolled away
      if (scrollY !== 0) {
        touchTrackerRef.current = null;
        setIsDragging(false);
        setDisplayDistance(0);
        return;
      }

      const now = Date.now();
      if (now - lastUpdateTimeRef.current < CONFIG.THROTTLE_MS) {
        return;
      }
      lastUpdateTimeRef.current = now;

      const rawDistance = e.touches[0].clientY - tracker.startY;

      if (rawDistance <= 0) return;

      const displayDistance = Math.min(
        rawDistance * CONFIG.RESISTANCE,
        CONFIG.MAX_PULL_DISPLAY
      );

      if (!isDragging) {
        setIsDragging(true);
      }
      setDisplayDistance(displayDistance);

      if (displayDistance > 0) {
        e.preventDefault();
      }
    },
    [getScrollY, isDragging, setDisplayDistance]
  );

  const handleTouchEnd: TouchEventHandler<HTMLElement> = useCallback(
    () => {
      const tracker = touchTrackerRef.current;
      touchTrackerRef.current = null;

      if (!tracker) {
        setIsDragging(false);
        setPullDistance(0);
        return;
      }

      if (pullDistanceRef.current >= CONFIG.THRESHOLD) {
        void triggerRefresh();
      } else {
        setIsDragging(false);
        setDisplayDistance(0);
      }
    },
    [setDisplayDistance, triggerRefresh]
  );

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const containerProps = useMemo(
    () => ({
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    }),
    [handleTouchEnd, handleTouchMove, handleTouchStart]
  );

  return {
    pullDistance,
    isRefreshing,
    error,
    containerProps,
  };
};
