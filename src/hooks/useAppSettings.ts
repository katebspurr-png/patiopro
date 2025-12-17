import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppSettings } from "@/types/app-settings";

const APP_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: async (): Promise<AppSettings> => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', APP_SETTINGS_ID)
        .maybeSingle();
      
      if (error) throw error;
      
      // Return defaults if no settings found
      if (!data) {
        return {
          id: APP_SETTINGS_ID,
          enable_confidence_level: false,
          enable_crowd_sun_feedback: false,
          enable_seasonal_adjustment: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      
      return data as AppSettings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateAppSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<Pick<AppSettings, 'enable_confidence_level' | 'enable_crowd_sun_feedback' | 'enable_seasonal_adjustment'>>) => {
      const { data, error } = await supabase
        .from('app_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', APP_SETTINGS_ID)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
  });
}
