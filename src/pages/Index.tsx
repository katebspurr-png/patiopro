import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, ChevronUp, ChevronDown, MapPin, Search, X, SlidersHorizontal } from "lucide-react";
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
import { usePatiosWithStatus } from "@/hooks/usePatios";
import { useTopPatioIds } from "@/hooks/useBestRightNow";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
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
  const [showFilters, setShowFilters] = useState(false);

  const { data: patios, isLoading, error } = usePatiosWithStatus();
  const topPatioIds = useTopPatioIds(3);
  const { selectedTime, setSelectedTime, resolvedTime } = useTimeOfDay();

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
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const patiosWithLiveScores = useMemo(() => {
    return computeAllLiveScores(patios, resolvedTime);
  }, [patios, resolvedTime]);

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

  const activeFilterCount = (sunnyOnly ? 1 : 0) + (selectedNeighborhood !== "all" ? 1 : 0) + selectedTags.length;

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
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="relative">
              <Sun className="h-10 w-10 text-amber-400 sun-glow" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Finding sunny patios...</p>
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
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <TimeOfDayToggle
            selectedTime={selectedTime}
            onTimeChange={setSelectedTime}
          />
        </div>

        {/* Search + Filter toggle - Top left */}
        <div className="absolute top-16 left-3 z-10 flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search patios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[180px] pl-9 pr-8 bg-background/95 backdrop-blur-xl border shadow-lg rounded-xl h-9 text-sm"
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-xl border shadow-lg text-sm font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background/95 backdrop-blur-xl text-muted-foreground hover:text-foreground"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center h-4 w-4 rounded-full bg-white/30 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="bg-background/95 backdrop-blur-xl border rounded-xl shadow-lg p-3 space-y-3 animate-in slide-in-from-top-2 duration-200 w-[240px]">
              {/* Sunny Only */}
              <div className="flex items-center justify-between">
                <Label htmlFor="sunny-only" className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <Sun className="h-4 w-4 text-sunny" />
                  Sunny Only
                </Label>
                <Switch
                  id="sunny-only"
                  checked={sunnyOnly}
                  onCheckedChange={setSunnyOnly}
                  className="data-[state=checked]:bg-sunny"
                />
              </div>

              {/* Neighborhood */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Neighborhood</Label>
                <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
                  <SelectTrigger className="h-8 text-sm">
                    <MapPin className="h-3 w-3 mr-1.5 text-muted-foreground" />
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

              {/* Tags */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {ALLOWED_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer text-[10px] px-2 py-0.5 transition-all ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {TAG_LABELS[tag] || tag}
                      <span className={`ml-0.5 ${selectedTags.includes(tag) ? "opacity-80" : "opacity-50"}`}>
                        {tagCounts[tag] || 0}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSunnyOnly(false);
                    setSelectedNeighborhood("all");
                    setSelectedTags([]);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Best Right Now Button - Floating on map */}
        <div className="absolute top-3 right-3 z-10">
          <BestRightNowButton onClick={() => setShowBestRightNow(true)} />
        </div>

        {/* Bottom Drawer */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-xl rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out ${
            drawerExpanded ? 'h-[70vh]' : 'h-[180px]'
          }`}
        >
          {/* Drawer Handle */}
          <button
            onClick={() => setDrawerExpanded(!drawerExpanded)}
            className="w-full flex flex-col items-center pt-2.5 pb-1.5 focus:outline-none group"
          >
            <div className="w-10 h-1 bg-muted-foreground/25 rounded-full mb-2 group-hover:bg-muted-foreground/40 transition-colors" />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {drawerExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
              <span className="text-xs font-medium">
                {filteredPatios.length} patio{filteredPatios.length !== 1 ? "s" : ""}
                {selectedNeighborhood !== "all" && ` in ${selectedNeighborhood}`}
                {sunnyOnly && " · sunny"}
              </span>
            </div>
          </button>

          {/* Drawer Content */}
          <ScrollArea className={`px-4 ${drawerExpanded ? 'h-[calc(70vh-56px)]' : 'h-[120px]'}`}>
            <div className="space-y-2 pb-4">
              {filteredPatios.length === 0 ? (
                <div className="text-center py-8">
                  <Sun className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {sunnyOnly ? "No sunny patios right now" : "No patios found"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters</p>
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
