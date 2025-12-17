import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Settings, Users, Calendar, Activity } from "lucide-react";
import { useAppSettings, useUpdateAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";

export function FeatureFlagToggles() {
  const { data: settings, isLoading } = useAppSettings();
  const updateSettings = useUpdateAppSettings();
  const { toast } = useToast();
  
  const handleToggle = async (
    key: 'enable_confidence_level' | 'enable_crowd_sun_feedback' | 'enable_seasonal_adjustment',
    value: boolean
  ) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
      toast({
        title: "Settings updated",
        description: `Feature ${value ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </Card>
    );
  }
  
  if (!settings) return null;
  
  const features = [
    {
      key: 'enable_confidence_level' as const,
      label: 'Confidence Level',
      description: 'Show confidence level (low/medium/high) on patio cards and detail pages.',
      icon: Activity,
      enabled: settings.enable_confidence_level,
    },
    {
      key: 'enable_crowd_sun_feedback' as const,
      label: 'Crowd Sun Feedback',
      description: 'Allow users to submit "Was it sunny?" feedback with voting and aggregation.',
      icon: Users,
      enabled: settings.enable_crowd_sun_feedback,
    },
    {
      key: 'enable_seasonal_adjustment' as const,
      label: 'Seasonal Adjustment',
      description: 'Apply seasonal scoring adjustments based on time of year and sun profile.',
      icon: Calendar,
      enabled: settings.enable_seasonal_adjustment,
    },
  ];
  
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-full bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg">Feature Flags</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enable or disable optional features. All features are OFF by default.
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.key}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor={feature.key} className="font-medium cursor-pointer">
                    {feature.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
              <Switch
                id={feature.key}
                checked={feature.enabled}
                onCheckedChange={(checked) => handleToggle(feature.key, checked)}
                disabled={updateSettings.isPending}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
