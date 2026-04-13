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
}

const CACHE_KEY = "weather_cache";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(): { data: WeatherData; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCache(data: WeatherData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
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

export function useWeather(lat = 44.6488, lng = -63.5752) {
  const [weather, setWeather] = useState<WeatherData | null>(() => getCached()?.data ?? null);
  const [isLoading, setIsLoading] = useState(!weather);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setWeather(cached.data);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchWeather() {
      try {
        setIsLoading(true);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,cloud_cover,uv_index,precipitation,weather_code,is_day&timezone=auto`;
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
        setWeather(data);
        setCache(data);
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

  return { weather, isLoading, error };
}
