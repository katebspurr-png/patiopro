import { useState } from "react";
import { Sun, Cloud, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TimeOfDay } from "@/types/app-settings";

interface SunFeedbackWidgetProps {
  patioId: string;
  sunnyVotes: number;
  notSunnyVotes: number;
  lastSunCheckAt: string | null;
}

function getDeviceFingerprint(): string {
  const nav = window.navigator;
  const screen = window.screen;
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');
  
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function SunFeedbackWidget({
  patioId,
  sunnyVotes,
  notSunnyVotes,
  lastSunCheckAt,
}: SunFeedbackWidgetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<'initial' | 'time' | 'notes'>('initial');
  const [wasSunny, setWasSunny] = useState<boolean | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(null);
  const [notes, setNotes] = useState('');
  
  const submitMutation = useMutation({
    mutationFn: async () => {
      const deviceFingerprint = getDeviceFingerprint();
      
      const { data: canSubmit, error: checkError } = await supabase
        .rpc('can_submit_sun_check', {
          p_patio_id: patioId,
          p_device_fingerprint: deviceFingerprint,
        });
      
      if (checkError) throw checkError;
      
      if (!canSubmit) {
        throw new Error('You can only submit one report per patio every 2 hours.');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('sun_checks')
        .insert({
          patio_id: patioId,
          was_sunny: wasSunny!,
          time_of_day: timeOfDay!,
          notes: notes.trim() || null,
          user_id: user?.id || null,
          device_fingerprint: deviceFingerprint,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Thanks for your feedback!",
        description: "Your sun report has been recorded.",
      });
      setStep('initial');
      setWasSunny(null);
      setTimeOfDay(null);
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['patio', patioId] });
    },
    onError: (error) => {
      toast({
        title: "Couldn't submit",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  const handleSunnyChoice = (sunny: boolean) => {
    setWasSunny(sunny);
    setStep('time');
  };
  
  const handleTimeChoice = (time: TimeOfDay) => {
    setTimeOfDay(time);
    setStep('notes');
  };
  
  const handleSubmit = () => {
    if (wasSunny === null || timeOfDay === null) return;
    submitMutation.mutate();
  };
  
  const totalVotes = sunnyVotes + notSunnyVotes;
  
  return (
    <Card className="p-4">
      <h3 className="font-sans font-semibold mb-3">Was it sunny when you visited?</h3>
      
      {step === 'initial' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-12 border border-gray-200 text-gray-700 rounded-xl bg-white"
              onClick={() => handleSunnyChoice(true)}
            >
              <Sun className="h-5 w-5 mr-2 text-[#C87533]" />
              Yes ☀️
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 border border-gray-200 text-gray-700 rounded-xl bg-white"
              onClick={() => handleSunnyChoice(false)}
            >
              <Cloud className="h-5 w-5 mr-2 text-gray-400" />
              No ☁️
            </Button>
          </div>
          
          {totalVotes > 0 && (
            <p className="text-[13px] text-gray-400 text-center">
              Recent reports: {sunnyVotes} sunny / {notSunnyVotes} not sunny
              {lastSunCheckAt && (
                <> · Last report: {new Date(lastSunCheckAt).toLocaleDateString()}</>
              )}
            </p>
          )}
        </div>
      )}
      
      {step === 'time' && (
        <div className="space-y-3">
          <p className="text-[14px] text-gray-400 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            When did you visit?
          </p>
          <div className="flex gap-2">
            {(['morning', 'midday', 'afternoon'] as const).map((time) => (
              <Button
                key={time}
                variant="outline"
                size="sm"
                className="flex-1 border border-gray-200 text-gray-700 rounded-xl bg-white"
                onClick={() => handleTimeChoice(time)}
              >
                {time.charAt(0).toUpperCase() + time.slice(1)}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStep('initial')}>
            ← Back
          </Button>
        </div>
      )}
      
      {step === 'notes' && (
        <div className="space-y-3">
          <Textarea
            placeholder="Any notes? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={200}
          />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep('time')}>
              ← Back
            </Button>
            <Button
              className="flex-1 bg-[#C87533] hover:bg-[#A86020] text-white rounded-xl"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
