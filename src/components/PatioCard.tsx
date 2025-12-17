import { MapPin, Sun, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SunStatusBadge } from "./SunStatusBadge";
import { formatTimeAgo } from "@/lib/sun-status";
import { getSunScoreColor } from "@/lib/sun-profile";
import { TIME_OF_DAY_LABELS, type PatioWithLiveScore } from "@/lib/live-sun-score";
import type { TimeOfDaySelection, ResolvedTimeOfDay } from "@/hooks/useTimeOfDay";
import { cn } from "@/lib/utils";

interface PatioCardProps {
  patio: PatioWithLiveScore;
  onClick?: () => void;
  compact?: boolean;
  scoredFor?: TimeOfDaySelection;
  resolvedTime?: ResolvedTimeOfDay;
}

export function PatioCard({ patio, onClick, compact = false, scoredFor, resolvedTime }: PatioCardProps) {
  const displayTags = patio.tags?.slice(0, 2) || [];
  
  // Use live scores
  const displayScore = patio.sun_score_live;
  const displayReason = patio.sun_score_reason_live;
  const displayBestTime = patio.best_time_to_visit_live || patio.best_time_to_visit || 'Try midday on a clear day.';
  
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
        compact ? "p-3" : "p-4"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-display font-semibold truncate", compact ? "text-sm" : "text-base")}>
            {patio.name}
          </h3>
          {patio.neighborhood && (
            <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs truncate">{patio.neighborhood}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={cn("flex items-center gap-1 font-semibold", getSunScoreColor(displayScore))}>
            <Sun className="h-4 w-4" />
            <span className={compact ? "text-sm" : "text-base"}>{displayScore}</span>
          </div>
          <SunStatusBadge
            status={patio.currentStatus}
            confidence={patio.confidence}
            size="sm"
          />
        </div>
      </div>
      
      <div className="mt-2 space-y-1">
        {/* Sun score reason */}
        <p className="text-xs font-medium text-muted-foreground">
          {displayReason}
        </p>
        
        {/* Best time & scored for label */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{displayBestTime}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
            <Clock className="h-3 w-3" />
            {patio.lastReportTime
              ? formatTimeAgo(patio.lastReportTime)
              : "No recent reports"}
          </div>
          
          {/* Scored for label */}
          {scoredFor && (
            <span className="text-[10px] text-muted-foreground/60 italic">
              {scoredFor === "now" 
                ? `Scored for now (${TIME_OF_DAY_LABELS[resolvedTime || "midday"]})`
                : `Scored for ${TIME_OF_DAY_LABELS[scoredFor as ResolvedTimeOfDay]}`}
            </span>
          )}
        </div>
      </div>
      
      {displayTags.length > 0 && (
        <div className="flex gap-1 mt-2">
          {displayTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
              {tag.replace("_", " ")}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
