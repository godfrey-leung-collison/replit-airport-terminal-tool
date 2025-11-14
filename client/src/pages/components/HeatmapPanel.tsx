import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface HeatmapData {
  sched_departure_hour: string;
  gate: number;
  total_seats: number;
  first_class_seats: number;
  business_class_seats: number;
  premium_economy_class_seats: number;
  economy_plus_class_seats: number;
  economy_class_seats: number;
  ref: number;
}

interface HeatmapResponse {
  airport_code: string;
  date_range: {
    start: string;
    end: string;
  };
  data: HeatmapData[];
}

interface HeatmapPanelProps {
  isOpen: boolean;
  onHeatmapDataChange: (data: Map<string, number>) => void;
}

export function HeatmapPanel({ isOpen, onHeatmapDataChange }: HeatmapPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms per frame
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Cabin class filters
  const [filters, setFilters] = useState({
    firstClass: true,
    businessClass: true,
    premiumEconomy: true,
    economyPlus: true,
    economy: true,
  });

  const { data: heatmapResponse, isLoading } = useQuery<HeatmapResponse>({
    queryKey: ["/api/heatmap/hkg"],
    enabled: isOpen,
  });

  // Get unique dates and times
  const uniqueTimes = heatmapResponse?.data
    ? Array.from(new Set(heatmapResponse.data.map(d => d.sched_departure_hour)))
        .sort()
    : [];

  const uniqueDates = Array.from(new Set(uniqueTimes.map(t => t.split(' ')[0]))).sort();

  // Initialize selected date to first available date
  useEffect(() => {
    if (uniqueDates.length > 0 && !selectedDate) {
      // Set to a date with more activity (e.g., 2024-01-15)
      const defaultDate = uniqueDates.find(d => d >= '2024-01-15') || uniqueDates[uniqueDates.length - 1];
      setSelectedDate(defaultDate);
    }
  }, [uniqueDates, selectedDate]);

  // Filter times by selected date
  const filteredTimes = selectedDate 
    ? uniqueTimes.filter(t => t.startsWith(selectedDate))
    : [];

  // Calculate heatmap data for current time
  useEffect(() => {
    if (!heatmapResponse || filteredTimes.length === 0 || !isOpen) {
      onHeatmapDataChange(new Map());
      return;
    }

    const currentTime = filteredTimes[currentTimeIndex];
    const currentData = heatmapResponse.data.filter(
      d => d.sched_departure_hour === currentTime
    );

    // Calculate total seats per individual gate based on filters
    const gateMap = new Map<string, number>();

    currentData.forEach(record => {
      let totalSeats = 0;
      
      if (filters.firstClass) totalSeats += record.first_class_seats;
      if (filters.businessClass) totalSeats += record.business_class_seats;
      if (filters.premiumEconomy) totalSeats += record.premium_economy_class_seats;
      if (filters.economyPlus) totalSeats += record.economy_plus_class_seats;
      if (filters.economy) totalSeats += record.economy_class_seats;

      // Store seats per individual gate (use gate number as string)
      if (totalSeats > 0) {
        gateMap.set(record.gate.toString(), totalSeats);
      }
    });

    onHeatmapDataChange(gateMap);
  }, [currentTimeIndex, filters, heatmapResponse, filteredTimes, isOpen, onHeatmapDataChange]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || filteredTimes.length === 0) return;

    const timer = setInterval(() => {
      setCurrentTimeIndex(prev => {
        if (prev >= filteredTimes.length - 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, filteredTimes.length, playbackSpeed]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipBack = () => {
    setCurrentTimeIndex(prev => Math.max(0, prev - 1));
  };

  const handleSkipForward = () => {
    setCurrentTimeIndex(prev => Math.min(filteredTimes.length - 1, prev + 1));
  };

  const handleSliderChange = (value: number[]) => {
    setCurrentTimeIndex(value[0]);
  };

  const toggleFilter = (filter: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };

  if (!isOpen) return null;

  return (
    <Card className="absolute bottom-4 left-4 w-96 z-[1000] shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Terminal Heatmap</CardTitle>
        <CardDescription>
          Scheduled departure seats by gate area
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading heatmap data...</div>
        ) : (
          <>
            {/* Date selector */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Date</Label>
              <select 
                value={selectedDate || ''}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentTimeIndex(0);
                }}
                className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
              >
                {uniqueDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>

            {/* Current time display */}
            <div className="bg-muted p-2 rounded-md">
              <div className="text-xs text-muted-foreground">Current Time</div>
              <div className="text-sm font-semibold">
                {filteredTimes[currentTimeIndex]?.split(' ')[1] || '--:--'}
              </div>
            </div>

            {/* Time slider */}
            <div className="space-y-2">
              <Slider
                value={[currentTimeIndex]}
                onValueChange={handleSliderChange}
                max={Math.max(0, filteredTimes.length - 1)}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>00:00</span>
                <span>23:00</span>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSkipBack}
                disabled={currentTimeIndex === 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={handlePlayPause}
                className="w-20"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Play
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSkipForward}
                disabled={currentTimeIndex >= filteredTimes.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Playback speed */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Playback Speed: {playbackSpeed}ms
              </Label>
              <Slider
                value={[playbackSpeed]}
                onValueChange={(value) => setPlaybackSpeed(value[0])}
                min={100}
                max={2000}
                step={100}
                className="w-full"
              />
            </div>

            {/* Cabin class filters */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-xs font-medium">Cabin Class Filter</Label>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="firstClass"
                    checked={filters.firstClass}
                    onCheckedChange={() => toggleFilter('firstClass')}
                  />
                  <label
                    htmlFor="firstClass"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    First Class
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="businessClass"
                    checked={filters.businessClass}
                    onCheckedChange={() => toggleFilter('businessClass')}
                  />
                  <label
                    htmlFor="businessClass"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Business
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="premiumEconomy"
                    checked={filters.premiumEconomy}
                    onCheckedChange={() => toggleFilter('premiumEconomy')}
                  />
                  <label
                    htmlFor="premiumEconomy"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Premium Economy
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="economyPlus"
                    checked={filters.economyPlus}
                    onCheckedChange={() => toggleFilter('economyPlus')}
                  />
                  <label
                    htmlFor="economyPlus"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Economy Plus
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="economy"
                    checked={filters.economy}
                    onCheckedChange={() => toggleFilter('economy')}
                  />
                  <label
                    htmlFor="economy"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Economy
                  </label>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

