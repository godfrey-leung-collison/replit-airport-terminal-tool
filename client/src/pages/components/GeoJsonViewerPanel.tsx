import { useState } from "react";
import { FileJson, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CustomPoi, DrawnPolygon } from "@shared/schema";

interface GeoJsonViewerPanelProps {
  customPois: CustomPoi[];
  drawnPolygons: DrawnPolygon[];
}

export function GeoJsonViewerPanel({
  customPois,
  drawnPolygons,
}: GeoJsonViewerPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<string>("");
  const [selectedPolygonId, setSelectedPolygonId] = useState<string>("");

  const convertPoiToGeoJson = (poi: CustomPoi) => {
    return {
      type: "Feature",
      properties: {
        id: poi.id,
        type: "custom_poi",
        name: poi.name,
        category: poi.category,
        description: poi.description,
        airportId: poi.airportId,
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
        airportId: polygon.airportId,
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
  };

  const selectedPoi = customPois.find((poi) => poi.id === selectedPoiId);
  const selectedPolygon = drawnPolygons.find(
    (polygon) => polygon.id === selectedPolygonId
  );

  if (!isOpen) {
    return (
      <Button
        className="fixed top-[240px] right-4 z-[1000]"
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        data-testid="button-open-geojson-viewer"
      >
        <FileJson className="w-4 h-4 mr-2" />
        View GeoJSON
      </Button>
    );
  }

  return (
    <Card className="fixed top-[240px] right-4 z-[1000] w-[420px] max-h-[80vh] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileJson className="w-4 h-4" />
            GeoJSON Viewer
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6"
            data-testid="button-close-geojson-viewer"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex-1 overflow-hidden">
        <Tabs defaultValue="pois" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pois" data-testid="tab-pois">
              POIs ({customPois.length})
            </TabsTrigger>
            <TabsTrigger value="polygons" data-testid="tab-polygons">
              Polygons ({drawnPolygons.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pois" className="space-y-4 mt-4">
            <div>
              <Label className="text-xs font-medium uppercase tracking-wide mb-2 block">
                Select POI
              </Label>
              <Select value={selectedPoiId} onValueChange={setSelectedPoiId}>
                <SelectTrigger data-testid="select-poi">
                  <SelectValue placeholder="Choose a custom POI..." />
                </SelectTrigger>
                <SelectContent>
                  {customPois.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2">
                      No custom POIs available
                    </div>
                  ) : (
                    customPois.map((poi) => (
                      <SelectItem key={poi.id} value={poi.id}>
                        {poi.name} ({poi.category})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedPoi && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium uppercase tracking-wide">
                    GeoJSON Output
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopyToClipboard(convertPoiToGeoJson(selectedPoi))
                    }
                    data-testid="button-copy-poi-json"
                  >
                    Copy
                  </Button>
                </div>
                <ScrollArea className="h-[380px] w-full rounded-md border bg-muted/50">
                  <pre className="p-4 text-xs font-mono">
                    {JSON.stringify(
                      convertPoiToGeoJson(selectedPoi),
                      null,
                      2
                    )}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="polygons" className="space-y-4 mt-4">
            <div>
              <Label className="text-xs font-medium uppercase tracking-wide mb-2 block">
                Select Polygon
              </Label>
              <Select
                value={selectedPolygonId}
                onValueChange={setSelectedPolygonId}
              >
                <SelectTrigger data-testid="select-polygon">
                  <SelectValue placeholder="Choose a polygon..." />
                </SelectTrigger>
                <SelectContent>
                  {drawnPolygons.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2">
                      No polygons available
                    </div>
                  ) : (
                    drawnPolygons.map((polygon) => (
                      <SelectItem key={polygon.id} value={polygon.id}>
                        {polygon.name} ({polygon.zoneType})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedPolygon && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium uppercase tracking-wide">
                    GeoJSON Output
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopyToClipboard(
                        convertPolygonToGeoJson(selectedPolygon)
                      )
                    }
                    data-testid="button-copy-polygon-json"
                  >
                    Copy
                  </Button>
                </div>
                <ScrollArea className="h-[380px] w-full rounded-md border bg-muted/50">
                  <pre className="p-4 text-xs font-mono">
                    {JSON.stringify(
                      convertPolygonToGeoJson(selectedPolygon),
                      null,
                      2
                    )}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

