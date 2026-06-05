# Requirements Document

## Introduction

This feature adds an interactive map to the weather dashboard that displays all saved locations as clickable pins. The map is implemented using **react-leaflet v4.2.1** (wrapping **Leaflet v1.9.4**), both of which are already installed in `frontend/package.json`. Map tiles come from OpenStreetMap (free, no API key). The map lives inside a new dashboard card component that follows the existing `TileShell` visual pattern and supports expanding to a fullscreen overlay.

### Files to Create

- `frontend/src/components/MapCard.tsx` — The map card component containing the Leaflet map, pin rendering, expand/collapse logic, and popup display.
- `frontend/src/components/MapCard.test.tsx` — Unit and integration tests for the MapCard component.

### Files to Modify

- `frontend/src/components/Tiles.tsx` — Add the MapCard to the TileGrid layout (render it after existing tiles).
- `frontend/src/main.tsx` or `frontend/src/index.css` — Import `leaflet/dist/leaflet.css` for Leaflet styling.
- `frontend/src/components/MapCard.tsx` — Include the Leaflet default icon fix (reassigning `L.Icon.Default.prototype.options` for Vite bundler compatibility).

### Map Library

- **Library**: `react-leaflet` v4.2.1 (React bindings) + `leaflet` v1.9.4 (core)
- **Tile provider**: OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
- **Why Leaflet**: Already a project dependency, zero API key requirement, lightweight (~40KB gzipped), strong TypeScript support, well-suited for the simple pin-display use case.

## Glossary

- **Map_Card**: A new React component (`MapCard.tsx`) that renders within the TileGrid, containing the map container, expand button, and all map-related UI.
- **Map_Container**: The `<MapContainer>` component from react-leaflet that initializes and manages the Leaflet map instance.
- **Tile_Layer**: The `<TileLayer>` component from react-leaflet that renders OpenStreetMap raster tiles as the base map.
- **Location_Marker**: A `<Marker>` component from react-leaflet placed at each saved location's `[latitude, longitude]` coordinates.
- **Marker_Popup**: A `<Popup>` component from react-leaflet attached to each Location_Marker, showing area name, temperature, and condition.
- **Fullscreen_Overlay**: A `<div>` with `position: fixed; inset: 0` rendered via React portal or inline, covering the viewport when the map is expanded.
- **Store**: The existing React context (`useStore` from `state/store.tsx`) providing `locations`, `selectedId`, and `select()`.
- **Expand_Button**: A `<button>` in the Map_Card header that toggles a local `isFullscreen` state boolean.
- **Close_Button**: A `<button>` in the Fullscreen_Overlay that sets `isFullscreen` back to false.

## Requirements

### Requirement 1: Map Card Rendering in TileGrid

**User Story:** As a user, I want to see a map card in my weather dashboard, so that I can view my saved locations spatially alongside other weather tiles.

#### Acceptance Criteria

1. THE Map_Card SHALL be rendered as the last child inside the `TileGrid` component in `Tiles.tsx`, receiving the `locations` array (of type `Location[]`) from the store to obtain each location's `latitude` and `longitude` for marker placement.
2. THE Map_Card SHALL use the existing TileShell visual pattern: `rounded-2xl`, `border border-white/15`, `bg-white/[0.08]`, `backdrop-blur-xl`, with a header row containing a map pin icon and the title "Locations Map".
3. THE Map_Card SHALL span the full grid width using the Tailwind class `col-span-full`.
4. WHILE the Map_Card is rendered inline (not in fullscreen mode), THE Map_Container SHALL have a fixed height of 280px and width of 100%.
5. THE Tile_Layer SHALL use the URL template `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` with attribution `© OpenStreetMap contributors`.
6. THE Map_Container SHALL initialize with center `[1.3521, 103.8198]` (Singapore) and zoom level `11`.
7. THE Map_Card SHALL render one marker per saved location, placed at the location's `latitude` and `longitude` coordinates, with Leaflet default marker icons displaying correctly in the Vite build.
8. IF the `locations` array is empty, THEN THE Map_Card SHALL display the map at the default center and zoom with no markers rendered.
9. WHEN a location marker is present on the map, THE marker SHALL be visible at the coordinates corresponding to that location's `latitude` and `longitude` values without requiring user interaction to appear.

### Requirement 2: Saved Locations Rendered as Pins

**User Story:** As a user, I want each saved location to appear as a pin on the map, so that I can see where my weather stations are.

#### Acceptance Criteria

