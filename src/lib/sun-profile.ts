import type { SunProfile } from "@/types/patio";

export interface SunDerivedFields {
  sun_score: number;
  sun_score_base: number;
  sun_score_reason: string;
  best_time_to_visit: string;
}

export const ALLOWED_TAGS = [
  'waterfront',
  'dog_friendly', 
  'heated',
  'beer_garden',
  'rooftop',
  'brunch',
  'sheltered',
  'courtyard',
  'patio_bar'
] as const;

export type AllowedTag = typeof ALLOWED_TAGS[number];

/**
 * Single source of truth mapping from sun_profile to derived fields.
 * This mirrors the database trigger logic.
 */
export function getSunDerivedFields(sunProfile: SunProfile | null | undefined): SunDerivedFields {
  switch (sunProfile) {
    case 'morning':
      return {
        sun_score: 80,
        sun_score_base: 80,
        sun_score_reason: 'morning bias',
        best_time_to_visit: '9am–11:30am',
      };
    case 'midday':
      return {
        sun_score: 90,
        sun_score_base: 90,
        sun_score_reason: 'strong midday sun',
        best_time_to_visit: '12pm–3pm',
      };
    case 'afternoon':
      return {
        sun_score: 95,
        sun_score_base: 95,
        sun_score_reason: 'afternoon bias',
        best_time_to_visit: '2pm–sunset',
      };
    case 'mixed':
      return {
        sun_score: 70,
        sun_score_base: 70,
        sun_score_reason: 'mixed exposure',
        best_time_to_visit: '12pm–4pm',
      };
    case 'unknown':
    default:
      return {
        sun_score: 50,
        sun_score_base: 50,
        sun_score_reason: 'sun unknown',
        best_time_to_visit: 'check recent visits',
      };
  }
}

/**
 * Normalize tags: filter to allowlist only
 */
export function normalizeTags(tags: string[] | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .map(tag => tag.trim())
    .filter((tag): tag is AllowedTag => ALLOWED_TAGS.includes(tag as AllowedTag));
}

/**
 * Get sun score color class based on score value
 */
export function getSunScoreColor(score: number): string {
  if (score >= 90) return 'text-amber-500';
  if (score >= 75) return 'text-yellow-500';
  if (score >= 60) return 'text-orange-400';
  return 'text-muted-foreground';
}
