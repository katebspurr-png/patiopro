import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Globe, Instagram, Clock, Navigation, Sun } from "lucide-react";
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
import { getSunScoreColor } from "@/lib/sun-profile";
import { calculateSeasonalScore } from "@/lib/seasonal-adjustment";
import { cn } from "@/lib/utils";
import type { SunProfile } from "@/types/patio";
import type { ConfidenceLevel } from "@/types/app-settings";

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
  
  // Calculate seasonal score if enabled
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
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="text-center text-muted-foreground mt-8">Patio not found.</p>
      </div>
    );
  }
  
  const recentReports = reports?.slice(0, 10) || [];
  
  // Determine which score to display
  const displayScore = settings?.enable_seasonal_adjustment && seasonalResult
    ? seasonalResult.sunScoreTuned
    : (patio.sun_score ?? 50);
  
  // Get confidence level from patio data (if feature enabled)
  const confidenceLevel = settings?.enable_confidence_level
    ? ((patio as any).confidence_level as ConfidenceLevel | null)
    : null;
  
  // Get crowd feedback data
  const sunnyVotes = (patio as any).sunny_votes ?? 0;
  const notSunnyVotes = (patio as any).not_sunny_votes ?? 0;
  const lastSunCheckAt = (patio as any).last_sun_check_at ?? null;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center gap-2 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display font-semibold text-lg truncate">{patio.name}</h1>
        </div>
      </div>
      
      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Status Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn("flex items-center gap-2 text-2xl font-bold", getSunScoreColor(displayScore))}>
                <Sun className="h-6 w-6" />
                <span>{displayScore}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="block font-medium">
                  {settings?.enable_seasonal_adjustment ? 'Sun Score (seasonal)' : 'Sun Score'}
                </span>
                {settings?.enable_seasonal_adjustment && seasonalResult?.seasonalAdjustmentNotes ? (
                  <span className="text-xs">{seasonalResult.seasonalAdjustmentNotes}</span>
                ) : (
                  <span className="text-xs">{patio.sun_score_reason || 'sun unknown'}</span>
                )}
              </div>
            </div>
            {statusResult && (
              <SunStatusBadge
                status={statusResult.status}
                confidence={statusResult.confidence}
                size="md"
              />
            )}
          </div>
          
          {/* Confidence Level Badge (gated) */}
          {settings?.enable_confidence_level && confidenceLevel && (
            <div className="mb-4">
              <ConfidenceLevelBadge level={confidenceLevel} />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <span className="text-sm font-medium">Best time</span>
              <p className="text-lg font-semibold">{patio.best_time_to_visit || 'check recent visits'}</p>
            </div>
            {statusResult?.lastReportTime && (
              <p className="text-sm text-muted-foreground">
                Last report: {formatTimeAgo(statusResult.lastReportTime)}
              </p>
            )}
          </div>
          
          {statusResult?.confidence === "low" && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
              Based on patio profile — add a report to improve accuracy.
            </p>
          )}
        </Card>
        
        {/* Crowd Sun Feedback Widget (gated) */}
        {settings?.enable_crowd_sun_feedback && (
          <SunFeedbackWidget
            patioId={patio.id}
            sunnyVotes={sunnyVotes}
            notSunnyVotes={notSunnyVotes}
            lastSunCheckAt={lastSunCheckAt}
          />
        )}
        
        {/* Info */}
        <div className="space-y-3">
          {patio.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
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
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm">{patio.hours}</p>
            </div>
          )}
          
          {patio.sun_notes && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Sun profile:</span> {patio.sun_notes}
              </p>
            </div>
          )}
        </div>
        
        {/* Tags */}
        {patio.tags && patio.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {patio.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag.replace("_", " ")}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          {patio.address && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(patio.address!)}`, "_blank")}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Directions
            </Button>
          )}
          {patio.phone && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(`tel:${patio.phone}`, "_self")}
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          {patio.website && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(patio.website!, "_blank")}
            >
              <Globe className="h-4 w-4" />
            </Button>
          )}
          {patio.instagram && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(`https://instagram.com/${patio.instagram}`, "_blank")}
            >
              <Instagram className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Recent Reports */}
        <div>
          <h2 className="font-display font-semibold mb-3">Recent Reports</h2>
          {recentReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports yet. Be the first!</p>
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
          className="w-full"
          size="lg"
          onClick={() => navigate(`/report?patio=${patio.id}`)}
        >
          Add a sun report
        </Button>
      </div>
    </div>
  );
}
