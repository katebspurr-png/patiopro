import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HappyHour {
  id: string;
  venue_name: string;
  neighborhood: string | null;
  days: string | null;
  time_range: string | null;
  details: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  patio_id: string | null;
  needs_verification: boolean;
  is_active: boolean;
}

export function useHappyHours() {
  return useQuery({
    queryKey: ["happy-hours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("happy_hours")
        .select("*")
        .eq("is_active", true)
        .order("venue_name");

      if (error) throw error;
      return data as HappyHour[];
    },
  });
}
