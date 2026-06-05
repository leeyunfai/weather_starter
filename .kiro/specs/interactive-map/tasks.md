# Implementation Plan: Interactive Map

## Overview

Add an interactive Leaflet-based map card to the weather dashboard that displays saved locations as clickable pins with popups, supports fullscreen expansion, and follows the existing TileShell visual pattern. The implementation uses the already-installed `react-leaflet` and `leaflet` packages with OpenStreetMap tiles.

## Tasks

- [x] 1. Set up test infrastructure and Leaflet CSS
  - [x] 1.1 Install test dependencies in the frontend workspace
    - Run `npm install -D @testing-library/react@^14.0.0 @testing-library/jest-dom@^6.0.0 jsdom@^24.0.0 fast-check@^3.15.0` in the frontend directory
    - These are needed for component testing (React Testing Library), DOM assertions, jsdom environment, and property-based tests
    - _Requirements: 7.1_

  - [x] 1.2 Add Leaflet CSS import to index.css
    - Add `@import 'leaflet/dist/leaflet.css';` as the first line of `frontend/src/index.css`, before the `@tailwind` directives
    - This ensures Leaflet's base styles (map container sizing, tile positioning, controls) are loaded globally
    - _Requirements: 1.2, 1.5_

  - [x] 1.3 Add MapPinIcon and ExpandIcon to icons.tsx
    - Add `MapPinIcon` (map pin SVG) and `ExpandIcon` (expand/arrows-out SVG) exports to `frontend/src/components/icons.tsx`
    - Follow the existing icon pattern: accept `className` prop with default size, use the shared `base` SVG props
    - _Requirements: 1.2, 3.2_

