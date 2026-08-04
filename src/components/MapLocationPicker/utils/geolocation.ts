export interface GeolocationState {
  loading: boolean;
  error: string | null;
}

export const normalizeGeolocationError = (error: unknown): string => {
  if (error instanceof GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access was denied. Please enable location permissions and try again.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information is currently unavailable. Please try again.';
      case error.TIMEOUT:
        return 'Location request timed out. Please try again.';
      default:
        return 'Unable to determine your location right now.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unable to determine your location right now.';
};
