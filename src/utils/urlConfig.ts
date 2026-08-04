/**
 * Centralized URL Configuration
 * Single source of truth for all URL generation across the application
 *
 * Production-safe URL handling with proper environment-based fallbacks
 * Prevents localhost leakage to production environments
 *
 * Environment variables (must be set in .env.* files):
 * - VITE_SHARE_URL: Main frontend URL (e.g., https://homilivo.com)
 * - VITE_SHARE_URL: URL used for sharing (defaults to VITE_SHARE_URL)
 * - VITE_SHARE_URL: Base URL for OG images (defaults to VITE_SHARE_URL)
 */

/**
 * Validates URL to prevent localhost/internal URLs in production
 * Used to sanitize user-provided or legacy URLs
 */


const isLocalUrl = (url: string): boolean =>
  /^(https?:)?\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(url);

/**
 * Converts relative and protocol-relative URLs to absolute HTTPS URLs
 */

/**
 * Get the main frontend URL for canonical links and internal navigation
 * Used in:
 * - Canonical URL tags (for SEO)
 * - Internal redirects
 * - API response URLs
 */
export const getFrontendUrl = (): string => {
  const url = import.meta.env.VITE_FRONTEND_URL || "https://homilivo.com";

  return url.replace(/\/$/, "");
};

/**
 * Get the URL used for sharing (may differ from frontend URL in some cases)
 * Used in:
 * - Social media sharing links
 * - WhatsApp/email share URLs
 * - Copy-to-clipboard links
 */
export const getShareUrl = (): string => {
  const url = import.meta.env.VITE_SHARE_URL || getFrontendUrl();
  return url.replace(/\/$/, ""); // Remove trailing slash
};

/**
 * Get the base URL for OG images
 * Used in:
 * - og:image meta tags
 * - Twitter card images
 * - Social preview images
 */
export const getOgImageUrl = (): string => {
  const url = import.meta.env.VITE_SHARE_URL || getShareUrl();
  return url.replace(/\/$/, ""); // Remove trailing slash
};

/**
 * Build absolute URL with proper base
 * Used for any public URL that needs to be shared or indexed
 *
 * @param path - Path relative to domain (e.g., "/rooms/123" or "/og-image.png")
 * @param baseUrl - Optional base URL (defaults to getShareUrl)
 * @returns Absolute URL
 */
export const buildPublicUrl = (
  path: string,
  baseUrl = getShareUrl(),
): string => {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

/**
 * Build property sharing URL
 * This is the URL that gets shared on WhatsApp, email, etc.
 * Points to OG endpoint which generates social preview
 *
 * @param propertyId - Property ID
 * @returns Absolute sharing URL (e.g., https://homilivo.com/og/property/123)
 */
export const getPropertyShareUrl = (propertyId: string): string => {
  return buildPublicUrl(`/og/property/${propertyId}`);
};

/**
 * Build property detail URL (for canonical links and navigation)
 * This is the actual page URL that opens when share link is clicked
 *
 * @param propertyId - Property ID
 * @returns Absolute property URL (e.g., https://homilivo.com/property/123)
 */
export const getPropertyUrl = (propertyId: string): string => {
  return buildPublicUrl(`/property/${propertyId}`, getFrontendUrl());
};

/**
 * Build property review URL (for owner-specific links)
 * Used in WhatsApp messages to property owners
 *
 * @param propertyId - Property ID
 * @returns Absolute review URL
 */
export const getPropertyReviewUrl = (propertyId: string): string => {
  return buildPublicUrl(`/review/${propertyId}`, getFrontendUrl());
};

/**
 * Get default OG image with fallback handling
 * Used when property image is missing or invalid
 *
 * @returns Absolute OG image URL
 */
export const getDefaultOgImage = (): string => {
  return buildPublicUrl("/og-image.png", getOgImageUrl());
};

/**
 * Sanitize image URL to prevent localhost/internal URLs from being shared
 *
 * @param imageUrl - Raw image URL from database
 * @returns Safe absolute image URL or default OG image
 */
export const getSafeImageUrl = (imageUrl?: string | null): string => {
  if (!imageUrl) return getDefaultOgImage();

  // Already absolute
  if (/^https?:\/\//.test(imageUrl)) {
    return isLocalUrl(imageUrl) ? getDefaultOgImage() : imageUrl;
  }

  // Protocol-relative URL
  if (imageUrl.startsWith("//")) {
    const absoluteUrl = `https:${imageUrl}`;
    return isLocalUrl(absoluteUrl) ? getDefaultOgImage() : absoluteUrl;
  }

  // Relative URL
  if (imageUrl.startsWith("/")) {
    return buildPublicUrl(imageUrl, getShareUrl());
  }

  return getDefaultOgImage();
};

/**
 * Get deep link URL for opening property directly in app
 * Format: homilivo://property/123
 * Used in:
 * - Capacitor app URL handling
 * - Android app links
 * - Native app navigation
 *
 * @param propertyId - Property ID
 * @returns Deep link URL
 */
export const getPropertyDeepLink = (propertyId: string): string => {
  return `homilivo://property/${propertyId}`;
};

/**
 * Check if URL is localhost (unsafe for production)
 * Used to validate environment configuration
 *
 * @param url - URL to check
 * @returns true if URL is localhost
 */
export const isLocalhostUrl = (url: string): boolean => {
  return isLocalUrl(url);
};

/**
 * Validate production URLs (no localhost/internal IPs)
 * Should be called during initialization if in production
 *
 * @throws Error if localhost URL detected in production
 */
export const validateProductionUrls = (): void => {
  if (import.meta.env.PROD) {
    const frontendUrl = getFrontendUrl();
    const shareUrl = getShareUrl();

    if (isLocalUrl(frontendUrl) || isLocalUrl(shareUrl)) {
      throw new Error(
        "Production frontend and share URLs must not use localhost",
      );
    }
  }
};

/**
 * Get current configuration (useful for debugging)
 * Only logs in non-production or when explicitly requested
 */
export const getUrlConfig = () => {
  return {
    frontendUrl: getFrontendUrl(),
    shareUrl: getShareUrl(),
    ogImageUrl: getOgImageUrl(),
    defaultOgImage: getDefaultOgImage(),
    isProduction: import.meta.env.PROD,
  };
};

// Validate URLs on module load in production
// if (import.meta.env.PROD) {
//   validateProductionUrls();
// }
