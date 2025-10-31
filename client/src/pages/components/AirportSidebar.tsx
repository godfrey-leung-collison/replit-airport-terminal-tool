import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, MapPin, Coffee, Utensils, Shield, Plane, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Airport } from "@shared/schema";

interface AirportSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedAirport: Airport | null;
  onSelectAirport: (airport: Airport) => void;
  poiFilters: Record<string, boolean>;
  onToggleFilter: (key: string) => void;
  customPoisCount: number;
  polygonsCount: number;
}

export function AirportSidebar({
  collapsed,
  onToggleCollapse,
  selectedAirport,
  onSelectAirport,
  poiFilters,
  onToggleFilter,
  customPoisCount,
  polygonsCount,
}: AirportSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: airports = [], isLoading } = useQuery<Airport[]>({
    queryKey: ["/api/airports"],
  });

  const filteredAirports = airports.filter(
    (airport) =>
      airport.iataCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airport.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (collapsed) {
    return (
      <div className="fixed left-0 top-0 bottom-0 w-12 bg-sidebar border-r border-sidebar-border z-[1000] flex flex-col items-center py-4">
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleCollapse}
          data-testid="button-toggle-sidebar"
          className="mb-4"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="flex flex-col gap-3 items-center mt-4">
          <MapPin className="w-5 h-5 text-sidebar-foreground/60" />
          <Layers className="w-5 h-5 text-sidebar-foreground/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[360px] bg-sidebar border-r border-sidebar-border z-[1000] flex flex-col">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-sidebar-foreground">Airport POI Mapper</h1>
          <p className="text-xs text-sidebar-foreground/60">Terminal visualization tool</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleCollapse}
          data-testid="button-toggle-sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div>
            <Label htmlFor="airport-search" className="text-xs font-medium uppercase tracking-wide mb-2 block">
              Select Airport
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="airport-search"
                type="search"
                placeholder="Search by IATA code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-airport-search"
              />
            </div>

            {isLoading && (
              <div className="mt-2 text-sm text-muted-foreground">Loading airports...</div>
            )}

            {searchQuery && !isLoading && filteredAirports.length > 0 && (
              <Card className="mt-2 max-h-[200px] overflow-y-auto">
                <CardContent className="p-2">
                  {filteredAirports.slice(0, 10).map((airport) => (
                    <button
                      key={airport.id}
                      onClick={() => {
                        onSelectAirport(airport);
                        setSearchQuery("");
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover-elevate active-elevate-2 flex items-center gap-3"
                      data-testid={`button-select-airport-${airport.iataCode}`}
                    >
                      <Badge variant="secondary" className="font-mono text-xs">
                        {airport.iataCode}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{airport.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {airport.city}, {airport.country}
                        </p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {searchQuery && !isLoading && filteredAirports.length === 0 && (
              <div className="mt-2 text-sm text-muted-foreground">No airports found</div>
            )}
          </div>

          {selectedAirport && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Selected Airport
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-semibold">{selectedAirport.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-mono">
                      {selectedAirport.iataCode}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {selectedAirport.city}, {selectedAirport.country}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {selectedAirport.latitude.toFixed(4)}, {selectedAirport.longitude.toFixed(4)}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <Label className="text-xs font-medium uppercase tracking-wide mb-3 block">
              POI Categories
            </Label>
            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Lounges</span>
                  </div>
                  <Switch
                    checked={poiFilters.lounges}
                    onCheckedChange={() => onToggleFilter("lounges")}
                    data-testid="toggle-lounges"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-500" />
                    <span className="text-sm">Cafes</span>
                  </div>
                  <Switch
                    checked={poiFilters.cafes}
                    onCheckedChange={() => onToggleFilter("cafes")}
                    data-testid="toggle-cafes"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Restaurants</span>
                  </div>
                  <Switch
                    checked={poiFilters.restaurants}
                    onCheckedChange={() => onToggleFilter("restaurants")}
                    data-testid="toggle-restaurants"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Security</span>
                  </div>
                  <Switch
                    checked={poiFilters.security}
                    onCheckedChange={() => onToggleFilter("security")}
                    data-testid="toggle-security"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Gates</span>
                  </div>
                  <Switch
                    checked={poiFilters.gates}
                    onCheckedChange={() => onToggleFilter("gates")}
                    data-testid="toggle-gates"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-sm">Custom POIs</span>
                  </div>
                  <Switch
                    checked={poiFilters.customPois}
                    onCheckedChange={() => onToggleFilter("customPois")}
                    data-testid="toggle-custom-pois"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Data Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custom POIs</span>
                <Badge variant="secondary" data-testid="text-custom-pois-count">
                  {customPoisCount}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Drawn Areas</span>
                <Badge variant="secondary" data-testid="text-polygons-count">
                  {polygonsCount}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
