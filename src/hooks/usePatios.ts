import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Patio, SunReport, PatioWithStatus, SunProfile } from "@/types/patio";
import { calculateSunStatus } from "@/lib/sun-status";

export function usePatios() {
  return useQuery({
    queryKey: ["patios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patios")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as Patio[];
    },
  });
}

export function usePatio(id: string) {
  return useQuery({
    queryKey: ["patio", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patios")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Patio;
    },
    enabled: !!id,
  });
}

export function useSunReports(patioId?: string) {
  return useQuery({
    queryKey: ["sun-reports", patioId],
    queryFn: async () => {
      let query = supabase
        .from("sun_reports")
        .select("*")
        .order("reported_at", { ascending: false });
      
      if (patioId) {
        query = query.eq("patio_id", patioId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as SunReport[];
    },
  });
}

export function usePatiosWithStatus(targetTime: Date = new Date()) {
  const patiosQuery = usePatios();
  const reportsQuery = useSunReports();
  
  const patiosWithStatus: PatioWithStatus[] = [];
  
  if (patiosQuery.data && reportsQuery.data) {
    for (const patio of patiosQuery.data) {
      const patioReports = reportsQuery.data.filter(r => r.patio_id === patio.id);
      const statusResult = calculateSunStatus(
        patioReports,
        patio.sun_profile as SunProfile | null,
        targetTime
      );
      
      patiosWithStatus.push({
        ...patio,
        currentStatus: statusResult.status,
        confidence: statusResult.confidence,
        lastReportTime: statusResult.lastReportTime,
        recentReportsCount: statusResult.recentReportsCount,
      });
    }
  }
  
  return {
    data: patiosWithStatus,
    isLoading: patiosQuery.isLoading || reportsQuery.isLoading,
    error: patiosQuery.error || reportsQuery.error,
  };
}
