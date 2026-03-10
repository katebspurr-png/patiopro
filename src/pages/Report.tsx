import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sun, CloudSun, Cloud, Wind, Users, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePatios } from "@/hooks/usePatios";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { z } from "zod";
import type { SunStatus, WindStatus, BusyStatus } from "@/types/patio";

const MAX_NOTES_LENGTH = 500;

const notesSchema = z.string().max(MAX_NOTES_LENGTH, `Notes must be ${MAX_NOTES_LENGTH} characters or less`).optional();

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

  const currentStep = !patioId ? 1 : !status ? 2 : 3;

  const handleSubmit = async () => {
    if (!patioId || !status) {
      toast({
        title: "Missing info",
        description: "Please select a patio and sun status.",
        variant: "destructive",
      });
      return;
    }

    const trimmedNotes = notes.trim();
    const notesResult = notesSchema.safeParse(trimmedNotes || undefined);
    if (!notesResult.success) {
      toast({
        title: "Invalid notes",
        description: notesResult.error.errors[0]?.message || "Notes are invalid.",
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
      notes: trimmedNotes || null,
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
    { value: "sunny" as const, label: "Sunny", description: "Full sun on patio", icon: Sun, gradient: "from-amber-400 to-orange-500", bgSelected: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-300 dark:border-amber-700" },
    { value: "part_shade" as const, label: "Part Shade", description: "Mixed sun and shade", icon: CloudSun, gradient: "from-violet-400 to-purple-500", bgSelected: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border-violet-300 dark:border-violet-700" },
    { value: "shaded" as const, label: "Shaded", description: "Mostly or fully shaded", icon: Cloud, gradient: "from-slate-400 to-slate-500", bgSelected: "bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/40 dark:to-gray-950/40 border-slate-300 dark:border-slate-600" },
  ];

  const selectedPatio = patios?.find((p) => p.id === patioId);

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display font-semibold text-lg">Add Sun Report</h1>
            <p className="text-xs text-muted-foreground">Quick 10-second update</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="px-4 pb-3 flex gap-1.5">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                step < currentStep
                  ? "bg-gradient-to-r from-amber-400 to-orange-500"
                  : step === currentStep
                  ? "bg-amber-400/60"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Patio Selection */}
        {!preselectedPatioId && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Which patio are you at?</Label>
            <Select value={patioId} onValueChange={setPatioId}>
              <SelectTrigger className="rounded-xl h-12">
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

        {preselectedPatioId && selectedPatio && (
          <Card className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                <Sun className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">{selectedPatio.name}</p>
                {selectedPatio.neighborhood && (
                  <p className="text-xs text-muted-foreground">{selectedPatio.neighborhood}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Sun Status */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">How's the sun right now?</Label>
          <div className="grid grid-cols-3 gap-3">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = status === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                    isSelected
                      ? `${option.bgSelected} shadow-md`
                      : "border-border hover:border-primary/30 hover:shadow-sm"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center h-12 w-12 rounded-full transition-all",
                    isSelected
                      ? `bg-gradient-to-br ${option.gradient} text-white shadow-sm`
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight text-center">{option.description}</span>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional: Wind */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Wind className="h-4 w-4 text-muted-foreground" />
            Wind
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <div className="flex gap-2">
            {(["calm", "breezy", "windy"] as const).map((option) => (
              <Button
                key={option}
                variant={wind === option ? "secondary" : "outline"}
                size="sm"
                className={cn("rounded-xl flex-1 transition-all", wind === option && "shadow-sm")}
                onClick={() => setWind(wind === option ? null : option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Optional: Busy */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-muted-foreground" />
            How busy?
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <div className="flex gap-2">
            {(["quiet", "medium", "busy"] as const).map((option) => (
              <Button
                key={option}
                variant={busy === option ? "secondary" : "outline"}
                size="sm"
                className={cn("rounded-xl flex-1 transition-all", busy === option && "shadow-sm")}
                onClick={() => setBusy(busy === option ? null : option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-semibold">
            Notes
            <span className="text-xs font-normal text-muted-foreground ml-1">(optional)</span>
          </Label>
          <Textarea
            id="notes"
            placeholder="Any additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))}
            rows={3}
            maxLength={MAX_NOTES_LENGTH}
            className="rounded-xl resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {notes.length}/{MAX_NOTES_LENGTH}
          </p>
        </div>

        {/* Submit */}
        <Button
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/30 dark:shadow-amber-900/20"
          size="lg"
          onClick={handleSubmit}
          disabled={!patioId || !status || submitting}
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
