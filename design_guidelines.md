# Airport Terminal POI Mapping Application - Design Guidelines

## Design Approach

**Selected Framework:** Minimalist Utility Design System
Drawing inspiration from professional GIS applications like Mapbox Studio and Google Maps Platform, combined with the clean efficiency of Linear's interface. The design prioritizes map visibility, tool accessibility, and unobtrusive controls that enhance rather than compete with the primary map interface.

## Core Design Principles

1. **Map-First Philosophy:** The map occupies maximum screen real estate; all controls are non-invasive overlays
2. **Clarity Over Decoration:** Every element serves a functional purpose
3. **Spatial Efficiency:** Dense information presentation without feeling cluttered
4. **Tool Accessibility:** Frequently used functions within immediate reach

---

## Layout Architecture

### Primary Structure
- **Full viewport map canvas:** 100vw x 100vh with all controls as overlays
- **Collapsible left sidebar:** 360px wide when expanded, 48px when collapsed
- **Floating action panels:** Positioned strategically to avoid map center (drawing tools in top-right, export controls in bottom-right)

### Spacing System
Use Tailwind spacing units: **2, 3, 4, 6, 8** for consistent rhythm
- Component padding: p-4 or p-6
- Panel gaps: space-y-3 or space-y-4
- Icon margins: m-2
- Section separation: mb-6 or mb-8

---

## Typography Hierarchy

**Font Stack:** Inter (via Google Fonts CDN)
- **Primary weights:** 400 (Regular), 500 (Medium), 600 (Semibold)

**Type Scale:**
- **H1 - Page/Panel Titles:** 20px/24px, Semibold, tight tracking
- **H2 - Section Headers:** 16px/20px, Semibold
- **H3 - Subsection Labels:** 14px/18px, Medium
- **Body Text:** 14px/20px, Regular
- **Small/Meta Text:** 12px/16px, Regular
- **Input Labels:** 12px/16px, Medium, uppercase tracking

---

## Component Library

### Navigation & Layout Components

**1. Collapsible Sidebar Panel**
- Fixed left position, full height
- Header: Airport search/selection (IATA code input + autocomplete dropdown)
- Scrollable content area with distinct sections
- Collapse/expand toggle icon button (chevron) in top-right of header
- Sections: "Selected Airport" info card, "POI Categories" filter list, "Drawing Tools" section

**2. Airport Search Component**
- Combobox/autocomplete input with icon prefix (search/globe icon)
- Dropdown results showing: IATA code (bold) + Full airport name (lighter)
- Selected airport displayed as card: Large airport name, IATA code badge, coordinates meta text

**3. POI Filter Toggles**
- Vertical list of checkbox items with icons
- Categories: Lounges, Cafes, Restaurants, Security Checkpoints, Gates, Custom POIs
- Each with left-aligned icon, category name, and right-aligned toggle switch
- Active filters indicated with accent styling

### Map & Drawing Components

**4. Floating Drawing Tools Panel**
- Top-right corner position (16px from edges)
- Vertical button group with icon-only actions
- Tools: Add Marker, Draw Polygon, Edit Mode, Delete Mode, Clear All
- Active tool gets emphasized border/background
- Tooltips on hover showing tool names

**5. Map Layer Controls**
- Bottom-left corner overlay
- Compact button group: Base map style selector, Zoom in/out, Geolocation, Full screen
- Stacked vertically with minimal spacing

**6. Drawing Mode Indicators**
- Top-center banner when in active drawing mode
- Shows current tool, instruction text, and "Cancel" action
- Example: "Drawing Polygon Mode - Click to add points, double-click to complete"

### Data Management Components

**7. Export Controls Panel**
- Bottom-right floating card
- Header: "Export Data" with close icon
- Format selector: GeoJSON, KML, CSV options as radio buttons
- "Include Layers" multi-select checkboxes
- Primary action button: "Download Export"
- Secondary text showing feature count

**8. POI Marker Popups**
- Compact popup on marker click
- Title row: POI name + category icon
- Content: Type, additional metadata (hours, terminal section)
- Action buttons: Edit, Delete (icon buttons)
- Custom POIs get additional "Save" flow

**9. Feature List Drawer** (Optional bottom drawer)
- Slide-up panel showing all drawn features and custom POIs
- Searchable/filterable table with columns: Name, Type, Actions
- Quick delete and edit actions per row

### Form Components

**10. Custom POI Creation Modal**
- Centered overlay modal (max-width 480px)
- Form fields: Name (text input), Category (select dropdown), Description (textarea), Terminal/Zone (text input)
- Icon selector grid (common POI icons)
- Actions: Cancel (secondary), Save POI (primary)

**11. Polygon Area Definition Form**
- Similar modal structure
- Fields: Area name, Zone type (dropdown: Terminal, Security, Gates, Retail), Notes
- Visual preview of polygon bounds
- Area calculation display (sq meters)

---

## Interaction Patterns

### Map Interactions
- Click empty area: Deselect all
- Click marker: Show popup
- Drawing mode: Click to place points, double-click or press Enter to complete
- Right-click: Context menu (when applicable)

### Sidebar Behavior
- Collapsed state shows only icons vertically
- Hover on collapsed shows tooltip labels
- Smooth slide transition (200ms ease-in-out)
- Persists state in localStorage

### Tool States
- **Default:** Neutral, ready state
- **Active:** Drawing/editing mode with visual feedback
- **Disabled:** Greyed out when not applicable
- No hover/active interactions for buttons over images (N/A for this app)

---

## Iconography

**Icon Library:** Heroicons (via CDN)
- Outline style for inactive/secondary actions
- Solid style for active states and primary actions
- Consistent 20px size for toolbar icons, 16px for inline icons

**Key Icons:**
- Globe: Airport selection
- MapPin: Add POI marker
- Square3Stack3D: Layers
- PencilSquare: Edit mode
- Trash: Delete
- ArrowDownTray: Export
- Squares2X2: Terminal zones

---

## Animation & Micro-interactions

**Minimal Animation Philosophy - Use Sparingly:**
- Sidebar collapse/expand: 200ms slide transform
- Modal appearance: 150ms fade-in
- Tooltip delays: 300ms before showing
- Map zoom transitions: Leaflet default (smooth)
- **No** elaborate page transitions, scroll effects, or decorative animations

---

## Accessibility Standards

- All controls keyboard navigable
- Focus indicators on all interactive elements (2px outline)
- ARIA labels for icon-only buttons
- Color contrast minimum 4.5:1 for text
- Touch targets minimum 44x44px for mobile

---

## Images

**No hero images or decorative graphics** - This is a utility application where the map IS the visual centerpiece. The Leaflet map with OpenStreetMap tiles provides all necessary visual content.

---

## Responsive Behavior

**Desktop (1024px+):** Full layout as described
**Tablet (768-1023px):** Sidebar width 320px, floating panels slightly smaller
**Mobile (<768px):** 
- Sidebar becomes full-screen drawer from bottom
- Drawing tools compact horizontal row at top
- Export controls in slide-up sheet
- Single column all forms