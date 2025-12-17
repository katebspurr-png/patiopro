import { useState, useEffect } from "react";
import { Sun, X, MapPin, Navigation, LocateFixed, ExternalLink, MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBestRightNow } from "@/hooks/useBestRightNow";
import { useBestNearYou } from "@/hooks/useBestNearYou";
import { getSunScoreColor } from "@/lib/sun-profile";
import { formatDistance } from "@/hooks/useUserLocation";
import type { RightNowResult } from "@/lib/right-now-score";
import type { NearYouResult } from "@/lib/near-you-score";
import { cn } from "@/lib/utils";

interface BestRightNowPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPatioSelect: (patioId: string) => void;
}

type ViewMode = "right-now" | "near-you";

/**
 * Get time-of-day specific subtext
 */
function getTimeSubtext(bucket: "morning" | "midday" | "afternoon"): string {
  const hour = new Date().getHours();
  
  // Early morning (before 9am)
  if (hour < 9) {
    return "Good spots as the day brightens";
  }
  
  // Evening (after 6pm)
  if (hour >= 18) {
    return "Nice light to finish the day";
  }
  
  // Normal times
  const subtexts: Record<typeof bucket, string> = {
    morning: "Great light for this time of day",
    midday: "Bright right now",
    afternoon: "Perfect afternoon sun"
  };
  
  return subtexts[bucket];
}

function RightNowResultCard({ 
  result, 
  onView, 
  onDirections 
}: { 
  result: RightNowResult; 
  onView: () => void;
  onDirections: () => void;
}) {
  const { patio, rightNowScore, whyNowText } = result;
  
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold truncate">{patio.name}</h4>
          <p className="text-sm text-muted-foreground truncate">
            {patio.neighborhood || patio.address || "Downtown Halifax"}
          </p>
        </div>
        <div className={cn("flex items-center gap-1 font-bold", getSunScoreColor(rightNowScore))}>
          <Sun className="h-4 w-4" />
          <span>{rightNowScore}</span>
        </div>
      </div>
      
      <div className="mt-3 space-y-1">
        <p className="text-sm font-medium text-primary">{whyNowText}</p>
        <p className="text-xs text-muted-foreground">{patio.best_time_to_visit || "Check recent visits"}</p>
      </div>
      
      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
          <ExternalLink className="h-3 w-3 mr-1.5" />
          View
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={onDirections}>
          <MapIcon className="h-3 w-3 mr-1.5" />
          Directions
        </Button>
      </div>
    </Card>
  );
}

function NearYouResultCard({ 
  result, 
  onView, 
  onDirections 
}: { 
  result: NearYouResult; 
  onView: () => void;
  onDirections: () => void;
}) {
  const { patio, distanceMeters, whyNearText } = result;
  
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold truncate">{patio.name}</h4>
          <p className="text-sm text-muted-foreground truncate">
            {patio.neighborhood || patio.address || "Downtown Halifax"}
          </p>
        </div>
        <div className={cn("flex items-center gap-1 font-bold", getSunScoreColor(patio.sun_score ?? 50))}>
          <Sun className="h-4 w-4" />
          <span>{patio.sun_score ?? 50}</span>
        </div>
      </div>
      
      <div className="mt-3 space-y-1">
        <p className="text-sm font-medium">{whyNearText}</p>
        <p className="text-xs text-muted-foreground">{patio.best_time_to_visit || "Check recent visits"}</p>
      </div>
      
      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
          <ExternalLink className="h-3 w-3 mr-1.5" />
          View
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={onDirections}>
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
      <Sun className="h-8 w-8 text-sunny animate-pulse" />
      <p className="text-sm text-muted-foreground">Finding good patio light...</p>
    </div>
  );
}

export function BestRightNowPanel({ isOpen, onClose, onPatioSelect }: BestRightNowPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const [manualMode, setManualMode] = useState<ViewMode | null>(null);
  
  const rightNow = useBestRightNow(5);
  const nearYou = useBestNearYou(5);
  
  // Determine effective view mode
  const effectiveMode: ViewMode = manualMode ?? (rightNow.shouldFallback ? "near-you" : "right-now");
  const isNearYouMode = effectiveMode === "near-you";
  
  // Reset state when panel closes
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
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-background rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-300 max-h-[70vh] flex flex-col">
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
      </div>
      
      {/* Header */}
      <div className="px-4 pb-3 border-b">
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
                <h2 className="font-display font-semibold text-lg">Best patios right now</h2>
                <p className="text-sm text-muted-foreground">
                  {getTimeSubtext(rightNow.currentTimeBucket)}
                </p>
              </>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="-mr-2">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Results */}
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
              <p className="font-medium">{"Here's what works nearby"}</p>
              <p className="text-sm text-muted-foreground mt-1">These spots are open right now</p>
            </div>
          ) : (
            <>
              {isNearYouMode
                ? (displayResults as NearYouResult[]).map((result) => (
                    <NearYouResultCard
                      key={result.patio.id}
                      result={result}
                      onView={() => onPatioSelect(result.patio.id)}
                      onDirections={() => handleDirections(result.patio)}
                    />
                  ))
                : (displayResults as RightNowResult[]).map((result) => (
                    <RightNowResultCard
                      key={result.patio.id}
                      result={result}
                      onView={() => onPatioSelect(result.patio.id)}
                      onDirections={() => handleDirections(result.patio)}
                    />
                  ))
              }
            </>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      {!isLoading && !error && displayResults.length > 0 && (
        <div className="px-4 py-3 border-t bg-background">
          <div className="flex gap-2">
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show less" : `Show more (${totalCount})`}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn("text-muted-foreground", !hasMore && "flex-1")}
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
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={onClick}
        className="bg-sunny hover:bg-sunny/90 text-sunny-foreground shadow-lg gap-2"
        size="default"
      >
        <Sun className="h-4 w-4" />
        Best Right Now
      </Button>
      <span className="text-xs text-muted-foreground/80 pr-1">
        Find the best patios for this moment
      </span>
    </div>
  );
}
