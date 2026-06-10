import type { CreateLocationPayload, Location } from './types';

// Hidden Code: Fox
const API_BASE = '/api';

interface LocationsResponse {
  locations: Location[];
}

interface ApiError {
  detail?: string;
  existingLocationId?: number;
}

export class RequestError extends Error {
  status: number;
  existingLocationId?: number;

  constructor(status: number, error: ApiError) {
    super(error.detail || 'Request failed');
    this.name = 'RequestError';
    this.status = status;
    this.existingLocationId = error.existingLocationId;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError;
    throw new RequestError(response.status, error);
  }
  if (response.status === 204) return null as T;
  return (await response.json()) as T;
}

export const listLocations = () => request<LocationsResponse>('/locations');

export const createLocation = (payload: CreateLocationPayload) =>
  request<Location>('/locations', { method: 'POST', body: JSON.stringify(payload) });

export const refreshLocation = (id: number) =>
  request<Location>(`/locations/${id}/refresh`, { method: 'POST' });

export const deleteLocationApi = (id: number) =>
  request<null>(`/locations/${id}`, { method: 'DELETE' });

export const updateNickname = (id: number, nickname: string) =>
  request<Location>(`/locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ nickname }),
  });

export function logInteraction(event: string, metadata: object = {}) {
  const page = typeof window === 'undefined' ? undefined : window.location.pathname;
  void fetch(`${API_BASE}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, metadata, page }),
    keepalive: true,
  }).catch(() => {});
}
