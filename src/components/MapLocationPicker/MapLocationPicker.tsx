import React, { useCallback, useEffect, useRef } from 'react';
import { AlertCircle, Loader2, MapPin } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '../ui/Button';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import { useMapbox } from './hooks/useMapbox';
import { getMarkerElementConfig, hasValidCoordinates } from './utils/mapHelpers';

interface MapLocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (latitude: number | null, longitude: number | null) => void;
  defaultCity?: string;
  showLabel?: boolean;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  latitude,
  longitude,
  onChange,
  defaultCity = 'bangalore',
  showLabel = true,
}) => {
  const { locate, loading: isGeoLocating, error: locationError, clearError } = useCurrentLocation();
  const hasCoordinates = hasValidCoordinates(latitude, longitude);
  const lastSyncedCoordinatesRef = useRef<[number, number] | null>(null);

  const handleMapReady = useCallback(() => {
    clearError();
  }, [clearError]);

  const handleMapClick = useCallback(
    (latitudeValue: number, longitudeValue: number) => {
      onChange(latitudeValue, longitudeValue);
    },
    [onChange],
  );

  const { mapContainerRef, mapRef, markerRef, isMapReady, clearMarker } = useMapbox({
    token: import.meta.env.VITE_MAPBOX_TOKEN,
    latitude,
    longitude,
    defaultCity,
    onMapReady: handleMapReady,
    onMapClick: handleMapClick,
  });

  useEffect(() => {
    if (!mapRef.current || !isMapReady) {
      return;
    }

    if (!hasCoordinates) {
      clearMarker();
      lastSyncedCoordinatesRef.current = null;
      return;
    }

    const nextCoordinates: [number, number] = [longitude as number, latitude as number];

    if (markerRef.current) {
      markerRef.current.setLngLat(nextCoordinates);
    } else {
      const markerElement = document.createElement('div');
      const markerConfig = getMarkerElementConfig();
      markerElement.className = markerConfig.className;
      markerElement.innerHTML = markerConfig.innerHTML;

      markerRef.current = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(nextCoordinates)
        .addTo(mapRef.current);
    }
  }, [clearMarker, hasCoordinates, isMapReady, latitude, longitude]);

  useEffect(() => {
    if (!mapRef.current || !isMapReady || !hasCoordinates) {
      return;
    }

    const nextCoordinates: [number, number] = [longitude as number, latitude as number];
    const previousCoordinates = lastSyncedCoordinatesRef.current;

    if (
      previousCoordinates &&
      previousCoordinates[0] === nextCoordinates[0] &&
      previousCoordinates[1] === nextCoordinates[1]
    ) {
      return;
    }

    mapRef.current.flyTo({
      center: nextCoordinates,
      zoom: 16,
      duration: 900,
      essential: false,
      pitch: 0,
    });

    lastSyncedCoordinatesRef.current = nextCoordinates;
  }, [hasCoordinates, isMapReady, latitude, longitude]);

  const handleUseCurrentLocation = useCallback(async () => {
    const position = await locate();
    if (position) {
      onChange(position.coords.latitude, position.coords.longitude);
    }
  }, [locate, onChange]);

  const clearLocation = useCallback(() => {
    clearMarker();
    lastSyncedCoordinatesRef.current = null;
    onChange(null, null);
  }, [clearMarker, onChange]);

  return (
    <div className="space-y-3">
      {showLabel && (
        <label className="block text-sm font-bold text-navy dark:text-white">
          <MapPin className="w-4 h-4 inline mr-2 text-gold" />
          Property Location (Optional)
        </label>
      )}

      {locationError && (
        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{locationError}</p>
        </div>
      )}

      <div className="relative z-0 isolate">
        <div
          ref={mapContainerRef}
          className="w-full h-64 md:h-80 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden bg-slate-100 dark:bg-slate-700"
        />

        {isGeoLocating ? (
          <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-gold" />
              <span className="text-sm font-medium text-navy dark:text-white">
                Getting your location...
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        {hasCoordinates && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Location</p>
            <p className="text-sm font-mono text-navy dark:text-white">
              {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Click on map to change location
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={isGeoLocating}
            className="flex-1"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {isGeoLocating ? 'Locating...' : 'Use Current Location'}
          </Button>

          {hasCoordinates && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={clearLocation}
              className="flex-1"
            >
              Clear Location
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        💡 <span className="font-medium">Tip:</span> Click anywhere on the map to set your property location, or use your current location.
      </p>
    </div>
  );
};

export default MapLocationPicker;
