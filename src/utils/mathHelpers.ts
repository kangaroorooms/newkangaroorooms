/**
 * Mathematical utility functions for consistent calculations across frontend and backend
 * 
 * Primary use cases:
 * - Percentage calculations with consistent rounding
 * - Ratio calculations
 * - Safe number formatting
 */

/**
 * Calculate percentage with consistent rounding
 * 
 * @param value - Numerator
 * @param total - Denominator (safe divide by zero)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage as decimal (e.g., 12.5 for 12.5%)
 * 
 * @example
 * calculatePercentage(3, 10) // returns 30.0
 * calculatePercentage(1, 3, 2) // returns 33.33
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimals: number = 1
): number {
  if (total === 0) return 0;
  const multiplier = Math.pow(10, decimals + 2);
  return Math.round((value / total) * multiplier) / Math.pow(10, decimals);
}

/**
 * Calculate ratio safely (prevents division by zero)
 * 
 * @param numerator - Top of ratio
 * @param denominator - Bottom of ratio
 * @param fallback - Value to return if denominator is 0 (default: 0)
 * @returns Safe ratio calculation
 */
export function safeRatio(
  numerator: number,
  denominator: number,
  fallback: number = 0
): number {
  return denominator === 0 ? fallback : numerator / denominator;
}

/**
 * Safe number with fallback for undefined/NaN values
 * 
 * @param value - Value to ensure is a number
 * @param fallback - Default if value is not a valid number (default: 0)
 * @returns Valid number or fallback
 */
export function ensureNumber(value: unknown, fallback: number = 0): number {
  const num = typeof value === 'number' ? value : parseFloat(value as string);
  return Number.isNaN(num) ? fallback : num;
}

/**
 * Clamp a number between min and max
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
