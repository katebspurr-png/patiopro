import type { Tables } from "@/integrations/supabase/types";

export type Patio = Tables<"patios">;
export type SunReport = Tables<"sun_reports">;
export type PatioSubmission = Tables<"patio_submissions">;
export type Favorite = Tables<"favorites">;

export type SunStatus = "sunny" | "part_shade" | "shaded";
export type WindStatus = "calm" | "breezy" | "windy";
export type BusyStatus = "quiet" | "medium" | "busy";
export type SunProfile = "morning" | "midday" | "afternoon" | "mixed" | "unknown";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface PatioWithStatus extends Patio {
  currentStatus: SunStatus | "unknown";
  confidence: ConfidenceLevel;
  lastReportTime?: string;
  recentReportsCount: number;
}

export interface SunStatusResult {
  status: SunStatus | "unknown";
  confidence: ConfidenceLevel;
  lastReportTime?: string;
  recentReportsCount: number;
}
