import type { PatioWithStatus, SunProfile, ConfidenceLevel } from "@/types/patio";
import type { AppSettings } from "@/types/app-settings";
import { calculateSeasonalScore } from "./seasonal-adjustment";

type TimeOfDay = 'morning' | 'midday' | 'afternoon';

/**
 * Determine current time bucket for Halifax (Atlantic Time)
 * Morning: before 11:30am
 * Midday: 11:30am–2:30pm
 * Afternoon: 2:30pm–sunset
 */
export function getCurrentTimeBucket(date: Date = new Date()): TimeOfDay {
  // Get Halifax time (UTC-4 in summer, UTC-3 in winter)
  const halifaxTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Halifax' }));
  const hours = halifaxTime.getHours();
  const minutes = halifaxTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  const MORNING_END = 11 * 60 + 30; // 11:30am
  const MIDDAY_END = 14 * 60 + 30;  // 2:30pm
  
  if (timeInMinutes < MORNING_END) return 'morning';
  if (timeInMinutes < MIDDAY_END) return 'midday';
  return 'afternoon';
}

/**
 * Get time-of-day alignment bonus
 */
function getTimeAlignmentBonus(sunProfile: SunProfile | null, currentTimeBucket: TimeOfDay): number {
  if (!sunProfile) return 0;
  
  if (sunProfile === currentTimeBucket) return 10;
  if (sunProfile === 'mixed') return 5;
  return 0;
}

/**
 * Get crowd feedback bonus (within 6 hours)
 */
function getCrowdBonus(
  sunnyVotes: number,
  notSunnyVotes: number,
  lastSunCheckAt: string | null,
  now: Date = new Date()
): number {
  if (!lastSunCheckAt) return 0;
  
  const lastCheck = new Date(lastSunCheckAt);
  const hoursSince = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
  
  if (hoursSince > 6) return 0;
  
  if (sunnyVotes > notSunnyVotes) return 10;
  if (notSunnyVotes > sunnyVotes) return -10;
  return 0;
}

/**
 * Get confidence adjustment
 */
function getConfidenceAdjustment(confidence: ConfidenceLevel | null | undefined): number {
  switch (confidence) {
    case 'high': return 5;
    case 'medium': return 0;
    case 'low': return -5;
    default: return 0;
  }
}

/**
 * Simple check if patio appears to be closed based on hours text
 * This is best-effort since hours is free text
 */
function appearsOpen(hours: string | null, now: Date = new Date()): boolean {
  if (!hours) return true; // No hours info = assume open
  
  const lowerHours = hours.toLowerCase();
  
  // Check for "closed" mentions
  if (lowerHours.includes('closed')) {
    // Check if permanently closed
    if (lowerHours.includes('permanently') || lowerHours.includes('seasonal')) {
      return false;
    }
    
    // Get current day
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    
    // Simple check: if today's day is mentioned with "closed"
    if (lowerHours.includes(today) && lowerHours.includes('closed')) {
      return false;
    }
  }
  
  return true;
}

export interface RightNowResult {
  patio: PatioWithStatus;
  rightNowScore: number;
  baseScore: number;
  whyNowText: string;
  bonuses: {
    timeAlignment: number;
    crowdFeedback: number;
    confidence: number;
  };
}

/**
 * Generate explanation text for why this patio is recommended
 */
function generateWhyNowText(
  patio: PatioWithStatus,
  currentTimeBucket: TimeOfDay,
  crowdBonus: number,
  timeBonus: number,
  baseScore: number
): string {
  // Priority 1: Recent sunny crowd feedback
  if (crowdBonus > 0 && patio.last_sun_check_at) {
    const lastCheck = new Date(patio.last_sun_check_at);
    const hoursSince = Math.round((Date.now() - lastCheck.getTime()) / (1000 * 60 * 60));
    if (hoursSince <= 1) {
      return "Sunny reports today";
    }
    return "Trending sunny this afternoon";
  }
  
  // Priority 2: Time-of-day match
  if (timeBonus >= 10) {
    const timeLabels: Record<TimeOfDay, string> = {
      morning: "Starting to brighten up",
      midday: "Bright right now",
      afternoon: "Perfect for afternoon sun"
    };
    return timeLabels[currentTimeBucket];
  }
  
  if (timeBonus >= 5 && patio.sun_profile === "mixed") {
    return "Some sun, some shade";
  }
  
  // Priority 3: High base sun score
  if (baseScore >= 90) {
    return "Catching the sun right now";
  }
  
  // Priority 4: Sheltered tag
  if (patio.tags?.includes("sheltered")) {
    return "Comfortable with changing light";
  }
  
  // Fallback
  return "Good light for this time of day";
}

