import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MapContainer } from "@/pages/components/MapContainer";
import { AirportSidebar } from "@/pages/components/AirportSidebar";
import { DrawingToolsPanel } from "@/pages/components/DrawingToolsPanel";
import { TimelapseControl } from "@/pages/components/TimelapseControl";
// import { ExportPanel } from "@/pages/components/ExportPanel";
import { CustomPoiModal } from "@/pages/components/CustomPoiModal";
import { PolygonModal } from "@/pages/components/PolygonModal";
import { GeoJsonViewerPanel } from "@/pages/components/GeoJsonViewerPanel";
import { QuickExportButton } from "@/pages/components/QuickExportButton";
import type { Airport, CustomPoi, DrawnPolygon } from "@shared/schema";
import {
  parseVisitData,
  parseLoungeMapping,
  getVisitDataForHour,
  getDateRange,
  findLoungeCodeByName,
  type LoungeVisitData,
  type LoungeMapping,
} from "@/lib/timelapseUtils";

export default function MapPage() {
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [activeDrawingTool, setActiveDrawingTool] = useState<
    null | "marker" | "polygon" | "edit" | "delete"
  >(null);
  
  const [poiFilters, setPoiFilters] = useState({
    lounges: true,
    cafes: false,
    restaurants: false,
    security: false,
    gates: false,
    customPois: true,
    terminals: true,
  });

  const [showCustomPoiModal, setShowCustomPoiModal] = useState(false);
  const [showPolygonModal, setShowPolygonModal] = useState(false);
  const [tempMarkerPosition, setTempMarkerPosition] = useState<[number, number] | null>(null);
  const [tempPolygonCoords, setTempPolygonCoords] = useState<[number, number][] | null>(null);
  
  // Feature selection for GeoJSON viewer
  const [selectedCustomPoi, setSelectedCustomPoi] = useState<CustomPoi | null>(null);
  const [selectedPolygon, setSelectedPolygon] = useState<DrawnPolygon | null>(null);

  // Timelapse state
  const [visitDataLoaded, setVisitDataLoaded] = useState(false);
  const [allVisitData, setAllVisitData] = useState<LoungeVisitData[]>([]);
  const [loungeMappings, setLoungeMappings] = useState<LoungeMapping[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date("2023-12-31T00:00:00"));
  const [minDateTime, setMinDateTime] = useState<Date>(new Date("2023-12-31T00:00:00"));
  const [maxDateTime, setMaxDateTime] = useState<Date>(new Date("2024-12-31T23:00:00"));
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: customPois = [] } = useQuery<CustomPoi[]>({
    queryKey: selectedAirport ? [`/api/custom-pois/${selectedAirport.id}`] : [],
    enabled: !!selectedAirport,
  });

  const { data: drawnPolygons = [] } = useQuery<DrawnPolygon[]>({
    queryKey: selectedAirport ? [`/api/polygons/${selectedAirport.id}`] : [],
    enabled: !!selectedAirport,
  });

  // Load visit data for HKG airport
  useEffect(() => {
    if (selectedAirport?.iataCode === "HKG" && !visitDataLoaded) {
      const loadVisitData = async () => {
        try {
          // Load CSV data
          const csvResponse = await fetch("/files/samples/HKG_visits_hourly_visit.csv");
          const csvText = await csvResponse.text();
          const parsedData = parseVisitData(csvText);
          
          // Load lounge mapping
          const jsonResponse = await fetch("/files/samples/mapped_HKG_lounges.json");
          const mappingJson = await jsonResponse.json();
          const mappings = parseLoungeMapping(mappingJson);
          
          // Get date range
          const dateRange = getDateRange(parsedData);
          
          if (dateRange) {
            setMinDateTime(dateRange.min);
            setMaxDateTime(dateRange.max);
            setCurrentDateTime(dateRange.min);
          }
          
          setAllVisitData(parsedData);
          setLoungeMappings(mappings);
          setVisitDataLoaded(true);
        } catch (error) {
          console.error("Failed to load visit data:", error);
        }
      };
      
      loadVisitData();
    } else if (selectedAirport?.iataCode !== "HKG") {
      // Reset timelapse data when switching away from HKG
      setVisitDataLoaded(false);
      setAllVisitData([]);
      setLoungeMappings([]);
      setIsPlaying(false);
    }
  }, [selectedAirport, visitDataLoaded]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentDateTime((prev) => {
        const nextTime = new Date(prev.getTime() + 60 * 60 * 1000); // +1 hour
        if (nextTime > maxDateTime) {
          setIsPlaying(false);
          return maxDateTime;
        }
        return nextTime;
      });
    }, 1000); // Advance every 1 second

    return () => clearInterval(interval);
  }, [isPlaying, maxDateTime]);

  // Compute visit data for current hour and lounge code map
  const { currentVisitData, maxVisits, loungeCodeMap } = useMemo(() => {
    if (allVisitData.length === 0 || loungeMappings.length === 0) {
      return { currentVisitData: new Map(), maxVisits: 0, loungeCodeMap: new Map() };
    }

    const visitMap = getVisitDataForHour(allVisitData, currentDateTime);
    
    // Calculate max visits for scaling
    let max = 0;
    visitMap.forEach((visits) => {
      if (visits > max) max = visits;
    });

    // Create map from lounge name to lounge code for quick lookups
    const codeMap = new Map<string, string>();
    loungeMappings.forEach((mapping) => {
      codeMap.set(mapping.loungeName, mapping.loungeCode);
    });

    return { currentVisitData: visitMap, maxVisits: max, loungeCodeMap: codeMap };
  }, [allVisitData, loungeMappings, currentDateTime]);

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
      setSelectedCustomPoi(null);
      setSelectedPolygon(null);
    }
  };

  const handleFeatureSelected = (type: "poi" | "polygon", id: string) => {
    if (type === "poi") {
      const poi = customPois.find(p => p.id === id);
      setSelectedCustomPoi(poi || null);
      setSelectedPolygon(null);
    } else {
      const polygon = drawnPolygons.find(p => p.id === id);
      setSelectedPolygon(polygon || null);
      setSelectedCustomPoi(null);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <AirportSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
        selectedAirport={selectedAirport}
        onSelectAirport={setSelectedAirport}
        poiFilters={poiFilters}
        onToggleFilter={(key: string) =>
          setPoiFilters({ ...poiFilters, [key]: !poiFilters[key as keyof typeof poiFilters] })
        }
        customPoisCount={customPois.length}
        polygonsCount={drawnPolygons.length}
        customPois={customPois}
        drawnPolygons={drawnPolygons}
        selectedCustomPoi={selectedCustomPoi}
        selectedPolygon={selectedPolygon}
        onSelectFeature={handleFeatureSelected}
      />

      <div
        className="absolute inset-0 z-0"
        style={{
          marginLeft: sidebarCollapsed ? "48px" : `${sidebarWidth}px`,
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
          onFeatureSelected={handleFeatureSelected}
          visitData={currentVisitData}
          maxVisits={maxVisits}
          loungeCodeMap={loungeCodeMap}
        />

        {/* Timelapse Control - only show for HKG airport with loaded data */}
        {selectedAirport?.iataCode === "HKG" && visitDataLoaded && (
          <TimelapseControl
            currentDateTime={currentDateTime}
            minDateTime={minDateTime}
            maxDateTime={maxDateTime}
            onDateTimeChange={setCurrentDateTime}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
          />
        )}
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
          airportId={selectedAirport?.id || ""}
          airportIataCode={selectedAirport?.iataCode}
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
          airportId={selectedAirport?.id || ""}
          airportIataCode={selectedAirport?.iataCode}
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
