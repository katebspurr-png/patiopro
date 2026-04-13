import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";
import {
  isLocalFavorite,
  addLocalFavorite,
  removeLocalFavorite,
} from "@/lib/local-favorites";

function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  return userId;
}

export function useIsFavorite(patioId: string | undefined) {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();

  const { data: isFavorite = false, isLoading } = useQuery({
    queryKey: ["favorite", patioId, userId],
    queryFn: async () => {
      if (!patioId) return false;
      // Check localStorage first
      if (isLocalFavorite(patioId)) return true;
      // Check Supabase if logged in
      if (userId) {
        const { data } = await supabase
          .from("favorites")
          .select("id")
          .eq("patio_id", patioId)
          .eq("user_id", userId)
          .maybeSingle();
        if (data) return true;
      }
      return false;
    },
    enabled: !!patioId,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!patioId) throw new Error("No patio ID");

      if (isFavorite) {
        // Remove from localStorage
        removeLocalFavorite(patioId);
        // Remove from Supabase if logged in
        if (userId) {
          await supabase
            .from("favorites")
            .delete()
            .eq("patio_id", patioId)
            .eq("user_id", userId);
        }
      } else {
        // Add to localStorage
        addLocalFavorite(patioId);
        // Add to Supabase if logged in
        if (userId) {
          await supabase
            .from("favorites")
            .upsert({ patio_id: patioId, user_id: userId }, { onConflict: "user_id,patio_id" });
        }
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["favorite", patioId, userId] });
      const previous = queryClient.getQueryData(["favorite", patioId, userId]);
      queryClient.setQueryData(["favorite", patioId, userId], !isFavorite);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["favorite", patioId, userId], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite", patioId, userId] });
      queryClient.invalidateQueries({ queryKey: ["favoriteIds"] });
    },
  });

  return {
    isFavorite,
    isLoading,
    isLoggedIn: !!userId,
    toggle: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  };
}
