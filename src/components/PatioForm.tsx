import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Edit2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ALLOWED_TAGS } from "@/lib/sun-profile";

const SUN_PROFILES = ["morning", "midday", "afternoon", "all_day", "mixed", "unknown"] as const;
const SUN_ORIENTATIONS = ["east", "south", "west", "north", "unknown"] as const;
const SHADE_CONTEXTS = ["open", "partial", "enclosed", "unknown"] as const;
const PRICE_RANGES = ["low", "medium", "high", "unknown"] as const;

const patioFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  address: z.string().max(255).optional(),
  neighborhood: z.string().max(100).optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  sun_profile: z.enum(SUN_PROFILES),
  sun_orientation: z.enum(SUN_ORIENTATIONS),
  shade_context: z.enum(SHADE_CONTEXTS),
  price_range: z.enum(PRICE_RANGES),
  obstruction_context: z.string().max(200).optional(),
  sun_confidence_notes: z.string().max(500).optional(),
  sun_notes: z.string().max(500).optional(),
  tags: z.string().optional(),
  hours: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  website: z.string().url().or(z.literal("")).optional(),
  instagram: z.string().max(50).optional(),
});

type PatioFormValues = z.infer<typeof patioFormSchema>;

interface PatioFormProps {
  patio?: {
    id: string;
    name: string;
    address?: string | null;
    neighborhood?: string | null;
    lat: number;
    lng: number;
    sun_profile?: string | null;
    sun_orientation?: string | null;
    shade_context?: string | null;
    price_range?: string | null;
    obstruction_context?: string | null;
    sun_confidence_notes?: string | null;
    sun_notes?: string | null;
    tags?: string[] | null;
    hours?: string | null;
    phone?: string | null;
    website?: string | null;
    instagram?: string | null;
  };
  onSuccess?: () => void;
}

export function PatioForm({ patio, onSuccess }: PatioFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const isEditing = !!patio;

  const form = useForm<PatioFormValues>({
    resolver: zodResolver(patioFormSchema),
    defaultValues: {
      name: patio?.name || "",
      address: patio?.address || "",
      neighborhood: patio?.neighborhood || "",
      lat: patio?.lat || 44.6488,
      lng: patio?.lng || -63.5752,
      sun_profile: (patio?.sun_profile as typeof SUN_PROFILES[number]) || "unknown",
      sun_orientation: (patio?.sun_orientation as typeof SUN_ORIENTATIONS[number]) || "unknown",
      shade_context: (patio?.shade_context as typeof SHADE_CONTEXTS[number]) || "unknown",
      price_range: (patio?.price_range as typeof PRICE_RANGES[number]) || "unknown",
      obstruction_context: patio?.obstruction_context || "",
      sun_confidence_notes: patio?.sun_confidence_notes || "",
      sun_notes: patio?.sun_notes || "",
      tags: patio?.tags?.join(", ") || "",
      hours: patio?.hours || "",
      phone: patio?.phone || "",
      website: patio?.website || "",
      instagram: patio?.instagram || "",
    },
  });

  const onSubmit = async (values: PatioFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Parse and validate tags
      const tags = values.tags
        ? values.tags.split(",").map(t => t.trim()).filter(t => ALLOWED_TAGS.includes(t as any))
        : [];

      const patioData = {
        name: values.name,
        address: values.address || null,
        neighborhood: values.neighborhood || null,
        lat: values.lat,
        lng: values.lng,
        sun_profile: values.sun_profile,
        sun_orientation: values.sun_orientation,
        shade_context: values.shade_context,
        price_range: values.price_range,
        obstruction_context: values.obstruction_context || "",
        sun_confidence_notes: values.sun_confidence_notes || "",
        sun_notes: values.sun_notes || null,
        tags,
        hours: values.hours || null,
        phone: values.phone || null,
        website: values.website || null,
        instagram: values.instagram || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("patios")
          .update(patioData)
          .eq("id", patio.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Patio updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("patios")
          .insert(patioData);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Patio created successfully.",
        });
        form.reset();
      }
      
      onSuccess?.();
    } catch (error) {
      console.error("Error saving patio:", error);
      toast({
        title: "Error",
        description: "Failed to save patio. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Basic Info
          </h3>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., The Seahorse Tavern" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="lat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude *</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lng"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude *</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1665 Argyle St" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Neighborhood</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Downtown Halifax" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Sun Profile Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Sun Profile
          </h3>
          
          <FormField
            control={form.control}
            name="sun_profile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sun Profile</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sun profile" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="morning">Morning (best 9am–11:30am)</SelectItem>
                    <SelectItem value="midday">Midday (best 12pm–3pm)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (best 2pm–sunset)</SelectItem>
                    <SelectItem value="all_day">All Day (sunny throughout)</SelectItem>
                    <SelectItem value="mixed">Mixed (varies throughout day)</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  When does this patio typically get the best sun?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sun_orientation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sun Orientation</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select orientation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="east">East (morning sun)</SelectItem>
                    <SelectItem value="south">South (midday sun)</SelectItem>
                    <SelectItem value="west">West (afternoon sun)</SelectItem>
                    <SelectItem value="north">North (indirect light)</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Which direction does the patio mostly face? (east = morning, south = midday, west = afternoon)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="shade_context"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shade Context</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shade context" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="open">Open (consistent direct sun)</SelectItem>
                    <SelectItem value="partial">Partial (some shade from trees/structures)</SelectItem>
                    <SelectItem value="enclosed">Enclosed (blocked by buildings)</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How reliable is direct sun? (open = consistent, enclosed = blocked by buildings)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="obstruction_context"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Obstruction Context</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., waterfront, courtyard, street canyon, tree cover" {...field} />
                </FormControl>
                <FormDescription>
                  Brief description of what affects sun exposure
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sun_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sun Notes (public)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="e.g., Gets great afternoon sun but shade after 5pm from adjacent building" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Visible to users on the patio detail page
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sun_confidence_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sun Confidence Notes (internal)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="e.g., Tall buildings block sun after 3pm, need to verify in summer" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Internal notes for admin/editors only
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Details Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Details
          </h3>
          
          <FormField
            control={form.control}
            name="price_range"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Range</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">$ (Budget-friendly)</SelectItem>
                    <SelectItem value="medium">$$ (Moderate)</SelectItem>
                    <SelectItem value="high">$$$ (Upscale)</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  General price level for food and drinks
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., waterfront, dog_friendly, rooftop" {...field} />
                </FormControl>
                <FormDescription>
                  Comma-separated. Valid: {ALLOWED_TAGS.join(", ")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Mon-Sun 11am-11pm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 902-555-1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., seahorsetavern" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., https://seahorse.ca" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              <>
                <Edit2 className="h-4 w-4 mr-2" />
                Update Patio
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Patio
              </>
            )}
          </Button>
          
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              disabled={isRecalculating}
              onClick={async () => {
                setIsRecalculating(true);
                try {
                  const { data, error } = await supabase.rpc('recalculate_sun_outputs', {
                    p_patio_id: patio.id,
                    p_time_of_day: 'midday'
                  });
                  
                  if (error) throw error;
                  
                  toast({
                    title: "Sun Score Recalculated",
                    description: "The sun outputs have been updated.",
                  });
                  onSuccess?.();
                } catch (error) {
                  console.error('Error recalculating:', error);
                  toast({
                    title: "Error",
                    description: "Failed to recalculate sun score.",
                    variant: "destructive",
                  });
                } finally {
                  setIsRecalculating(false);
                }
              }}
            >
              {isRecalculating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
