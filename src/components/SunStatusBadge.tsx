import { Sun, CloudSun, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SunStatus, ConfidenceLevel } from "@/types/patio";

interface SunStatusBadgeProps {
  status: SunStatus | "unknown";
  confidence?: ConfidenceLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const statusConfig = {
  sunny: {
    icon: Sun,
    label: "Sunny",
    className: "bg-sunny text-sunny-foreground",
  },
  part_shade: {
    icon: CloudSun,
    label: "Mixed",
    className: "bg-mixed text-mixed-foreground",
  },
  shaded: {
    icon: Cloud,
    label: "Shaded",
    className: "bg-shaded text-shaded-foreground",
  },
  unknown: {
    icon: CloudSun,
    label: "Unknown",
    className: "bg-muted text-muted-foreground",
  },
};

const sizeConfig = {
  sm: "h-5 px-2 text-xs gap-1",
  md: "h-7 px-3 text-sm gap-1.5",
  lg: "h-9 px-4 text-base gap-2",
};

const iconSizeConfig = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function SunStatusBadge({
  status,
  confidence,
  size = "md",
  showLabel = true,
}: SunStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          config.className,
          sizeConfig[size]
        )}
      >
        <Icon className={cn(iconSizeConfig[size], status === "sunny" && "animate-pulse-sunny")} />
        {showLabel && <span>{config.label}</span>}
      </span>
      {confidence && (
        <span
          className={cn(
            "text-xs px-1.5 py-0.5 rounded-full",
            confidence === "high" && "bg-confidence-high/20 text-confidence-high",
            confidence === "medium" && "bg-confidence-medium/20 text-confidence-medium",
            confidence === "low" && "bg-confidence-low/20 text-muted-foreground"
          )}
        >
          {confidence === "high" ? "High" : confidence === "medium" ? "Med" : "Low"}
        </span>
      )}
    </div>
  );
}
