import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, ChevronUp, ChevronDown, MapPin, Search, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
import { WeatherBanner } from "@/components/WeatherBanner";
import { HourlyForecast } from "@/components/HourlyForecast";
import { FilterPanel, type AdvancedFilters, DEFAULT_FILTERS } from "@/components/FilterPanel";
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
      <WeatherBanner />
      <HourlyForecast />
      
      {/* Map Container */}
      <div className="flex-1 relative">
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
        
        {/* Time of Day Toggle - Top center */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <TimeOfDayToggle 
            selectedTime={selectedTime} 
            onTimeChange={setSelectedTime} 
          />
        </div>
        
        {/* Sunny Only Toggle + Filters - Floating on map */}
        <div className="absolute top-16 left-4 z-10 flex items-center gap-2">
          <div className="bg-background/95 backdrop-blur border rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <Switch
              id="sunny-only"
              checked={sunnyOnly}
              onCheckedChange={setSunnyOnly}
              className="data-[state=checked]:bg-sunny"
            />
            <Label htmlFor="sunny-only" className="flex items-center gap-1.5 cursor-pointer">
              <Sun className="h-4 w-4 text-sunny" />
              <span className="text-sm font-medium">Sunny Only</span>
            </Label>
          </div>
          <FilterPanel filters={advancedFilters} onChange={setAdvancedFilters} />
        </div>

        {/* Search and Neighborhood Filters */}
        <div className="absolute top-[104px] left-4 z-10 flex flex-col gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[200px] pl-9 pr-8 bg-background/95 backdrop-blur border shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
          
          {/* Neighborhood Filter */}
          <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
            <SelectTrigger className="w-[200px] bg-background/95 backdrop-blur border shadow-lg">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
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
        </div>

        {/* Tag Filter Chips - Bottom positioned above drawer */}
        <div className="absolute bottom-[188px] left-4 right-4 z-10">
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
        <div className="absolute top-4 right-4 z-10">
          <BestRightNowButton onClick={() => setShowBestRightNow(true)} />
        </div>

        {/* Bottom Drawer */}
        <div 
          className={`absolute bottom-0 left-0 right-0 z-20 bg-background rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out ${
            drawerExpanded ? 'h-[70vh]' : 'h-[180px]'
          }`}
        >
          {/* Drawer Handle */}
          <button
            onClick={() => setDrawerExpanded(!drawerExpanded)}
            className="w-full flex flex-col items-center pt-2 pb-1 focus:outline-none"
          >
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mb-2" />
            <div className="flex items-center gap-1 text-muted-foreground">
              {drawerExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
              <span className="text-xs font-medium">
                {filteredPatios.length} patios
                {selectedNeighborhood !== "all" && ` in ${selectedNeighborhood}`}
                {sunnyOnly && ` • sunny only`}
              </span>
            </div>
          </button>

          {/* Drawer Content */}
          <ScrollArea className={`px-4 ${drawerExpanded ? 'h-[calc(70vh-60px)]' : 'h-[120px]'}`}>
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
