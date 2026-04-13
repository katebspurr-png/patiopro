import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Phone, Globe, Instagram, Clock, Navigation, Sun, Wind, Droplets, Heart } from "lucide-react";
import { useIsFavorite } from "@/hooks/useFavorites";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { SunStatusBadge } from "@/components/SunStatusBadge";
import { ConfidenceLevelBadge } from "@/components/ConfidenceLevelBadge";
import { SunFeedbackWidget } from "@/components/SunFeedbackWidget";
import { HourlyForecast } from "@/components/HourlyForecast";
import { usePatio, useSunReports } from "@/hooks/usePatios";
import { useAppSettings } from "@/hooks/useAppSettings";
import { calculateSunStatus, formatTimeAgo } from "@/lib/sun-status";
import { calculateSeasonalScore } from "@/lib/seasonal-adjustment";
import { cn } from "@/lib/utils";
import { useWeather, getWeatherLabel, getWindLabel, getUVLabel } from "@/hooks/useWeather";
import type { SunProfile } from "@/types/patio";
import type { ConfidenceLevel } from "@/types/app-settings";

export default function PatioDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: patio, isLoading: patioLoading } = usePatio(id!);
  const { data: reports, isLoading: reportsLoading } = useSunReports(id);
  const { data: settings } = useAppSettings();
  const { weather } = useWeather(patio?.lat, patio?.lng);
  const { isFavorite, isLoggedIn, toggle: toggleFavorite, isToggling } = useIsFavorite(id);
  
  const isLoading = patioLoading || reportsLoading;
  
  const statusResult = patio && reports
    ? calculateSunStatus(reports, patio.sun_profile as SunProfile | null)
    : null;
  
  const seasonalResult = patio && settings?.enable_seasonal_adjustment
    ? calculateSeasonalScore(
        (patio as any).sun_score_base ?? patio.sun_score,
        patio.sun_profile as SunProfile | null
      )
    : null;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }
  
  if (!patio) {
    return (
      <div className="min-h-screen bg-background p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-amber-600 text-sm font-medium">
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        <p className="text-center text-muted-foreground mt-8">Patio not found.</p>
      </div>
    );
  }
  
  const recentReports = reports?.slice(0, 10) || [];
  
  const displayScore = settings?.enable_seasonal_adjustment && seasonalResult
    ? seasonalResult.sunScoreTuned
    : (patio.sun_score ?? 50);
  
  const confidenceLevel = settings?.enable_confidence_level
    ? ((patio as any).confidence_level as ConfidenceLevel | null)
    : null;
  
  const sunnyVotes = (patio as any).sunny_votes ?? 0;
  const notSunnyVotes = (patio as any).not_sunny_votes ?? 0;
  const lastSunCheckAt = (patio as any).last_sun_check_at ?? null;

  const iconBtnClass = "h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-muted transition-colors";
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-0.5 text-amber-600 text-sm font-medium">
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              className={iconBtnClass}
              onClick={() => {
                if (!isLoggedIn) {
                  toast({ title: "Sign in to save favorites", description: "Create an account to save your favorite patios." });
                  return;
                }
                toggleFavorite();
              }}
              disabled={isToggling}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={cn("h-4 w-4 transition-colors", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
            </button>
            {patio.address && (
              <button
                className={iconBtnClass}
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(patio.address!)}`, "_blank")}
                title="Directions"
              >
                <Navigation className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            {patio.phone && (
              <button className={iconBtnClass} onClick={() => window.open(`tel:${patio.phone}`, "_self")} title="Call">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            {patio.website && (
              <button className={iconBtnClass} onClick={() => window.open(patio.website!, "_blank")} title="Website">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            {patio.instagram && (
              <button className={iconBtnClass} onClick={() => window.open(`https://instagram.com/${patio.instagram}`, "_blank")} title="Instagram">
                <Instagram className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="px-5 pt-5 pb-4 border-b">
        <h1 className="text-[26px] font-medium leading-tight">{patio.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {patio.neighborhood}{patio.neighborhood && patio.address ? " · " : ""}{patio.address}
        </p>

        {/* Score row */}
        <div className="flex items-center gap-4 mt-4">
          <span className="text-[40px] font-medium leading-none text-amber-600">{displayScore}</span>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Sun score</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-foreground">
                {settings?.enable_seasonal_adjustment && seasonalResult?.seasonalAdjustmentNotes
                  ? seasonalResult.seasonalAdjustmentNotes
                  : (patio.sun_score_reason || "Based on patio profile")}
              </p>
              {statusResult && (
                <SunStatusBadge status={statusResult.status} confidence={statusResult.confidence} size="md" />
              )}
            </div>
          </div>
        </div>

        {/* Low confidence note */}
        {statusResult?.confidence === "low" && (
          <p className="text-xs text-muted-foreground mt-2">
            Based on patio profile — add a report to improve accuracy.
          </p>
        )}

        {/* Confidence Level */}
        {settings?.enable_confidence_level && confidenceLevel && (
          <div className="mt-3">
            <ConfidenceLevelBadge level={confidenceLevel} />
          </div>
        )}

        {/* Best time pill */}
        <div className="bg-amber-50 rounded-lg px-3 py-2 mt-4">
          <p className="text-[11px] uppercase tracking-wider text-amber-600 font-medium">Best time</p>
          <p className="text-[15px] font-medium text-amber-700 mt-0.5">
            {patio.best_time_to_visit || "Check recent visits"}
          </p>
        </div>

        {statusResult?.lastReportTime && (
          <p className="text-xs text-muted-foreground mt-3">
            Last report: {formatTimeAgo(statusResult.lastReportTime)}
          </p>
        )}
      </div>

      {/* Crowd Sun Feedback */}
      {settings?.enable_crowd_sun_feedback && (
        <div className="px-5 py-4 border-b">
          <SunFeedbackWidget
            patioId={patio.id}
            sunnyVotes={sunnyVotes}
            notSunnyVotes={notSunnyVotes}
            lastSunCheckAt={lastSunCheckAt}
          />
        </div>
      )}

      {/* Sun Forecast */}
      <div className="border-b">
        <HourlyForecast />
      </div>

      {/* Current Weather */}
      {weather && (
        <div className="px-5 py-4 border-b">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Current weather</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getWeatherLabel(weather.weatherCode).emoji}</span>
              <div>
                <p className="text-sm font-medium">{getWeatherLabel(weather.weatherCode).label}</p>
                <p className="text-xs text-muted-foreground">{weather.temperature}°C (feels {weather.feelsLike}°C)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className={cn("text-sm font-medium", getUVLabel(weather.uvIndex).color)}>
                  UV {weather.uvIndex} — {getUVLabel(weather.uvIndex).label}
                </p>
                <p className="text-xs text-muted-foreground">Cloud cover {weather.cloudCover}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{getWindLabel(weather.windSpeed)}</p>
                <p className="text-xs text-muted-foreground">{weather.windSpeed} km/h</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Humidity {weather.humidity}%</p>
                {weather.precipitation > 0 && (
                  <p className="text-xs text-muted-foreground">{weather.precipitation}mm precip</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="px-5 py-4 border-b space-y-3">
        {patio.address && (
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm">{patio.address}</p>
              {patio.neighborhood && (
                <p className="text-xs text-muted-foreground">{patio.neighborhood}</p>
              )}
            </div>
          </div>
        )}
        {patio.hours && (
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-sm">{patio.hours}</p>
          </div>
        )}
        {patio.sun_notes && (
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm">{patio.sun_notes}</p>
              <p className="text-xs text-muted-foreground">Sun profile</p>
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {patio.tags && patio.tags.length > 0 && (
        <div className="px-5 py-4 border-b">
          <div className="flex flex-wrap gap-1.5">
            {patio.tags.map((tag) => (
              <span key={tag} className="bg-muted rounded-md px-2.5 py-1 text-xs text-muted-foreground">
                {tag.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reports */}
      <div className="px-5 py-4 border-b">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Recent reports</p>
        {recentReports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reports yet. Be the first!</p>
        ) : (
          <div className="divide-y">
            {recentReports.map((report) => (
              <div key={report.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <SunStatusBadge status={report.status} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(report.reported_at || report.created_at || "")}
                  </span>
                </div>
                {report.notes && (
                  <p className="text-sm text-muted-foreground mt-1.5">{report.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 py-5">
        <button
          onClick={() => navigate(`/report?patio=${patio.id}`)}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-xl transition-colors text-sm"
        >
          Add a sun report
        </button>
      </div>
    </div>
  );
}
