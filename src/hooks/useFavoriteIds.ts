import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export function useFavoriteIds() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const { data: favoriteIds = [], isLoading } = useQuery({
    queryKey: ["favoriteIds", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("favorites")
        .select("patio_id")
        .eq("user_id", userId);
      return (data ?? []).map((r) => r.patio_id);
    },
    enabled: !!userId,
  });

  return { favoriteIds, isLoggedIn: !!userId, isLoading };
}
