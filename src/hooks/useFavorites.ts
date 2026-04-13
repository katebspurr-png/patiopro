import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

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
      if (!userId || !patioId) return false;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("patio_id", patioId)
        .eq("user_id", userId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!userId && !!patioId,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !patioId) throw new Error("Not authenticated");

      if (isFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("patio_id", patioId)
          .eq("user_id", userId);
      } else {
        await supabase
          .from("favorites")
          .insert({ patio_id: patioId, user_id: userId });
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
