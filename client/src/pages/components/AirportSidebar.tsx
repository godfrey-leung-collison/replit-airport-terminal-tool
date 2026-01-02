import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, MapPin, Coffee, Utensils, Shield, Plane, Layers, FileJson, Copy, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Airport, CustomPoi, DrawnPolygon } from "@shared/schema";

interface AirportSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  width: number;
  onWidthChange: (width: number) => void;
  selectedAirport: Airport | null;
  onSelectAirport: (airport: Airport) => void;
  poiFilters: Record<string, boolean>;
  onToggleFilter: (key: string) => void;
  customPoisCount: number;
  polygonsCount: number;
  customPois: CustomPoi[];
  drawnPolygons: DrawnPolygon[];
  selectedCustomPoi: CustomPoi | null;
  selectedPolygon: DrawnPolygon | null;
  onSelectFeature: (type: "poi" | "polygon", id: string) => void;
}

export function AirportSidebar({
  collapsed,
  onToggleCollapse,
  width,
  onWidthChange,
  selectedAirport,
  onSelectAirport,
  poiFilters,
  onToggleFilter,
  customPoisCount,
  polygonsCount,
  customPois,
  drawnPolygons,
  selectedCustomPoi,
  selectedPolygon,
  onSelectFeature,
}: AirportSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const { toast } = useToast();

  const MIN_WIDTH = 300;
  const MAX_WIDTH = 600;

  const { data: airports = [], isLoading } = useQuery<Airport[]>({
    queryKey: ["/api/airports"],
  });

  const filteredAirports = airports.filter(
    (airport) =>
      airport.iataCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airport.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const convertPoiToGeoJson = (poi: CustomPoi) => {
    return {
      type: "Feature",
      properties: {
        id: poi.id,
        type: "custom_poi",
        name: poi.name,
        category: poi.category,
        description: poi.description,
        airportIATA: poi.airportIataCode,
        createdAt: poi.createdAt,
      },
      geometry: {
        type: "Point",
        coordinates: [poi.longitude, poi.latitude],
      },
    };
  };

  const convertPolygonToGeoJson = (polygon: DrawnPolygon) => {
    const coords = (polygon.coordinates as any).map((c: any) => [c[1], c[0]]);
    return {
      type: "Feature",
      properties: {
        id: polygon.id,
        type: "polygon_area",
        name: polygon.name,
        zoneType: polygon.zoneType,
        notes: polygon.notes,
        area: polygon.area,
        airportIATA: polygon.airportIataCode,
        createdAt: polygon.createdAt,
      },
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
    };
  };

  const handleCopyToClipboard = (json: any) => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    toast({
      title: "Copied!",
      description: "GeoJSON data copied to clipboard",
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        onWidthChange(newWidth);
      } else if (newWidth < MIN_WIDTH) {
        onWidthChange(MIN_WIDTH);
      } else if (newWidth > MAX_WIDTH) {
        onWidthChange(MAX_WIDTH);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, onWidthChange]);

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
    <div 
      className="fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border z-[1000] flex flex-col"
      style={{ width: `${width}px` }}
    >
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
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span className="text-sm">Terminals</span>
                  </div>
                  <Switch
                    checked={poiFilters.terminals}
                    onCheckedChange={() => onToggleFilter("terminals")}
                    data-testid="toggle-terminals"
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

          {(selectedCustomPoi || selectedPolygon) && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    GeoJSON Viewer
                  </CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      onSelectFeature(selectedCustomPoi ? "poi" : "polygon", "");
                    }}
                    className="h-6 w-6"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedCustomPoi && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Selected POI
                      </p>
                      <p className="text-sm font-semibold">{selectedCustomPoi.name}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {selectedCustomPoi.category}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-medium uppercase tracking-wide">
                          GeoJSON
                        </Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleCopyToClipboard(convertPoiToGeoJson(selectedCustomPoi))
                          }
                          className="h-7"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/50">
                        <pre className="p-3 text-[10px] font-mono">
                          {JSON.stringify(
                            convertPoiToGeoJson(selectedCustomPoi),
                            null,
                            2
                          )}
                        </pre>
                      </ScrollArea>
                    </div>
                  </>
                )}
                {selectedPolygon && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Selected Polygon
                      </p>
                      <p className="text-sm font-semibold">{selectedPolygon.name}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {selectedPolygon.zoneType}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-medium uppercase tracking-wide">
                          GeoJSON
                        </Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleCopyToClipboard(convertPolygonToGeoJson(selectedPolygon))
                          }
                          className="h-7"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/50">
                        <pre className="p-3 text-[10px] font-mono">
                          {JSON.stringify(
                            convertPolygonToGeoJson(selectedPolygon),
                            null,
                            2
                          )}
                        </pre>
                      </ScrollArea>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
      
      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 bg-primary/30 group-hover:bg-primary/70 transition-colors rounded-l" />
      </div>
    </div>
  );
}
