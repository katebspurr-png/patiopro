import type { PatioWithStatus, SunProfile } from "@/types/patio";
import type { ResolvedTimeOfDay } from "@/hooks/useTimeOfDay";
import type { WeatherData } from "@/hooks/useWeather";
import { getSunDerivedFields } from "./sun-profile";
import { getWeatherAdjustment } from "./weather-adjustment";

export interface LiveSunOutput {
  sun_score_live: number;
  sun_score_reason_live: string;
  best_time_to_visit_live: string;
}

export interface PatioWithLiveScore extends PatioWithStatus {
  sun_score_live: number;
  sun_score_reason_live: string;
  best_time_to_visit_live: string;
  wind_adjusted: boolean;
  wind_penalty: number;
}

/**
 * Orientation nudge based on time of day
 * East-facing = better in morning
 * South-facing = good midday
 * West-facing = better afternoon/evening
 */
function getOrientationNudge(
  orientation: string | null | undefined,
  timeOfDay: ResolvedTimeOfDay
): number {
  if (!orientation || orientation === "unknown") return 0;

  const nudges: Record<string, Record<ResolvedTimeOfDay, number>> = {
    east: { morning: 10, midday: 5, afternoon: -5, evening: -10 },
    south: { morning: 5, midday: 10, afternoon: 5, evening: 0 },
    west: { morning: -5, midday: 5, afternoon: 10, evening: 10 },
    north: { morning: 0, midday: -5, afternoon: 0, evening: -5 },
  };

  return nudges[orientation]?.[timeOfDay] ?? 0;
}

/**
 * Time alignment bonus based on sun_profile matching selected time
 */
function getTimeAlignmentBonus(
  sunProfile: SunProfile | null | undefined,
  timeOfDay: ResolvedTimeOfDay
): number {
  if (!sunProfile || sunProfile === "unknown") return 0;

  const bonuses: Record<SunProfile, Record<ResolvedTimeOfDay, number>> = {
    morning: { morning: 10, midday: 0, afternoon: -5, evening: -10 },
    midday: { morning: 0, midday: 10, afternoon: 5, evening: 0 },
    afternoon: { morning: -5, midday: 5, afternoon: 10, evening: 5 },
    all_day: { morning: 5, midday: 5, afternoon: 5, evening: 3 },
    mixed: { morning: 0, midday: 0, afternoon: 0, evening: 0 },
    unknown: { morning: 0, midday: 0, afternoon: 0, evening: 0 },
  };

  return bonuses[sunProfile]?.[timeOfDay] ?? 0;
}

/**
 * Generate reason text based on profile and time
 */
function generateReasonText(
  sunProfile: SunProfile | null | undefined,
  timeOfDay: ResolvedTimeOfDay,
  orientation: string | null | undefined
): string {
  const baseReason = getSunDerivedFields(sunProfile).sun_score_reason;
  
  // Add time-specific context
  const timeContext: Record<ResolvedTimeOfDay, string> = {
    morning: "morning light",
    midday: "peak sun",
    afternoon: "afternoon sun",
    evening: "evening light",
  };

  if (sunProfile === "all_day") {
    return `All-day sun • great for ${timeContext[timeOfDay]}`;
  }

  if (sunProfile === timeOfDay || 
      (sunProfile === "midday" && timeOfDay === "afternoon")) {
    return `Peak time • ${baseReason}`;
  }

  if (orientation && orientation !== "unknown") {
    const orientationLabels: Record<string, string> = {
      east: "east-facing",
      south: "south-facing", 
      west: "west-facing",
      north: "north-facing",
    };
    return `${orientationLabels[orientation]} • ${baseReason}`;
  }

  return baseReason;
}

/**
 * Pure function to compute live sun score for a patio based on selected time
 * This mirrors server-side logic but is display-only
 */
export function computeLiveSunScore(
  patio: PatioWithStatus,
  timeOfDay: ResolvedTimeOfDay,
  weather?: WeatherData | null
): LiveSunOutput {
  const sunProfile = patio.sun_profile as SunProfile | null;
  const baseFields = getSunDerivedFields(sunProfile);
  
  // Start with the stored base score
  const baseScore = patio.sun_score_base ?? patio.sun_score ?? baseFields.sun_score;
  
  // Apply time-based adjustments
  const orientationNudge = getOrientationNudge(patio.sun_orientation, timeOfDay);
  const timeAlignmentBonus = getTimeAlignmentBonus(sunProfile, timeOfDay);
  
  // Apply weather adjustment
  const weatherAdj = getWeatherAdjustment(weather ?? null);
  
  // Calculate live score, clamped 0-100
  const rawScore = baseScore + orientationNudge + timeAlignmentBonus + weatherAdj.total;
  const sun_score_live = Math.max(0, Math.min(100, rawScore));
  
  // Generate reason text with weather context
  let sun_score_reason_live = generateReasonText(
    sunProfile, 
    timeOfDay, 
    patio.sun_orientation
  );
  
  if (weatherAdj.label) {
    sun_score_reason_live += ` • ${weatherAdj.label}`;
  }
  
  // Best time can stay static or be computed
  const best_time_to_visit_live = baseFields.best_time_to_visit;

  return {
    sun_score_live,
    sun_score_reason_live,
    best_time_to_visit_live,
  };
}

/**
 * Compute live scores for all patios and return enhanced array
 */
export function computeAllLiveScores(
  patios: PatioWithStatus[],
  timeOfDay: ResolvedTimeOfDay,
  weather?: WeatherData | null
): PatioWithLiveScore[] {
  return patios.map((patio) => {
    const liveOutput = computeLiveSunScore(patio, timeOfDay, weather);
    return {
      ...patio,
      ...liveOutput,
    };
  });
}

/**
 * Sort patios by live score (descending)
 */
export function sortByLiveScore(patios: PatioWithLiveScore[]): PatioWithLiveScore[] {
  return [...patios].sort((a, b) => b.sun_score_live - a.sun_score_live);
}

/**
 * Time of day display labels
 */
export const TIME_OF_DAY_LABELS: Record<ResolvedTimeOfDay, string> = {
  morning: "Morning",
  midday: "Midday", 
  afternoon: "Afternoon",
  evening: "Evening",
};