1. THE Map_Card SHALL read the `locations` array from the Store via `useStore()`.
2. FOR EACH location in the `locations` array, THE Map_Card SHALL render one `<Marker>` component at position `[location.latitude, location.longitude]`, keyed by `location.id`.
3. WHEN a Location_Marker is clicked, THE Map_Card SHALL call `store.select(location.id)` to update the selected location in the Store.
4. WHEN a Location_Marker is clicked, THE Map_Card SHALL open a Marker_Popup displaying:
   - Line 1: The location's `weather.area` value, or `"${latitude.toFixed(3)}, ${longitude.toFixed(3)}"` if area is null.
   - Line 2: The temperature formatted as `"${Math.round(temperature_c)}°"` or `"--"` if null.
   - Line 3: The `weather.condition` value or `"No data"` if null.
5. WHEN a Location_Marker is clicked while a different Marker_Popup is already open, THE Map_Card SHALL close the previously open Marker_Popup before opening the new one, so that at most one Marker_Popup is visible at any time.
6. THE Map_Card SHALL visually distinguish the selected location's pin by using a custom Leaflet `L.divIcon` with a blue (#3b82f6) circular marker of 24×24 CSS pixels for the selected location and a gray (#6b7280) circular marker of 16×16 CSS pixels for unselected locations.
7. WHEN the `locations` array in the Store changes (additions or removals), THE Map_Card SHALL update the rendered set of `<Marker>` components to match the current `locations` array within the next render cycle.
8. IF the `locations` array is empty, THEN THE Map_Card SHALL render no `<Marker>` components on the map.

### Requirement 3: Fullscreen Expansion via Overlay

**User Story:** As a user, I want to expand the map to fullscreen, so that I can see all my locations with more detail.

#### Acceptance Criteria

1. THE Map_Card SHALL maintain a local React state `isFullscreen` (boolean, default `false`).
2. THE Map_Card header SHALL render an Expand_Button using an expand icon from the existing `icons.tsx`, positioned at the right side of the header, with an `aria-label` of "Expand map to fullscreen".
3. WHEN the Expand_Button is clicked, THE Map_Card SHALL set `isFullscreen` to `true`.
4. WHILE `isFullscreen` is true, THE Map_Card SHALL render a Fullscreen_Overlay `<div>` with these CSS properties: `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm`.
5. WHILE `isFullscreen` is true, THE Map_Container inside the overlay SHALL expand to `width: calc(100vw - 48px)` and `height: calc(100vh - 48px)` with `rounded-2xl` corners.
6. WHILE `isFullscreen` is true, THE Fullscreen_Overlay SHALL render a Close_Button (`position: absolute; top: 16px; right: 16px`) as a white circular button with an X icon and an `aria-label` of "Close fullscreen map".
7. WHEN the Close_Button is clicked, THE Map_Card SHALL set `isFullscreen` to `false`.
8. WHEN the Escape key is pressed while `isFullscreen` is true, THE Map_Card SHALL set `isFullscreen` to `false` (via a `useEffect` with a `keydown` event listener).
9. WHEN the user clicks the backdrop area of the Fullscreen_Overlay (outside the Map_Container), THE Map_Card SHALL set `isFullscreen` to `false`.
10. WHEN `isFullscreen` changes from false to true, THE Map_Card SHALL call `map.invalidateSize()` (via a `useMap()` hook in a child component) after a 250ms delay to allow the CSS transition to complete before Leaflet recalculates dimensions.
11. THE Fullscreen_Overlay SHALL animate in with a CSS transition: `opacity 0→1` and `scale 0.95→1` over 200ms with `ease-out` timing. WHEN `isFullscreen` changes from true to false, THE Fullscreen_Overlay SHALL animate out with `opacity 1→0` and `scale 1→0.95` over 150ms with `ease-in` timing before unmounting.
12. WHEN the Fullscreen_Overlay opens, THE Map_Card SHALL move focus to the Close_Button. WHEN the Fullscreen_Overlay closes, THE Map_Card SHALL return focus to the Expand_Button.

### Requirement 4: Map Interaction Controls

**User Story:** As a user, I want to pan and zoom the map, so that I can explore locations at different scales.

#### Acceptance Criteria

