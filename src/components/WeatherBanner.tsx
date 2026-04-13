import { Cloud, Droplets, Wind, Sun, Thermometer, CloudRain, Umbrella } from "lucide-react";
import { useWeather, getWeatherLabel, getWindLabel, getUVLabel } from "@/hooks/useWeather";
import { cn } from "@/lib/utils";

interface WeatherBannerProps {
  compact?: boolean;
}

/** Is the weather code a precipitation type? */
function isRainyCode(code: number): boolean {
  // WMO codes: 51-67 drizzle/rain/freezing, 80-82 showers, 95-99 thunderstorm
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);
}

function isSnowCode(code: number): boolean {
  return (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
}

function RainAlert({ weatherCode, precipitation }: { weatherCode: number; precipitation: number }) {
  const isSnow = isSnowCode(weatherCode);
  const { label } = getWeatherLabel(weatherCode);

  const intensity = precipitation >= 4 ? "heavy" : precipitation >= 1 ? "moderate" : "light";
  const bgColor = intensity === "heavy"
    ? "bg-blue-600/90"
    : intensity === "moderate"
      ? "bg-blue-500/80"
      : "bg-blue-400/70";

  return (
    <div className={cn("px-4 py-2 flex items-center gap-2 text-white text-xs font-medium", bgColor)}>
      {isSnow ? <Cloud className="h-4 w-4" /> : <Umbrella className="h-4 w-4" />}
      <span>
        {isSnow ? "❄️" : "🌧️"} {label} right now ({precipitation}mm)
        {intensity === "heavy" && " — not a great time for patios"}
        {intensity === "moderate" && " — patio sun unlikely"}
        {intensity === "light" && " — sun may peek through"}
      </span>
    </div>
  );
}

export function WeatherBanner({ compact = false }: WeatherBannerProps) {
  const { weather, isLoading, error } = useWeather();

  if (isLoading) {
    return (
      <div className="bg-muted/50 border-b px-4 py-1.5 flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
        <Cloud className="h-3.5 w-3.5" />
        <span>Loading weather…</span>
      </div>
    );
  }

  if (error || !weather) return null;

  const { label, emoji } = getWeatherLabel(weather.weatherCode);
  const uvInfo = getUVLabel(weather.uvIndex);
  const windLabel = getWindLabel(weather.windSpeed);
  const showRainAlert = isRainyCode(weather.weatherCode) || isSnowCode(weather.weatherCode) || weather.precipitation > 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{emoji}</span>
        <span>{weather.temperature}°C</span>
        <span className="opacity-60">•</span>
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div>
      {showRainAlert && (
        <RainAlert weatherCode={weather.weatherCode} precipitation={weather.precipitation} />
      )}
      <div className="bg-muted/40 border-b px-4 py-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-base leading-none">{emoji}</span>
            <div className="flex items-center gap-1.5">
              <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{weather.temperature}°C</span>
              <span className="text-muted-foreground">(feels {weather.feelsLike}°C)</span>
            </div>
            <span className="text-muted-foreground">{label}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-1" title={`UV Index: ${weather.uvIndex}`}>
              <Sun className="h-3.5 w-3.5" />
              <span className={cn("font-medium", uvInfo.color)}>UV {weather.uvIndex}</span>
            </div>
            <div className="flex items-center gap-1" title={`Wind: ${weather.windSpeed} km/h`}>
              <Wind className="h-3.5 w-3.5" />
              <span>{windLabel} {weather.windSpeed}km/h</span>
            </div>
            <div className="flex items-center gap-1" title={`Humidity: ${weather.humidity}%`}>
              <Droplets className="h-3.5 w-3.5" />
              <span>{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1" title={`Cloud cover: ${weather.cloudCover}%`}>
              <Cloud className="h-3.5 w-3.5" />
              <span>{weather.cloudCover}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
