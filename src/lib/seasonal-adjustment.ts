import type { SunProfile } from "@/types/patio";

type Season = 'winter' | 'spring' | 'summer' | 'fall';

/**
 * Get current season based on month (Northern Hemisphere)
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth(); // 0-11
  
  if (month >= 11 || month <= 1) return 'winter'; // Dec, Jan, Feb
  if (month >= 2 && month <= 4) return 'spring';  // Mar, Apr, May
  if (month >= 5 && month <= 7) return 'summer';  // Jun, Jul, Aug
  return 'fall'; // Sep, Oct, Nov
}

/**
 * Seasonal adjustment rules by sun_profile
 * Negative values = less sun expected
 */
const SEASONAL_ADJUSTMENTS: Record<SunProfile, Record<Season, number>> = {
  morning: {
    winter: -10,
    spring: -5,
    summer: 0,
    fall: -5,
  },
  midday: {
    winter: -5,
    spring: 0,
    summer: 0,
    fall: 0,
  },
  afternoon: {
    winter: 0,
    spring: 0,
    summer: 0,
    fall: -5,
  },
  mixed: {
    winter: -5,
    spring: -2,
    summer: 0,
    fall: -2,
  },
  unknown: {
    winter: 0,
    spring: 0,
    summer: 0,
    fall: 0,
  },
};

/**
 * Get seasonal adjustment note
 */
function getSeasonalNote(season: Season, adjustment: number): string | null {
  if (adjustment === 0) return null;
  
  if (season === 'winter' && adjustment <= -5) {
    return 'Winter light penalty';
  }
  if (season === 'fall' || season === 'spring') {
    return 'Shoulder-season slight reduction';
  }
  return null;
}

/**
 * Calculate tuned sun score with seasonal adjustment
 */
export function calculateSeasonalScore(
  sunScoreBase: number | null | undefined,
  sunProfile: SunProfile | null | undefined,
  date: Date = new Date()
): {
  sunScoreTuned: number;
  seasonalAdjustmentNotes: string | null;
  season: Season;
  adjustment: number;
} {
  const baseScore = sunScoreBase ?? 50;
  const profile: SunProfile = sunProfile || 'unknown';
  const season = getCurrentSeason(date);
  const adjustment = SEASONAL_ADJUSTMENTS[profile][season];
  
  // Clamp to 0-100
  const tunedScore = Math.max(0, Math.min(100, baseScore + adjustment));
  const notes = getSeasonalNote(season, adjustment);
  
  return {
    sunScoreTuned: tunedScore,
    seasonalAdjustmentNotes: notes,
    season,
    adjustment,
  };
}
