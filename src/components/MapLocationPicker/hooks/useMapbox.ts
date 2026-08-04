import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl, { Map } from 'mapbox-gl';
import { getFallbackCenter, hasValidCoordinates } from '../utils/mapHelpers';

interface UseMapboxOptions {
  token?: string;
  latitude?: number | null;
  longitude?: number | null;
  defaultCity?: string;
  onMapReady?: () => void;
  onMapClick?: (latitude: number, longitude: number) => void;
}

export const useMapbox = ({
  token,
  latitude,
  longitude,
  defaultCity,
  onMapReady,
  onMapClick,
}: UseMapboxOptions) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const clickHandlerRef = useRef<((event: mapboxgl.MapMouseEvent) => void) | null>(null);
  const initialCoordinatesRef = useRef<[number, number] | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const clearMarker = useCallback(() => {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !token) {
      return undefined;
    }

    if (!initialCoordinatesRef.current) {
      const initialCoordinates = hasValidCoordinates(latitude, longitude)
        ? ([longitude as number, latitude as number] as [number, number])
        : getFallbackCenter(defaultCity);
      initialCoordinatesRef.current = initialCoordinates;
    }

    mapboxgl.accessToken = token;

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCoordinatesRef.current,
      zoom: 13,
      interactive: true,
      dragPan: true,
      doubleClickZoom: true,
      touchZoomRotate: true,
      scrollZoom: true,
      boxZoom: true,
      keyboard: true,
      pitchWithRotate: true,
      minZoom: 5,
      maxZoom: 18,
    });

    mapRef.current = mapInstance;

    const canvasContainer = mapInstance.getCanvasContainer();
    canvasContainer.style.cursor = 'crosshair';

    const nav = new mapboxgl.NavigationControl({ showCompass: true, showZoom: true });
    mapInstance.addControl(nav, 'top-right');
    mapInstance.addControl(new mapboxgl.ScaleControl({ maxWidth: 80, unit: 'metric' }), 'bottom-right');

    const handleMapLoad = () => {
      setIsMapReady(true);
      onMapReady?.();
    };

    const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
      const { lng, lat } = event.lngLat;
      onMapClick?.(lat, lng);
    };

    clickHandlerRef.current = handleMapClick;
    mapInstance.on('click', handleMapClick);
    mapInstance.once('load', handleMapLoad);

    return () => {
      if (clickHandlerRef.current && mapRef.current) {
        mapRef.current.off('click', clickHandlerRef.current);
        clickHandlerRef.current = null;
      }

      clearMarker();

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      setIsMapReady(false);
    };
  }, [token, defaultCity, onMapReady, onMapClick]);

  return {
    mapContainerRef,
    mapRef,
    markerRef,
    isMapReady,
    clearMarker,
  };
};
