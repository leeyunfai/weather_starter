import { useState } from 'react';
import type { FormEvent } from 'react';
import { useStore } from '../state/store';
import { PlusIcon } from './icons';

type Activity = 'idle' | 'locating' | 'submitting';

const isWithinSingapore = (latitude: number, longitude: number) =>
  1.1 <= latitude && latitude <= 1.5 && 103.6 <= longitude && longitude <= 104.1;

function geolocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return 'Location permission was denied.';
  if (error.code === error.POSITION_UNAVAILABLE) return 'Your location is unavailable.';
  if (error.code === error.TIMEOUT) return 'Finding your location timed out.';
  return 'Could not find your location.';
}

export function AddLocationForm() {
  const { isAdding, setAdding, create } = useStore();
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [activity, setActivity] = useState<Activity>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const busy = activity !== 'idle';

  const cancel = () => {
    setLatitude('');
    setLongitude('');
    setSubmitError(null);
    setAdding(false);
  };

  const submitCoordinates = async (coordinates: { latitude: number; longitude: number }) => {
    setActivity('submitting');
    const result = await create(coordinates);
    if (result.status === 'existing') setNotice('Nearby location already added');
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setNotice(null);
    try {
      await submitCoordinates({ latitude: Number(latitude), longitude: Number(longitude) });
      setLatitude('');
      setLongitude('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not add location');
    } finally {
      setActivity('idle');
    }
  };

  const useMyLocation = () => {
    setSubmitError(null);
    setNotice(null);
    const localHostname =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!window.isSecureContext && !localHostname) {
      setSubmitError('Location access requires HTTPS or localhost.');
      return;
    }
    if (!navigator.geolocation) {
      setSubmitError('Location access is not supported by this browser.');
      return;
    }

    setActivity('locating');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (!isWithinSingapore(coords.latitude, coords.longitude)) {
          setSubmitError(
            'Your location is outside Singapore. Only Singapore locations are supported.',
          );
          setActivity('idle');
          return;
        }
        try {
          await submitCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : 'Could not add location');
        } finally {
          setActivity('idle');
        }
      },
      (error) => {
        setSubmitError(geolocationErrorMessage(error));
        setActivity('idle');
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  if (!isAdding) {
    return (
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => {
            setNotice(null);
            setAdding(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--sidebar-card-bg)] px-3 py-2.5 text-sm font-medium text-white/85 backdrop-blur-xl hover:bg-white/[0.12]"
        >
          <PlusIcon />
          <span>Add Location</span>
        </button>
        {notice && <p className="px-2 text-xs text-emerald-200">{notice}</p>}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-2.5 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 backdrop-blur-xl"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
        New coordinate
      </p>
      <button
        type="button"
        onClick={useMyLocation}
        disabled={busy}
        className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {activity === 'locating'
          ? 'Finding your location...'
          : activity === 'submitting'
            ? 'Adding location...'
            : 'Use my location'}
      </button>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid min-w-0 gap-1">
          <span className="text-[11px] text-white/60">Latitude</span>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="1.296"
            required
            disabled={busy}
            className="w-full min-w-0 rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-sm text-white placeholder:text-white/40"
          />
        </label>
        <label className="grid min-w-0 gap-1">
          <span className="text-[11px] text-white/60">Longitude</span>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="103.847"
            required
            disabled={busy}
            className="w-full min-w-0 rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-sm text-white placeholder:text-white/40"
          />
        </label>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-white/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {activity === 'submitting' ? 'Adding...' : 'Add'}
        </button>
      </div>
      {submitError && (
        <p className="rounded-md border border-red-300/30 bg-red-500/15 px-2.5 py-1.5 text-xs text-red-100">
          {submitError}
        </p>
      )}
    </form>
  );
}
