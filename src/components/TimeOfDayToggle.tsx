import { Sun, Sunrise, Sunset, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeOfDaySelection } from "@/hooks/useTimeOfDay";
import { TIME_OF_DAY_LABELS } from "@/lib/live-sun-score";

interface TimeOfDayToggleProps {
  selectedTime: TimeOfDaySelection;
  onTimeChange: (time: TimeOfDaySelection) => void;
}

const TIME_OPTIONS: { value: TimeOfDaySelection; icon: typeof Sun }[] = [
  { value: "morning", icon: Sunrise },
  { value: "midday", icon: Sun },
  { value: "afternoon", icon: Sunset },
  { value: "evening", icon: Moon },
];

export function TimeOfDayToggle({ selectedTime, onTimeChange }: TimeOfDayToggleProps) {
  return (
    <div className="bg-background/95 backdrop-blur border rounded-lg shadow-lg p-1 flex gap-0.5">
      {TIME_OPTIONS.map(({ value, icon: Icon }) => {
        const isSelected = selectedTime === value;
        return (
          <button
            key={value}
            onClick={() => onTimeChange(value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{TIME_OF_DAY_LABELS[value]}</span>
          </button>
        );
      })}
    </div>
  );
}
