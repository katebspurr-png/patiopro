import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Phone, Globe, Instagram, Clock, Navigation, Sun, Wind, Droplets, Heart } from "lucide-react";
import { useIsFavorite } from "@/hooks/useFavorites";

import { Skeleton } from "@/components/ui/skeleton";
import { SunStatusBadge } from "@/components/SunStatusBadge";
import { ConfidenceLevelBadge } from "@/components/ConfidenceLevelBadge";
import { SunFeedbackWidget } from "@/components/SunFeedbackWidget";
import { HourlyForecast } from "@/components/HourlyForecast";
import { usePatio, useSunReports } from "@/hooks/usePatios";
import { useHappyHourByPatioId } from "@/hooks/useHappyHours";
import { useAppSettings } from "@/hooks/useAppSettings";
import { calculateSunStatus, formatTimeAgo } from "@/lib/sun-status";
import { calculateSeasonalScore } from "@/lib/seasonal-adjustment";
import { cn } from "@/lib/utils";
import { useWeather, getWeatherLabel, getWindLabel, getUVLabel } from "@/hooks/useWeather";
import { computeLiveSunScore } from "@/lib/live-sun-score";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import type { SunProfile } from "@/types/patio";
import type { ConfidenceLevel } from "@/types/app-settings";

export default function PatioDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: patio, isLoading: patioLoading } = usePatio(id!);
  const { data: reports, isLoading: reportsLoading } = useSunReports(id);
  const { data: settings } = useAppSettings();
  const { weather } = useWeather(patio?.lat, patio?.lng);
  const { resolvedTime } = useTimeOfDay();
  const { isFavorite, isLoggedIn, toggle: toggleFavorite, isToggling } = useIsFavorite(id);
  const { data: happyHour } = useHappyHourByPatioId(id);
  
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
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[#C87533] text-sm font-medium">
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        <p className="text-center text-gray-400 mt-8">Patio not found.</p>
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
  const windExposure = (patio as any).wind_exposure as string | null;
  const windExposureLabel = windExposure === 'exposed' ? 'Exposed' : windExposure === 'sheltered' ? 'Sheltered' : 'Partial shelter';
  
  const liveResult = patio && statusResult
    ? computeLiveSunScore({ ...patio, ...statusResult } as any, resolvedTime, weather)
    : null;

  const iconBtnClass = "h-9 w-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors";
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      {/* Header */}
      <div className="sticky top-0 z-50" style={{ backgroundColor: '#1C1C1A' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-0.5 text-[#C87533] text-sm font-medium">
            <ChevronLeft className="h-5 w-5" />
            <span style={{ color: '#FFFFFF' }}>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              className={iconBtnClass}
              onClick={() => toggleFavorite()}
              disabled={isToggling}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={cn("h-4 w-4 transition-colors", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
            </button>
            {patio.address && (
              <button
                className={iconBtnClass}
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(patio.address!)}`, "_blank")}
                title="Directions"
              >
                <Navigation className="h-4 w-4 text-white" />
              </button>
            )}
            {patio.phone && (
              <button className={iconBtnClass} onClick={() => window.open(`tel:${patio.phone}`, "_self")} title="Call">
                <Phone className="h-4 w-4 text-white" />
              </button>
            )}
            {patio.website && (
              <button className={iconBtnClass} onClick={() => window.open(patio.website!, "_blank")} title="Website">
                <Globe className="h-4 w-4 text-white" />
              </button>
            )}
            {patio.instagram && (
              <button className={iconBtnClass} onClick={() => window.open(`https://instagram.com/${patio.instagram}`, "_blank")} title="Instagram">
                <Instagram className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="px-5 pt-5 pb-4 border-b border-[#E5E0D8]">
        <h1 className="font-sans leading-tight" style={{ fontSize: '28px', fontWeight: 700, color: '#1C1C1A' }}>{patio.name}</h1>
        <p className="text-[13px] text-gray-400 mt-1">
          {patio.neighborhood}{patio.neighborhood && patio.address ? " · " : ""}{patio.address}
        </p>

        {/* Score row */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative">
            <span className="leading-none" style={{ fontSize: '52px', fontWeight: 700, color: '#C87533' }}>{displayScore}</span>
            {liveResult?.wind_adjusted && (
              <Wind className="h-4 w-4 absolute -top-1 -right-5" style={{ color: '#C87533' }} />
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Sun score</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[14px] text-gray-800">
                {settings?.enable_seasonal_adjustment && seasonalResult?.seasonalAdjustmentNotes
                  ? seasonalResult.seasonalAdjustmentNotes
                  : (patio.sun_score_reason || "Based on patio profile")}
              </p>
              {statusResult && (
                <SunStatusBadge status={statusResult.status} size="md" />
              )}
            </div>
            {liveResult?.wind_adjusted && liveResult.wind_penalty !== 0 && (
              <p className="text-[11px] text-gray-400 mt-1">
                {liveResult.wind_penalty > 0
                  ? `Wind shelter bonus (+${liveResult.wind_penalty})`
                  : `Wind penalty applied (${liveResult.wind_penalty})`}
              </p>
            )}
          </div>
        </div>

        {/* Best time pill */}
        <div className="bg-[#C87533]/8 rounded-lg px-3 py-2 mt-4">
          <p className="text-[11px] uppercase tracking-wider text-[#C87533] font-medium">Best time</p>
          <p className="text-[15px] font-medium text-[#C87533] mt-0.5">
            {patio.best_time_to_visit || "Check recent visits"}
          </p>
        </div>

        {statusResult?.lastReportTime && (
          <p className="text-[13px] text-gray-400 mt-3">
            Last report: {formatTimeAgo(statusResult.lastReportTime)}
          </p>
        )}
      </div>

      {/* Crowd Sun Feedback */}
      {settings?.enable_crowd_sun_feedback && (
        <div className="px-5 py-4 border-b border-[#E5E0D8]">
          <SunFeedbackWidget
            patioId={patio.id}
            sunnyVotes={sunnyVotes}
            notSunnyVotes={notSunnyVotes}
            lastSunCheckAt={lastSunCheckAt}
          />
        </div>
      )}

      {/* Sun Forecast */}
      <div className="border-b border-[#E5E0D8]">
        <div className="px-5 pt-4">
          <p style={{ fontSize: 11, fontWeight: 700, color: '#1C1C1A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sun forecast today</p>
        </div>
        <HourlyForecast />
      </div>

      {/* Current Weather */}
      {weather && (
        <div className="px-5 py-4 border-b border-[#E5E0D8]">
          <p className="text-[11px] uppercase tracking-wider font-bold mb-3" style={{ color: '#1C1C1A' }}>Current weather</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getWeatherLabel(weather.weatherCode).emoji}</span>
              <div>
                <p className="text-[14px] font-medium text-gray-800">{getWeatherLabel(weather.weatherCode).label}</p>
                <p className="text-[13px] text-gray-400">{weather.temperature}°C (feels {weather.feelsLike}°C)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-gray-400" />
              <div>
                <p className={cn("text-[14px] font-medium", getUVLabel(weather.uvIndex).color)}>
                  UV {weather.uvIndex} — {getUVLabel(weather.uvIndex).label}
                </p>
                <p className="text-[13px] text-gray-400">Cloud cover {weather.cloudCover}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-[14px] font-medium text-gray-800">{getWindLabel(weather.windSpeed)}</p>
                <p className="text-[13px] text-gray-400">{weather.windSpeed} km/h</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-[14px] font-medium text-gray-800">Humidity {weather.humidity}%</p>
                {weather.precipitation > 0 && (
                  <p className="text-[13px] text-gray-400">{weather.precipitation}mm precip</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Happy Hour */}
      {happyHour && (
        <div className="px-5 py-4 border-b border-[#E5E0D8]">
          <p className="text-[11px] uppercase tracking-wider font-bold mb-2" style={{ color: '#1C1C1A' }}>Happy hour</p>
          <div className="bg-[#FDF0E3] rounded-lg px-4 py-3 space-y-1.5">
            {happyHour.days && (
              <p className="text-[14px] font-medium text-gray-800">{happyHour.days}</p>
            )}
            {happyHour.time_range && (
              <p className="text-[14px] text-[#C87533] font-medium">{happyHour.time_range}</p>
            )}
            {happyHour.details && (
              <p className="text-[13px] text-gray-600">{happyHour.details}</p>
            )}
            {happyHour.needs_verification && (
              <p className="text-[11px] text-gray-400 italic mt-1">Details may have changed — check with the venue.</p>
            )}
          </div>
        </div>
      )}

      <div className="px-5 py-4 border-b border-[#E5E0D8] space-y-3">
        {patio.address && (
          <div className="flex items-start gap-3">
            <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, backgroundColor: '#EDE8E0', borderRadius: 8 }}>
              <MapPin className="h-4 w-4" style={{ color: '#9A9490' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1A' }}>{patio.address}</p>
              {patio.neighborhood && (
                <p style={{ fontSize: 12, color: '#9A9490' }}>{patio.neighborhood}</p>
              )}
            </div>
          </div>
        )}
        {patio.hours && (
          <div className="flex items-center gap-3">
            <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, backgroundColor: '#EDE8E0', borderRadius: 8 }}>
              <Clock className="h-4 w-4" style={{ color: '#9A9490' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1A' }}>{patio.hours}</p>
          </div>
        )}
        {patio.sun_notes && (
          <div className="flex items-start gap-3">
            <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, backgroundColor: '#EDE8E0', borderRadius: 8 }}>
              <Sun className="h-4 w-4" style={{ color: '#9A9490' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1A' }}>{patio.sun_notes}</p>
              <p style={{ fontSize: 12, color: '#9A9490' }}>Sun profile</p>
            </div>
          </div>
        )}
        {/* Wind exposure row */}
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, backgroundColor: '#EDE8E0', borderRadius: 8 }}>
            <Wind className="h-4 w-4" style={{ color: '#9A9490' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1A' }}>{windExposureLabel}</p>
            <p style={{ fontSize: 12, color: '#9A9490' }}>Wind exposure</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      {patio.tags && patio.tags.length > 0 && (
        <div className="px-5 py-4 border-b border-[#E5E0D8]">
          <div className="flex flex-wrap gap-1.5">
            {patio.tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1.5 rounded-md font-medium" style={{ backgroundColor: '#1C1C1A', color: '#FFFFFF' }}>
                {tag.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reports */}
      <div className="px-5 py-4 border-b border-[#E5E0D8]">
        <p className="text-[11px] uppercase tracking-wider font-bold mb-3" style={{ color: '#1C1C1A' }}>Recent reports</p>
        {recentReports.length === 0 ? (
          <div className="flex flex-col items-center py-6">
            <Sun className="h-8 w-8 mb-2" style={{ color: '#C87533' }} />
            <p style={{ fontSize: 14, color: '#9A9490' }}>No reports yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentReports.map((report) => (
              <div key={report.id} className="rounded-lg" style={{ backgroundColor: '#EDE8E0', padding: 12 }}>
                <div className="flex items-center justify-between">
                  <SunStatusBadge status={report.status} size="sm" />
                  <span style={{ fontSize: 12, color: '#9A9490' }}>
                    {formatTimeAgo(report.reported_at || report.created_at || "")}
                  </span>
                </div>
                {report.notes && (
                  <p style={{ fontSize: 13, color: '#1C1C1A', marginTop: 6 }}>{report.notes}</p>
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
          className="w-full rounded-xl transition-colors text-sm"
          style={{ backgroundColor: '#1C1C1A', color: '#FFFFFF', fontWeight: 600, height: 52 }}
        >
          Add a sun report
        </button>
      </div>
    </div>
  );
}
