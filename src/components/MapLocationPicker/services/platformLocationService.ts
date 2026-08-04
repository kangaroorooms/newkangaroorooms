import { Capacitor } from '@capacitor/core';
import { Geolocation, type Position as CapacitorPosition } from '@capacitor/geolocation';

export type LocationErrorKind = 'permission-denied' | 'timeout' | 'unavailable' | 'unsupported' | 'unknown';

export interface PlatformLocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export interface PlatformLocationError {
  kind: LocationErrorKind;
  message: string;
}

interface GetCurrentPositionOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const getCurrentPosition = async ({
  enableHighAccuracy = false,
  timeout = 15000,
  maximumAge = 10000,
}: GetCurrentPositionOptions = {}): Promise<{
  position: PlatformLocationPosition | null;
  error: PlatformLocationError | null;
}> => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      position: null,
      error: {
        kind: 'unsupported',
        message: 'Geolocation is not supported in this browser.',
      },
    };
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const permissionStatus = await Geolocation.checkPermissions();
      if (permissionStatus.location !== 'granted') {
        const requestedPermissions = await Geolocation.requestPermissions();
        if (requestedPermissions.location !== 'granted') {
          return {
            position: null,
            error: {
              kind: 'permission-denied',
              message: 'Location access was denied. Please enable location permissions and try again.',
            },
          };
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge,
      });

      return {
        position: normalizeCapacitorPosition(position),
        error: null,
      };
    } catch (error) {
      return {
        position: null,
        error: normalizeLocationError(error),
      };
    }
  }

  if (!('geolocation' in navigator)) {
    return {
      position: null,
      error: {
        kind: 'unsupported',
        message: 'Geolocation is not supported in this browser.',
      },
    };
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy,
        timeout,
        maximumAge,
      });
    });

    return {
      position: normalizeBrowserPosition(position),
      error: null,
    };
  } catch (error) {
    return {
      position: null,
      error: normalizeLocationError(error),
    };
  }
};

const normalizeBrowserPosition = (position: GeolocationPosition): PlatformLocationPosition => ({
  coords: {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? null,
    altitude: position.coords.altitude ?? null,
    altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
    heading: position.coords.heading ?? null,
    speed: position.coords.speed ?? null,
  },
  timestamp: position.timestamp,
});

const normalizeCapacitorPosition = (position: CapacitorPosition): PlatformLocationPosition => ({
  coords: {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? null,
    altitude: position.coords.altitude ?? null,
    altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
    heading: position.coords.heading ?? null,
    speed: position.coords.speed ?? null,
  },
  timestamp: position.timestamp,
});

export const normalizeLocationError = (error: unknown): PlatformLocationError => {
  if (typeof error === 'object' && error !== null) {
    const maybeCode = 'code' in error ? Number((error as { code?: unknown }).code) : undefined;
    const maybeMessage = 'message' in error ? String((error as { message?: unknown }).message) : '';

    if (maybeCode === 1 || /denied|permission/i.test(maybeMessage)) {
      return {
        kind: 'permission-denied',
        message: 'Location access was denied. Please enable location permissions and try again.',
      };
    }

    if (maybeCode === 3 || /timeout/i.test(maybeMessage)) {
      return {
        kind: 'timeout',
        message: 'Location request timed out. Please try again.',
      };
    }

    if (maybeCode === 2 || /unavailable|not available/i.test(maybeMessage)) {
      return {
        kind: 'unavailable',
        message: 'Location information is currently unavailable. Please try again.',
      };
    }

    if (/unsupported|not supported/i.test(maybeMessage)) {
      return {
        kind: 'unsupported',
        message: 'Geolocation is not supported in this browser.',
      };
    }
  }

  return {
    kind: 'unknown',
    message: 'Unable to determine your location right now.',
  };
};
