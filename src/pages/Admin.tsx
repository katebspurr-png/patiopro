import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Sun, CheckCircle, Database, Plus, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { usePatios } from "@/hooks/usePatios";
import { FeatureFlagToggles } from "@/components/FeatureFlagToggles";
import { PatioForm } from "@/components/PatioForm";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { data: patios, refetch: refetchPatios } = usePatios();
  const [recalculating, setRecalculating] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<number | null>(null);
  const [selectedPatio, setSelectedPatio] = useState<typeof patios[0] | null>(null);

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

  const handleBackfillSunScoreBase = async () => {
    setBackfilling(true);
    setBackfillResult(null);
    
    try {
      const { data, error } = await supabase.rpc('backfill_sun_score_base');
      
      if (error) throw error;
      
      setBackfillResult(data as number);
      toast({
        title: "Success",
        description: `Backfilled sun_score_base for ${data} patios.`,
      });
    } catch (error) {
      console.error('Error backfilling sun_score_base:', error);
      toast({
        title: "Error",
        description: "Failed to backfill. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setBackfilling(false);
    }
  };

  const handleFormSuccess = () => {
    refetchPatios();
    setSelectedPatio(null);
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

      <div className="p-4 max-w-2xl mx-auto">
        <Tabs defaultValue="patios" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="patios">
              <List className="h-4 w-4 mr-2" />
              Patios
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="h-4 w-4 mr-2" />
              {selectedPatio ? "Edit" : "Create"}
            </TabsTrigger>
            <TabsTrigger value="tools">
              <Database className="h-4 w-4 mr-2" />
              Tools
            </TabsTrigger>
          </TabsList>

          {/* Patios List Tab */}
          <TabsContent value="patios" className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-4">All Patios ({patios?.length || 0})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {patios?.map((patio) => (
                  <div
                    key={patio.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => setSelectedPatio(patio)}
                  >
                    <div>
                      <p className="font-medium text-sm">{patio.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {patio.neighborhood || "No neighborhood"} · Score: {patio.sun_score}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Create/Edit Tab */}
          <TabsContent value="create" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">
                  {selectedPatio ? `Edit: ${selectedPatio.name}` : "Create New Patio"}
                </h2>
                {selectedPatio && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPatio(null)}>
                    Clear
                  </Button>
                )}
              </div>
              <PatioForm 
                patio={selectedPatio || undefined} 
                onSuccess={handleFormSuccess} 
              />
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            {/* Feature Flags */}
            <FeatureFlagToggles />

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

            {/* Backfill Sun Score Base */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Database className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-semibold text-lg">
                    Backfill Sun Score Base
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    One-time migration to populate sun_score_base from existing sun_score values. Sets default of 50 for patios with no score.
                  </p>
                  
                  {backfillResult !== null && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Backfilled {backfillResult} patios</span>
                    </div>
                  )}
                  
                  <Button
                    className="mt-4"
                    variant="secondary"
                    onClick={handleBackfillSunScoreBase}
                    disabled={backfilling}
                  >
                    {backfilling ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Backfilling...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Backfill Base Scores
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
                <p><strong>all_day:</strong> Base 85, "All-day sun"</p>
                <p><strong>afternoon:</strong> Base 75, "Afternoon bias"</p>
                <p><strong>morning:</strong> Base 70, "Morning bias"</p>
                <p><strong>midday:</strong> Base 80, "Afternoon bias"</p>
                <p><strong>mixed:</strong> Base 60, "Mixed sun & shade"</p>
                <p><strong>unknown:</strong> Base 55, "Sun varies"</p>
                <p className="mt-2 pt-2 border-t">
                  <strong>Shade:</strong> open +10, partial 0, enclosed -12
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}