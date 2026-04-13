import { useMemo } from "react";
import { usePatiosWithStatus } from "./usePatios";
import { useAppSettings } from "./useAppSettings";
import { useWeather } from "./useWeather";
import { getBestRightNow, getCurrentTimeBucket, type RightNowResult } from "@/lib/right-now-score";

export interface BestRightNowState {
  results: RightNowResult[];
  allRanked: RightNowResult[];
  currentTimeBucket: 'morning' | 'midday' | 'afternoon';
  isLoading: boolean;
  error: Error | null;
  shouldFallback: boolean;
  fallbackReason: string | null;
}

const MINIMUM_THRESHOLD = 65;
const MINIMUM_RESULTS = 3;

export function useBestRightNow(limit: number = 5): BestRightNowState {
  const { data: patios, isLoading: patiosLoading, error: patiosError } = usePatiosWithStatus();
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useAppSettings();
  const { weather } = useWeather();
  
  const now = useMemo(() => new Date(), []);
  const currentTimeBucket = getCurrentTimeBucket(now);
  
  const { results, allRanked, shouldFallback, fallbackReason } = useMemo(() => {
    if (!patios || !settings) {
      return { results: [], allRanked: [], shouldFallback: false, fallbackReason: null };
    }
    
    const topResults = getBestRightNow(patios, settings, now, limit, weather);
    const allResults = getBestRightNow(patios, settings, now, patios.length, weather);
    
    // Check fallback conditions
    let shouldFallback = false;
    let fallbackReason: string | null = null;
    
    // Condition 1: Fewer than 3 patios meet minimum threshold
    const aboveThreshold = topResults.filter(r => r.rightNowScore >= MINIMUM_THRESHOLD);
    if (aboveThreshold.length < MINIMUM_RESULTS) {
      shouldFallback = true;
      fallbackReason = "Easy choices nearby right now";
    }
    
    // Condition 2: Top patio score < 65
    if (topResults.length > 0 && topResults[0].rightNowScore < MINIMUM_THRESHOLD) {
      shouldFallback = true;
      fallbackReason = "Good choices without going far";
    }
    
    // Condition 3: All patios have unknown sun_profile
    const allUnknown = topResults.every(r => 
      !r.patio.sun_profile || r.patio.sun_profile === "unknown"
    );
    if (topResults.length > 0 && allUnknown) {
      shouldFallback = true;
      fallbackReason = "Solid spots within a short walk";
    }
    
    return { results: topResults, allRanked: allResults, shouldFallback, fallbackReason };
  }, [patios, settings, weather, now, limit]);
  
  return {
    results,
    allRanked,
    currentTimeBucket,
    isLoading: patiosLoading || settingsLoading,
    error: patiosError || settingsError || null,
    shouldFallback,
    fallbackReason,
  };
}

/**
 * Get IDs of top patios for map highlighting
 */
export function useTopPatioIds(count: number = 3): string[] {
  const { results } = useBestRightNow(count);
  return useMemo(() => results.map(r => r.patio.id), [results]);
}
