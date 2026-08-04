/**
 * Deep Link Handler Service
 * 
 * Manages all deep linking for the Capacitor app
 * Handles:
 * - Property URLs: homilivo://property/123
 * - Auth URLs: homilivo://auth?token=xyz
 * - Review URLs: homilivo://review/123
 * 
 * Also supports web URLs when opened on the web
 * - /property/123
 * - /rooms/123
 * - /review/123
 * 
 * Production-grade error handling with fallbacks
 */

import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

/**
 * Parse a deep link URL and extract route information
 * Supports both native deep links (homilivo://...) and web URLs
 */
export interface DeepLinkRoute {
  type: "property" | "review" | "auth" | "unknown";
  propertyId?: string;
  reviewPropertyId?: string;
  token?: string;
  rawUrl: string;
}

/**
 * Parse a deep link URL and return structured route information
 * 
 * @param url - Deep link URL to parse
 * @returns Structured route information
 */
export const parseDeepLink = (url: string): DeepLinkRoute => {
  try {
    const parsed = new URL(url);

    // Handle native deep links (homilivo://...)
    if (parsed.protocol === "homilivo:") {
      const pathname = parsed.pathname;
      const hostname = parsed.hostname;
      
      // Extract route name from either hostname or pathname
      // homilivo://auth?token=xyz → hostname: "auth", pathname: "/"
      // homilivo:///auth?token=xyz → hostname: "", pathname: "/auth"
      let routeName = '';
      
      if (hostname) {
        // "auth" is in hostname (most common case from OAuth deep links)
        routeName = hostname.split('/')[0]; // Take first part in case of subdomains
      } else if (pathname && pathname !== '/') {
        // "auth" is in pathname
        routeName = pathname.replace(/^\/+/, '').split('/')[0];
      }
      
      // Property deep link: homilivo://property/123 or homilivo:///property/123
      if (pathname.startsWith("/property/")) {
        const propertyId = pathname.replace("/property/", "");
        if (propertyId) {
          return {
            type: "property",
            propertyId,
            rawUrl: url,
          };
        }
      }

      // Review deep link: homilivo://review/123 or homilivo:///review/123
      if (pathname.startsWith("/review/")) {
        const reviewPropertyId = pathname.replace("/review/", "");
        if (reviewPropertyId) {
          return {
            type: "review",
            reviewPropertyId,
            rawUrl: url,
          };
        }
      }

      // Auth deep link: homilivo://auth?token=xyz or homilivo:///auth?token=xyz
      // Check against extracted routeName (handles both hostname and pathname cases)
      if (routeName === "auth" || pathname === "/auth" || pathname === "/") {
        const token = parsed.searchParams.get("token");

        if (token) {
          return {
            type: "auth",
            token,
            rawUrl: url,
          };
        }
      }
    }

    // Handle web URLs (https://homilivo.com/property/123)
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      const pathname = parsed.pathname;

      // Web property URL: /property/123 or /rooms/123
      if (pathname.startsWith("/property/") || pathname.startsWith("/rooms/")) {
        const propertyId = pathname.split("/").pop();
        if (propertyId) {
          return {
            type: "property",
            propertyId,
            rawUrl: url,
          };
        }
      }

      // Web review URL: /review/123
      if (pathname.startsWith("/review/")) {
        const reviewPropertyId = pathname.split("/").pop();
        if (reviewPropertyId) {
          return {
            type: "review",
            reviewPropertyId,
            rawUrl: url,
          };
        }
      }

      // Auth URL: check for token
      const token = parsed.searchParams.get("token");
      if (token) {
        return {
          type: "auth",
          token,
          rawUrl: url,
        };
      }
    }

    return {
      type: "unknown",
      rawUrl: url,
    };
  } catch {
    return {
      type: "unknown",
      rawUrl: url,
    };
  }
};

/**
 * Navigate to a deep link route
 * Determines whether to use React Router navigation or browser redirect
 * 
 * @param route - Parsed deep link route
 * @param navigate - React Router navigate function
 */
export const handleDeepLink = async (route: DeepLinkRoute, navigate: (path: string) => void): Promise<void> => {
  try {
    switch (route.type) {
      case "property":
        if (route.propertyId) {
          // Navigate using React Router for SPA behavior
          navigate(`/property/${route.propertyId}`);
        }
        break;

      case "review":
        if (route.reviewPropertyId) {
          navigate(`/review/${route.reviewPropertyId}`);
        }
        break;

      case "auth":
        if (route.token) {
          // Save token to localStorage
          localStorage.setItem("kangaroo_token", route.token);
          
          // Close browser if opened from external link
          if (Capacitor.isNativePlatform()) {
            try {
              await Browser.close();
            } catch {}
          }
          
          // Navigate to dashboard
          navigate("/owner/dashboard");
        }
        break;

      case "unknown":
        navigate("/");
        break;
    }
  } catch {
    navigate("/");
  }
};

/**
 * Build a shareable deep link for a property
 * Can be used in WhatsApp messages, emails, etc.
 * 
 * When opened:
 * - On native app: Opens directly in the app (deep link)
 * - On web: Opens via regular web URL (fallback in case app not installed)
 * - On non-native: Opens web URL
 * 
 * @param propertyId - Property ID
 * @returns Deep link URL
 */
export const buildPropertyDeepLink = (propertyId: string): string => {
  // If on native platform, use deep link scheme
  if (Capacitor.isNativePlatform()) {
    return `homilivo://property/${propertyId}`;
  }

  // Otherwise use web URL
  return `/property/${propertyId}`;
};

/**
 * Get redirect URL for when app is not installed
 * Shares will use a web URL that has OG tags for social preview
 * 
 * @param propertyId - Property ID
 * @returns Web URL that can be shared
 */
export const getPropertyWebShareUrl = (propertyId: string): string => {
  return `/og/property/${propertyId}`;
};

/**
 * Check if string is a valid deep link format
 * Used to validate before processing
 * 
 * @param url - URL to check
 * @returns true if URL is a deep link
 */
export const isDeepLink = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "homilivo:";
  } catch {
    return false;
  }
};
