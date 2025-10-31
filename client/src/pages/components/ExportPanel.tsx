import { useState } from "react";
import { Download, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { Airport, CustomPoi, DrawnPolygon } from "@shared/schema";

interface ExportPanelProps {
  customPois: CustomPoi[];
  drawnPolygons: DrawnPolygon[];
  selectedAirport: Airport | null;
}

export function ExportPanel({
  customPois,
  drawnPolygons,
  selectedAirport,
}: ExportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<"geojson" | "json">("geojson");
  const [includePois, setIncludePois] = useState(true);
  const [includePolygons, setIncludePolygons] = useState(true);

  const handleExport = () => {
    const features = [];

    if (includePois) {
      customPois.forEach((poi) => {
        features.push({
          type: "Feature",
          properties: {
            type: "custom_poi",
            name: poi.name,
            category: poi.category,
            description: poi.description,
            airportId: poi.airportId,
          },
          geometry: {
            type: "Point",
            coordinates: [poi.longitude, poi.latitude],
          },
        });
      });
    }

    if (includePolygons) {
      drawnPolygons.forEach((polygon) => {
        const coords = (polygon.coordinates as any).map((c: any) => [c[1], c[0]]);
        features.push({
          type: "Feature",
          properties: {
            type: "polygon_area",
            name: polygon.name,
            zoneType: polygon.zoneType,
            notes: polygon.notes,
            area: polygon.area,
            airportId: polygon.airportId,
          },
          geometry: {
            type: "Polygon",
            coordinates: [coords],
          },
        });
      });
    }

    const data =
      format === "geojson"
        ? {
            type: "FeatureCollection",
            features,
          }
        : {
            airport: selectedAirport,
            customPois: includePois ? customPois : [],
            drawnPolygons: includePolygons ? drawnPolygons : [],
          };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `airport-terminal-data-${selectedAirport?.iataCode || "export"}.${format === "geojson" ? "geojson" : "json"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalFeatures =
    (includePois ? customPois.length : 0) +
    (includePolygons ? drawnPolygons.length : 0);

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-4 right-4 z-[1000]"
        onClick={() => setIsOpen(true)}
        data-testid="button-open-export"
      >
        <Download className="w-4 h-4 mr-2" />
        Export Data
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-[1000] w-[320px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileJson className="w-4 h-4" />
            Export Data
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6"
            data-testid="button-close-export"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs font-medium uppercase tracking-wide mb-2 block">
            Export Format
          </Label>
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="geojson" id="format-geojson" data-testid="radio-format-geojson" />
              <Label htmlFor="format-geojson" className="text-sm font-normal cursor-pointer">
                GeoJSON
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="json" id="format-json" data-testid="radio-format-json" />
              <Label htmlFor="format-json" className="text-sm font-normal cursor-pointer">
                JSON
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-xs font-medium uppercase tracking-wide mb-2 block">
            Include Layers
          </Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-pois"
                checked={includePois}
                onCheckedChange={(checked) => setIncludePois(checked as boolean)}
                data-testid="checkbox-include-pois"
              />
              <Label
                htmlFor="include-pois"
                className="text-sm font-normal cursor-pointer"
              >
                Custom POIs ({customPois.length})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-polygons"
                checked={includePolygons}
                onCheckedChange={(checked) =>
                  setIncludePolygons(checked as boolean)
                }
                data-testid="checkbox-include-polygons"
              />
              <Label
                htmlFor="include-polygons"
                className="text-sm font-normal cursor-pointer"
              >
                Drawn Areas ({drawnPolygons.length})
              </Label>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {totalFeatures} feature{totalFeatures !== 1 ? "s" : ""} selected
        </div>

        <Button
          onClick={handleExport}
          disabled={totalFeatures === 0}
          className="w-full"
          data-testid="button-download-export"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Export
        </Button>
      </CardContent>
    </Card>
  );
}
