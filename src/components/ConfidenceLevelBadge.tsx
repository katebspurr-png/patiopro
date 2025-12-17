import { cn } from "@/lib/utils";
import type { ConfidenceLevel } from "@/types/app-settings";

interface ConfidenceLevelBadgeProps {
  level: ConfidenceLevel | null | undefined;
  className?: string;
}

const levelConfig: Record<ConfidenceLevel, { label: string; className: string }> = {
  high: {
    label: 'High',
    className: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  low: {
    label: 'Low',
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
};

export function ConfidenceLevelBadge({ level, className }: ConfidenceLevelBadgeProps) {
  if (!level) return null;
  
  const config = levelConfig[level];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      Confidence: {config.label}
    </span>
  );
}
