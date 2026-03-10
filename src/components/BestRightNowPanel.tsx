import { useState, useEffect } from "react";
import { Sun, X, Navigation, ExternalLink, MapIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBestRightNow } from "@/hooks/useBestRightNow";
import { useBestNearYou } from "@/hooks/useBestNearYou";
import type { RightNowResult } from "@/lib/right-now-score";
import type { NearYouResult } from "@/lib/near-you-score";
import { cn } from "@/lib/utils";

interface BestRightNowPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPatioSelect: (patioId: string) => void;
}

type ViewMode = "right-now" | "near-you";

function getTimeSubtext(bucket: "morning" | "midday" | "afternoon"): string {
  const hour = new Date().getHours();
  if (hour < 9) return "Good spots as the day brightens";
  if (hour >= 18) return "Nice light to finish the day";
  const subtexts: Record<typeof bucket, string> = {
    morning: "Great light for this time of day",
    midday: "Bright right now",
    afternoon: "Perfect afternoon sun"
  };
  return subtexts[bucket];
}

function getScoreGradient(score: number) {
  if (score >= 70) return "from-amber-400 to-orange-500";
  if (score >= 40) return "from-amber-300 to-yellow-500";
  return "from-slate-300 to-slate-400";
}

function RightNowResultCard({
  result,
  index,
  onView,
  onDirections
}: {
  result: RightNowResult;
  index: number;
  onView: () => void;
  onDirections: () => void;
}) {
  const { patio, rightNowScore, whyNowText } = result;

  return (
    <Card className="p-4 card-hover overflow-hidden relative">
      {index < 3 && (
        <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
          #{index + 1}
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold truncate">{patio.name}</h4>
          <p className="text-sm text-muted-foreground truncate">
            {patio.neighborhood || patio.address || "Downtown Halifax"}
          </p>
        </div>
        <div className={cn(
          "flex items-center justify-center rounded-full w-10 h-10 bg-gradient-to-br shadow-sm",
          getScoreGradient(rightNowScore)
        )}>
          <span className="font-bold text-white text-sm">{rightNowScore}</span>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{whyNowText}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{patio.best_time_to_visit || "Check recent visits"}</p>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={onView}>
          <ExternalLink className="h-3 w-3 mr-1.5" />
          View
        </Button>
        <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={onDirections}>
          <MapIcon className="h-3 w-3 mr-1.5" />
          Directions
        </Button>
      </div>
    </Card>
  );
}

function NearYouResultCard({
  result,
  index,
  onView,
  onDirections
}: {
  result: NearYouResult;
  index: number;
  onView: () => void;
  onDirections: () => void;
}) {
  const { patio, whyNearText } = result;
  const score = patio.sun_score ?? 50;

  return (
    <Card className="p-4 card-hover overflow-hidden relative">
      {index < 3 && (
        <div className="absolute top-0 right-0 bg-gradient-to-bl from-blue-400 to-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
          #{index + 1}
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold truncate">{patio.name}</h4>
          <p className="text-sm text-muted-foreground truncate">
            {patio.neighborhood || patio.address || "Downtown Halifax"}
          </p>
        </div>
        <div className={cn(
          "flex items-center justify-center rounded-full w-10 h-10 bg-gradient-to-br shadow-sm",
          getScoreGradient(score)
        )}>
          <span className="font-bold text-white text-sm">{score}</span>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium">{whyNearText}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{patio.best_time_to_visit || "Check recent visits"}</p>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={onView}>
          <ExternalLink className="h-3 w-3 mr-1.5" />
          View
        </Button>
        <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={onDirections}>
          <MapIcon className="h-3 w-3 mr-1.5" />
          Directions
        </Button>
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <Sun className="h-8 w-8 text-sunny sun-glow" />
      <p className="text-sm text-muted-foreground">Finding good patio light...</p>
    </div>
  );
}

export function BestRightNowPanel({ isOpen, onClose, onPatioSelect }: BestRightNowPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const [manualMode, setManualMode] = useState<ViewMode | null>(null);

  const rightNow = useBestRightNow(5);
  const nearYou = useBestNearYou(5);

  const effectiveMode: ViewMode = manualMode ?? (rightNow.shouldFallback ? "near-you" : "right-now");
  const isNearYouMode = effectiveMode === "near-you";

  useEffect(() => {
    if (!isOpen) {
      setManualMode(null);
      setShowAll(false);
    }
  }, [isOpen]);

  const isLoading = rightNow.isLoading || nearYou.isLoading;
  const error = rightNow.error || nearYou.error;

  const displayResults = isNearYouMode
    ? (showAll ? nearYou.allRanked.slice(0, 10) : nearYou.results.slice(0, 5))
    : (showAll ? rightNow.allRanked.slice(0, 10) : rightNow.results.slice(0, 5));

  const totalCount = isNearYouMode ? nearYou.allRanked.length : rightNow.allRanked.length;
  const hasMore = totalCount > 5;

  const handleDirections = (patio: { lat: number; lng: number; name: string }) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${patio.lat},${patio.lng}&destination_place_id=${encodeURIComponent(patio.name)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-xl rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom duration-300 max-h-[75vh] flex flex-col">
      <div className="flex justify-center pt-2.5 pb-1">
        <div className="w-10 h-1 bg-muted-foreground/25 rounded-full" />
      </div>

      <div className="px-4 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div>
            {isNearYouMode ? (
              <>
                <h2 className="font-display font-semibold text-lg">Great patios near you</h2>
                <p className="text-sm text-muted-foreground">
                  {rightNow.shouldFallback && !manualMode && rightNow.fallbackReason
                    ? rightNow.fallbackReason
                    : "Easy choices close by right now"}
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Best patios right now
                </h2>
                <p className="text-sm text-muted-foreground">
                  {getTimeSubtext(rightNow.currentTimeBucket)}
                </p>
              </>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="-mr-2 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-3">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Something went wrong</p>
              <Button variant="link" size="sm" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          ) : displayResults.length === 0 ? (
            <div className="text-center py-8">
              <Sun className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-medium">{"Here's what works nearby"}</p>
              <p className="text-sm text-muted-foreground mt-1">These spots are open right now</p>
            </div>
          ) : (
            <>
              {isNearYouMode
                ? (displayResults as NearYouResult[]).map((result, index) => (
                    <NearYouResultCard
                      key={result.patio.id}
                      result={result}
                      index={index}
                      onView={() => onPatioSelect(result.patio.id)}
                      onDirections={() => handleDirections(result.patio)}
                    />
                  ))
                : (displayResults as RightNowResult[]).map((result, index) => (
                    <RightNowResultCard
                      key={result.patio.id}
                      result={result}
                      index={index}
                      onView={() => onPatioSelect(result.patio.id)}
                      onDirections={() => handleDirections(result.patio)}
                    />
                  ))
              }
            </>
          )}
        </div>
      </ScrollArea>

      {!isLoading && !error && displayResults.length > 0 && (
        <div className="px-4 py-3 border-t border-border/40 bg-background/95">
          <div className="flex gap-2">
            {hasMore && (
              <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => setShowAll(!showAll)}>
                {showAll ? "Show less" : `Show more (${totalCount})`}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn("text-muted-foreground rounded-lg", !hasMore && "flex-1")}
              onClick={() => setManualMode(isNearYouMode ? "right-now" : "near-you")}
            >
              {isNearYouMode ? (
                <>
                  <Sun className="h-3 w-3 mr-1.5" />
                  Sunny picks
                </>
              ) : (
                <>
                  <Navigation className="h-3 w-3 mr-1.5" />
                  Nearby picks
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BestRightNowButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/40 dark:shadow-amber-900/30 gap-2 rounded-xl"
      size="default"
    >
      <Sparkles className="h-4 w-4" />
      Best Right Now
    </Button>
  );
}
