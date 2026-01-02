import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Airport, CustomPoi, DrawnPolygon } from "@shared/schema";

interface QuickExportButtonProps {
  customPois: CustomPoi[];
  drawnPolygons: DrawnPolygon[];
  selectedAirport: Airport | null;
}

export function QuickExportButton({
  customPois,
  drawnPolygons,
  selectedAirport,
}: QuickExportButtonProps) {
  const { toast } = useToast();

  const handleQuickExport = () => {
    const features: Array<{
      type: "Feature";
      properties: Record<string, any>;
      geometry: {
        type: "Point" | "Polygon";
        coordinates: any;
      };
    }> = [];

    // Add all custom POIs
    customPois.forEach((poi) => {
      features.push({
        type: "Feature",
        properties: {
          type: "custom_poi",
          id: poi.id,
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
      });
    });

    // Add all polygons
    drawnPolygons.forEach((polygon) => {
      const coords = (polygon.coordinates as any).map((c: any) => [c[1], c[0]]);
      features.push({
        type: "Feature",
        properties: {
          type: "polygon_area",
          id: polygon.id,
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
      });
    });

    const data = {
      type: "FeatureCollection",
      features,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().split("T")[0];
    a.download = `airport-data-${selectedAirport?.iataCode || "export"}-${timestamp}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${features.length} feature${features.length !== 1 ? "s" : ""} to GeoJSON`,
    });
  };

  const totalFeatures = customPois.length + drawnPolygons.length;

  return (
    <div className="fixed top-[180px] right-4 z-[1000]">
      <Button
        onClick={handleQuickExport}
        disabled={totalFeatures === 0}
        data-testid="button-quick-export"
        className="w-full"
        title={`Quick export all ${totalFeatures} feature${totalFeatures !== 1 ? "s" : ""}`}
      >
        <Download className="w-4 h-4 mr-2" />
        ({totalFeatures})
      </Button>
    </div>
  );
}

