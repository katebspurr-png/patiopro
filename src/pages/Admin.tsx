import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Sun, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [recalculating, setRecalculating] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);

  const handleRecalculateSunFields = async () => {
    setRecalculating(true);
    setLastResult(null);
    
    try {
      const { data, error } = await supabase.rpc('recalculate_all_sun_fields');
      
      if (error) throw error;
      
      setLastResult(data as number);
      toast({
        title: "Success",
        description: `Recalculated sun fields for ${data} patios.`,
      });
    } catch (error) {
      console.error('Error recalculating sun fields:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate sun fields. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setRecalculating(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="text-center text-muted-foreground mt-8">
          Admin access required.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center gap-2 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display font-semibold text-lg">Admin</h1>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Sun Fields Recalculation */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-amber-500/10">
              <Sun className="h-6 w-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-semibold text-lg">
                Recalculate Sun Fields
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Updates sun_score, sun_score_reason, and best_time_to_visit for all patios based on their sun_profile.
              </p>
              
              {lastResult !== null && (
                <div className="flex items-center gap-2 mt-3 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Updated {lastResult} patios</span>
                </div>
              )}
              
              <Button
                className="mt-4"
                onClick={handleRecalculateSunFields}
                disabled={recalculating}
              >
                {recalculating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Recalculating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recalculate All
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-4 bg-muted/50">
          <h3 className="font-semibold text-sm mb-2">Sun Profile Mapping</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>morning:</strong> Score 80, "9am–11:30am"</p>
            <p><strong>midday:</strong> Score 90, "12pm–3pm"</p>
            <p><strong>afternoon:</strong> Score 95, "2pm–sunset"</p>
            <p><strong>mixed:</strong> Score 70, "12pm–4pm"</p>
            <p><strong>unknown:</strong> Score 50, "check recent visits"</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
