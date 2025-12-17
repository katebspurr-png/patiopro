import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, X, MapPin, ChevronRight, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBestRightNow, type BestRightNowState } from "@/hooks/useBestRightNow";
import { getSunScoreColor } from "@/lib/sun-profile";
import type { RightNowResult } from "@/lib/right-now-score";
import { cn } from "@/lib/utils";

interface BestRightNowPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPatioSelect: (patioId: string) => void;
}

function ResultCard({ result, onClick, rank }: { result: RightNowResult; onClick: () => void; rank: number }) {
  const { patio, rightNowScore, whyNowText } = result;
  
  return (
    <Card
      className="p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Rank badge */}
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
            
            {/* Score */}
            <div className={cn("flex items-center gap-1 font-bold text-sm", getSunScoreColor(rightNowScore))}>
              <Sun className="h-4 w-4" />
              <span>{rightNowScore}</span>
            </div>
          </div>
          
          {/* Why now text */}
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

export function BestRightNowPanel({ isOpen, onClose, onPatioSelect }: BestRightNowPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const { results, allRanked, currentTimeBucket, isLoading, error } = useBestRightNow(5);
  
  const displayResults = showAll ? allRanked : results;
  
  if (!isOpen) return null;
  
  return (
    <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-sunny" />
            <h2 className="font-display font-semibold">Best Right Now</h2>
            <TimeBucketBadge bucket={currentTimeBucket} />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
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
                {displayResults.map((result, index) => (
                  <ResultCard
                    key={result.patio.id}
                    result={result}
                    rank={index + 1}
                    onClick={() => onPatioSelect(result.patio.id)}
                  />
                ))}
              </>
            )}
          </div>
        </ScrollArea>
        
        {/* Footer */}
        {!isLoading && !error && displayResults.length > 0 && (
          <div className="px-4 py-3 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? `Show Top 5` : `View All ${allRanked.length} Ranked`}
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
