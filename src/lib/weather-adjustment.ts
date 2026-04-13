import type { WeatherData } from "@/hooks/useWeather";

/**
 * Weather-based adjustments to sun scores.
 * Cloud cover reduces effective sun; UV indicates strong sun; rain = no sun benefit.
 */

export interface WeatherAdjustment {
  cloudPenalty: number;
  uvBonus: number;
  precipPenalty: number;
  total: number;
  label: string;
}

/**
 * Calculate weather-based score adjustment.
 * 
 * Cloud cover: 0-25% = +5 (clear), 26-50% = 0, 51-75% = -8, 76-100% = -15
 * UV index: >= 6 = +5 (strong sun confirms), 3-5 = +2, < 3 = 0
 * Precipitation: > 0 = -10 (rain kills patio sun experience)
 */
export function getWeatherAdjustment(weather: WeatherData | null): WeatherAdjustment {
  if (!weather) {
    return { cloudPenalty: 0, uvBonus: 0, precipPenalty: 0, total: 0, label: "" };
  }

  // Cloud cover penalty/bonus
  let cloudPenalty = 0;
  if (weather.cloudCover <= 25) {
    cloudPenalty = 5; // Clear skies bonus
  } else if (weather.cloudCover <= 50) {
    cloudPenalty = 0; // Neutral
  } else if (weather.cloudCover <= 75) {
    cloudPenalty = -8; // Partly cloudy penalty
  } else {
    cloudPenalty = -15; // Overcast heavy penalty
  }

  // UV bonus (confirms actual sun reaching ground)
  let uvBonus = 0;
  if (weather.uvIndex >= 6) {
    uvBonus = 5;
  } else if (weather.uvIndex >= 3) {
    uvBonus = 2;
  }

  // Precipitation penalty
  let precipPenalty = 0;
  if (weather.precipitation > 0) {
    precipPenalty = -10;
  }

  const total = cloudPenalty + uvBonus + precipPenalty;

  // Generate a short label
  let label = "";
  if (weather.precipitation > 0) {
    label = "Rainy conditions";
  } else if (weather.cloudCover > 75) {
    label = "Overcast skies";
  } else if (weather.cloudCover > 50) {
    label = "Partly cloudy";
  } else if (weather.cloudCover <= 25 && weather.uvIndex >= 3) {
    label = "Clear & sunny";
  } else if (weather.cloudCover <= 25) {
    label = "Clear skies";
  }

  return { cloudPenalty, uvBonus, precipPenalty, total, label };
}
