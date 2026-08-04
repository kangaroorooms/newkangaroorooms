/**
 * Role Utilities
 * 
 * Centralized role normalization and comparison utilities.
 * Ensures consistent role handling across frontend and backend.
 */

/**
 * Normalize role to uppercase for consistent comparison
 * 
 * @param role - Role string (may be lowercase, uppercase, or mixed case)
 * @returns Uppercase role string or empty string if role is undefined/null
 * 
 * @example
 * normalizeRole('agent') // 'AGENT'
 * normalizeRole('AGENT') // 'AGENT'
 * normalizeRole('Agent') // 'AGENT'
 * normalizeRole(undefined) // ''
 */
export const normalizeRole = (role?: string | null): string => {
  return String(role || '').toUpperCase();
};

/**
 * Check if role matches expected role (case-insensitive)
 * 
 * @param role - Role to check
 * @param expectedRole - Expected role value (e.g., 'AGENT', Role.AGENT)
 * @returns true if roles match (case-insensitive)
 * 
 * @example
 * isRole('agent', 'AGENT') // true
 * isRole('AGENT', 'AGENT') // true
 * isRole('tenant', 'AGENT') // false
 */
export const isRole = (role: string | null | undefined, expectedRole: string): boolean => {
  return normalizeRole(role) === normalizeRole(expectedRole);
};
