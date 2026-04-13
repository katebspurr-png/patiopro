import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Wind, Star, Heart, SlidersHorizontal, Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFavoriteIds } from "@/hooks/useFavoriteIds";
import { useHappyHours } from "@/hooks/useHappyHours";
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
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [happyHourOnly, setHappyHourOnly] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [showBestRightNow, setShowBestRightNow] = useState(false);
  
  const { data: patios, isLoading, error } = usePatiosWithStatus();
  const topPatioIds = useTopPatioIds(3);
  const { selectedTime, setSelectedTime, resolvedTime } = useTimeOfDay();
  const { weather } = useWeather();
  const { favoriteIds } = useFavoriteIds();
  const { data: happyHours } = useHappyHours();

  const happyHourMap = useMemo(() => {
    const byPatioId: Record<string, string> = {};
    const byName: Record<string, string> = {};
    happyHours?.forEach(hh => {
      const label = hh.time_range ? `Happy hour ${hh.time_range}` : "Happy hour";
      if (hh.patio_id) byPatioId[hh.patio_id] = label;
      byName[hh.venue_name.toLowerCase()] = label;
    });
    return { byPatioId, byName };
  }, [happyHours]);
  
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
    if (favoritesOnly && favoriteIds.length > 0) {
      filtered = filtered.filter(p => favoriteIds.includes(p.id));
    }
    if (happyHourOnly) {
      filtered = filtered.filter(p => 
        happyHourMap.byPatioId[p.id] || happyHourMap.byName[p.name.toLowerCase()]
      );
    }
    
    return sortByLiveScore(filtered);
  }, [patiosWithLiveScores, sunnyOnly, favoritesOnly, happyHourOnly, favoriteIds, selectedNeighborhood, searchQuery, selectedTags, happyHourMap]);

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
          <div className="absolute top-3 left-3 z-[1000] rounded-full bg-[#1C1C1A] backdrop-blur border border-white/10 shadow-sm px-3 py-1.5 flex items-center gap-2 text-xs text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C87533] shrink-0" />
            <span className="font-medium">{weather.temperature}°C</span>
            <span className="text-white/50">·</span>
            <span>{getWeatherLabel(weather.weatherCode).label}</span>
            <span className="text-white/50">·</span>
            <Wind className="h-3 w-3 text-white/60" />
            <span>{weather.windSpeed} km/h</span>
          </div>
        )}

        {/* Best Right Now — fixed above drawer */}
        <button
          onClick={() => setShowBestRightNow(true)}
          className="fixed right-4 z-[1002] h-9 w-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 transition-all duration-300 ease-out"
          style={{ bottom: drawerExpanded ? 'calc(65vh + 12px)' : 'calc(260px + 12px)' }}
          title="Best Right Now"
        >
          <Star className="h-4 w-4 text-[#C87533]" />
        </button>

        {/* Bottom Drawer */}
        <div 
          className={`absolute bottom-0 left-0 right-0 z-[1001] bg-[#FAFAF8] rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] border-t-[1.5px] border-[#E5E0D8] transition-all duration-300 ease-out ${
            drawerExpanded ? 'h-[65vh]' : 'h-[260px]'
          }`}
        >
          {/* Drag Handle */}
          <button
            onClick={() => setDrawerExpanded(!drawerExpanded)}
            className="w-full flex items-center justify-center gap-2 focus:outline-none pt-3 pb-2"
          >
            <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
            {!drawerExpanded && (
              <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
            )}
          </button>

          {drawerExpanded ? (
            /* Expanded state */
            <ScrollArea className="px-4 h-[calc(65vh-40px)]">
              <div className="space-y-3 pb-4">
                {/* Time of Day pill row */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {(["now", "morning", "midday", "afternoon", "evening"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedTime === t
                          ? "bg-[#C87533] text-white"
                          : "bg-muted text-gray-400 hover:bg-muted/80"
                      }`}
                    >
                      {t === "now" ? "Now" : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Favorites + Tag chips in one row */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setSunnyOnly(!sunnyOnly)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      sunnyOnly
                        ? "bg-[#C87533] text-white"
                        : "bg-muted text-gray-400 hover:bg-muted/80"
                    }`}
                  >
                    Sunny Only
                  </button>
                  <button
                    onClick={() => setFavoritesOnly(!favoritesOnly)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      favoritesOnly
                        ? "bg-[#C87533] text-white"
                        : "bg-muted text-gray-400 hover:bg-muted/80"
                    }`}
                  >
                    Favorites
                  </button>
                  <button
                    onClick={() => setHappyHourOnly(!happyHourOnly)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      happyHourOnly
                        ? "bg-[#C87533] text-white"
                        : "bg-muted text-gray-400 hover:bg-muted/80"
                    }`}
                  >
                    Happy Hour
                  </button>
                  {ALLOWED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-[#C87533] text-white"
                          : "bg-muted text-gray-400 hover:bg-muted/80"
                      }`}
                    >
                      {(TAG_LABELS[tag] || tag).replace(/^[^\s]+\s/, '')}
                    </button>
                  ))}
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 whitespace-nowrap shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Compact patio list */}
                <div className="space-y-1.5">
                  {filteredPatios.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {sunnyOnly ? "No sunny patios right now" : "No patios found"}
                    </div>
                  ) : (
                    filteredPatios.map((patio, i) => (
                      <button
                        key={patio.id}
                        onClick={() => navigate(`/patio/${patio.id}`)}
                        className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="text-xs font-bold text-muted-foreground w-4 text-center">{i + 1}</span>
                        <span className="bg-[#C87533] text-white font-bold text-xs px-2 py-0.5 rounded-xl min-w-[36px] text-center">
                          {(patio as any).sun_score_live ?? patio.sun_score ?? "–"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate" style={{ fontWeight: 700, color: '#1C1C1A' }}>{patio.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {patio.neighborhood ?? "Unknown"} · {patio.sun_profile ?? "mixed"}
                          </div>
                          {(happyHourMap.byPatioId[patio.id] || happyHourMap.byName[patio.name.toLowerCase()]) && (
                            <div className="text-[11px] text-gray-400 truncate">
                              {happyHourMap.byPatioId[patio.id] || happyHourMap.byName[patio.name.toLowerCase()]}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 max-w-[100px] truncate text-right">
                          {patio.best_time_to_visit ?? "—"}
                        </span>
                      </button>
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
                      ? "bg-[#C87533] text-white"
                      : "bg-[#F0EBE3] border border-[#D5CEC5] text-[#3D3830] hover:bg-[#E8E2D8]"
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
                        ? "bg-[#C87533] text-white"
                        : "bg-[#F0EBE3] border border-[#D5CEC5] text-[#3D3830] hover:bg-[#E8E2D8]"
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
                    <span className="bg-[#C87533] text-white font-bold text-xs px-2 py-0.5 rounded-xl min-w-[36px] text-center">
                      {(patio as any).sun_score_live ?? patio.sun_score ?? "–"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate" style={{ fontWeight: 700, color: '#1C1C1A' }}>{patio.name}</div>
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
