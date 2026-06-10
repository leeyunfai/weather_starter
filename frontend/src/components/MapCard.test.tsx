// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Location, WeatherSnapshot } from '../types';

// Mock store values
const mockSelect = vi.fn();
const defaultStoreValues = {
  locations: [] as {
    id: number;
    latitude: number;
    longitude: number;
    nickname: string | null;
    created_at: string;
    weather: WeatherSnapshot;
  }[],
  selectedId: null as number | null,
  isAdding: false,
  isLoading: false,
  refreshingId: null,
  error: null,
  select: mockSelect,
  setAdding: vi.fn(),
  create: vi.fn(),
  refresh: vi.fn(),
  remove: vi.fn(),
  updateNickname: vi.fn(),
};

vi.mock('../state/store', () => ({
  useStore: () => defaultStoreValues,
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: { children?: React.ReactNode; style?: object }) => (
    <div data-testid="map-container" data-style={JSON.stringify(props.style)}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({
    children,
    eventHandlers,
    position,
    icon,
    alt,
  }: {
    children?: React.ReactNode;
    eventHandlers?: { click?: () => void };
    position?: [number, number];
    icon?: { options?: { iconSize?: number[] } };
    alt?: string;
  }) => (
    <div
      data-testid="marker"
      data-position={JSON.stringify(position)}
      data-alt={alt}
      data-icon-size={icon?.options?.iconSize?.[0]}
      onClick={() => eventHandlers?.click?.()}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  ZoomControl: () => <div data-testid="zoom-control" />,
  useMap: () => ({
    invalidateSize: vi.fn(),
    scrollWheelZoom: { enable: vi.fn(), disable: vi.fn() },
    doubleClickZoom: { enable: vi.fn(), disable: vi.fn() },
    getCenter: () => ({ lat: 1.3521, lng: 103.8198 }),
    getZoom: () => 11,
    setView: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        prototype: { _getIconUrl: undefined },
        mergeOptions: vi.fn(),
      },
    },
    divIcon: (opts: Record<string, unknown>) => ({ options: opts }),
  },
  divIcon: (opts: Record<string, unknown>) => ({ options: opts }),
}));

import { MapCard } from './MapCard';

function makeWeather(overrides: Partial<WeatherSnapshot> = {}): WeatherSnapshot {
  return {
    condition: null,
    observed_at: null,
    source: null,
    area: null,
    valid_period_text: null,
    temperature_c: null,
    humidity_percent: null,
    rainfall_mm: null,
    wind_speed_knots: null,
    wind_direction_degrees: null,
    forecast_low_c: null,
    forecast_high_c: null,
    uv_index: null,
    psi_twenty_four_hourly: null,
    pm25_one_hourly: null,
    air_quality_region: null,
    forecast_periods: [],
    daily_forecast: [],
    ...overrides,
  };
}

const mockLocations: Location[] = [
  {
    id: 1,
    latitude: 1.3521,
    longitude: 103.8198,
    nickname: null,
    created_at: '2024-01-01T00:00:00Z',
    weather: makeWeather({
      area: 'Ang Mo Kio',
      temperature_c: 28.5,
      condition: 'Partly Cloudy',
    }),
  },
  {
    id: 2,
    latitude: 1.29,
    longitude: 103.85,
    nickname: null,
    created_at: '2024-01-01T00:00:00Z',
    weather: makeWeather(),
  },
];

function setStoreValues(overrides: Partial<typeof defaultStoreValues>) {
  Object.assign(defaultStoreValues, {
    locations: [],
    selectedId: null,
    isAdding: false,
    isLoading: false,
    refreshingId: null,
    error: null,
    select: mockSelect,
    setAdding: vi.fn(),
    create: vi.fn(),
    refresh: vi.fn(),
    remove: vi.fn(),
    updateNickname: vi.fn(),
    ...overrides,
  });
}

describe('MapCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setStoreValues({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with correct aria attributes', () => {
    render(<MapCard />);
    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-label', 'Interactive locations map');
  });

  it('renders header with title and expand button', () => {
    render(<MapCard />);
    expect(screen.getByText('Locations Map')).toBeInTheDocument();
    expect(screen.getByLabelText('Expand map to fullscreen')).toBeInTheDocument();
  });

  it('expand button opens fullscreen overlay', () => {
    render(<MapCard />);
    const expandBtn = screen.getByLabelText('Expand map to fullscreen');
    fireEvent.click(expandBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('close button closes overlay', () => {
    vi.useFakeTimers();
    render(<MapCard />);
    fireEvent.click(screen.getByLabelText('Expand map to fullscreen'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close fullscreen map'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('escape key closes overlay', () => {
    vi.useFakeTimers();
    render(<MapCard />);
    fireEvent.click(screen.getByLabelText('Expand map to fullscreen'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('backdrop click closes overlay', () => {
    vi.useFakeTimers();
    render(<MapCard />);
    fireEvent.click(screen.getByLabelText('Expand map to fullscreen'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Click the backdrop (the dialog div itself)
    fireEvent.click(dialog);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('loading state shows placeholder', () => {
    setStoreValues({ isLoading: true, locations: [] });
    render(<MapCard />);
    expect(screen.getByText('Loading locations…')).toBeInTheDocument();
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument();
  });

  it('empty state shows message', () => {
    setStoreValues({ isLoading: false, locations: [] });
    render(<MapCard />);
    expect(screen.getByText('No locations yet. Add one from the sidebar.')).toBeInTheDocument();
  });

  it('renders correct number of markers', () => {
    const threeLocations: Location[] = [
      ...mockLocations,
      {
        id: 3,
        latitude: 1.32,
        longitude: 103.9,
        nickname: null,
        created_at: '2024-01-01T00:00:00Z',
        weather: makeWeather({ area: 'Tampines' }),
      },
    ];
    setStoreValues({ locations: threeLocations });
    render(<MapCard />);
    const markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(3);
  });

  it('clicking a marker calls select', () => {
    setStoreValues({ locations: mockLocations });
    render(<MapCard />);
    const markers = screen.getAllByTestId('marker');
    fireEvent.click(markers[1]);
    expect(mockSelect).toHaveBeenCalledWith(2);
  });

  it('selected marker gets larger icon', () => {
    setStoreValues({ locations: mockLocations, selectedId: 1 });
    render(<MapCard />);
    const markers = screen.getAllByTestId('marker');
    expect(markers[0]).toHaveAttribute('data-icon-size', '24');
    expect(markers[1]).toHaveAttribute('data-icon-size', '16');
  });

  it('MapCard has col-span-full class', () => {
    render(<MapCard />);
    const section = screen.getByRole('region');
    expect(section.className).toContain('col-span-full');
  });
});
