import { useState, useEffect, useMemo } from "react";

export type TimeOfDaySelection = "now" | "morning" | "midday" | "afternoon" | "evening";
export type ResolvedTimeOfDay = "morning" | "midday" | "afternoon" | "evening";

const STORAGE_KEY = "patio-time-of-day-selection";

/**
 * Get the actual time of day based on current hour
 */
export function getCurrentTimeOfDay(): ResolvedTimeOfDay {
  const hour = new Date().getHours();
  if (hour < 11) return "morning";
  if (hour < 14) return "midday";
  if (hour < 18) return "afternoon";
  return "evening";
}

/**
 * Resolve a time selection to an actual time of day
 * "now" gets resolved to the current time bucket
 */
export function resolveTimeOfDay(selection: TimeOfDaySelection): ResolvedTimeOfDay {
  if (selection === "now") {
    return getCurrentTimeOfDay();
  }
  return selection;
}

export function useTimeOfDay() {
  const [selectedTime, setSelectedTime] = useState<TimeOfDaySelection>(() => {
    // Try to restore from localStorage, default to "now"
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ["now", "morning", "midday", "afternoon", "evening"].includes(stored)) {
        return stored as TimeOfDaySelection;
      }
    }
    return "now";
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedTime);
  }, [selectedTime]);

  // Resolved time updates when "now" is selected and time changes
  const resolvedTime = useMemo(() => {
    return resolveTimeOfDay(selectedTime);
  }, [selectedTime]);

  return {
    selectedTime,
    setSelectedTime,
    resolvedTime,
    getCurrentTimeOfDay,
  };
}
