import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MapContainer } from "@/pages/components/MapContainer";
import { AirportSidebar } from "@/pages/components/AirportSidebar";
import { DrawingToolsPanel } from "@/pages/components/DrawingToolsPanel";
// import { ExportPanel } from "@/pages/components/ExportPanel";
import { CustomPoiModal } from "@/pages/components/CustomPoiModal";
import { PolygonModal } from "@/pages/components/PolygonModal";
import { GeoJsonViewerPanel } from "@/pages/components/GeoJsonViewerPanel";
import { QuickExportButton } from "@/pages/components/QuickExportButton";
import type { Airport, CustomPoi, DrawnPolygon } from "@shared/schema";

export default function MapPage() {
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState<
    null | "marker" | "polygon" | "edit" | "delete"
  >(null);
  
  const [poiFilters, setPoiFilters] = useState({
    lounges: true,
    cafes: true,
    restaurants: true,
    security: false,
    gates: false,
    customPois: true,
  });

  const [showCustomPoiModal, setShowCustomPoiModal] = useState(false);
  const [showPolygonModal, setShowPolygonModal] = useState(false);
  const [tempMarkerPosition, setTempMarkerPosition] = useState<[number, number] | null>(null);
  const [tempPolygonCoords, setTempPolygonCoords] = useState<[number, number][] | null>(null);

  const { data: customPois = [] } = useQuery<CustomPoi[]>({
    queryKey: selectedAirport ? [`/api/custom-pois/${selectedAirport.id}`] : [],
    enabled: !!selectedAirport,
  });

  const { data: drawnPolygons = [] } = useQuery<DrawnPolygon[]>({
    queryKey: selectedAirport ? [`/api/polygons/${selectedAirport.id}`] : [],
    enabled: !!selectedAirport,
  });

  const createPoiMutation = useMutation({
    mutationFn: async (poi: Omit<CustomPoi, "id" | "createdAt">) => {
      return await apiRequest("POST", "/api/custom-pois", poi);
    },
    onSuccess: () => {
      if (selectedAirport) {
        queryClient.invalidateQueries({ queryKey: [`/api/custom-pois/${selectedAirport.id}`] });
      }
    },
  });

  const createPolygonMutation = useMutation({
    mutationFn: async (polygon: Omit<DrawnPolygon, "id" | "createdAt">) => {
      return await apiRequest("POST", "/api/polygons", polygon);
    },
    onSuccess: () => {
      if (selectedAirport) {
        queryClient.invalidateQueries({ queryKey: [`/api/polygons/${selectedAirport.id}`] });
      }
    },
  });

  const deletePoiMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/custom-pois/${id}`, undefined);
    },
    onSuccess: () => {
      if (selectedAirport) {
        queryClient.invalidateQueries({ queryKey: [`/api/custom-pois/${selectedAirport.id}`] });
      }
    },
  });

  const deletePolygonMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/polygons/${id}`, undefined);
    },
    onSuccess: () => {
      if (selectedAirport) {
        queryClient.invalidateQueries({ queryKey: [`/api/polygons/${selectedAirport.id}`] });
      }
    },
  });

  const handleAddCustomPoi = (poi: CustomPoi) => {
    const { id, createdAt, ...poiData } = poi;
    createPoiMutation.mutate(poiData);
    setTempMarkerPosition(null);
    setActiveDrawingTool(null);
  };

  const handleAddPolygon = (polygon: DrawnPolygon) => {
    const { id, createdAt, ...polygonData } = polygon;
    createPolygonMutation.mutate(polygonData);
    setTempPolygonCoords(null);
    setActiveDrawingTool(null);
  };

  const handleMarkerPlaced = (position: [number, number]) => {
    setTempMarkerPosition(position);
    setShowCustomPoiModal(true);
  };

  const handlePolygonDrawn = (coords: [number, number][]) => {
    setTempPolygonCoords(coords);
    setShowPolygonModal(true);
  };

  const handleDeleteFeature = (type: "poi" | "polygon", id: string) => {
    if (type === "poi") {
      deletePoiMutation.mutate(id);
    } else {
      deletePolygonMutation.mutate(id);
    }
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear all drawn features and custom POIs?")) {
      for (const poi of customPois) {
        if (poi.id) deletePoiMutation.mutate(poi.id);
      }
      for (const polygon of drawnPolygons) {
        if (polygon.id) deletePolygonMutation.mutate(polygon.id);
      }
      setActiveDrawingTool(null);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <AirportSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        selectedAirport={selectedAirport}
        onSelectAirport={setSelectedAirport}
        poiFilters={poiFilters}
        onToggleFilter={(key: string) =>
          setPoiFilters({ ...poiFilters, [key]: !poiFilters[key as keyof typeof poiFilters] })
        }
        customPoisCount={customPois.length}
        polygonsCount={drawnPolygons.length}
      />

      <div
        className="absolute inset-0 z-0"
        style={{
          marginLeft: sidebarCollapsed ? "48px" : "360px",
          transition: "margin-left 200ms ease-in-out",
        }}
      >
        <MapContainer
          selectedAirport={selectedAirport}
          activeDrawingTool={activeDrawingTool}
          poiFilters={poiFilters}
          customPois={customPois}
          drawnPolygons={drawnPolygons}
          onMarkerPlaced={handleMarkerPlaced}
          onPolygonDrawn={handlePolygonDrawn}
          onDeleteFeature={handleDeleteFeature}
        />
      </div>

      <DrawingToolsPanel
        activeTool={activeDrawingTool}
        onSelectTool={setActiveDrawingTool}
        onClearAll={handleClearAll}
      />

      {/* <ExportPanel
        customPois={customPois}
        drawnPolygons={drawnPolygons}
        selectedAirport={selectedAirport}
      /> */}

      <QuickExportButton
        customPois={customPois}
        drawnPolygons={drawnPolygons}
        selectedAirport={selectedAirport}
      />

      {/* <GeoJsonViewerPanel
        customPois={customPois}
        drawnPolygons={drawnPolygons}
      /> */}

      {showCustomPoiModal && tempMarkerPosition && (
        <CustomPoiModal
          position={tempMarkerPosition}
          airportId={selectedAirport?.iataCode || ""}
          onSave={handleAddCustomPoi}
          onClose={() => {
            setShowCustomPoiModal(false);
            setTempMarkerPosition(null);
            setActiveDrawingTool(null);
          }}
        />
      )}

      {showPolygonModal && tempPolygonCoords && (
        <PolygonModal
          coordinates={tempPolygonCoords}
          airportId={selectedAirport?.iataCode || ""}
          onSave={handleAddPolygon}
          onClose={() => {
            setShowPolygonModal(false);
            setTempPolygonCoords(null);
            setActiveDrawingTool(null);
          }}
        />
      )}
    </div>
  );
}