/**
 * Calculate right-now score for a single patio
 */
export function calculateRightNowScore(
  patio: PatioWithStatus,
  settings: AppSettings,
  now: Date = new Date()
): RightNowResult {
  const currentTimeBucket = getCurrentTimeBucket(now);
  
  // Step 1: Base sun score
  let baseScore: number;
  if (settings.enable_seasonal_adjustment && patio.sun_score_tuned != null) {
    baseScore = patio.sun_score_tuned;
  } else if (settings.enable_seasonal_adjustment) {
    const seasonal = calculateSeasonalScore(
      patio.sun_score_base ?? patio.sun_score,
      patio.sun_profile as SunProfile | null,
      now
    );
    baseScore = seasonal.sunScoreTuned;
  } else {
    baseScore = patio.sun_score ?? 50;
  }
  
  // Step 2: Time-of-day alignment bonus
  const timeAlignment = getTimeAlignmentBonus(patio.sun_profile as SunProfile | null, currentTimeBucket);
  
  // Step 3: Fresh crowd signal (if enabled)
  let crowdFeedback = 0;
  if (settings.enable_crowd_sun_feedback) {
    crowdFeedback = getCrowdBonus(
      patio.sunny_votes ?? 0,
      patio.not_sunny_votes ?? 0,
      patio.last_sun_check_at ?? null,
      now
    );
  }
  
  // Step 4: Confidence adjustment (if enabled)
  let confidence = 0;
  if (settings.enable_confidence_level && patio.confidence_level) {
    confidence = getConfidenceAdjustment(patio.confidence_level as ConfidenceLevel);
  }
  
  // Calculate total and clamp
  const rawScore = baseScore + timeAlignment + crowdFeedback + confidence;
  const rightNowScore = Math.max(0, Math.min(100, rawScore));
  
  // Generate explanation
  const whyNowText = generateWhyNowText(
    patio,
    currentTimeBucket,
    crowdFeedback,
    timeAlignment,
    baseScore
  );
  
  return {
    patio,
    rightNowScore,
    baseScore,
    whyNowText,
    bonuses: {
      timeAlignment,
      crowdFeedback,
      confidence,
    },
  };
}

/**
 * Get best patios for right now
 */
export function getBestRightNow(
  patios: PatioWithStatus[],
  settings: AppSettings,
  now: Date = new Date(),
  limit: number = 5
): RightNowResult[] {
  const currentTimeBucket = getCurrentTimeBucket(now);
  
  // Filter patios
  const eligiblePatios = patios.filter(patio => {
    // Must be active
    if (!patio.is_active) return false;
    
    // Check if appears open
    if (!appearsOpen(patio.hours, now)) return false;
    
    // Exclude unknown profiles with no crowd data (unless no other results)
    // We'll handle this after initial filtering
    return true;
  });
  
  // Calculate scores
  const scored = eligiblePatios.map(patio => calculateRightNowScore(patio, settings, now));
  
  // Separate unknown-profile patios with no data
  const withData = scored.filter(r => {
    const hasProfile = r.patio.sun_profile && r.patio.sun_profile !== 'unknown';
    const hasCrowdData = settings.enable_crowd_sun_feedback && 
      (r.patio.sunny_votes ?? 0) + (r.patio.not_sunny_votes ?? 0) > 0;
    return hasProfile || hasCrowdData;
  });
  
  const unknownOnly = scored.filter(r => {
    const hasProfile = r.patio.sun_profile && r.patio.sun_profile !== 'unknown';
    const hasCrowdData = settings.enable_crowd_sun_feedback && 
      (r.patio.sunny_votes ?? 0) + (r.patio.not_sunny_votes ?? 0) > 0;
    return !hasProfile && !hasCrowdData;
  });
  
  // Sort by right_now_score DESC, then base score DESC
  const sortFn = (a: RightNowResult, b: RightNowResult) => {
    if (b.rightNowScore !== a.rightNowScore) {
      return b.rightNowScore - a.rightNowScore;
    }
    return b.baseScore - a.baseScore;
  };
  
  withData.sort(sortFn);
  unknownOnly.sort(sortFn);
  
  // Return top results, preferring patios with data
  const results = [...withData];
  if (results.length < limit) {
    results.push(...unknownOnly.slice(0, limit - results.length));
  }
  
  return results.slice(0, limit);
}
