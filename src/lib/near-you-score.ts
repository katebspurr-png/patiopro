import type { PatioWithStatus } from "@/types/patio";
import type { AppSettings } from "@/types/app-settings";
import type { UserLocation } from "@/hooks/useUserLocation";
import { calculateDistance } from "@/hooks/useUserLocation";
import { calculateSeasonalScore } from "./seasonal-adjustment";
import type { SunProfile } from "@/types/patio";

export interface NearYouResult {
  patio: PatioWithStatus;
  nearYouScore: number;
  distanceMeters: number;
  distanceScore: number;
  sunBonus: number;
  tagBoost: number;
  whyNearText: string;
}

/**
 * Get distance score based on meters from user
 */
function getDistanceScore(meters: number): number {
  if (meters <= 500) return 50;
  if (meters <= 1000) return 40;
  if (meters <= 2000) return 30;
  if (meters <= 4000) return 15;
  return 0;
}

/**
 * Get tag boost (max one)
 */
function getTagBoost(tags: string[] | null): number {
  if (!tags) return 0;
  
  const boostTags = ['waterfront', 'beer_garden', 'rooftop'];
  for (const tag of boostTags) {
    if (tags.includes(tag)) return 5;
  }
  return 0;
}

/**
 * Simple check if patio appears to be closed based on hours text
 */
function appearsOpen(hours: string | null, now: Date = new Date()): boolean {
  if (!hours) return true;
  
  const lowerHours = hours.toLowerCase();
  
  if (lowerHours.includes('closed')) {
    if (lowerHours.includes('permanently') || lowerHours.includes('seasonal')) {
      return false;
    }
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    
    if (lowerHours.includes(today) && lowerHours.includes('closed')) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate explanation text for near-you recommendation
 */
function generateWhyNearText(
  distanceMeters: number,
  sunScore: number,
  patio: PatioWithStatus
): string {
  const walkingMinutes = Math.round(distanceMeters / 83.33);
  const walkText = walkingMinutes <= 1 ? '1 min walk' : `${walkingMinutes} min walk`;
  
  // Check if it has decent sun
  if (sunScore >= 85) {
    return `${walkText} · great sun`;
  }
  
  if (sunScore >= 70) {
    if (patio.sun_profile === 'afternoon') {
      return `${walkText} · good afternoon light`;
    }
    if (patio.sun_profile === 'morning') {
      return `${walkText} · nice morning sun`;
    }
    return `${walkText} · decent sun`;
  }
  
  // Check for tag-based descriptions
  if (patio.tags?.includes('sheltered')) {
    return `Nearby and sheltered`;
  }
  
  if (patio.tags?.includes('waterfront')) {
    return `Close by · waterfront`;
  }
  
  if (patio.tags?.includes('rooftop')) {
    return `Close by · rooftop`;
  }
  
  // Distance-based fallbacks
  if (distanceMeters <= 300) {
    return `Very close · worth a look`;
  }
  
  if (sunScore >= 50) {
    return `Close by · mixed sun`;
  }
  
  return `Not perfect sun, but very close`;
}

/**
 * Calculate near-you score for a single patio
 */
export function calculateNearYouScore(
  patio: PatioWithStatus,
  userLocation: UserLocation,
  settings: AppSettings,
  now: Date = new Date()
): NearYouResult {
  // Calculate distance
  const distanceMeters = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    patio.lat,
    patio.lng
  );
  
  // Step 1: Distance score (primary)
  const distanceScore = getDistanceScore(distanceMeters);
  
  // Step 2: Sun bonus (secondary, weighted 0.3)
  let baseSunScore: number;
  if (settings.enable_seasonal_adjustment && patio.sun_score_tuned != null) {
    baseSunScore = patio.sun_score_tuned;
  } else if (settings.enable_seasonal_adjustment) {
    const seasonal = calculateSeasonalScore(
      patio.sun_score_base ?? patio.sun_score,
      patio.sun_profile as SunProfile | null,
      now
    );
    baseSunScore = seasonal.sunScoreTuned;
  } else {
    baseSunScore = patio.sun_score ?? 50;
  }
  const sunBonus = Math.round(baseSunScore * 0.3);
  
  // Step 3: Tag boost
  const tagBoost = getTagBoost(patio.tags);
  
  // Calculate total and clamp
  const rawScore = distanceScore + sunBonus + tagBoost;
  const nearYouScore = Math.max(0, Math.min(100, rawScore));
  
  // Generate explanation
  const whyNearText = generateWhyNearText(distanceMeters, baseSunScore, patio);
  
  return {
    patio,
    nearYouScore,
    distanceMeters,
    distanceScore,
    sunBonus,
    tagBoost,
    whyNearText,
  };
}

/**
 * Get best patios near user location
 */
export function getBestNearYou(
  patios: PatioWithStatus[],
  userLocation: UserLocation,
  settings: AppSettings,
  now: Date = new Date(),
  limit: number = 5
): NearYouResult[] {
  // Filter patios
  const eligiblePatios = patios.filter(patio => {
    if (!patio.is_active) return false;
    if (!appearsOpen(patio.hours, now)) return false;
    return true;
  });
  
  // Calculate scores
  const scored = eligiblePatios.map(patio => 
    calculateNearYouScore(patio, userLocation, settings, now)
  );
  
  // Filter by max distance (6km unless no closer results)
  const withinRange = scored.filter(r => r.distanceMeters <= 6000);
  const results = withinRange.length >= 3 ? withinRange : scored;
  
  // Sort by near_you_score DESC, then distance ASC
  results.sort((a, b) => {
    if (b.nearYouScore !== a.nearYouScore) {
      return b.nearYouScore - a.nearYouScore;
    }
    return a.distanceMeters - b.distanceMeters;
  });
  
  return results.slice(0, limit);
}
