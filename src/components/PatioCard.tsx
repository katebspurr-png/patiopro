import { MapPin, Sun, Clock, Cloud, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SunStatusBadge } from "./SunStatusBadge";
import { formatTimeAgo } from "@/lib/sun-status";
import { TIME_OF_DAY_LABELS, type PatioWithLiveScore } from "@/lib/live-sun-score";
import type { TimeOfDaySelection, ResolvedTimeOfDay } from "@/hooks/useTimeOfDay";
import { useWeather, getWeatherLabel } from "@/hooks/useWeather";
import { useFavoriteIds } from "@/hooks/useFavoriteIds";
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
  const { weather } = useWeather();
  const { favoriteIds } = useFavoriteIds();
  const isFav = favoriteIds.includes(patio.id);
  
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
          <h3 className={cn("font-sans font-semibold truncate flex items-center gap-1.5", compact ? "text-sm" : "text-base")}>
            {isFav && <Heart className="h-3.5 w-3.5 shrink-0 fill-red-500 text-red-500" />}
            <span className="truncate">{patio.name}</span>
          </h3>
          {patio.neighborhood && (
            <div className="flex items-center gap-1 text-[13px] text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{patio.neighborhood}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 font-semibold text-primary">
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
        <p className="text-xs font-medium text-muted-foreground">
          {displayReason}
        </p>
        
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
          
          {scoredFor && (
            <span className="text-[10px] text-muted-foreground/60 italic">
              {scoredFor === "now" 
                ? `Scored for now (${TIME_OF_DAY_LABELS[resolvedTime || "midday"]})`
                : `Scored for ${TIME_OF_DAY_LABELS[scoredFor as ResolvedTimeOfDay]}`}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        {displayTags.length > 0 && (
          <div className="flex gap-1">
            {displayTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                {tag.replace("_", " ")}
              </Badge>
            ))}
          </div>
        )}
        {weather && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
            <span>{getWeatherLabel(weather.weatherCode).emoji}</span>
            <span>{weather.temperature}°C</span>
            {weather.cloudCover > 0 && (
              <>
                <Cloud className="h-2.5 w-2.5" />
                <span>{weather.cloudCover}%</span>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}