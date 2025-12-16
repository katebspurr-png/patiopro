import type { SunReport, SunStatus, SunProfile, ConfidenceLevel, SunStatusResult } from "@/types/patio";

// Weight reports by recency
function getWeight(minutesAgo: number): number {
  if (minutesAgo <= 30) return 1.0;
  if (minutesAgo <= 120) return 0.6;
  if (minutesAgo <= 180) return 0.3;
  return 0;
}

// Convert status to numeric score
function statusToScore(status: SunStatus): number {
  switch (status) {
    case "sunny": return 1;
    case "part_shade": return 0;
    case "shaded": return -1;
  }
}

// Convert score back to display status
function scoreToStatus(score: number): SunStatus | "unknown" {
  if (score >= 0.35) return "sunny";
  if (score <= -0.35) return "shaded";
  return "part_shade";
}

// Get heuristic status based on sun_profile and time
function getHeuristicStatus(sunProfile: SunProfile | null, currentHour: number): SunStatus | "unknown" {
  if (!sunProfile || sunProfile === "unknown") return "part_shade";
  
  switch (sunProfile) {
    case "morning":
      return currentHour < 12 ? "sunny" : "part_shade";
    case "midday":
      return currentHour >= 11 && currentHour <= 14 ? "sunny" : "part_shade";
    case "afternoon":
      return currentHour >= 14 ? "sunny" : "part_shade";
    case "mixed":
      return "part_shade";
    default:
      return "part_shade";
  }
}

export function calculateSunStatus(
  reports: SunReport[],
  sunProfile: SunProfile | null,
  targetTime: Date = new Date()
): SunStatusResult {
  const now = targetTime.getTime();
  const threeHoursAgo = now - 3 * 60 * 60 * 1000;
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;
  
  // Filter reports from last 3 hours
  const recentReports = reports.filter(r => {
    const reportTime = new Date(r.reported_at || r.created_at || 0).getTime();
    return reportTime >= threeHoursAgo;
  });
  
  // Sort by most recent first
  recentReports.sort((a, b) => {
    const timeA = new Date(a.reported_at || a.created_at || 0).getTime();
    const timeB = new Date(b.reported_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });
  
  const lastReportTime = recentReports[0]?.reported_at || recentReports[0]?.created_at;
  
  // Determine confidence
  let confidence: ConfidenceLevel = "low";
  const reportsWithinHour = recentReports.filter(r => {
    const reportTime = new Date(r.reported_at || r.created_at || 0).getTime();
    return reportTime >= oneHourAgo;
  });
  const reportsWithinTwoHours = recentReports.filter(r => {
    const reportTime = new Date(r.reported_at || r.created_at || 0).getTime();
    return reportTime >= twoHoursAgo;
  });
  
  if (reportsWithinHour.length >= 2) {
    confidence = "high";
  } else if (reportsWithinTwoHours.length >= 1) {
    confidence = "medium";
  }
  
  // If no recent reports, use heuristic fallback
  if (recentReports.length === 0 || confidence === "low") {
    return {
      status: getHeuristicStatus(sunProfile, targetTime.getHours()),
      confidence: "low",
      lastReportTime: lastReportTime || undefined,
      recentReportsCount: recentReports.length,
    };
  }
  
  // Calculate weighted average score
  let totalWeight = 0;
  let weightedScore = 0;
  
  for (const report of recentReports) {
    const reportTime = new Date(report.reported_at || report.created_at || 0).getTime();
    const minutesAgo = (now - reportTime) / (60 * 1000);
    const weight = getWeight(minutesAgo);
    
    if (weight > 0) {
      totalWeight += weight;
      weightedScore += statusToScore(report.status as SunStatus) * weight;
    }
  }
  
  const averageScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  
  return {
    status: scoreToStatus(averageScore),
    confidence,
    lastReportTime: lastReportTime || undefined,
    recentReportsCount: recentReports.length,
  };
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
