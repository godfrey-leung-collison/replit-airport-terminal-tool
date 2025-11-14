# Airport Terminal Heatmap Feature

## Overview

This document describes the new terminal heatmap feature that visualizes scheduled departure flight seats by gate area over time.

## Features

### 1. Time-lapse Controls
- **Play/Pause**: Automatically cycle through hourly time slots
- **Skip Forward/Backward**: Navigate through time manually
- **Time Slider**: Jump to any hour of the day
- **Playback Speed Control**: Adjust animation speed (100-2000ms per frame)
- **Date Selector**: Choose from available dates in the dataset

### 2. Cabin Class Filters
Filter the heatmap by cabin class to analyze specific passenger segments:
- **First Class**
- **Business Class**
- **Premium Economy**
- **Economy Plus**
- **Economy**

All filters can be toggled independently to show combined or isolated cabin class data.

### 3. Visualization
- **Color-coded gate areas**: Gate areas are colored based on the number of scheduled departure seats
- **Interactive polygons**: Hover over gate areas to see tooltips with exact seat counts
- **Legend**: Visual reference showing the intensity scale from low (blue) to high (red)

### 4. Color Scale
The heatmap uses a 5-color intensity scale:
- **Blue (#4299e1)**: Low activity (0-25%)
- **Green (#48bb78)**: Low-medium activity (25-50%)
- **Yellow (#ecc94b)**: Medium activity (50-75%)
- **Orange (#ed8936)**: Medium-high activity (75-100%)
- **Red (#f56565)**: High activity (100%)

## Usage

### Activating the Heatmap
1. Select **Hong Kong International Airport (HKG)** from the airport selector
2. Click the **Flame icon** (🔥) in the drawing tools panel (top-right)
3. The heatmap panel will appear in the bottom-left corner

### Exploring the Data
1. **Select a date** from the dropdown menu
2. Use the **time slider** or **play button** to see how gate activity changes throughout the day
3. **Toggle cabin class filters** to focus on specific passenger segments
4. **Hover over gate areas** on the map to see detailed seat counts
5. **Click on gate areas** to view more information

### Best Practices
- Use the playback speed slider to control animation speed for better visualization
- Combine multiple cabin classes to see total activity patterns
- Compare different dates to identify trends and patterns
- Use the legend as a reference for interpreting color intensity

## Technical Implementation

### Data Source
- **Dataset**: Hong Kong Airport scheduled seats by gate (2022-01-01 to 2024-09-20)
- **Format**: Parquet file converted to JSON for API serving
- **Granularity**: Hourly aggregations by gate and cabin class

### Components
1. **HeatmapPanel**: Control panel with filters and time-lapse controls
2. **MapContainer**: Renders gate area polygons with color-coded intensities
3. **API Endpoints**:
   - `/api/heatmap/hkg`: Provides hourly seat data
   - `/api/heatmap/hkg/gate-areas`: Provides gate area polygon coordinates

### Gate Areas
The following gate areas are defined for HKG:
- Gate 1-4
- Gate 5-9
- Gate 13-21
- Gate 10-12 & 23-36
- Gate 40-50
- Gate 60-71
- Gate 211-219
- Gate 201-210 & 228-230

## Sample Use Cases

### Operations Planning
- Identify peak hours for each terminal area
- Optimize staff allocation based on passenger flow
- Plan maintenance windows during low-activity periods

### Passenger Experience
- Analyze congestion patterns
- Identify areas needing enhanced services
- Plan lounge and retail positioning

### Business Intelligence
- Compare cabin class distributions across gate areas
- Track seasonal variations in departure patterns
- Analyze the impact of schedule changes

## Future Enhancements

Potential improvements for the heatmap feature:
- Support for additional airports
- Real-time data integration
- Arrival seat data visualization
- Comparison mode (side-by-side dates)
- Export heatmap animations as video
- Historical trend analysis
- Predictive modeling integration

## Data Requirements

To add heatmap support for other airports, you need:
1. Scheduled flight data with:
   - Gate number or gate area
   - Departure time (hourly granularity)
   - Seat counts by cabin class
2. Gate area polygon coordinates in GeoJSON format
3. Mapping of individual gates to gate areas

## Notes

- The heatmap replaces terminal polygons when active
- Drawing tools remain available while the heatmap is shown
- Gate areas with no scheduled flights appear in blue (minimum color)
- The feature is currently optimized for Hong Kong Airport data

