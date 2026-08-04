/**
 * Analytics Adapters
 * 
 * Lightweight utilities for transforming and formatting analytics data.
 * Single source of truth for analytics transformations to prevent duplication.
 * 
 * RULE: Only add transformations here if meaningfully used across multiple tabs.
 * Do NOT create a generic analytics framework.
 */

/**
 * Format date string for chart display
 * Used across: Freshness, Recovery, Reminders, Workload tabs
 */
export const formatChartDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/**
 * Map trend direction to human-readable description
 * Used in: Overview, Freshness, Recovery, RemindersTab, FalsePositives
 */
export const getTrendDescription = (trend: "up" | "down" | "stable"): string => {
  const descriptions: Record<"up" | "down" | "stable", string> = {
    up: "improving",
    down: "declining",
    stable: "stable",
  };
  return descriptions[trend] ?? "unknown";
};

/**
 * Map reminder effectiveness status to user-friendly label
 * Used in: Reminders tab, Overview
 */
export const getEffectivenessLabel = (
  effectiveness: "highly_effective" | "moderately_effective" | "low_effectiveness" | string
): string => {
  const labels: Record<string, string> = {
    highly_effective: "Highly Effective",
    moderately_effective: "Moderately Effective",
    low_effectiveness: "Low Effectiveness",
  };
  return labels[effectiveness] ?? "Unknown";
};

/**
 * Safe percentage parsing from string format (e.g., "23.5%")
 * Used in: False Positives tab (API returns percentages as strings)
 */
export const parsePercentageString = (percentStr: string | number): number => {
  if (typeof percentStr === "number") return percentStr;
  if (!percentStr) return 0;
  return parseFloat(percentStr.toString().replace("%", "")) || 0;
};

/**
 * Format number as percentage with consistent decimal places
 */
export const formatPercentage = (value: number | undefined, decimals: number = 1): string => {
  if (value === undefined || value === null) return "0%";
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Safe numeric access with fallback
 * Prevents NaN when API returns undefined numeric fields
 */
export const safeNumber = (value: unknown, fallback: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

/**
 * Transform historical data points with safe access and formatting
 * Prevents crashes on missing fields while preserving type safety
 */
export const transformHistoricalSnapshots = <T extends { date: string }>(
  snapshots: T[] | undefined | null
): Array<T & { formattedDate: string }> => {
  if (!snapshots?.length) return [];
  return snapshots.map((snapshot) => ({
    ...snapshot,
    formattedDate: formatChartDate(snapshot.date),
  }));
};

/**
 * Transform false positive reasons (API returns tuples [reason, count])
 * Safe handling of array access with fallback
 */
export const transformFalsePositiveReasons = (
  reasons: Array<[string, number]> | undefined | null
): Array<{ name: string; value: number }> => {
  if (!reasons?.length) return [];
  return reasons.map(([name, value]) => ({
    name,
    value: safeNumber(value),
  }));
};

/**
 * Trend mapping for false positives and consistency metrics
 * Handles "up"/"down"/"stable" with consistent label generation
 */
export const getTrendStatus = (
  trend: "up" | "down" | "stable" | string | undefined,
  prefix: string = ""
): string => {
  if (!trend) return "stable";
  
  const trendMap: Record<string, string> = {
    up: `${prefix} increasing`,
    down: `${prefix} decreasing`,
    stable: "stable",
  };
  
  return trendMap[trend] ?? "unknown";
};

/**
 * Safe chart data transformation preventing NaN on undefined values
 */
export const transformChartData = <T extends Record<string, unknown>>(
  sourceData: T[] | undefined,
  transformer: (item: T) => Record<string, unknown>
): Record<string, unknown>[] => {
  if (!sourceData?.length) return [];
  return sourceData.map(transformer).filter((item) => Object.values(item).every((v) => !isNaN(v as any)));
};
