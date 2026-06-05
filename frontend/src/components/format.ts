export function formatTemperature(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value)}°` : '--°';
}

export function formatTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function getDisplayName(location: {
  nickname?: string | null;
  latitude: number;
  longitude: number;
  weather: { area: string | null };
}): string {
  const trimmedNickname = location.nickname?.trim();
  if (trimmedNickname && trimmedNickname.length > 0) {
    return trimmedNickname;
  }
  if (location.weather.area) {
    return location.weather.area;
  }
  return `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
}
