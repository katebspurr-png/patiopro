import { MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SunStatusBadge } from "./SunStatusBadge";
import { formatTimeAgo } from "@/lib/sun-status";
import type { PatioWithStatus } from "@/types/patio";
import { cn } from "@/lib/utils";

interface PatioCardProps {
  patio: PatioWithStatus;
  onClick?: () => void;
  compact?: boolean;
}

export function PatioCard({ patio, onClick, compact = false }: PatioCardProps) {
  const displayTags = patio.tags?.slice(0, 2) || [];
  
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
        <SunStatusBadge
          status={patio.currentStatus}
          confidence={patio.confidence}
          size={compact ? "sm" : "md"}
        />
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {patio.lastReportTime
              ? formatTimeAgo(patio.lastReportTime)
              : "No recent reports"}
          </span>
        </div>
        
        {displayTags.length > 0 && (
          <div className="flex gap-1">
            {displayTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                {tag.replace("_", " ")}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
