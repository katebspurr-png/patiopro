import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, Phone, Globe, Instagram, AlertTriangle, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useHappyHours } from "@/hooks/useHappyHours";

export default function HappyHours() {
  const { data: happyHours, isLoading } = useHappyHours();
  const [search, setSearch] = useState("");
  const [selectedHood, setSelectedHood] = useState<string | null>(null);

  const neighborhoods = useMemo(() => {
    if (!happyHours) return [];
    const hoods = new Set(happyHours.map(h => h.neighborhood).filter(Boolean) as string[]);
    return Array.from(hoods).sort();
  }, [happyHours]);

  const filtered = useMemo(() => {
    if (!happyHours) return [];
    return happyHours.filter(h => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        h.venue_name.toLowerCase().includes(q) ||
        (h.details || "").toLowerCase().includes(q) ||
        (h.neighborhood || "").toLowerCase().includes(q);
      const matchesHood = !selectedHood || h.neighborhood === selectedHood;
      return matchesSearch && matchesHood;
    });
  }, [happyHours, search, selectedHood]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="px-4 py-4 max-w-2xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-display font-bold text-foreground">🍻 Happy Hours</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {happyHours?.length ?? 0} venues in Halifax
          </p>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search venues, deals, neighborhoods..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          <Badge
            variant={selectedHood === null ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap shrink-0"
            onClick={() => setSelectedHood(null)}
          >
            All
          </Badge>
          {neighborhoods.map(hood => (
            <Badge
              key={hood}
              variant={selectedHood === hood ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap shrink-0"
              onClick={() => setSelectedHood(selectedHood === hood ? null : hood)}
            >
              {hood}
            </Badge>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading happy hours...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No matching venues found</div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(hh => (
              <Card key={hh.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground leading-tight">
                        {hh.patio_id ? (
                          <Link to={`/patio/${hh.patio_id}`} className="hover:text-primary transition-colors">
                            {hh.venue_name}
                          </Link>
                        ) : (
                          hh.venue_name
                        )}
                      </h3>
                      {hh.neighborhood && (
                        <p className="text-xs text-muted-foreground mt-0.5">{hh.neighborhood}</p>
                      )}
                    </div>
                    {hh.needs_verification && (
                      <Badge variant="outline" className="shrink-0 text-amber-600 border-amber-300 bg-amber-50 text-[10px]">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>

                  {(hh.days || hh.time_range) && (
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-primary font-medium">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {hh.days && !hh.days.includes("VERIFY") ? hh.days : ""}
                        {hh.days && hh.time_range && !hh.days.includes("VERIFY") && !hh.time_range.includes("VERIFY") ? " · " : ""}
                        {hh.time_range && !hh.time_range.includes("VERIFY") ? hh.time_range : ""}
                      </span>
                    </div>
                  )}

                  {hh.details && !hh.details.startsWith("VERIFY") && !hh.details.startsWith("Check with") && (
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {hh.details.replace(/VERIFY DETAILS -?\s*/i, "").replace(/VERIFY DAYS[^|]*\|\s*/i, "")}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                    {hh.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {hh.address}
                      </span>
                    )}
                    {hh.phone && (
                      <a href={`tel:${hh.phone}`} className="flex items-center gap-1 hover:text-primary">
                        <Phone className="h-3 w-3" />
                        {hh.phone}
                      </a>
                    )}
                    {hh.website && hh.website.startsWith("http") && (
                      <a href={hh.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                        <Globe className="h-3 w-3" />
                        Website
                      </a>
                    )}
                    {hh.instagram && (
                      <a
                        href={`https://instagram.com/${hh.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <Instagram className="h-3 w-3" />
                        {hh.instagram}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
