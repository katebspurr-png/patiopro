import { MapPin, Sun, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SunStatusBadge } from "./SunStatusBadge";
import { formatTimeAgo } from "@/lib/sun-status";
import { getSunScoreColor } from "@/lib/sun-profile";
import { TIME_OF_DAY_LABELS, type PatioWithLiveScore } from "@/lib/live-sun-score";
import type { TimeOfDaySelection, ResolvedTimeOfDay } from "@/hooks/useTimeOfDay";
import { cn } from "@/lib/utils";

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

interface PatioCardProps {
  patio: PatioWithLiveScore;
  onClick?: () => void;
  compact?: boolean;
  scoredFor?: TimeOfDaySelection;
  resolvedTime?: ResolvedTimeOfDay;
}

export function PatioCard({ patio, onClick, compact = false, scoredFor, resolvedTime }: PatioCardProps) {
  const displayTags = patio.tags?.slice(0, 3) || [];

  const displayScore = patio.sun_score_live;
  const displayReason = patio.sun_score_reason_live;
  const displayBestTime = patio.best_time_to_visit_live || patio.best_time_to_visit || 'Try midday on a clear day.';

  const scoreGradient = displayScore >= 70
    ? "from-amber-400 to-orange-500"
    : displayScore >= 40
    ? "from-amber-300 to-yellow-500"
    : "from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700";

  return (
    <Card
      className={cn(
        "cursor-pointer card-hover group relative overflow-hidden",
        compact ? "p-3" : "p-4"
      )}
      onClick={onClick}
    >
      {/* Subtle gradient accent on left edge */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-gradient-to-b",
        scoreGradient
      )} />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-display font-semibold truncate",
              compact ? "text-sm" : "text-base"
            )}>
              {patio.name}
            </h3>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
          {patio.neighborhood && (
            <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs truncate">{patio.neighborhood}</span>
            </div>
          )}
        </div>

        {/* Score circle */}
        <div className="flex flex-col items-center gap-1">
          <div className={cn(
            "flex items-center justify-center rounded-full w-10 h-10 bg-gradient-to-br shadow-sm",
            scoreGradient
          )}>
            <span className={cn(
              "font-bold text-white text-sm drop-shadow-sm"
            )}>
              {displayScore}
            </span>
          </div>
          <SunStatusBadge
            status={patio.currentStatus}
            confidence={patio.confidence}
            size="sm"
          />
        </div>
      </div>

      <div className="mt-2 space-y-1 pl-2">
        <p className="text-xs font-medium text-muted-foreground line-clamp-1">
          {displayReason}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
            <Clock className="h-3 w-3" />
            {patio.lastReportTime
              ? formatTimeAgo(patio.lastReportTime)
              : "No recent reports"}
          </div>

          {scoredFor && (
            <span className="text-[10px] text-muted-foreground/60 italic">
              {scoredFor === "now"
                ? `${TIME_OF_DAY_LABELS[resolvedTime || "midday"]}`
                : `${TIME_OF_DAY_LABELS[scoredFor as ResolvedTimeOfDay]}`}
            </span>
          )}
        </div>
      </div>

      {displayTags.length > 0 && (
        <div className="flex gap-1 mt-2 pl-2">
          {displayTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted/60 hover:bg-muted">
              {TAG_EMOJI[tag] ? `${TAG_EMOJI[tag]} ` : ""}{tag.replace("_", " ")}
            </Badge>
          ))}
          {(patio.tags?.length || 0) > 3 && (
            <span className="text-[10px] text-muted-foreground/50 self-center">
              +{(patio.tags?.length || 0) - 3}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
