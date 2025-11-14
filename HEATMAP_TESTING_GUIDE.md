# Heatmap Testing Guide

## Server Status ✓

The heatmap feature is now fully implemented and the server is running on **port 8080**.

### Verified Components:

1. ✓ API endpoint `/api/heatmap/hkg` - returns 203,940 records
2. ✓ API endpoint `/api/heatmap/hkg/gate-areas` - returns 8 gate areas with coordinates
3. ✓ MapContainer.tsx - updated with heatmap rendering logic
4. ✓ HeatmapPanel.tsx - time-lapse controls and cabin class filters
5. ✓ DrawingToolsPanel.tsx - heatmap toggle button (flame icon 🔥)
6. ✓ map.tsx - heatmap state management and props passing

## How to Test the Heatmap

### Step 1: Access the Application
Open your browser and go to: `http://localhost:8080`

### Step 2: Select Hong Kong Airport
1. Look at the **left sidebar** (airport selector)
2. Search for or scroll to **"Hong Kong International Airport (HKG)"**
3. Click to select it
4. The map should center on Hong Kong

### Step 3: Activate the Heatmap
1. Look at the **top-right corner** of the map
2. You should see a toolbar with drawing tools
3. Click the **Flame icon** 🔥 (labeled "Terminal Heatmap (HKG)")
4. The button should turn blue/highlighted when active

### Step 4: Use the Heatmap Controls
After activating the heatmap, you should see:

1. **Heatmap Control Panel** (bottom-left):
   - Date selector dropdown
   - Current time display
   - Time slider (0:00 - 23:00)
   - Play/Pause/Skip buttons
   - Playback speed slider
   - Cabin class checkboxes (First, Business, Premium Economy, Economy Plus, Economy)

2. **Heatmap on Map**:
   - Colored gate area polygons
   - Colors range from blue (low) to red (high) based on seat counts
   - Hover over areas to see tooltips with exact seat numbers

3. **Legend** (bottom-right):
   - Color reference showing intensity levels
   - High (red), Medium-High (orange), Medium-Low (yellow), Low (blue/green)

### Step 5: Test Features

#### Time-lapse Playback:
1. Click the **Play button** ▶️
2. Watch the heatmap animate through the hours
3. Click **Pause** to stop
4. Use **Skip Forward/Backward** buttons to step through hours

#### Cabin Class Filtering:
1. Uncheck **"Economy"** - see the heatmap update with only premium cabin seats
2. Uncheck all except **"First Class"** - see only first class seat distribution
3. Re-check all to see combined data

#### Date Selection:
1. Click the **date dropdown**
2. Select a different date (recommend trying dates in 2024)
3. The heatmap should update with that date's data

### Expected Behavior

**When heatmap is active:**
- Terminal polygons (if enabled) should be hidden
- Gate areas should be visible with color-coded intensity
- Hovering shows tooltips with area name and seat count
- Clicking shows popup with detailed information

**When heatmap is inactive:**
- Gate area polygons should disappear
- Normal terminal polygons should return (if enabled)
- Legend should disappear

## Troubleshooting

### Problem: Heatmap button doesn't appear
- **Solution**: Make sure you've selected "Hong Kong International Airport (HKG)"
- The heatmap is only available for HKG airport

### Problem: No polygons appear on map
- **Check 1**: Make sure the flame icon button is active (highlighted/blue)
- **Check 2**: Zoom to Hong Kong airport area (the map should auto-zoom when you select HKG)
- **Check 3**: Open browser console (F12) and check for any errors

### Problem: "Loading heatmap data..." appears indefinitely
- **Check 1**: Verify the server is running on port 8080
- **Check 2**: Test API endpoints:
  ```bash
  curl http://localhost:8080/api/heatmap/hkg/gate-areas
  curl http://localhost:8080/api/heatmap/hkg
  ```
- **Check 3**: Check browser network tab (F12 -> Network) for failed requests

### Problem: Polygons appear but with no color variation
- **Solution 1**: Select a date with more flight activity (try 2024-01-15 or later)
- **Solution 2**: Make sure at least one cabin class filter is checked
- **Solution 3**: Try different times of day (early morning hours often have less activity)

### Problem: Time slider doesn't work
- **Solution**: Make sure you've selected a date first from the date dropdown

## API Testing Commands

Test the API endpoints directly:

```bash
# Test gate areas endpoint
curl http://localhost:8080/api/heatmap/hkg/gate-areas | python3 -m json.tool | head -50

# Test heatmap data endpoint (first 20 records)
curl -s http://localhost:8080/api/heatmap/hkg | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('Airport:', data['airport_code'])
print('Date range:', data['date_range'])
print('Total records:', len(data['data']))
print('\nFirst 5 records with non-zero seats:')
for r in data['data']:
    if r['total_seats'] > 0:
        print(r)
        break
"
```

## Data Information

### Gate Areas Mapped:
1. Gate 1-4
2. Gate 5-9
3. Gate 13-21
4. Gate 10-12 & 23-36
5. Gate 40-50
6. Gate 60-71
7. Gate 211-219
8. Gate 201-210 & 228-230

### Dataset Details:
- **Date Range**: 2022-01-01 to 2024-09-19
- **Total Records**: 203,940
- **Granularity**: Hourly
- **Cabin Classes**: First, Business, Premium Economy, Economy Plus, Economy

### Note on Data Activity:
- Early 2022 dates may have lower activity due to COVID-19 restrictions
- More recent dates (2024) tend to have higher flight activity
- Peak hours typically: 6am-10am, 3pm-8pm
- Low activity hours: 11pm-5am

## Console Debugging

Open browser console (F12) and run:

```javascript
// Check if heatmap data is loading
console.log('Heatmap visible:', document.querySelector('.heatmap-tooltip'));

// Check for heatmap polygons
console.log('Gate area polygons:', document.querySelectorAll('.leaflet-interactive').length);

// Monitor heatmap panel state
const heatmapPanel = document.querySelector('div').textContent;
console.log('Panel visible:', heatmapPanel.includes('Terminal Heatmap'));
```

## Success Criteria

✓ Flame icon button appears in top-right toolbar for HKG airport
✓ Clicking flame icon shows heatmap panel in bottom-left
✓ Gate area polygons render on the map with colors
✓ Time slider changes the heatmap colors
✓ Play button animates through hours
✓ Cabin class filters update the heatmap
✓ Legend appears in bottom-right
✓ Hovering over gate areas shows tooltips
✓ Clicking gate areas shows popups with details

## Performance Notes

- Initial data load may take 1-2 seconds (48MB JSON file)
- Time transitions should be smooth
- Hovering should be responsive
- The playback speed slider allows you to control animation speed

If you encounter any issues not covered here, please check the browser console for error messages.

