import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { useQuery } from "@tanstack/react-query";
import type { Airport, CustomPoi, DrawnPolygon, OsmPoi } from "@shared/schema";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapContainerProps {
  selectedAirport: Airport | null;
  activeDrawingTool: "marker" | "polygon" | "edit" | "delete" | null;
  poiFilters: Record<string, boolean>;
  customPois: CustomPoi[];
  drawnPolygons: DrawnPolygon[];
  onMarkerPlaced: (position: [number, number]) => void;
  onPolygonDrawn: (coords: [number, number][]) => void;
  onDeleteFeature: (type: "poi" | "polygon", id: string) => void;
}

export function MapContainer({
  selectedAirport,
  activeDrawingTool,
  poiFilters,
  customPois,
  drawnPolygons,
  onMarkerPlaced,
  onPolygonDrawn,
  onDeleteFeature,
}: MapContainerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawingMarker, setIsDrawingMarker] = useState(false);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const polygonPointsRef = useRef<[number, number][]>([]);
  const tempPolygonLayerRef = useRef<L.Polyline | null>(null);

  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polygonsRef = useRef<{ [key: string]: L.Polygon }>({});

  const { data: osmPois = [], isLoading: poisLoading } = useQuery<OsmPoi[]>({
    queryKey: selectedAirport ? [`/api/pois/${selectedAirport.id}`] : [],
    enabled: !!selectedAirport,
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
              <button class="text-xs text-destructive mt-2" data-delete-poi="${poi.id}">Delete</button>
            </div>`,
            { className: "custom-popup" }
          )
          .addTo(map);

        markersRef.current[`custom-${poi.id}`] = marker;

        marker.on("popupopen", () => {
          const deleteBtn = document.querySelector(`[data-delete-poi="${poi.id}"]`);
          deleteBtn?.addEventListener("click", () => {
            onDeleteFeature("poi", poi.id!);
            marker.closePopup();
          });
        });
      });
    }
  }, [osmPois, customPois, poiFilters, onDeleteFeature]);

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
            <button class="text-xs text-destructive mt-2" data-delete-polygon="${poly.id}">Delete</button>
          </div>`,
          { className: "custom-popup" }
        )
        .addTo(map);

      polygonsRef.current[poly.id!] = polygon;

      polygon.on("popupopen", () => {
        const deleteBtn = document.querySelector(`[data-delete-polygon="${poly.id}"]`);
        deleteBtn?.addEventListener("click", () => {
          onDeleteFeature("polygon", poly.id!);
          polygon.closePopup();
        });
      });
    });
  }, [drawnPolygons, onDeleteFeature]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {poisLoading && selectedAirport && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card border border-card-border px-4 py-2 rounded-md shadow-md z-[1000]">
          <p className="text-sm font-medium text-muted-foreground">Loading POIs...</p>
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
    </div>
  );
}
