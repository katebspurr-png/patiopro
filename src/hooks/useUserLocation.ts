import { useState, useEffect, useCallback } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
  source: 'gps' | 'cached' | 'default';
  accuracy?: number;
}

// Downtown Halifax default location
const HALIFAX_DEFAULT: UserLocation = {
  lat: 44.6488,
  lng: -63.5752,
  source: 'default',
};

const LOCATION_CACHE_KEY = 'user_location_cache';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface CachedLocation {
  location: UserLocation;
  timestamp: number;
}

function getCachedLocation(): UserLocation | null {
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;
    
    const { location, timestamp }: CachedLocation = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }
    
    return { ...location, source: 'cached' };
  } catch {
    return null;
  }
}

function setCachedLocation(location: UserLocation): void {
  try {
    const cached: CachedLocation = {
      location,
      timestamp: Date.now(),
    };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

export interface UseUserLocationResult {
  location: UserLocation;
  isLoading: boolean;
  error: string | null;
  permissionDenied: boolean;
  requestLocation: () => void;
}

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<UserLocation>(() => {
    return getCachedLocation() || HALIFAX_DEFAULT;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: 'gps',
          accuracy: position.coords.accuracy,
        };
        setLocation(newLocation);
        setCachedLocation(newLocation);
        setIsLoading(false);
        setPermissionDenied(false);
      },
      (err) => {
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setError('Location permission denied');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location unavailable');
        } else if (err.code === err.TIMEOUT) {
          setError('Location request timed out');
        }
        // Fall back to cached or default - already set
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  // Try to get location on mount (only if we don't have GPS location)
  useEffect(() => {
    if (location.source === 'default') {
      requestLocation();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    location,
    isLoading,
    error,
    permissionDenied,
    requestLocation,
  };
}

/**
 * Calculate distance between two points in meters using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Get walking time estimate (assumes 5 km/h walking speed)
 */
export function getWalkingTime(meters: number): string {
  const minutes = Math.round(meters / 83.33); // 5 km/h = 83.33 m/min
  if (minutes < 1) return '< 1 min walk';
  if (minutes === 1) return '1 min walk';
  return `${minutes} min walk`;
}
