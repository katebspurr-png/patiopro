import { Sun, Sunrise, Sunset, Moon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeOfDaySelection } from "@/hooks/useTimeOfDay";
import { getCurrentTimeOfDay } from "@/hooks/useTimeOfDay";

interface TimeOfDayToggleProps {
  selectedTime: TimeOfDaySelection;
  onTimeChange: (time: TimeOfDaySelection) => void;
}

const TIME_LABELS: Record<TimeOfDaySelection, string> = {
  now: "Now",
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  evening: "Evening",
};

const TIME_OPTIONS: { value: TimeOfDaySelection; icon: typeof Sun }[] = [
  { value: "now", icon: Clock },
  { value: "morning", icon: Sunrise },
  { value: "midday", icon: Sun },
  { value: "afternoon", icon: Sunset },
  { value: "evening", icon: Moon },
];

export function TimeOfDayToggle({ selectedTime, onTimeChange }: TimeOfDayToggleProps) {
  const currentTimeBucket = getCurrentTimeOfDay();

  return (
    <div className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-xl shadow-lg p-1 flex gap-0.5">
      {TIME_OPTIONS.map(({ value, icon: Icon }) => {
        const isSelected = selectedTime === value;
        const isNow = value === "now";

        return (
          <button
            key={value}
            onClick={() => onTimeChange(value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              isSelected
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {TIME_LABELS[value]}
              {isNow && !isSelected && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({TIME_LABELS[currentTimeBucket]})
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
