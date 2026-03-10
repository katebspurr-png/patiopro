import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Globe, Instagram, Clock, Navigation, Sun, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SunStatusBadge } from "@/components/SunStatusBadge";
import { ConfidenceLevelBadge } from "@/components/ConfidenceLevelBadge";
import { SunFeedbackWidget } from "@/components/SunFeedbackWidget";
import { usePatio, useSunReports } from "@/hooks/usePatios";
import { useAppSettings } from "@/hooks/useAppSettings";
import { calculateSunStatus, formatTimeAgo } from "@/lib/sun-status";
import { calculateSeasonalScore } from "@/lib/seasonal-adjustment";
import { cn } from "@/lib/utils";
import type { SunProfile } from "@/types/patio";
import type { ConfidenceLevel } from "@/types/app-settings";

const TAG_EMOJI: Record<string, string> = {
  waterfront: "🌊",
  dog_friendly: "🐕",
  heated: "🔥",
  beer_garden: "🍺",
  rooftop: "🏙️",
  brunch: "🥞",
  sheltered: "⛱️",
  courtyard: "🌿",
  patio_bar: "🍹",
};

export default function PatioDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: patio, isLoading: patioLoading } = usePatio(id!);
  const { data: reports, isLoading: reportsLoading } = useSunReports(id);
  const { data: settings } = useAppSettings();

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
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background border-b">
          <div className="flex items-center gap-2 p-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
        <div className="p-4 max-w-lg mx-auto space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!patio) {
    return (
      <div className="min-h-screen bg-background page-enter">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Sun className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Patio not found.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
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

  const scoreGradient = displayScore >= 70
    ? "from-amber-400 to-orange-500"
    : displayScore >= 40
    ? "from-amber-300 to-yellow-500"
    : "from-slate-400 to-slate-500";

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-semibold text-lg truncate">{patio.name}</h1>
            {patio.neighborhood && (
              <p className="text-xs text-muted-foreground truncate">{patio.neighborhood}</p>
            )}
          </div>
          {statusResult && (
            <SunStatusBadge
              status={statusResult.status}
              confidence={statusResult.confidence}
              size="sm"
            />
          )}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-5">
        {/* Hero Sun Score Card */}
        <Card className="overflow-hidden">
          <div className={cn(
            "bg-gradient-to-br p-6 text-white relative",
            scoreGradient
          )}>
            <div className="absolute top-4 right-4 opacity-20">
              <Sun className="h-20 w-20" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-white/80 mb-1">
                {settings?.enable_seasonal_adjustment ? 'Seasonal Sun Score' : 'Sun Score'}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold font-display drop-shadow-sm">{displayScore}</span>
                <span className="text-lg text-white/70">/100</span>
              </div>
              <p className="text-sm text-white/80 mt-2">
                {settings?.enable_seasonal_adjustment && seasonalResult?.seasonalAdjustmentNotes
                  ? seasonalResult.seasonalAdjustmentNotes
                  : patio.sun_score_reason || 'Sun exposure data available'}
              </p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Best Time</p>
                <p className="text-base font-semibold mt-0.5">{patio.best_time_to_visit || 'Check recent visits'}</p>
              </div>
              {statusResult?.lastReportTime && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Last Report</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatTimeAgo(statusResult.lastReportTime)}
                  </p>
                </div>
              )}
            </div>

            {settings?.enable_confidence_level && confidenceLevel && (
              <ConfidenceLevelBadge level={confidenceLevel} />
            )}

            {statusResult?.confidence === "low" && (
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Based on patio profile — add a report to improve accuracy.
              </p>
            )}
          </div>
        </Card>

        {/* Crowd Sun Feedback Widget */}
        {settings?.enable_crowd_sun_feedback && (
          <SunFeedbackWidget
            patioId={patio.id}
            sunnyVotes={sunnyVotes}
            notSunnyVotes={notSunnyVotes}
            lastSunCheckAt={lastSunCheckAt}
          />
        )}

        {/* Details Card */}
        <Card className="p-4 space-y-3">
          <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">Details</h2>

          {patio.address && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="pt-1">
                <p className="text-sm">{patio.address}</p>
              </div>
            </div>
          )}

          {patio.hours && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="pt-1">
                <p className="text-sm">{patio.hours}</p>
              </div>
            </div>
          )}

          {patio.sun_notes && (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30">
              <div className="flex items-center gap-1.5 mb-1">
                <Sun className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Sun Profile</span>
              </div>
              <p className="text-sm text-amber-900/80 dark:text-amber-200/80">{patio.sun_notes}</p>
            </div>
          )}
        </Card>

        {/* Tags */}
        {patio.tags && patio.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {patio.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm bg-muted/60">
                {TAG_EMOJI[tag] ? `${TAG_EMOJI[tag]} ` : ""}{tag.replace("_", " ")}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {patio.address && (
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(patio.address!)}`, "_blank")}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Directions
            </Button>
          )}
          {patio.phone && (
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => window.open(`tel:${patio.phone}`, "_self")}>
              <Phone className="h-4 w-4" />
            </Button>
          )}
          {patio.website && (
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => window.open(patio.website!, "_blank")}>
              <Globe className="h-4 w-4" />
            </Button>
          )}
          {patio.instagram && (
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => window.open(`https://instagram.com/${patio.instagram}`, "_blank")}>
              <Instagram className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Recent Reports */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold">Recent Reports</h2>
            <span className="text-xs text-muted-foreground">{recentReports.length} report{recentReports.length !== 1 ? "s" : ""}</span>
          </div>
          {recentReports.length === 0 ? (
            <Card className="p-6 text-center">
              <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No reports yet. Be the first!</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentReports.map((report) => (
                <Card key={report.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <SunStatusBadge status={report.status} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(report.reported_at || report.created_at || "")}
                    </span>
                  </div>
                  {report.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{report.notes}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <Button
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/30 dark:shadow-amber-900/20"
          size="lg"
          onClick={() => navigate(`/report?patio=${patio.id}`)}
        >
          <Sun className="h-4 w-4 mr-2" />
          Add a sun report
        </Button>
      </div>
    </div>
  );
}