1. THE Map_Container SHALL enable drag-to-pan by default (Leaflet's `dragging` option is true).
2. THE Map_Container SHALL enable pinch-to-zoom on touch devices (Leaflet's `touchZoom` option is true).
3. THE Map_Container SHALL display Leaflet's built-in zoom control (+ / − buttons) in the top-right corner (`zoomControl: true`, `zoomControlPosition: 'topright'`).
4. THE Map_Container SHALL constrain zoom between `minZoom: 10` and `maxZoom: 18`.
5. WHILE the Map_Card is in inline mode (not fullscreen), THE Map_Container SHALL disable scroll-wheel zoom (`scrollWheelZoom: false`) and double-click zoom (`doubleClickZoom: false`) to prevent accidental zooming while the user scrolls the dashboard page.
6. WHILE the Map_Card is in fullscreen mode, THE Map_Container SHALL enable scroll-wheel zoom (`scrollWheelZoom: true`) and double-click zoom (`doubleClickZoom: true`).
7. THE Map_Container SHALL support keyboard pan (arrow keys) and keyboard zoom (+/− keys) when the map has focus in both inline and fullscreen modes (`keyboard: true`).

### Requirement 5: Accessibility

**User Story:** As a user who relies on assistive technology, I want the map card to be accessible, so that I can understand and interact with the map feature.

#### Acceptance Criteria

1. THE Map_Card container SHALL include `role="region"` and `aria-label="Interactive locations map"`.
2. THE Expand_Button SHALL include `aria-label="Expand map to fullscreen"`.
3. THE Close_Button SHALL include `aria-label="Close fullscreen map"`.
4. WHILE the Fullscreen_Overlay is active, THE Fullscreen_Overlay SHALL trap focus within itself: the Close_Button SHALL receive focus on open, Tab from the last focusable element SHALL cycle to the Close_Button, and Shift+Tab from the Close_Button SHALL cycle to the last focusable element.
5. WHEN the Fullscreen_Overlay closes, THE focus SHALL return to the Expand_Button element.
6. EACH Location_Marker SHALL include a Leaflet marker `alt` attribute set to the location's `area` value when present, or `"${latitude.toFixed(3)}, ${longitude.toFixed(3)}"` when area is null.
7. WHILE the Fullscreen_Overlay is active, THE Fullscreen_Overlay SHALL include `role="dialog"`, `aria-modal="true"`, and `aria-label="Fullscreen locations map"`.

### Requirement 6: Empty and Loading States

**User Story:** As a user, I want clear feedback when there are no locations or data is loading, so that I understand what the map is showing.

#### Acceptance Criteria

1. WHILE the Store's `isLoading` is true and the `locations` array is empty, THE Map_Card SHALL display a centered text "Loading locations…" over a placeholder area with a height of 280px and a neutral gray background, instead of rendering the map.
2. WHILE `isLoading` is false and the `locations` array is empty, THE Map_Card SHALL render the Map_Container showing the map centered on Singapore (latitude 1.3521, longitude 103.8198) at zoom level 11, with a non-interactive overlay message: "No locations yet. Add one from the sidebar."
3. IF the OpenStreetMap tile layer fails to load due to a network error, THEN THE Map_Card SHALL continue to display Location_Markers at their correct positions on the blank map canvas without throwing a runtime error, and the map SHALL remain pannable and zoomable.

### Requirement 7: Verification Strategy

**User Story:** As a developer, I want a clear testing approach, so that I can verify the map feature works correctly.

#### Acceptance Criteria

1. THE MapCard component SHALL be tested with React Testing Library and Vitest in `MapCard.test.tsx`, mocking `react-leaflet` components (`MapContainer`, `TileLayer`, `Marker`, `Popup`) as simple `<div>` elements with data-testid attributes.
2. THE test suite SHALL verify that exactly one marker element (identified by data-testid) is rendered per Location object in the store's `locations` array.
3. WHEN a marker element is clicked in the test, THE test suite SHALL verify that the store's `select` function is called with the `id` property of the corresponding Location object.
4. THE test suite SHALL verify that the Fullscreen_Overlay element is present in the DOM when the component's `isFullscreen` state is true, and absent from the DOM when `isFullscreen` is false.
5. WHEN the Escape key is pressed while the Fullscreen_Overlay is visible, THE test suite SHALL verify that the overlay is removed from the DOM within the same render cycle.
6. IF the store's `locations` array is empty (length 0), THEN THE test suite SHALL verify that an empty state message element is rendered and no marker elements are present.
7. THE test suite SHALL verify that the marker element corresponding to the store's `selectedId` receives the selected icon class, and all other marker elements receive the unselected icon class.
8. WHEN running property-based tests using a fuzzing library, THE test suite SHALL verify the invariant: the count of rendered marker elements equals the length of the `locations` array for arrays of 0 to 50 generated Location objects, including locations with null weather fields and coordinates at the Singapore boundary edges (latitude 1.15 to 1.47, longitude 103.60 to 104.05).
