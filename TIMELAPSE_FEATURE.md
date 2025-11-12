# Hourly Visit Volume Timelapse Feature

## Overview
This feature adds interactive hourly visit volume visualization for airport lounges with a timelapse slider control. It's currently configured for Hong Kong International Airport (HKG) as a demonstration.

## Features

### 1. Visual Visit Indicators
- **Original Markers**: Lounge markers retain their original purple color and size
- **Bar Chart Visualization**: A vertical bar chart appears next to each lounge marker
- **Color Coding**:
  - 🔵 Blue: Low/empty visit volume (0-33% of max)
  - 🟢 Green: Medium visit volume (33-66% of max)
  - 🔴 Red: High visit volume (66-100% of max)
- **Visit Count Annotation**: Exact visit number displayed above the bar chart
- **Bar Height**: Proportional to visit volume relative to maximum

### 2. Timelapse Control Panel
Located at the bottom of the map, featuring:
- **Date/Time Display**: Shows current selected date and hour
- **Play/Pause Button**: Auto-plays through the timeline at 1-hour per second
- **Step Controls**: 
  - Skip backward/forward by 1 hour
  - Disabled when at min/max bounds
- **Slider**: Scrub through the entire date range
- **Range Display**: Shows min and max dates at slider ends

### 3. Data Integration
- **OSM Lounges**: Automatically matches visit data to OpenStreetMap lounge POIs by name
- **Custom Lounges**: Includes user-added custom POI lounges if names match the mapping file
- **Real-time Updates**: Markers update instantly as you scrub through time

## File Structure

### New Files Created

#### `/client/src/pages/components/TimelapseControl.tsx`
The main timelapse UI component featuring:
- Date/time display
- Play/pause/step controls
- Slider for time navigation
- Progress indicator

#### `/client/src/lib/timelapseUtils.ts`
Utility functions for data processing:
- `parseVisitData()`: Parses CSV visit data
- `parseLoungeMapping()`: Parses lounge name to code mapping
- `getVisitDataForHour()`: Filters data for specific hour
- `findLoungeCodeByName()`: Fuzzy matching for lounge names
- `getDateRange()`: Extracts min/max dates from data
- `getVisitColorIntensity()`: Calculates marker colors and sizes

### Modified Files

#### `/client/src/pages/components/MapContainer.tsx`
Enhanced with:
- New props: `visitData`, `maxVisits`, `loungeCodeMap`
- Updated `createIcon()` function to render visit badges
- Visit count display in marker popups
- Support for both OSM and custom POI lounges

#### `/client/src/pages/map.tsx`
Integrated timelapse functionality:
- State management for visit data and timelapse control
- CSV and JSON data loading via fetch
- Auto-play interval logic
- Computed visit data for current hour
- Conditional rendering of timelapse control (HKG only)

#### `/server/index.ts`
Added static file serving:
```typescript
app.use('/files', express.static('files'));
```

## Data Files

### `/files/samples/HKG_visits_hourly_visit.csv`
Format:
```csv
LOUNGE_CODE,VISIT_HOUR,TOTAL_VISITS
HKG10,2023-12-31 00:00:00.000,2
HKG13,2023-12-31 06:00:00.000,42
...
```

### `/files/samples/mapped_HKG_lounges.json`
Format:
```json
{
  "環亞機場貴賓室 Plaza Premium Lounge": {
    "LOUNGE_CODE": "HKG10",
    "is_AD": false
  },
  "Chase Sapphire Lounge": {
    "LOUNGE_CODE": "HKG13",
    "is_AD": true
  }
}
```

## Usage

1. **Select HKG Airport**: Choose Hong Kong International Airport from the sidebar
2. **Wait for Data Load**: Visit data loads automatically (check console for errors if it doesn't appear)
3. **View Visit Volumes**: Lounge markers now display bar charts with visit count annotations
4. **Use Timelapse Controls**:
   - Click play to auto-advance through time
   - Use step buttons to move hour by hour
   - Drag the slider to jump to specific times
5. **Click Markers**: View detailed visit information in popups

## Extending to Other Airports

To add timelapse support for another airport (e.g., LHR):

1. **Prepare Data Files**:
   ```
   /files/samples/LHR_visits_hourly_visit.csv
   /files/samples/mapped_LHR_lounges.json
   ```

2. **Update Data Loading** in `/client/src/pages/map.tsx`:
   ```typescript
   useEffect(() => {
     if (selectedAirport?.iataCode === "LHR" && !visitDataLoaded) {
       const csvResponse = await fetch("/files/samples/LHR_visits_hourly_visit.csv");
       const jsonResponse = await fetch("/files/samples/mapped_LHR_lounges.json");
       // ... rest of loading logic
     }
   }, [selectedAirport, visitDataLoaded]);
   ```

3. **Update Conditional Rendering**:
   ```typescript
   {(selectedAirport?.iataCode === "HKG" || selectedAirport?.iataCode === "LHR") && visitDataLoaded && (
     <TimelapseControl ... />
   )}
   ```

## Technical Details

### Performance Optimizations
- **useMemo**: Visit data computation is memoized to prevent recalculation
- **Map-based Lookups**: O(1) lounge code lookups using Map data structure
- **Conditional Rendering**: Timelapse control only renders when data is available

### Auto-Play Behavior
- Advances 1 hour per second (configurable in the useEffect interval)
- Automatically stops at max date
- Can be paused/resumed at any time

### Fuzzy Name Matching
The `findLoungeCodeByName()` function performs:
1. Exact match (case-insensitive)
2. Partial match (contains or is contained by)
3. Returns null if no match found

This handles variations in lounge naming between OSM, custom POIs, and mapping files.

## Troubleshooting

### No Visit Data Appearing
1. Check browser console for fetch errors
2. Verify CSV and JSON files exist in `/files/samples/`
3. Ensure HKG airport is selected
4. Check that lounge names in OSM/custom POIs match mapping file

### Markers Not Updating
1. Verify `visitData` prop is being passed to MapContainer
2. Check that `loungeCodeMap` has correct mappings
3. Ensure dependency array includes visit-related props

### Slider Not Moving
1. Verify date range is valid (min < max)
2. Check that `currentDateTime` is within range
3. Ensure state updates are not being blocked

## Future Enhancements

Potential improvements:
- [ ] Support multiple airports simultaneously
- [ ] Heatmap overlay instead of individual markers
- [ ] Aggregate views (daily/weekly averages)
- [ ] Export timelapse as video/GIF
- [ ] Configurable playback speed
- [ ] Date range filtering
- [ ] Statistics panel showing trends
- [ ] Comparison mode (compare two time periods)

