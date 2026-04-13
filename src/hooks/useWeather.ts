import { useState, useEffect } from "react";

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  uvIndex: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
}

export interface HourlyForecastPoint {
  time: string; // ISO string
  hour: number;
  temperature: number;
  cloudCover: number;
  precipitation: number;
  weatherCode: number;
  uvIndex: number;
  windSpeed: number;
}

export interface TimePeriodForecast {
  label: string;
  period: "morning" | "midday" | "afternoon";
  avgTemp: number;
  avgCloudCover: number;
  maxPrecip: number;
  avgUV: number;
  dominantWeatherCode: number;
  sunChance: number; // 0-100 percentage
  hours: HourlyForecastPoint[];
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    cloud_cover: number;
    uv_index: number;
    precipitation: number;
    weather_code: number;
    is_day: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    cloud_cover: number[];
    precipitation: number[];
    weather_code: number[];
    uv_index: number[];
    wind_speed_10m: number[];
  };
}

interface CachedWeather {
  current: WeatherData;
  forecast: TimePeriodForecast[];
  timestamp: number;
}

const CACHE_KEY = "weather_cache_v2";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(): CachedWeather | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedWeather = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCache(current: WeatherData, forecast: TimePeriodForecast[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ current, forecast, timestamp: Date.now() }));
  } catch {}
}

// WMO Weather code to label + emoji
const WMO_CODES: Record<number, { label: string; emoji: string }> = {
  0: { label: "Clear sky", emoji: "☀️" },
  1: { label: "Mainly clear", emoji: "🌤️" },
  2: { label: "Partly cloudy", emoji: "⛅" },
  3: { label: "Overcast", emoji: "☁️" },
  45: { label: "Fog", emoji: "🌫️" },
  48: { label: "Rime fog", emoji: "🌫️" },
  51: { label: "Light drizzle", emoji: "🌦️" },
  53: { label: "Drizzle", emoji: "🌦️" },
  55: { label: "Heavy drizzle", emoji: "🌧️" },
  61: { label: "Light rain", emoji: "🌧️" },
  63: { label: "Rain", emoji: "🌧️" },
  65: { label: "Heavy rain", emoji: "🌧️" },
  66: { label: "Freezing rain", emoji: "🌧️" },
  67: { label: "Heavy freezing rain", emoji: "🌧️" },
  71: { label: "Light snow", emoji: "🌨️" },
  73: { label: "Snow", emoji: "🌨️" },
  75: { label: "Heavy snow", emoji: "❄️" },
  77: { label: "Snow grains", emoji: "❄️" },
  80: { label: "Light showers", emoji: "🌦️" },
  81: { label: "Showers", emoji: "🌧️" },
  82: { label: "Heavy showers", emoji: "🌧️" },
  85: { label: "Snow showers", emoji: "🌨️" },
  86: { label: "Heavy snow showers", emoji: "❄️" },
  95: { label: "Thunderstorm", emoji: "⛈️" },
  96: { label: "Thunderstorm w/ hail", emoji: "⛈️" },
  99: { label: "Thunderstorm w/ heavy hail", emoji: "⛈️" },
};

export function getWeatherLabel(code: number): { label: string; emoji: string } {
  return WMO_CODES[code] ?? { label: "Unknown", emoji: "❓" };
}

export function getWindLabel(speed: number): string {
  if (speed < 5) return "Calm";
  if (speed < 20) return "Breezy";
  if (speed < 40) return "Windy";
  return "Very windy";
}

export function getUVLabel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: "Low", color: "text-green-600" };
  if (uv <= 5) return { label: "Moderate", color: "text-yellow-600" };
  if (uv <= 7) return { label: "High", color: "text-orange-500" };
  if (uv <= 10) return { label: "Very High", color: "text-red-500" };
  return { label: "Extreme", color: "text-purple-600" };
}

/**
 * Time period definitions (Halifax Atlantic Time hours)
 * Morning: 7-11, Midday: 11-14, Afternoon: 14-18
 */
