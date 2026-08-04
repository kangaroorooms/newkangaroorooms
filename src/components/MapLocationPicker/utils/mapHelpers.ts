export const DEFAULT_COORDS: Record<string, [number, number]> = {
  bangalore: [77.6412, 12.9716],
  mumbai: [72.8777, 19.0760],
  delhi: [77.1025, 28.7041],
  hyderabad: [78.4867, 17.3850],
  pune: [73.8479, 18.5204],
  chennai: [80.2707, 13.0827],
  Bangalore: [77.6412, 12.9716],
  Mumbai: [72.8777, 19.0760],
  Delhi: [77.1025, 28.7041],
  Hyderabad: [78.4867, 17.3850],
  Pune: [73.8479, 18.5204],
  Chennai: [80.2707, 13.0827],
};

export const DEFAULT_FALLBACK_COORDS: [number, number] = [77.6412, 12.9716];

export const hasValidCoordinates = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean => {
  return typeof latitude === 'number' && Number.isFinite(latitude) && typeof longitude === 'number' && Number.isFinite(longitude);
};

export const getFallbackCenter = (defaultCity?: string): [number, number] => {
  const normalizedCity = defaultCity?.trim();
  if (normalizedCity) {
    const cityCoords = DEFAULT_COORDS[normalizedCity];
    if (cityCoords) {
      return cityCoords;
    }
  }

  return DEFAULT_FALLBACK_COORDS;
};

export const getMarkerElementConfig = () => ({
  className: 'w-8 h-8 bg-gold rounded-full border-2 border-white shadow-lg flex items-center justify-center',
  innerHTML: '<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C7.04 0 3 4.04 3 9c0 5.25 9 15 9 15s9-9.75 9-15c0-4.96-4.04-9-9-9zm0 12c-1.66 0-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>',
});
