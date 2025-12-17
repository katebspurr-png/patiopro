import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, List, Map, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PatioList } from "@/components/PatioList";
import { PatioMap } from "@/components/PatioMap";
import { Header } from "@/components/Header";
import { usePatiosWithStatus } from "@/hooks/usePatios";

const Index = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"list" | "map">("map");
  const [sunnyOnly, setSunnyOnly] = useState(false);
  
  const { data: patios, isLoading, error } = usePatiosWithStatus();
  
  const filteredPatios = sunnyOnly 
    ? patios.filter(p => p.currentStatus === "sunny")
    : patios;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-sunny/20 to-background px-4 py-8 text-center">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
          Find Sunny Patios in Halifax
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Real-time sun reports from the community. Find the perfect sunny spot right now.
        </p>
      </section>
      
      {/* Controls */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="sunny-only"
              checked={sunnyOnly}
              onCheckedChange={setSunnyOnly}
            />
            <Label htmlFor="sunny-only" className="flex items-center gap-1.5 cursor-pointer">
              <Sun className="h-4 w-4 text-sunny" />
              <span className="text-sm font-medium">Sunny Only</span>
            </Label>
          </div>
          
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className="h-8"
            >
              <Map className="h-4 w-4 mr-1" />
              Map
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Error loading patios. Please try again.
          </div>
        ) : viewMode === "map" ? (
          <div className="h-[calc(100vh-220px)]">
            <PatioMap 
              patios={filteredPatios} 
              onPatioClick={(id) => navigate(`/patio/${id}`)}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-4">
            <PatioList 
              patios={filteredPatios} 
              onPatioClick={(id) => navigate(`/patio/${id}`)}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
