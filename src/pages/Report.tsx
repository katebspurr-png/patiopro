import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sun, CloudSun, Cloud, Wind, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePatios } from "@/hooks/usePatios";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { SunStatus, WindStatus, BusyStatus } from "@/types/patio";

export default function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatioId = searchParams.get("patio");
  const { toast } = useToast();
  
  const { data: patios, isLoading: patiosLoading } = usePatios();
  
  const [patioId, setPatioId] = useState(preselectedPatioId || "");
  const [status, setStatus] = useState<SunStatus | null>(null);
  const [wind, setWind] = useState<WindStatus | null>(null);
  const [busy, setBusy] = useState<BusyStatus | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!patioId || !status) {
      toast({
        title: "Missing info",
        description: "Please select a patio and sun status.",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    const { error } = await supabase.from("sun_reports").insert({
      patio_id: patioId,
      status,
      wind,
      busy,
      notes: notes.trim() || null,
      is_anonymous: true,
    });
    
    setSubmitting(false);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Thanks!",
      description: "Your sun report has been submitted.",
    });
    
    navigate(preselectedPatioId ? `/patio/${preselectedPatioId}` : "/");
  };
  
  const statusOptions = [
    { value: "sunny" as const, label: "Sunny", icon: Sun, className: "bg-sunny text-sunny-foreground" },
    { value: "part_shade" as const, label: "Part Shade", icon: CloudSun, className: "bg-mixed text-mixed-foreground" },
    { value: "shaded" as const, label: "Shaded", icon: Cloud, className: "bg-shaded text-shaded-foreground" },
  ];
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center gap-2 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display font-semibold text-lg">Add Sun Report</h1>
        </div>
      </div>
      
      <div className="p-4 max-w-lg mx-auto space-y-6">
        <p className="text-sm text-muted-foreground">
          Add a quick update (10 seconds).
        </p>
        
        {/* Patio Selection */}
        {!preselectedPatioId && (
          <div className="space-y-2">
            <Label>Select patio</Label>
            <Select value={patioId} onValueChange={setPatioId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a patio..." />
              </SelectTrigger>
              <SelectContent>
                {patios?.map((patio) => (
                  <SelectItem key={patio.id} value={patio.id}>
                    {patio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {preselectedPatioId && patios && (
          <Card className="p-3 bg-muted/50">
            <p className="text-sm font-medium">
              {patios.find((p) => p.id === preselectedPatioId)?.name || "Selected patio"}
            </p>
          </Card>
        )}
        
        {/* Sun Status */}
        <div className="space-y-3">
          <Label>How's the sun right now?</Label>
          <div className="grid grid-cols-3 gap-3">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = status === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    isSelected
                      ? `${option.className} border-transparent`
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <Icon className="h-8 w-8" />
                  <span className="text-sm font-medium">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Optional: Wind */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Wind className="h-4 w-4" />
            Wind (optional)
          </Label>
          <div className="flex gap-2">
            {(["calm", "breezy", "windy"] as const).map((option) => (
              <Button
                key={option}
                variant={wind === option ? "secondary" : "outline"}
                size="sm"
                onClick={() => setWind(wind === option ? null : option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Optional: Busy */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            How busy? (optional)
          </Label>
          <div className="flex gap-2">
            {(["quiet", "medium", "busy"] as const).map((option) => (
              <Button
                key={option}
                variant={busy === option ? "secondary" : "outline"}
                size="sm"
                onClick={() => setBusy(busy === option ? null : option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
        
        {/* Submit */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={!patioId || !status || submitting}
        >
          {submitting ? "Submitting..." : "Submit Report"}
        </Button>
      </div>
    </div>
  );
}
