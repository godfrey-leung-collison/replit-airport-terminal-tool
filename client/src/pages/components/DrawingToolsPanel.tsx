import { MapPin, Pentagon, Edit3, Trash2, X, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DrawingToolsPanelProps {
  activeTool: "marker" | "polygon" | "edit" | "delete" | null;
  onSelectTool: (tool: "marker" | "polygon" | "edit" | "delete" | null) => void;
  onClearAll: () => void;
  showHeatmap?: boolean;
  onToggleHeatmap?: () => void;
  canShowHeatmap?: boolean;
}

export function DrawingToolsPanel({
  activeTool,
  onSelectTool,
  onClearAll,
  showHeatmap,
  onToggleHeatmap,
  canShowHeatmap,
}: DrawingToolsPanelProps) {
  return (
    <Card className="fixed top-4 right-4 z-[1000] p-2">
      <div className="flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={activeTool === "marker" ? "default" : "ghost"}
              onClick={() => onSelectTool(activeTool === "marker" ? null : "marker")}
              data-testid="button-tool-marker"
            >
              <MapPin className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Add Custom POI Marker</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={activeTool === "polygon" ? "default" : "ghost"}
              onClick={() => onSelectTool(activeTool === "polygon" ? null : "polygon")}
              data-testid="button-tool-polygon"
            >
              <Pentagon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Draw Polygon Area</p>
          </TooltipContent>
        </Tooltip>

        <div className="h-px bg-border my-1" />

        {canShowHeatmap && onToggleHeatmap && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={showHeatmap ? "default" : "ghost"}
                  onClick={onToggleHeatmap}
                  data-testid="button-toggle-heatmap"
                >
                  <Flame className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Terminal Heatmap (HKG)</p>
              </TooltipContent>
            </Tooltip>

            <div className="h-px bg-border my-1" />
          </>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClearAll}
              data-testid="button-clear-all"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Clear All Features</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </Card>
  );
}
