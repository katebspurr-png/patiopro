import { PatioCard } from "./PatioCard";
import type { PatioWithStatus, ConfidenceLevel, SunStatus } from "@/types/patio";
import { Skeleton } from "@/components/ui/skeleton";
import { computeAllLiveScores, sortByLiveScore, type PatioWithLiveScore } from "@/lib/live-sun-score";
import type { TimeOfDaySelection } from "@/hooks/useTimeOfDay";
import { useMemo } from "react";

interface PatioListProps {
  patios: PatioWithStatus[];
  isLoading?: boolean;
  onPatioClick?: (patio: PatioWithLiveScore) => void;
  timeOfDay?: TimeOfDaySelection;
}

export function PatioList({ patios, isLoading, onPatioClick, timeOfDay = "midday" }: PatioListProps) {
  // Compute live scores and sort
  const sortedPatios = useMemo(() => {
    const withScores = computeAllLiveScores(patios, timeOfDay);
    return sortByLiveScore(withScores);
  }, [patios, timeOfDay]);
  
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  
  if (patios.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No patios found matching your criteria.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 p-4">
      {sortedPatios.map((patio) => (
        <PatioCard
          key={patio.id}
          patio={patio}
          onClick={() => onPatioClick?.(patio)}
          scoredFor={timeOfDay}
        />
      ))}
    </div>
  );
}
