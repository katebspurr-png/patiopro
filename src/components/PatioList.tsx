import { PatioCard } from "./PatioCard";
import type { PatioWithStatus, ConfidenceLevel, SunStatus } from "@/types/patio";
import { Skeleton } from "@/components/ui/skeleton";

interface PatioListProps {
  patios: PatioWithStatus[];
  isLoading?: boolean;
  onPatioClick?: (patio: PatioWithStatus) => void;
}

// Sort patios by status and confidence
function sortPatios(patios: PatioWithStatus[]): PatioWithStatus[] {
  const statusOrder: Record<SunStatus | "unknown", number> = {
    sunny: 0,
    part_shade: 1,
    shaded: 2,
    unknown: 3,
  };
  
  const confidenceOrder: Record<ConfidenceLevel, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  
  return [...patios].sort((a, b) => {
    // First by status
    const statusDiff = statusOrder[a.currentStatus] - statusOrder[b.currentStatus];
    if (statusDiff !== 0) return statusDiff;
    
    // Then by confidence
    return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
  });
}

export function PatioList({ patios, isLoading, onPatioClick }: PatioListProps) {
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
  
  const sortedPatios = sortPatios(patios);
  
  return (
    <div className="space-y-3 p-4">
      {sortedPatios.map((patio) => (
        <PatioCard
          key={patio.id}
          patio={patio}
          onClick={() => onPatioClick?.(patio)}
        />
      ))}
    </div>
  );
}
