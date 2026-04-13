import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, ChevronUp, ChevronDown, MapPin, Search, X, Wind } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatioMap } from "@/components/PatioMap";
import { PatioCard } from "@/components/PatioCard";
import { Header } from "@/components/Header";
import { TimeOfDayToggle } from "@/components/TimeOfDayToggle";
import { BestRightNowPanel, BestRightNowButton } from "@/components/BestRightNowPanel";
import { FilterPanel, type AdvancedFilters, DEFAULT_FILTERS } from "@/components/FilterPanel";
import { getWeatherLabel, getWindLabel } from "@/hooks/useWeather";
import { usePatiosWithStatus } from "@/hooks/usePatios";
import { useTopPatioIds } from "@/hooks/useBestRightNow";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { useWeather } from "@/hooks/useWeather";
import { ALLOWED_TAGS } from "@/lib/sun-profile";
import { computeAllLiveScores, sortByLiveScore } from "@/lib/live-sun-score";

const TAG_LABELS: Record<string, string> = {
  waterfront: "🌊 Waterfront",
  dog_friendly: "🐕 Dog Friendly",
  heated: "🔥 Heated",
  beer_garden: "🍺 Beer Garden",
  rooftop: "🏙️ Rooftop",
  brunch: "🥞 Brunch",
  sheltered: "⛱️ Sheltered",
  courtyard: "🌿 Courtyard",
  patio_bar: "🍹 Patio Bar",
};

