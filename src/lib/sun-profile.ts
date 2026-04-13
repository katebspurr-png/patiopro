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

export function getSunDerivedFields(sunProfile: SunProfile | null | undefined): SunDerivedFields {
  switch (sunProfile) {
    case 'morning':
      return {
        sun_score: 70,
        sun_score_base: 70,
        sun_score_reason: 'Morning bias',
        best_time_to_visit: 'Best in the morning, especially on bright days.',
      };
    case 'midday':
      return {
        sun_score: 80,
        sun_score_base: 80,
        sun_score_reason: 'Afternoon bias',
        best_time_to_visit: 'Best from early afternoon onward on sunny days.',
      };
    case 'afternoon':
      return {
        sun_score: 75,
        sun_score_base: 75,
        sun_score_reason: 'Afternoon bias',
        best_time_to_visit: 'Best from early afternoon onward on sunny days.',
      };
    case 'all_day':
      return {
        sun_score: 85,
        sun_score_base: 85,
        sun_score_reason: 'All-day sun',
        best_time_to_visit: 'Usually sunny all day — anytime works on a clear day.',
      };
    case 'mixed':
      return {
        sun_score: 60,
        sun_score_base: 60,
        sun_score_reason: 'Mixed sun & shade',
        best_time_to_visit: 'Try midday or early afternoon for your best odds.',
      };
    case 'unknown':
    default:
      return {
        sun_score: 55,
        sun_score_base: 55,
        sun_score_reason: 'Sun varies',
        best_time_to_visit: 'Try midday on a clear day and adjust based on shade.',
      };
  }
}

export function normalizeTags(tags: string[] | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .map(tag => tag.trim())
    .filter((tag): tag is AllowedTag => ALLOWED_TAGS.includes(tag as AllowedTag));
}

export function getSunScoreColor(score: number): string {
  return 'text-[#C87533]';
}
