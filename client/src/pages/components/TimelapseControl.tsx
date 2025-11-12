import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface TimelapseControlProps {
  currentDateTime: Date;
  minDateTime: Date;
  maxDateTime: Date;
  onDateTimeChange: (dateTime: Date) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export function TimelapseControl({
  currentDateTime,
  minDateTime,
  maxDateTime,
  onDateTimeChange,
  isPlaying,
  onPlayPause,
}: TimelapseControlProps) {
  const totalHours = Math.floor((maxDateTime.getTime() - minDateTime.getTime()) / (1000 * 60 * 60));
  const currentHour = Math.floor((currentDateTime.getTime() - minDateTime.getTime()) / (1000 * 60 * 60));

  const handleSliderChange = (value: number[]) => {
    const newDateTime = new Date(minDateTime.getTime() + value[0] * 60 * 60 * 1000);
    onDateTimeChange(newDateTime);
  };

  const handleStepBack = () => {
    const newDateTime = new Date(currentDateTime.getTime() - 60 * 60 * 1000);
    if (newDateTime >= minDateTime) {
      onDateTimeChange(newDateTime);
    }
  };

  const handleStepForward = () => {
    const newDateTime = new Date(currentDateTime.getTime() + 60 * 60 * 1000);
    if (newDateTime <= maxDateTime) {
      onDateTimeChange(newDateTime);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg p-4 z-[1000] min-w-[600px] max-w-[800px]">
      <div className="flex flex-col gap-3">
        {/* Date Time Display */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            {formatDateTime(currentDateTime)}
          </span>
          <span className="text-xs text-muted-foreground">
            {currentHour + 1} / {totalHours + 1} hours
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleStepBack}
            disabled={currentDateTime <= minDateTime}
            className="h-8 w-8"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onPlayPause}
            className="h-8 w-8"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleStepForward}
            disabled={currentDateTime >= maxDateTime}
            className="h-8 w-8"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <div className="flex-1 px-2">
            <Slider
              value={[currentHour]}
              max={totalHours}
              min={0}
              step={1}
              onValueChange={handleSliderChange}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Date Range Display */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatDateTime(minDateTime)}</span>
          <span>{formatDateTime(maxDateTime)}</span>
        </div>
      </div>
    </div>
  );
}

