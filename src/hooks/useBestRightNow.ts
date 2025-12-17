import { useMemo } from "react";
import { usePatiosWithStatus } from "./usePatios";
import { useAppSettings } from "./useAppSettings";
import { getBestRightNow, getCurrentTimeBucket, type RightNowResult } from "@/lib/right-now-score";

export interface BestRightNowState {
  results: RightNowResult[];
  allRanked: RightNowResult[];
  currentTimeBucket: 'morning' | 'midday' | 'afternoon';
  isLoading: boolean;
  error: Error | null;
}

export function useBestRightNow(limit: number = 5): BestRightNowState {
  const { data: patios, isLoading: patiosLoading, error: patiosError } = usePatiosWithStatus();
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useAppSettings();
  
  const now = useMemo(() => new Date(), []);
  const currentTimeBucket = getCurrentTimeBucket(now);
  
  const { results, allRanked } = useMemo(() => {
    if (!patios || !settings) {
      return { results: [], allRanked: [] };
    }
    
    const topResults = getBestRightNow(patios, settings, now, limit);
    const allResults = getBestRightNow(patios, settings, now, patios.length);
    
    return { results: topResults, allRanked: allResults };
  }, [patios, settings, now, limit]);
  
  return {
    results,
    allRanked,
    currentTimeBucket,
    isLoading: patiosLoading || settingsLoading,
    error: patiosError || settingsError || null,
  };
}

/**
 * Get IDs of top patios for map highlighting
 */
export function useTopPatioIds(count: number = 3): string[] {
  const { results } = useBestRightNow(count);
  return useMemo(() => results.map(r => r.patio.id), [results]);
}
