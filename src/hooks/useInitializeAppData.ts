/**
 * useInitializeAppData
 * 
 * Single-source hook for initializing common app data
 * Ensures each API is called only ONCE per app load
 * 
 * Loads:
 * - Cities (for city selection)
 * - Amenities (for property listings)
 * - Platform stats (for homepage display)
 * 
 * Usage in App.tsx:
 * useInitializeAppData();
 */

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadAmenities, loadCities, loadMetadataRegistry } from '../store/slices/metadata.slice';
import { fetchPlatformStats } from '../store/slices/stats.slice';

// Prevent multiple initializations
let hasInitialized = false;

export function useInitializeAppData() {
  const dispatch = useAppDispatch();
  const initCountRef = useRef(0);
  const { amenities, cities, registry } = useAppSelector((state: any) => state.metadata);
  const { platform: stats } = useAppSelector((state: any) => state.stats);

  useEffect(() => {
    initCountRef.current++;

    // Only initialize once per app lifecycle
    if (hasInitialized) {
      return;
    }

    // ℹ️ NOTE: Cities API removed from global init
    // Cities are now loaded ONLY when needed in:
    // - AddPropertyModal (on first open)
    // - EditPropertyModal (on first open)
    // This prevents unnecessary API calls for users who never edit properties

    // ✅ STEP 1: Load cities (displayed on homepage, needed for city selection)
    if (cities.length === 0) {
      dispatch(loadCities());
    }

    // ✅ STEP 2: Load amenities (used on Pricing page, property listings)
    if (amenities.length === 0) {
      dispatch(loadAmenities());
    }

    // ✅ STEP 3: Load shared metadata registry foundation
    if (!registry) {
      dispatch(loadMetadataRegistry());
    }

    // ✅ STEP 4: Load platform stats (displayed on homepage)
    if (!stats) {
      dispatch(fetchPlatformStats());
    }

    hasInitialized = true;
  }, []); // Empty dependency array - run only once
}

/**
 * Reset initialization flag (useful for testing/debugging)
 */
export function resetAppInitialization() {
  hasInitialized = false;
}
