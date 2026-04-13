import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Wind, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { PatioMap } from "@/components/PatioMap";
import { PatioCard } from "@/components/PatioCard";
import { Header } from "@/components/Header";
import { TimeOfDayToggle } from "@/components/TimeOfDayToggle";
import { BestRightNowPanel } from "@/components/BestRightNowPanel";
import { getWeatherLabel } from "@/hooks/useWeather";
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
  
  const { data: patios, isLoading, error } = usePatiosWithStatus();
  const topPatioIds = useTopPatioIds(3);
  const { selectedTime, setSelectedTime, resolvedTime } = useTimeOfDay();
  const { weather } = useWeather();
  
  const neighborhoods = useMemo(() => {
    const uniqueNeighborhoods = new Set<string>();
    patios.forEach(p => {
      if (p.neighborhood) uniqueNeighborhoods.add(p.neighborhood);
    });
    return Array.from(uniqueNeighborhoods).sort();
  }, [patios]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALLOWED_TAGS.forEach(tag => {
      counts[tag] = patios.filter(p => p.tags?.includes(tag)).length;
    });
    return counts;
  }, [patios]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  
  const patiosWithLiveScores = useMemo(() => {
    return computeAllLiveScores(patios, resolvedTime, weather);
  }, [patios, resolvedTime, weather]);
  
  const filteredPatios = useMemo(() => {
    let filtered = patiosWithLiveScores;
    
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
    if (selectedTags.length > 0) {
      filtered = filtered.filter(p => 
        selectedTags.every(tag => p.tags?.includes(tag))
      );
    }
    
    return sortByLiveScore(filtered);
  }, [patiosWithLiveScores, sunnyOnly, selectedNeighborhood, searchQuery, selectedTags]);

  const handlePatioSelect = (patioId: string) => {
    setShowBestRightNow(false);
    navigate(`/patio/${patioId}`);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      
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

        {/* Weather Pill — top left */}
        {weather && (
          <div className="absolute top-3 left-3 z-[1000] rounded-full bg-white/90 backdrop-blur border shadow-sm px-3 py-1.5 flex items-center gap-2 text-xs text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="font-medium">{weather.temperature}°C</span>
            <span className="text-muted-foreground">·</span>
            <span>{getWeatherLabel(weather.weatherCode).label}</span>
            <span className="text-muted-foreground">·</span>
            <Wind className="h-3 w-3 text-muted-foreground" />
            <span>{weather.windSpeed} km/h</span>
          </div>
        )}

        {/* Best Right Now — small icon button, top right */}
        <button
          onClick={() => setShowBestRightNow(true)}
          className="absolute top-3 right-3 z-[1000] h-9 w-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Best Right Now"
        >
          <Star className="h-4 w-4 text-amber-500" />
        </button>

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
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </button>

          {drawerExpanded ? (
            /* Expanded state */
            <ScrollArea className="px-4 h-[calc(70vh-40px)]">
              <div className="space-y-3 pb-4">
                {/* Time of Day Toggle */}
                <div className="flex justify-center">
                  <TimeOfDayToggle 
                    selectedTime={selectedTime} 
                    onTimeChange={setSelectedTime} 
                  />
                </div>

                {/* Sunny Only Toggle */}
                <div className="flex items-center gap-2 px-1">
                  <Switch
                    id="sunny-only"
                    checked={sunnyOnly}
                    onCheckedChange={setSunnyOnly}
                    className="data-[state=checked]:bg-amber-500"
                  />
                  <Label htmlFor="sunny-only" className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <Sun className="h-4 w-4 text-amber-500" />
                    Sunny Only
                  </Label>
                </div>

                {/* Tag Chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {ALLOWED_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer whitespace-nowrap text-xs px-2 py-1 transition-all ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted hover:bg-muted/80"
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
                      Clear
                    </button>
                  )}
                </div>

                {/* Full patio list */}
                <div className="space-y-2">
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
              </div>
            </ScrollArea>
          ) : (
            /* Collapsed state */
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
                      {(patio as any).sun_score_live ?? patio.sun_score ?? "–"}
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
