import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { getLocalFavorites } from "@/lib/local-favorites";

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
      const localIds = getLocalFavorites();
      if (!userId) return localIds;
      // Fetch from Supabase and merge
      const { data } = await supabase
        .from("favorites")
        .select("patio_id")
        .eq("user_id", userId);
      const remoteIds = (data ?? []).map((r) => r.patio_id);
      return [...new Set([...localIds, ...remoteIds])];
    },
  });

  return { favoriteIds, isLoggedIn: !!userId, isLoading };
}
