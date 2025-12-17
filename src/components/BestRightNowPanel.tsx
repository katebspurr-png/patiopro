import { useState, useEffect } from "react";
import { Sun, X, MapPin, ChevronRight, Sparkles, Clock, Navigation, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBestRightNow } from "@/hooks/useBestRightNow";
import { useBestNearYou } from "@/hooks/useBestNearYou";
import { getSunScoreColor } from "@/lib/sun-profile";
import { formatDistance, getWalkingTime } from "@/hooks/useUserLocation";
import type { RightNowResult } from "@/lib/right-now-score";
import type { NearYouResult } from "@/lib/near-you-score";
import { cn } from "@/lib/utils";

interface BestRightNowPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPatioSelect: (patioId: string) => void;
}

type ViewMode = 'right-now' | 'near-you';

function RightNowCard({ result, onClick, rank }: { result: RightNowResult; onClick: () => void; rank: number }) {
  const { patio, rightNowScore, whyNowText } = result;
  
  return (
    <Card
      className="p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold",
          rank === 1 ? "bg-sunny text-sunny-foreground" : "bg-muted text-muted-foreground"
        )}>
          {rank}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-display font-semibold text-sm truncate">{patio.name}</h4>
              {patio.neighborhood && (
                <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="text-xs truncate">{patio.neighborhood}</span>
                </div>
              )}
            </div>
            
            <div className={cn("flex items-center gap-1 font-bold text-sm", getSunScoreColor(rightNowScore))}>
              <Sun className="h-4 w-4" />
              <span>{rightNowScore}</span>
            </div>
          </div>
          
          <p className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {whyNowText}
          </p>
        </div>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary flex-shrink-0 self-center" />
      </div>
    </Card>
  );
}

function NearYouCard({ result, onClick, rank }: { result: NearYouResult; onClick: () => void; rank: number }) {
  const { patio, nearYouScore, distanceMeters, whyNearText } = result;
  
  return (
    <Card
      className="p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold",
          rank === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {rank}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-display font-semibold text-sm truncate">{patio.name}</h4>
              <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                <div className="flex items-center gap-1">
                  <Navigation className="h-3 w-3 flex-shrink-0" />
                  <span className="text-xs">{formatDistance(distanceMeters)}</span>
                </div>
                {patio.neighborhood && (
                  <>
                    <span className="text-xs opacity-50">·</span>
                    <span className="text-xs truncate">{patio.neighborhood}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className={cn("flex items-center gap-1 font-bold text-sm", getSunScoreColor(patio.sun_score ?? 50))}>
              <Sun className="h-4 w-4" />
              <span>{patio.sun_score ?? 50}</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground font-medium mt-1.5 flex items-center gap-1">
            <LocateFixed className="h-3 w-3" />
            {whyNearText}
          </p>
        </div>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary flex-shrink-0 self-center" />
      </div>
    </Card>
  );
}

function TimeBucketBadge({ bucket }: { bucket: 'morning' | 'midday' | 'afternoon' }) {
  const labels = {
    morning: '☀️ Morning',
    midday: '🌞 Midday',
    afternoon: '🌅 Afternoon'
  };
  
  return (
    <Badge variant="secondary" className="text-xs">
      <Clock className="h-3 w-3 mr-1" />
      {labels[bucket]}
    </Badge>
  );
}

function LocationBadge({ source }: { source: 'gps' | 'cached' | 'default' }) {
  const labels = {
    gps: 'Your location',
    cached: 'Recent location',
    default: 'Downtown Halifax'
  };
  
  return (
    <Badge variant="outline" className="text-xs">
      <Navigation className="h-3 w-3 mr-1" />
      {labels[source]}
    </Badge>
  );
}

export function BestRightNowPanel({ isOpen, onClose, onPatioSelect }: BestRightNowPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const [manualMode, setManualMode] = useState<ViewMode | null>(null);
  
  const rightNow = useBestRightNow(5);
  const nearYou = useBestNearYou(5);
  
  // Determine effective view mode
  const effectiveMode: ViewMode = manualMode ?? (rightNow.shouldFallback ? 'near-you' : 'right-now');
  const isNearYouMode = effectiveMode === 'near-you';
  
  // Reset manual mode when panel closes
  useEffect(() => {
    if (!isOpen) {
      setManualMode(null);
      setShowAll(false);
    }
  }, [isOpen]);
  
  const isLoading = rightNow.isLoading || nearYou.isLoading;
  const error = rightNow.error || nearYou.error;
  
  const displayResults = isNearYouMode
    ? (showAll ? nearYou.allRanked : nearYou.results)
    : (showAll ? rightNow.allRanked : rightNow.results);
  
  const totalCount = isNearYouMode ? nearYou.allRanked.length : rightNow.allRanked.length;
  
  if (!isOpen) return null;
  
  return (
    <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col px-4 py-3 border-b gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isNearYouMode ? (
                <>
                  <Navigation className="h-5 w-5 text-primary" />
                  <h2 className="font-display font-semibold">Best Near You</h2>
                </>
              ) : (
                <>
                  <Sun className="h-5 w-5 text-sunny" />
                  <h2 className="font-display font-semibold">Best Right Now</h2>
                </>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {isNearYouMode ? (
              <LocationBadge source={nearYou.locationSource} />
            ) : (
              <TimeBucketBadge bucket={rightNow.currentTimeBucket} />
            )}
            
            {/* Show fallback reason if auto-triggered */}
            {isNearYouMode && rightNow.shouldFallback && !manualMode && rightNow.fallbackReason && (
              <span className="text-xs text-muted-foreground">
                {rightNow.fallbackReason}
              </span>
            )}
          </div>
        </div>
        
        {/* Content */}
        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                Something went wrong. Please try again.
              </div>
            ) : displayResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No patios available right now
              </div>
            ) : (
              <>
                {isNearYouMode
                  ? (displayResults as NearYouResult[]).map((result, index) => (
                      <NearYouCard
                        key={result.patio.id}
                        result={result}
                        rank={index + 1}
                        onClick={() => onPatioSelect(result.patio.id)}
                      />
                    ))
                  : (displayResults as RightNowResult[]).map((result, index) => (
                      <RightNowCard
                        key={result.patio.id}
                        result={result}
                        rank={index + 1}
                        onClick={() => onPatioSelect(result.patio.id)}
                      />
                    ))
                }
              </>
            )}
          </div>
        </ScrollArea>
        
        {/* Footer */}
        {!isLoading && !error && displayResults.length > 0 && (
          <div className="px-4 py-3 border-t space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? `Show Top 5` : `View All ${totalCount} Ranked`}
            </Button>
            
            {/* Mode toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setManualMode(isNearYouMode ? 'right-now' : 'near-you')}
            >
              {isNearYouMode ? (
                <>
                  <Sun className="h-3 w-3 mr-1.5" />
                  Switch to Best Right Now
                </>
              ) : (
                <>
                  <Navigation className="h-3 w-3 mr-1.5" />
                  Switch to Best Near You
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function BestRightNowButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="bg-sunny hover:bg-sunny/90 text-sunny-foreground shadow-lg gap-2"
      size="sm"
    >
      <Sun className="h-4 w-4" />
      Best Right Now
    </Button>
  );
}