const Index = () => {
  const navigate = useNavigate();
  const [sunnyOnly, setSunnyOnly] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [showBestRightNow, setShowBestRightNow] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);
  
  const { data: patios, isLoading, error } = usePatiosWithStatus();
  const topPatioIds = useTopPatioIds(3);
  const { selectedTime, setSelectedTime, resolvedTime } = useTimeOfDay();
  const { weather } = useWeather();
  
  // Extract unique neighborhoods
  const neighborhoods = useMemo(() => {
    const uniqueNeighborhoods = new Set<string>();
    patios.forEach(p => {
      if (p.neighborhood) uniqueNeighborhoods.add(p.neighborhood);
    });
    return Array.from(uniqueNeighborhoods).sort();
  }, [patios]);

  // Calculate tag counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALLOWED_TAGS.forEach(tag => {
      counts[tag] = patios.filter(p => p.tags?.includes(tag)).length;
    });
    return counts;
  }, [patios]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  // Compute live scores based on resolved time
  const patiosWithLiveScores = useMemo(() => {
    return computeAllLiveScores(patios, resolvedTime, weather);
  }, [patios, resolvedTime, weather]);
  
  // Filter and sort patios
  const filteredPatios = useMemo(() => {
    let filtered = patiosWithLiveScores;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.neighborhood?.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (sunnyOnly) {
      filtered = filtered.filter(p => p.currentStatus === "sunny");
    }
    if (selectedNeighborhood !== "all") {
      filtered = filtered.filter(p => p.neighborhood === selectedNeighborhood);
    }
    // Tag filter - patio must have ALL selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(p => 
        selectedTags.every(tag => p.tags?.includes(tag))
      );
    }
    
    // Advanced filters
    if (advancedFilters.minSunScore > 0) {
      filtered = filtered.filter(p => p.sun_score_live >= advancedFilters.minSunScore);
    }
    if (advancedFilters.shadeTypes.length > 0) {
      filtered = filtered.filter(p => 
        advancedFilters.shadeTypes.includes((p as any).shade_context || "unknown")
      );
    }
    if (advancedFilters.sunProfiles.length > 0) {
      filtered = filtered.filter(p => 
        advancedFilters.sunProfiles.includes(p.sun_profile || "unknown")
      );
    }
    if (advancedFilters.priceRanges.length > 0) {
      filtered = filtered.filter(p => 
        advancedFilters.priceRanges.includes((p as any).price_range || "unknown")
      );
    }
    
    // Sort by live score descending
    return sortByLiveScore(filtered);
  }, [patiosWithLiveScores, sunnyOnly, selectedNeighborhood, searchQuery, selectedTags, advancedFilters]);

  const handlePatioSelect = (patioId: string) => {
    setShowBestRightNow(false);
    navigate(`/patio/${patioId}`);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      
      {/* Map Container */}
      <div className="flex-1 relative">
        {/* Floating Weather Pill */}
        {weather && (
          <div className="absolute top-3 left-3 z-[1000] rounded-full bg-white/90 backdrop-blur px-3 py-1.5 shadow-md flex items-center gap-2 text-xs text-foreground">
            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
            <span className="font-medium">{weather.temperature}°C</span>
            <span className="text-muted-foreground">·</span>
            <span>{getWeatherLabel(weather.weatherCode).label}</span>
            <span className="text-muted-foreground">|</span>
            <Wind className="h-3 w-3 text-muted-foreground" />
            <span>{weather.windSpeed} km/h</span>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-destructive">
            Error loading patios. Please try again.
          </div>
        ) : (
          <PatioMap 
            patios={filteredPatios} 
            onPatioClick={(id) => navigate(`/patio/${id}`)}
            highlightedIds={topPatioIds}
          />
        )}
        
        {/* Unified Filter Bar - Top center */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-background/95 backdrop-blur border shadow-md px-3 py-1.5 flex items-center gap-2">
          {/* Expandable Search */}
          <div className="flex items-center">
            {searchExpanded ? (
              <div className="relative flex items-center">
                <Search className="absolute left-2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => { if (!searchQuery) setSearchExpanded(false); }}
                  className="w-[130px] pl-7 pr-6 py-0.5 text-xs bg-transparent border-b border-muted-foreground/30 focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => { setSearchQuery(""); setSearchExpanded(false); }}
                  className="absolute right-0.5 p-0.5 hover:bg-muted rounded"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button onClick={() => setSearchExpanded(true)} className="p-1 hover:bg-muted rounded-full">
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <span className="h-4 w-px bg-border shrink-0" />

          {/* Neighborhood */}
          <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
            <SelectTrigger className="h-auto border-0 shadow-none bg-transparent px-1 py-0 text-xs gap-1 w-auto min-w-0 focus:ring-0">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">All Areas</SelectItem>
              {neighborhoods.map((neighborhood) => (
                <SelectItem key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="h-4 w-px bg-border shrink-0" />

          {/* Sunny Only */}
          <button
            onClick={() => setSunnyOnly(!sunnyOnly)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
              sunnyOnly ? "bg-amber-100 text-amber-700" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sunny</span>
          </button>

          <FilterPanel filters={advancedFilters} onChange={setAdvancedFilters} />
        </div>

        {/* Time of Day Toggle */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1000]">
          <TimeOfDayToggle 
            selectedTime={selectedTime} 
            onTimeChange={setSelectedTime} 
          />
        </div>

        {/* Tag Filter Chips - Bottom positioned above drawer */}
        <div className="absolute bottom-[188px] left-4 right-4 z-[1000]">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {ALLOWED_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap text-xs px-2 py-1 transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-background/95 backdrop-blur hover:bg-muted"
                }`}
                onClick={() => toggleTag(tag)}
              >
                {TAG_LABELS[tag] || tag}
                <span className={`ml-1 text-[10px] ${selectedTags.includes(tag) ? "opacity-80" : "opacity-60"}`}>
                  ({tagCounts[tag] || 0})
                </span>
              </Badge>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-muted-foreground hover:text-foreground px-2 whitespace-nowrap"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Best Right Now Button - Floating on map */}
        <div className="absolute top-4 right-4 z-[1000]">
          <BestRightNowButton onClick={() => setShowBestRightNow(true)} />
        </div>

        {/* Bottom Drawer */}
        <div 
          className={`absolute bottom-0 left-0 right-0 z-[1001] bg-background rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out ${
            drawerExpanded ? 'h-[70vh]' : 'h-[180px]'
          }`}
        >
          {/* Drag Handle */}
          <button
            onClick={() => setDrawerExpanded(!drawerExpanded)}
            className="w-full flex items-center justify-center pt-2 pb-1 focus:outline-none"
          >
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </button>

          {drawerExpanded ? (
            /* Expanded: full list */
            <ScrollArea className="px-4 h-[calc(70vh-40px)]">
              <div className="space-y-2 pb-4">
                {filteredPatios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {sunnyOnly ? "No sunny patios right now" : "No patios found"}
                  </div>
                ) : (
                  filteredPatios.map((patio) => (
                    <PatioCard
                      key={patio.id}
                      patio={patio}
                      onClick={() => navigate(`/patio/${patio.id}`)}
                      compact
                      scoredFor={selectedTime}
                      resolvedTime={resolvedTime}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          ) : (
            /* Collapsed: neighborhood chips + top 3 */
            <div className="px-4 space-y-2">
              {/* Neighborhood chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedNeighborhood("all")}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedNeighborhood === "all"
                      ? "bg-amber-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  All
                </button>
                {neighborhoods.map((n) => (
                  <button
                    key={n}
                    onClick={() => setSelectedNeighborhood(n)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedNeighborhood === n
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Top 3 ranked patios */}
              <div className="space-y-1.5">
                {filteredPatios.slice(0, 3).map((patio, i) => (
                  <button
                    key={patio.id}
                    onClick={() => navigate(`/patio/${patio.id}`)}
                    className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-4 text-center">{i + 1}</span>
                    <span className="bg-amber-100 text-amber-700 font-bold text-xs px-2 py-0.5 rounded-xl min-w-[36px] text-center">
                      {patio.sun_score_live ?? patio.sun_score ?? "–"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{patio.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {patio.neighborhood ?? "Unknown"} · {patio.sun_profile ?? "mixed"}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {patio.best_time_to_visit ?? "—"}
                    </span>
                  </button>
                ))}
                {filteredPatios.length === 0 && (
                  <div className="text-center py-2 text-xs text-muted-foreground">No patios found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Best Right Now Panel */}
        <BestRightNowPanel
          isOpen={showBestRightNow}
          onClose={() => setShowBestRightNow(false)}
          onPatioSelect={handlePatioSelect}
        />
      </div>
    </div>
  );
};

export default Index;