const TIME_PERIODS: { period: "morning" | "midday" | "afternoon"; label: string; startHour: number; endHour: number }[] = [
  { period: "morning", label: "Morning", startHour: 7, endHour: 11 },
  { period: "midday", label: "Midday", startHour: 11, endHour: 14 },
  { period: "afternoon", label: "Afternoon", startHour: 14, endHour: 18 },
];

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/** Pick the most common weather code from an array */
function dominantCode(codes: number[]): number {
  if (codes.length === 0) return 0;
  const counts = new Map<number, number>();
  for (const c of codes) counts.set(c, (counts.get(c) ?? 0) + 1);
  let best = codes[0];
  let bestCount = 0;
  for (const [code, count] of counts) {
    if (count > bestCount) { best = code; bestCount = count; }
  }
  return best;
}

/** Estimate sun chance from cloud cover and precipitation */
function estimateSunChance(avgCloud: number, maxPrecip: number): number {
  if (maxPrecip >= 1) return Math.max(0, 20 - maxPrecip * 5);
  if (avgCloud <= 20) return 90;
  if (avgCloud <= 40) return 70;
  if (avgCloud <= 60) return 45;
  if (avgCloud <= 80) return 20;
  return 5;
}

function buildForecast(hourly: OpenMeteoResponse["hourly"]): TimePeriodForecast[] {
  if (!hourly) return [];

  // Get today's date string for filtering
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Parse hourly data into points
  const points: HourlyForecastPoint[] = hourly.time.map((t, i) => ({
    time: t,
    hour: new Date(t).getHours(),
    temperature: Math.round(hourly.temperature_2m[i]),
    cloudCover: hourly.cloud_cover[i],
    precipitation: hourly.precipitation[i],
    weatherCode: hourly.weather_code[i],
    uvIndex: hourly.uv_index[i],
    windSpeed: Math.round(hourly.wind_speed_10m[i]),
  })).filter(p => p.time.startsWith(todayStr));

  return TIME_PERIODS.map(({ period, label, startHour, endHour }) => {
    const hours = points.filter(p => p.hour >= startHour && p.hour < endHour);
    if (hours.length === 0) {
      return {
        label, period,
        avgTemp: 0, avgCloudCover: 100, maxPrecip: 0, avgUV: 0,
        dominantWeatherCode: 3, sunChance: 0, hours: [],
      };
    }

    const avgCloud = Math.round(avg(hours.map(h => h.cloudCover)));
    const maxPrecip = Math.max(...hours.map(h => h.precipitation));

    return {
      label,
      period,
      avgTemp: Math.round(avg(hours.map(h => h.temperature))),
      avgCloudCover: avgCloud,
      maxPrecip: Math.round(maxPrecip * 10) / 10,
      avgUV: Math.round(avg(hours.map(h => h.uvIndex)) * 10) / 10,
      dominantWeatherCode: dominantCode(hours.map(h => h.weatherCode)),
      sunChance: Math.round(estimateSunChance(avgCloud, maxPrecip)),
      hours,
    };
  });
}

export function useWeather(lat = 44.6488, lng = -63.5752) {
  const [weather, setWeather] = useState<WeatherData | null>(() => getCached()?.current ?? null);
  const [forecast, setForecast] = useState<TimePeriodForecast[]>(() => getCached()?.forecast ?? []);
  const [isLoading, setIsLoading] = useState(!weather);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setWeather(cached.current);
      setForecast(cached.forecast);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchWeather() {
      try {
        setIsLoading(true);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,cloud_cover,uv_index,precipitation,weather_code,is_day&hourly=temperature_2m,cloud_cover,precipitation,weather_code,uv_index,wind_speed_10m&forecast_days=1&timezone=auto`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Weather fetch failed");
        const json: OpenMeteoResponse = await res.json();
        const c = json.current;
        const data: WeatherData = {
          temperature: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          windSpeed: Math.round(c.wind_speed_10m),
          windDirection: c.wind_direction_10m,
          cloudCover: c.cloud_cover,
          uvIndex: c.uv_index,
          precipitation: c.precipitation,
          weatherCode: c.weather_code,
          isDay: c.is_day === 1,
        };
        const forecastData = buildForecast(json.hourly);
        setWeather(data);
        setForecast(forecastData);
        setCache(data, forecastData);
        setError(null);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError("Could not load weather");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchWeather();
    return () => controller.abort();
  }, [lat, lng]);

  return { weather, forecast, isLoading, error };
}
