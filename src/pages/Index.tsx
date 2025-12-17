import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, ChevronUp, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PatioMap } from "@/components/PatioMap";
import { PatioCard } from "@/components/PatioCard";
import { Header } from "@/components/Header";
import { BestRightNowPanel, BestRightNowButton } from "@/components/BestRightNowPanel";
import { usePatiosWithStatus } from "@/hooks/usePatios";
import { useTopPatioIds } from "@/hooks/useBestRightNow";

const Index = () => {
  const navigate = useNavigate();
  const [sunnyOnly, setSunnyOnly] = useState(false);
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [showBestRightNow, setShowBestRightNow] = useState(false);
  
  const { data: patios, isLoading, error } = usePatiosWithStatus();
  const topPatioIds = useTopPatioIds(3);
  
  const filteredPatios = sunnyOnly 
    ? patios.filter(p => p.currentStatus === "sunny")
    : patios;

  const sunnyCount = patios.filter(p => p.currentStatus === "sunny").length;

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
        
        {/* Sunny Only Toggle - Floating on map */}
        <div className="absolute top-4 left-4 z-10">
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
                {filteredPatios.length} patios {sunnyOnly && `• ${sunnyCount} sunny`}
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
