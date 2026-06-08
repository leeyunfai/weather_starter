import { useState, useRef, useEffect, useCallback } from 'react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import { useStore } from '../state/store';
import { MapPinIcon, ExpandIcon, CloseIcon } from './icons';
import { getDisplayName } from './format';

const MAP_CENTER: [number, number] = [1.3521, 103.8198];
const MAP_ZOOM = 11;
const MAP_MIN_ZOOM = 10;
const MAP_MAX_ZOOM = 18;
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function createMarkerIcon(isSelected: boolean): L.DivIcon {
  const size = isSelected ? 24 : 16;
  const color = isSelected ? '#3b82f6' : '#6b7280';
  const boxShadow = isSelected ? 'box-shadow: 0 0 6px rgba(59,130,246,0.5);' : '';

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};${boxShadow}"></div>`,
  });
}

interface ViewState {
  center: [number, number];
  zoom: number;
}

interface MapControllerProps {
  isFullscreen: boolean;
  viewState: ViewState;
  onViewChange?: (state: ViewState) => void;
}

function MapController({ isFullscreen, viewState, onViewChange }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (isFullscreen) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, map]);

  useEffect(() => {
    if (isFullscreen) {
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
    }
  }, [isFullscreen, map]);

  // Sync view when viewState changes externally (e.g. fullscreen closed, inline map updates)
  useEffect(() => {
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    if (
      Math.abs(currentCenter.lat - viewState.center[0]) > 0.0001 ||
      Math.abs(currentCenter.lng - viewState.center[1]) > 0.0001 ||
      currentZoom !== viewState.zoom
    ) {
      map.setView(viewState.center, viewState.zoom, { animate: false });
    }
  }, [viewState, map]);

  // Report view changes back to parent
  useEffect(() => {
    if (!onViewChange) return;

    const handleMoveEnd = () => {
      const center = map.getCenter();
      onViewChange({ center: [center.lat, center.lng], zoom: map.getZoom() });
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleMoveEnd);
    };
  }, [map, onViewChange]);

  return null;
}

export function MapCard() {
  const store = useStore();
  const { locations, selectedId, isLoading } = store;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({ center: MAP_CENTER, zoom: MAP_ZOOM });
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleViewChange = useCallback((state: ViewState) => {
    setViewState(state);
  }, []);

  // Handle opening fullscreen with animation
  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
    // Trigger animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimatingIn(true);
      });
    });
  }, []);

  // Handle closing fullscreen with animation
  const closeFullscreen = useCallback(() => {
    setIsAnimatingIn(false);
    // Wait for exit animation to complete before unmounting
    setTimeout(() => {
      setIsFullscreen(false);
      // Return focus to expand button
      expandButtonRef.current?.focus();
    }, 150);
  }, []);

  // Escape key and focus trap handler
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFullscreen();
      }
      // Focus trap: keep focus within the overlay
      if (e.key === 'Tab') {
        // Get all focusable elements within the overlay
        const overlay = document.querySelector('[role="dialog"]');
        if (!overlay) return;

        const focusableElements = overlay.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if focus is on first element, wrap to last
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab: if focus is on last element, wrap to first
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, closeFullscreen]);

  // Focus close button when overlay opens
  useEffect(() => {
    if (isFullscreen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isFullscreen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        closeFullscreen();
      }
    },
    [closeFullscreen],
  );

  const renderMarkers = (enableScrollZoom: boolean) =>
    locations.map((location) => (
      <Marker
        key={location.id}
        position={[location.latitude, location.longitude]}
        icon={createMarkerIcon(location.id === selectedId)}
        alt={getDisplayName(location)}
        eventHandlers={{ click: () => store.select(location.id) }}
      >
        <Popup>
          <div className="text-sm">
            <div className="font-medium">
              {getDisplayName(location)}
            </div>
            <div>
              {location.weather.temperature_c != null
                ? `${Math.round(location.weather.temperature_c)}°`
                : '--'}
            </div>
            <div className="text-gray-500">
              {location.weather.condition ?? 'No data'}
            </div>
          </div>
        </Popup>
      </Marker>
    ));

  return (
    <section
      className="col-span-full flex flex-col gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 backdrop-blur-xl"
      role="region"
      aria-label="Interactive locations map"
    >
      <header className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
        <MapPinIcon className="h-3.5 w-3.5" />
        <span>Locations Map</span>
        <button
          ref={expandButtonRef}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Expand map to fullscreen"
          onClick={openFullscreen}
        >
          <ExpandIcon className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className={`flex-1${isFullscreen ? ' invisible' : ''}`}>
        {isLoading && locations.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center rounded-xl bg-white/[0.04] text-sm text-white/60">
            Loading locations…
          </div>
        ) : (
          <div className="relative">
            <MapContainer
              center={viewState.center}
              zoom={viewState.zoom}
              minZoom={MAP_MIN_ZOOM}
              maxZoom={MAP_MAX_ZOOM}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              dragging={true}
              touchZoom={true}
              keyboard={true}
              zoomControl={false}
              style={{ height: '280px', width: '100%' }}
            >
              <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
              <ZoomControl position="topright" />
              <MapController isFullscreen={false} viewState={viewState} onViewChange={handleViewChange} />
              {renderMarkers(false)}
            </MapContainer>
            {!isLoading && locations.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
                <p className="text-sm text-white/80">No locations yet. Add one from the sidebar.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-200 ease-out ${
            isAnimatingIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen locations map"
          onClick={handleBackdropClick}
        >
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ width: 'calc(100vw - 48px)', height: 'calc(100vh - 48px)' }}
          >
            <MapContainer
              center={viewState.center}
              zoom={viewState.zoom}
              minZoom={MAP_MIN_ZOOM}
              maxZoom={MAP_MAX_ZOOM}
              scrollWheelZoom={true}
              doubleClickZoom={true}
              dragging={true}
              touchZoom={true}
              keyboard={true}
              zoomControl={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
              <ZoomControl position="topright" />
              <MapController isFullscreen={true} viewState={viewState} onViewChange={handleViewChange} />
              {renderMarkers(true)}
            </MapContainer>
            <button
              ref={closeButtonRef}
              className="absolute top-4 right-4 z-[1000] flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close fullscreen map"
              onClick={closeFullscreen}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
