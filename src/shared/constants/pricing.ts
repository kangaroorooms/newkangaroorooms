/**
 * Pricing Constants
 * 
 * Single source of truth for all pricing values across the application.
 * All pricing must reference these constants - no hardcoded values allowed.
 */

// ============================================================================
// PROPERTY CONCIERGE PRICING
// ============================================================================

/**
 * Property Concierge service price in rupees
 */
export const PROPERTY_CONCIERGE_PRICE = 499;

/**
 * Property Concierge service price in paise (for Razorpay)
 * Razorpay requires amounts in paise (1 rupee = 100 paise)
 */
export const PROPERTY_CONCIERGE_PRICE_PAISE = 49900;

/**
 * Property Concierge service display name
 */
export const PROPERTY_CONCIERGE_NAME = 'Property Concierge';

/**
 * Property Concierge service description
 */
export const PROPERTY_CONCIERGE_DESCRIPTION = 'Assisted Property Service Booking';