- [x] 2. Implement MapCard component
  - [x] 2.1 Create MapCard.tsx with core map rendering
    - Create `frontend/src/components/MapCard.tsx`
    - Include Leaflet default icon fix (import marker assets, call `L.Icon.Default.mergeOptions`)
    - Implement `createMarkerIcon(isSelected: boolean)` factory returning `L.divIcon` — blue (#3b82f6) 24×24 for selected, gray (#6b7280) 16×16 for unselected
    - Render `MapContainer` with center `[1.3521, 103.8198]`, zoom `11`, minZoom `10`, maxZoom `18`
    - Render `TileLayer` with OpenStreetMap URL and attribution
    - Map one `<Marker>` per location from `useStore().locations`, keyed by `id`, positioned at `[latitude, longitude]`
    - Each marker gets `alt` attribute: `area` if non-null, or `"${lat.toFixed(3)}, ${lng.toFixed(3)}"`
    - On marker click: call `store.select(location.id)` and open a `<Popup>` showing area/coords, temperature, and condition
    - Apply correct icon via `createMarkerIcon(location.id === selectedId)`
    - Inline map container: height 280px, width 100%
    - Disable `scrollWheelZoom` and `doubleClickZoom` in inline mode
    - Enable `dragging`, `touchZoom`, `keyboard`, and zoom control at `topright`
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 5.1, 5.6_

  - [x] 2.2 Add fullscreen overlay with expand/close controls
    - Add `isFullscreen` local state (default `false`) and `expandButtonRef`
    - Render header row with MapPinIcon, "Locations Map" title, and ExpandButton (with `aria-label="Expand map to fullscreen"`)
    - When expanded: render fixed overlay `div` with `z-50 bg-black/60 backdrop-blur-sm`
    - Overlay contains map at `width: calc(100vw - 48px)`, `height: calc(100vh - 48px)`, `rounded-2xl`
    - Render CloseButton (absolute top-right, white circle, X icon, `aria-label="Close fullscreen map"`)
    - Close on: CloseButton click, backdrop click, Escape key press
    - Enable `scrollWheelZoom` and `doubleClickZoom` in fullscreen mode
    - Animate in: opacity 0→1, scale 0.95→1, 200ms ease-out; animate out: opacity 1→0, scale 1→0.95, 150ms ease-in
    - Overlay attributes: `role="dialog"`, `aria-modal="true"`, `aria-label="Fullscreen locations map"`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.11, 4.5, 4.6, 5.2, 5.3, 5.7_

  - [x] 2.3 Implement MapController and focus management
    - Create internal `MapController` sub-component using `useMap()` hook
    - On `isFullscreen` change to true: call `map.invalidateSize()` after 250ms delay
    - Toggle `scrollWheelZoom` enable/disable and `doubleClickZoom` enable/disable based on fullscreen state
    - Focus management: move focus to CloseButton on overlay open, return focus to ExpandButton on close
    - Focus trap: Tab from last focusable element cycles to CloseButton, Shift+Tab from CloseButton cycles to last focusable element
    - _Requirements: 3.10, 3.12, 5.4, 5.5_

  - [x] 2.4 Add empty and loading states
    - When `isLoading` is true and `locations` is empty: render placeholder div (280px height, neutral gray bg) with centered "Loading locations…" text instead of the map
    - When `isLoading` is false and `locations` is empty: render map at default center/zoom with overlay message "No locations yet. Add one from the sidebar."
    - Wrap map card container with `role="region"` and `aria-label="Interactive locations map"`
    - _Requirements: 5.1, 6.1, 6.2, 6.3_

- [x] 3. Integrate MapCard into dashboard
  - [x] 3.1 Add MapCard to TileGrid in Tiles.tsx
    - Import `MapCard` from `./MapCard`
    - Render `<MapCard />` as the last child in the `TileGrid` component's grid div
    - MapCard should use `col-span-full` to span the entire grid width
    - _Requirements: 1.1, 1.3_

- [x] 4. Checkpoint - Verify build and integration
  - Ensure `npm run build` in the frontend directory completes without TypeScript errors
  - Verify the MapCard renders correctly alongside existing tiles
  - Ask the user if questions arise

- [x] 5. Write tests for MapCard
  - [x] 5.1 Create MapCard.test.tsx with unit tests
    - Create `frontend/src/components/MapCard.test.tsx` with `// @vitest-environment jsdom` directive
    - Mock `react-leaflet` components (MapContainer, TileLayer, Marker, Popup, useMap) as simple divs with data-testid attributes
    - Mock the store via a test wrapper providing controlled values
    - Test: correct aria attributes rendered (`role="region"`, `aria-label`)
    - Test: expand button opens fullscreen overlay, close button closes it
    - Test: Escape key closes overlay
    - Test: backdrop click closes overlay
    - Test: focus moves to close button on open, returns to expand button on close
    - Test: loading state shows "Loading locations…" placeholder
    - Test: empty state shows "No locations yet" message and no markers
    - Test: correct number of markers rendered for given locations
    - Test: selected marker gets selected icon class, others get unselected
    - Test: clicking a marker calls `select` with correct id
    - Test: inline mode has correct dimensions (280px height)
    - Test: MapCard has `col-span-full` class
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 5.2 Write property test: Marker count equals locations length
    - **Property 1: Marker count equals locations length**
    - **Validates: Requirements 1.7, 1.8, 2.2, 2.8, 7.2, 7.8**
    - Generate arrays of 0–50 Location objects with `fast-check`, including null weather fields and Singapore boundary coordinates (lat 1.15–1.47, lng 103.60–104.05)
    - Assert: rendered marker count === locations array length

  - [ ]* 5.3 Write property test: Selected icon assignment
    - **Property 2: Selected icon assignment**
    - **Validates: Requirements 2.6, 7.7**
    - For any non-empty locations array and any selectedId from those IDs, exactly one marker gets the selected icon; all others get unselected
    - If selectedId is null or not in array, all markers get unselected icon

  - [ ]* 5.4 Write property test: Select callback correctness
    - **Property 3: Select callback correctness**
    - **Validates: Requirements 2.3, 7.3**
    - For any Location rendered as a marker, clicking it calls `store.select` exactly once with that location's `id`

  - [ ]* 5.5 Write property test: Location label derivation
    - **Property 4: Location label derivation**
    - **Validates: Requirements 2.4, 5.6**
    - For any Location, the derived label equals `weather.area` when non-null, or `"${lat.toFixed(3)}, ${lng.toFixed(3)}"` when area is null

- [x] 6. Final checkpoint - Ensure all tests pass
  - Run `npx vitest run frontend/src/components/MapCard.test.tsx` to verify all unit and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript with React — all implementation follows this stack
- `react-leaflet` and `leaflet` are already installed as project dependencies
- `@types/leaflet` is already in root devDependencies
- The root vitest config only targets backend; frontend tests use `// @vitest-environment jsdom` file directive

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3", "2.4"] },
    { "id": 4, "tasks": ["3.1"] },
    { "id": 5, "tasks": ["5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.4", "5.5"] }
  ]
}
```
