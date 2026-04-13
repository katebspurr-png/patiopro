import { Cloud, Droplets, Wind, Sun, Thermometer } from "lucide-react";
import { useWeather, getWeatherLabel, getWindLabel, getUVLabel } from "@/hooks/useWeather";
import { cn } from "@/lib/utils";

interface WeatherBannerProps {
  compact?: boolean;
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
  );
}
