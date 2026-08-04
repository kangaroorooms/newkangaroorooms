/**
 * PRODUCTION COMPONENT: Pull-to-Refresh Visual Indicator
 *
 * Memoized to prevent parent re-renders
 * Accessibility: ARIA labels for screen readers
 * Industry standard: Tailwind CSS, React.memo
 */

import React, { useMemo } from "react";

interface PullToRefreshIndicatorProps {
  readonly pullDistance: number;
  readonly isRefreshing: boolean;
  readonly error: string | null;
}

const INDICATOR_CONFIG = {
  TOP_OFFSET: "top-20", // Below navbar (z-50)
  Z_INDEX: "z-40",
  MIN_PULL_VISIBLE: 20, // px - fade in starts
  MAX_PULL_FOR_OPACITY: 80, // px - full opacity at threshold
  MIN_ROTATION: 0,
  MAX_ROTATION: 180, // degrees at threshold
} as const;

export const PullToRefreshIndicator = React.memo(
  function PullToRefreshIndicatorMemo({
    pullDistance,
    isRefreshing,
    error,
  }: PullToRefreshIndicatorProps) {
    // Calculated opacity: fade in gradually
    const opacity = useMemo(() => {
      const { MIN_PULL_VISIBLE, MAX_PULL_FOR_OPACITY } = INDICATOR_CONFIG;
      if (pullDistance < MIN_PULL_VISIBLE) return 0;
      if (pullDistance > MAX_PULL_FOR_OPACITY) return 1;
      return (
        (pullDistance - MIN_PULL_VISIBLE) /
        (MAX_PULL_FOR_OPACITY - MIN_PULL_VISIBLE)
      );
    }, [pullDistance]);

    // Spinner rotation based on pull

    return (
      <div
        className={`fixed ${INDICATOR_CONFIG.TOP_OFFSET} left-0 right-0 flex justify-center ${INDICATOR_CONFIG.Z_INDEX} pointer-events-none`}
        style={{
          transform: `translateY(${Math.max(-80, pullDistance - 80)}px)`,
          transition: isRefreshing
            ? "none"
            : "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          opacity,
        }}
        role="status"
        aria-live="polite"
        aria-label="Refreshing content"
      >
        <div className="flex items-center justify-center">
          {/* Icon: Spinner / Error / Chevron */}
          <div className="relative w-8 h-8" aria-hidden="true">
            <div
              className={`
  w-8 h-8 rounded-full border-2 border-[#D4AF37]
  flex items-center justify-center
`}
              style={{
                transform: `scale(${Math.max(
                  0.6,
                  Math.min(pullDistance / 80, 1),
                )})`,
                transition: "transform 0.15s ease",
              }}
            >
              {isRefreshing && <LoadingSpinner />}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

PullToRefreshIndicator.displayName = "PullToRefreshIndicator";

const LoadingSpinner = () => (
  <svg
    className="w-8 h-8 text-blue-500 animate-spin"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
