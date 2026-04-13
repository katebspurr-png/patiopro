import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface AdvancedFilters {
  minSunScore: number;
  shadeTypes: string[];
  sunProfiles: string[];
  priceRanges: string[];
}

export const DEFAULT_FILTERS: AdvancedFilters = {
  minSunScore: 0,
  shadeTypes: [],
  sunProfiles: [],
  priceRanges: [],
};

export function hasActiveFilters(filters: AdvancedFilters): boolean {
  return (
    filters.minSunScore > 0 ||
    filters.shadeTypes.length > 0 ||
    filters.sunProfiles.length > 0 ||
    filters.priceRanges.length > 0
  );
}

export function countActiveFilters(filters: AdvancedFilters): number {
  let count = 0;
  if (filters.minSunScore > 0) count++;
  if (filters.shadeTypes.length > 0) count++;
  if (filters.sunProfiles.length > 0) count++;
  if (filters.priceRanges.length > 0) count++;
  return count;
}

const SHADE_OPTIONS = [
  { value: "open", label: "☀️ Open", desc: "Direct sun, no cover" },
  { value: "partial", label: "⛅ Partial", desc: "Some shade coverage" },
  { value: "enclosed", label: "🏠 Enclosed", desc: "Covered or walled" },
];

const SUN_PROFILE_OPTIONS = [
  { value: "morning", label: "🌅 Morning" },
  { value: "midday", label: "☀️ Midday" },
  { value: "afternoon", label: "🌇 Afternoon" },
  { value: "all_day", label: "🌞 All Day" },
  { value: "mixed", label: "🔀 Mixed" },
];

const PRICE_OPTIONS = [
  { value: "low", label: "💲 Budget" },
  { value: "medium", label: "💲💲 Mid-range" },
  { value: "high", label: "💲💲💲 Upscale" },
];

function toggleInArray(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
}

interface FilterPanelProps {
  filters: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const activeCount = countActiveFilters(filters);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-background/95 backdrop-blur shadow-lg rounded-full gap-1.5"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
          {activeCount > 0 && (
            <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between pr-0">
          <SheetTitle className="text-base">Filters</SheetTitle>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => onChange(DEFAULT_FILTERS)}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset all
            </Button>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Min Sun Score */}
          <div>
            <Label className="text-sm font-semibold">Minimum Sun Score</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Only show patios scoring at least {filters.minSunScore}
            </p>
            <div className="mt-3 px-1">
              <Slider
                value={[filters.minSunScore]}
                onValueChange={([val]) => onChange({ ...filters, minSunScore: val })}
                max={100}
                min={0}
                step={5}
              />
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>0</span>
                <span className="font-medium text-foreground">{filters.minSunScore}</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sun Profile */}
          <div>
            <Label className="text-sm font-semibold">Best Time of Day</Label>
            <p className="text-xs text-muted-foreground mt-0.5">When the patio gets the most sun</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUN_PROFILE_OPTIONS.map((opt) => (
                <Badge
                  key={opt.value}
                  variant={filters.sunProfiles.includes(opt.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer text-xs px-2.5 py-1 transition-all",
                    filters.sunProfiles.includes(opt.value)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                  onClick={() => onChange({ ...filters, sunProfiles: toggleInArray(filters.sunProfiles, opt.value) })}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Shade Type */}
          <div>
            <Label className="text-sm font-semibold">Shade Type</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Patio sun exposure style</p>
            <div className="flex flex-col gap-1.5 mt-2">
              {SHADE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-all",
                    filters.shadeTypes.includes(opt.value)
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:bg-muted/50"
                  )}
                  onClick={() => onChange({ ...filters, shadeTypes: toggleInArray(filters.shadeTypes, opt.value) })}
                >
                  <span>{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Price Range */}
          <div>
            <Label className="text-sm font-semibold">Price Range</Label>
            <p className="text-xs text-muted-foreground mt-0.5">How pricey the menu is</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRICE_OPTIONS.map((opt) => (
                <Badge
                  key={opt.value}
                  variant={filters.priceRanges.includes(opt.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer text-xs px-2.5 py-1 transition-all",
                    filters.priceRanges.includes(opt.value)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                  onClick={() => onChange({ ...filters, priceRanges: toggleInArray(filters.priceRanges, opt.value) })}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
