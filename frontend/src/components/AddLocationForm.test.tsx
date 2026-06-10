// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddLocationForm } from './AddLocationForm';

const create = vi.fn();
const setAdding = vi.fn();
vi.mock('../state/store', () => ({
  useStore: () => ({ isAdding: true, create, setAdding }),
}));

const position = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude } }) as GeolocationPosition;

function installGeolocation(implementation: Geolocation['getCurrentPosition']) {
  const getCurrentPosition = vi.fn(implementation);
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition },
  });
  return getCurrentPosition;
}

describe('AddLocationForm geolocation', () => {
  beforeEach(() => {
    create.mockReset();
    setAdding.mockReset();
    create.mockResolvedValue({ status: 'created', locationId: 1 });
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  });

  it('submits exact detected coordinates with the requested options', async () => {
    const getCurrentPosition = installGeolocation((success) => success(position(1.3521, 103.8198)));
    render(<AddLocationForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({ latitude: 1.3521, longitude: 103.8198 }),
    );
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: true,
      timeout: 10_000,
    });
  });

  it('shows progress and disables every form control while adding', async () => {
    let resolveCreate!: (value: { status: 'created'; locationId: number }) => void;
    create.mockReturnValue(new Promise((resolve) => (resolveCreate = resolve)));
    installGeolocation((success) => success(position(1.35, 103.85)));
    render(<AddLocationForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    await screen.findByRole('button', { name: 'Adding location...' });
    for (const control of screen.getAllByRole('button')) expect(control).toBeDisabled();
    expect(screen.getByLabelText('Latitude')).toBeDisabled();
    expect(screen.getByLabelText('Longitude')).toBeDisabled();
    resolveCreate({ status: 'created', locationId: 1 });
    await screen.findByRole('button', { name: 'Use my location' });
  });

  it.each([
    [1, 'Location permission was denied.'],
    [2, 'Your location is unavailable.'],
    [3, 'Finding your location timed out.'],
  ])('shows a specific error for geolocation code %s', async (code, message) => {
    installGeolocation((_success, failure) =>
      failure?.({
        code,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError),
    );
    render(<AddLocationForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('rejects positions outside Singapore without creating a location', async () => {
    installGeolocation((success) => success(position(1.6, 103.85)));
    render(<AddLocationForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    expect(await screen.findByText(/outside Singapore/)).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('preserves manual coordinates after geolocation failure', async () => {
    installGeolocation((_success, failure) =>
      failure?.({
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError),
    );
    render(<AddLocationForm />);
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '1.3' } });
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '103.8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    await screen.findByText('Location permission was denied.');
    expect(screen.getByLabelText('Latitude')).toHaveValue(1.3);
    expect(screen.getByLabelText('Longitude')).toHaveValue(103.8);
  });

  it('shows an unsupported-browser error', () => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
    render(<AddLocationForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    expect(screen.getByText(/not supported/)).toBeInTheDocument();
  });
});
