import { useMemo } from "react";
import { usePatiosWithStatus } from "./usePatios";
import { useAppSettings } from "./useAppSettings";
import { useUserLocation } from "./useUserLocation";
import { getBestNearYou, type NearYouResult } from "@/lib/near-you-score";

export interface BestNearYouState {
  results: NearYouResult[];
  allRanked: NearYouResult[];
  isLoading: boolean;
  error: Error | null;
  locationSource: 'gps' | 'cached' | 'default';
  requestLocation: () => void;
}

export function useBestNearYou(limit: number = 5): BestNearYouState {
  const { data: patios, isLoading: patiosLoading, error: patiosError } = usePatiosWithStatus();
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useAppSettings();
  const { location, isLoading: locationLoading, requestLocation } = useUserLocation();
  
  const now = useMemo(() => new Date(), []);
  
  const { results, allRanked } = useMemo(() => {
    if (!patios || !settings) {
      return { results: [], allRanked: [] };
    }
    
    const topResults = getBestNearYou(patios, location, settings, now, limit);
    const allResults = getBestNearYou(patios, location, settings, now, patios.length);
    
    return { results: topResults, allRanked: allResults };
  }, [patios, settings, location, now, limit]);
  
  return {
    results,
    allRanked,
    isLoading: patiosLoading || settingsLoading || locationLoading,
    error: patiosError || settingsError || null,
    locationSource: location.source,
    requestLocation,
  };
}
