import { useState, useEffect } from "react";

export type TimeOfDaySelection = "morning" | "midday" | "afternoon" | "evening";

const STORAGE_KEY = "patio-time-of-day-selection";

function getCurrentTimeOfDay(): TimeOfDaySelection {
  const hour = new Date().getHours();
  if (hour < 11) return "morning";
  if (hour < 14) return "midday";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function useTimeOfDay() {
  const [selectedTime, setSelectedTime] = useState<TimeOfDaySelection>(() => {
    // Try to restore from localStorage, default to midday
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ["morning", "midday", "afternoon", "evening"].includes(stored)) {
        return stored as TimeOfDaySelection;
      }
    }
    return "midday";
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedTime);
  }, [selectedTime]);

  return {
    selectedTime,
    setSelectedTime,
    getCurrentTimeOfDay,
  };
}
