import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import "leaflet.heat";
import { useQuery } from "@tanstack/react-query";
import type { Airport, CustomPoi, DrawnPolygon, OsmPoi, OsmTerminalPolygon } from "@shared/schema";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface GateCoordinates {
  [gateNumber: string]: [number, number]; // [lat, lon]
}

interface MapContainerProps {
  selectedAirport: Airport | null;
  activeDrawingTool: "marker" | "polygon" | "edit" | "delete" | null;
  poiFilters: Record<string, boolean>;
  customPois: CustomPoi[];
  drawnPolygons: DrawnPolygon[];
  heatmapData: Map<string, number>;
  showHeatmap: boolean;
  onMarkerPlaced: (position: [number, number]) => void;
  onPolygonDrawn: (coords: [number, number][]) => void;
  onDeleteFeature: (type: "poi" | "polygon", id: string) => void;
  onFeatureSelected: (type: "poi" | "polygon", id: string) => void;
}

export function MapContainer({
  selectedAirport,
  activeDrawingTool,
  poiFilters,
  customPois,
  drawnPolygons,
  heatmapData,
  showHeatmap,
  onMarkerPlaced,
  onPolygonDrawn,
  onDeleteFeature,
  onFeatureSelected,
}: MapContainerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawingMarker, setIsDrawingMarker] = useState(false);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const polygonPointsRef = useRef<[number, number][]>([]);
  const tempPolygonLayerRef = useRef<L.Polyline | null>(null);

  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polygonsRef = useRef<{ [key: string]: L.Polygon }>({});
  const terminalPolygonsRef = useRef<{ [key: string]: L.Polygon }>({});
  const heatmapLayerRef = useRef<any>(null); // Heat layer reference

  const { data: osmPois = [], isLoading: poisLoading } = useQuery<OsmPoi[]>({
    queryKey: selectedAirport ? [`/api/pois/${selectedAirport.id}`] : [],
    enabled: !!selectedAirport,
  });

  const { data: terminals = [], isLoading: terminalsLoading } = useQuery<OsmTerminalPolygon[]>({
    queryKey: selectedAirport ? [`/api/terminals/${selectedAirport.id}`] : [],
    enabled: !!selectedAirport,
  });

  const { data: gateCoordinates } = useQuery<GateCoordinates>({
    queryKey: ["/api/heatmap/hkg/gate-coordinates"],
    enabled: showHeatmap && selectedAirport?.iataCode === "HKG",
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [51.505, -0.09],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !selectedAirport) return;

    mapRef.current.setView([selectedAirport.latitude, selectedAirport.longitude], 16);
  }, [selectedAirport]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isDrawingMarker) {
        onMarkerPlaced([e.latlng.lat, e.latlng.lng]);
        setIsDrawingMarker(false);
      } else if (isDrawingPolygon) {
        polygonPointsRef.current.push([e.latlng.lat, e.latlng.lng]);
        
        if (tempPolygonLayerRef.current) {
          map.removeLayer(tempPolygonLayerRef.current);
        }
        
        const polyline = L.polyline(polygonPointsRef.current, {
          color: "hsl(210, 70%, 45%)",
          weight: 2,
          dashArray: "5, 5",
        }).addTo(map);
        
        tempPolygonLayerRef.current = polyline;
      }
    };

    const handleDblClick = () => {
      if (isDrawingPolygon && polygonPointsRef.current.length >= 3) {
        if (tempPolygonLayerRef.current) {
          map.removeLayer(tempPolygonLayerRef.current);
          tempPolygonLayerRef.current = null;
        }
        
        onPolygonDrawn([...polygonPointsRef.current]);
        polygonPointsRef.current = [];
        setIsDrawingPolygon(false);
      }
    };

    map.on("click", handleMapClick);
    map.on("dblclick", handleDblClick);

    return () => {
      map.off("click", handleMapClick);
      map.off("dblclick", handleDblClick);
    };
  }, [isDrawingMarker, isDrawingPolygon, onMarkerPlaced, onPolygonDrawn]);

  useEffect(() => {
    if (activeDrawingTool === "marker") {
      setIsDrawingMarker(true);
      setIsDrawingPolygon(false);
      if (mapContainerRef.current) {
        mapContainerRef.current.style.cursor = "crosshair";
      }
    } else if (activeDrawingTool === "polygon") {
      setIsDrawingPolygon(true);
      setIsDrawingMarker(false);
      polygonPointsRef.current = [];
      if (mapContainerRef.current) {
        mapContainerRef.current.style.cursor = "crosshair";
      }
    } else {
      setIsDrawingMarker(false);
      setIsDrawingPolygon(false);
      polygonPointsRef.current = [];
      if (tempPolygonLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(tempPolygonLayerRef.current);
        tempPolygonLayerRef.current = null;
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.style.cursor = "";
      }
    }
  }, [activeDrawingTool]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    Object.values(markersRef.current).forEach(marker => map.removeLayer(marker));
    markersRef.current = {};

    const createIcon = (category: string, color: string) => {
      return L.divIcon({
        className: "custom-poi-marker",
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    };

    osmPois.forEach((poi) => {
      if (
        (poi.type === "lounge" && poiFilters.lounges) ||
        (poi.type === "cafe" && poiFilters.cafes) ||
        (poi.type === "restaurant" && poiFilters.restaurants) ||
        (poi.type === "security" && poiFilters.security) ||
        (poi.type === "gate" && poiFilters.gates)
      ) {
        const color = 
          poi.type === "lounge" ? "#9333ea" :
          poi.type === "cafe" ? "#f59e0b" :
          poi.type === "restaurant" ? "#ef4444" :
          poi.type === "security" ? "#3b82f6" :
          "#10b981";

        const marker = L.marker([poi.lat, poi.lon], {
          icon: createIcon(poi.type, color),
        })
          .bindPopup(
            `<div class="p-2">
              <h3 class="font-semibold text-sm">${poi.name || "Unnamed"}</h3>
              <p class="text-xs text-muted-foreground capitalize">${poi.type}</p>
            </div>`
          )
          .addTo(map);

        markersRef.current[`osm-${poi.id}`] = marker;
      }
    });

    if (poiFilters.customPois) {
      customPois.forEach((poi) => {
        const marker = L.marker([poi.latitude, poi.longitude], {
          icon: createIcon("custom", "hsl(210, 70%, 45%)"),
        })
          .bindPopup(
            `<div class="p-2">
              <h3 class="font-semibold text-sm">${poi.name}</h3>
              <p class="text-xs text-muted-foreground capitalize">${poi.category}</p>
              ${poi.description ? `<p class="text-xs mt-1">${poi.description}</p>` : ""}
              <div class="flex gap-2 mt-2">
                <button class="text-xs text-primary hover:underline" data-view-poi="${poi.id}">View GeoJSON</button>
                <button class="text-xs text-destructive hover:underline" data-delete-poi="${poi.id}">Delete</button>
              </div>
            </div>`,
            { className: "custom-popup" }
          )
          .addTo(map);

        markersRef.current[`custom-${poi.id}`] = marker;

        marker.on("popupopen", () => {
          const viewBtn = document.querySelector(`[data-view-poi="${poi.id}"]`);
          const deleteBtn = document.querySelector(`[data-delete-poi="${poi.id}"]`);
          
          viewBtn?.addEventListener("click", () => {
            onFeatureSelected("poi", poi.id!);
            marker.closePopup();
          });
          
          deleteBtn?.addEventListener("click", () => {
            onDeleteFeature("poi", poi.id!);
            marker.closePopup();
          });
        });
      });
    }
  }, [osmPois, customPois, poiFilters, onDeleteFeature, onFeatureSelected]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    Object.values(polygonsRef.current).forEach(polygon => map.removeLayer(polygon));
    polygonsRef.current = {};

    drawnPolygons.forEach((poly) => {
      const coords = (poly.coordinates as any).map((c: any) => [c[0], c[1]]);
      
      const polygon = L.polygon(coords, {
        color: "hsl(210, 70%, 45%)",
        fillColor: "hsl(210, 70%, 45%)",
        fillOpacity: 0.2,
        weight: 2,
      })
        .bindPopup(
          `<div class="p-2">
            <h3 class="font-semibold text-sm">${poly.name}</h3>
            <p class="text-xs text-muted-foreground capitalize">${poly.zoneType}</p>
            ${poly.notes ? `<p class="text-xs mt-1">${poly.notes}</p>` : ""}
            ${poly.area ? `<p class="text-xs mt-1">${poly.area.toFixed(2)} m²</p>` : ""}
            <div class="flex gap-2 mt-2">
              <button class="text-xs text-primary hover:underline" data-view-polygon="${poly.id}">View GeoJSON</button>
              <button class="text-xs text-destructive hover:underline" data-delete-polygon="${poly.id}">Delete</button>
            </div>
          </div>`,
          { className: "custom-popup" }
        )
        .addTo(map);

      polygonsRef.current[poly.id!] = polygon;

      polygon.on("popupopen", () => {
        const viewBtn = document.querySelector(`[data-view-polygon="${poly.id}"]`);
        const deleteBtn = document.querySelector(`[data-delete-polygon="${poly.id}"]`);
        
        viewBtn?.addEventListener("click", () => {
          onFeatureSelected("polygon", poly.id!);
          polygon.closePopup();
        });
        
        deleteBtn?.addEventListener("click", () => {
          onDeleteFeature("polygon", poly.id!);
          polygon.closePopup();
        });
      });
    });
  }, [drawnPolygons, onDeleteFeature, onFeatureSelected]);

  // Render terminal polygons from OpenStreetMap
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Remove existing terminal polygons
    Object.values(terminalPolygonsRef.current).forEach(polygon => map.removeLayer(polygon));
    terminalPolygonsRef.current = {};

    // Add new terminal polygons only if the filter is enabled and heatmap is not shown
    if (poiFilters.terminals && !showHeatmap) {
      // Color palette for terminals - distinct, vibrant colors
      const terminalColors = [
        "#fbbf24", // Amber
        "#3b82f6", // Blue
        "#10b981", // Green
        "#8b5cf6", // Purple
        "#ef4444", // Red
        "#f97316", // Orange
        "#06b6d4", // Cyan
        "#ec4899", // Pink
        "#84cc16", // Lime
        "#6366f1", // Indigo
      ];

      terminals.forEach((terminal, terminalIndex) => {
        if (!terminal.geometry || terminal.geometry.length === 0) return;

        // Assign color based on terminal index
        const color = terminalColors[terminalIndex % terminalColors.length];

        terminal.geometry.forEach((ring, ringIndex) => {
          if (ring.length < 3) return;

          const polygon = L.polygon(ring, {
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 2,
          })
            .bindTooltip(terminal.name || "Terminal", {
              permanent: false,
              direction: "center",
              className: "terminal-tooltip",
            })
            .bindPopup(
              `<div class="p-2">
                <h3 class="font-semibold text-sm">${terminal.name || "Terminal"}</h3>
                <p class="text-xs text-muted-foreground">Airport Terminal Building</p>
                ${terminal.tags.ref ? `<p class="text-xs mt-1">Ref: ${terminal.tags.ref}</p>` : ""}
                <div class="mt-2 flex items-center gap-2">
                  <div style="width: 16px; height: 16px; background-color: ${color}; border-radius: 2px; border: 1px solid rgba(0,0,0,0.2);"></div>
                  <span class="text-xs text-muted-foreground">Terminal ${terminalIndex + 1}</span>
                </div>
              </div>`,
              { className: "custom-popup" }
            )
            .addTo(map);

          // Add hover effect
          polygon.on("mouseover", function(this: L.Polygon) {
            this.setStyle({
              fillOpacity: 0.3,
              weight: 3,
            });
          });

          polygon.on("mouseout", function(this: L.Polygon) {
            this.setStyle({
              fillOpacity: 0.15,
              weight: 2,
            });
          });

          terminalPolygonsRef.current[`${terminal.id}-${ringIndex}`] = polygon;
        });
      });
    }
  }, [terminals, poiFilters.terminals, showHeatmap]);

  // Render gradient heatmap
  useEffect(() => {
    if (!mapRef.current || !showHeatmap || !gateCoordinates) {
      // Remove existing heatmap layer if heatmap is disabled
      if (heatmapLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
      return;
    }

    const map = mapRef.current;

    // Remove existing heatmap layer
    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    // Calculate max seats for intensity scaling
    const maxSeats = Math.max(...Array.from(heatmapData.values()), 1);

    // Create heat points array: [lat, lon, intensity]
    const heatPoints: [number, number, number][] = [];
    
    Object.entries(gateCoordinates).forEach(([gateNumber, coords]) => {
      const seats = heatmapData.get(`Gate ${gateNumber}`) || 
                    heatmapData.get(gateNumber) || 
                    heatmapData.get(parseInt(gateNumber).toString()) || 0;
      
      if (seats > 0 && coords && coords.length === 2) {
        // Normalize intensity to 0-1 range
        const intensity = maxSeats > 0 ? seats / maxSeats : 0;
        heatPoints.push([coords[0], coords[1], intensity]);
      }
    });

    // Create heat layer with gradient configuration
    if (heatPoints.length > 0) {
      const heatLayer = (L as any).heatLayer(heatPoints, {
        radius: 40, // Size of heat radius
        blur: 35, // Amount of blur
        maxZoom: 18,
        max: 1.0, // Maximum intensity
        gradient: {
          0.0: '#3b82f6',  // Blue (cold/low)
          0.2: '#06b6d4',  // Cyan
          0.4: '#10b981',  // Green
          0.6: '#fbbf24',  // Yellow
          0.8: '#f97316',  // Orange
          1.0: '#ef4444'   // Red (hot/high)
        }
      }).addTo(map);

      heatmapLayerRef.current = heatLayer;
    }
  }, [gateCoordinates, heatmapData, showHeatmap]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {(poisLoading || terminalsLoading) && selectedAirport && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card border border-card-border px-4 py-2 rounded-md shadow-md z-[1000]">
          <p className="text-sm font-medium text-muted-foreground">
            {poisLoading && terminalsLoading ? "Loading POIs and terminals..." : 
             poisLoading ? "Loading POIs..." : "Loading terminals..."}
          </p>
        </div>
      )}
      
      {(isDrawingMarker || isDrawingPolygon) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card border border-card-border px-4 py-2 rounded-md shadow-md z-[1000]">
          <p className="text-sm font-medium">
            {isDrawingMarker && "Click on the map to place a marker"}
            {isDrawingPolygon && `Drawing Polygon - Click to add points (${polygonPointsRef.current.length} points), double-click to complete`}
          </p>
        </div>
      )}

      {/* Heatmap Legend with Gradient */}
      {showHeatmap && (
        <div className="absolute bottom-4 right-4 bg-card border border-card-border px-4 py-3 rounded-md shadow-lg z-[1000]">
          <h3 className="text-sm font-semibold mb-2">Departure Seats</h3>
          <div className="space-y-2">
            {/* Gradient bar */}
            <div className="relative w-24 h-32 rounded"
              style={{
                background: 'linear-gradient(to top, #3b82f6, #06b6d4, #10b981, #fbbf24, #f97316, #ef4444)'
              }}>
            </div>
            {/* Labels */}
            <div className="flex flex-col justify-between h-32 -mt-32 ml-28">
              <span className="text-xs font-medium">High</span>
              <span className="text-xs">Medium</span>
              <span className="text-xs">Low</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Intensity shows departure seats per gate
          </div>
        </div>
      )}
    </div>
  );
}
