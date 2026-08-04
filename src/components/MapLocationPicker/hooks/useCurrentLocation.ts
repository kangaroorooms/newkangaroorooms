import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentPosition } from '../services/platformLocationService';

interface UseCurrentLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface UseCurrentLocationResult {
  locate: () => Promise<{ coords: { latitude: number; longitude: number; accuracy: number | null; altitude: number | null; altitudeAccuracy: number | null; heading: number | null; speed: number | null }; timestamp: number } | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useCurrentLocation = ({
  enableHighAccuracy = false,
  timeout = 15000,
  maximumAge = 10000,
}: UseCurrentLocationOptions = {}): UseCurrentLocationResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      inFlightRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const locate = useCallback(async () => {
    if (inFlightRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setLoading(true);
    setError(null);

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      const { position, error: locationError } = await getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge,
      });

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return null;
      }

      if (locationError) {
        setError(locationError.message);
        return null;
      }

      return position;
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        inFlightRef.current = false;
        setLoading(false);
      }
    }
  }, [enableHighAccuracy, maximumAge, timeout]);

  return { locate, loading, error, clearError };
};
