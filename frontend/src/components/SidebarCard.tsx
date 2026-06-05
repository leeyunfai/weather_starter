import { useState } from 'react';
import { useStore } from '../state/store';
import { CloudIcon, HomeIcon } from './icons';
import { formatTemperature, formatTime, getDisplayName } from './format';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { Location } from '../types';

interface SidebarCardProps {
  location: Location;
  isHome: boolean;
}

export function SidebarCard({ location, isHome }: SidebarCardProps) {
  const { selectedId, select, remove, updateNickname } = useStore();
  const isSelected = selectedId === location.id;
  const observed = formatTime(location.weather.observed_at);
  const displayName = getDisplayName(location);
  const condition = location.weather.condition || '-';
  const temperature = formatTemperature(location.weather.temperature_c);
  const high = formatTemperature(location.weather.forecast_high_c);
  const low = formatTemperature(location.weather.forecast_low_c);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const onSelect = () => select(location.id);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  const onDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void remove(location.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      aria-pressed={isSelected}
      className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl border text-left backdrop-blur-xl transition ${
        isSelected
          ? 'border-white/30 bg-white/20 shadow-lg shadow-black/20'
          : 'border-white/10 bg-white/[0.07] hover:bg-white/[0.12]'
      }`}
    >
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${displayName}`}
        className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white/60 opacity-0 transition hover:bg-white/25 hover:text-white group-hover:opacity-100"
      >
        &#x2715;
      </button>
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          {isEditing ? (
            <input
              type="text"
              className={`w-full rounded bg-white/10 px-1 text-lg font-semibold leading-tight text-white outline-none ring-1 ${
                saveError ? 'ring-red-400' : 'ring-white/30 focus:ring-white/60'
              } ${isSaving ? 'opacity-50' : ''}`}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setSaveError(false);
                }
              }}
              onBlur={async () => {
                const trimmed = editValue.trim();
                const newNickname = trimmed === '' ? '' : trimmed;
                if (newNickname === (location.nickname ?? '')) {
                  setIsEditing(false);
                  return;
                }
                setIsSaving(true);
                setSaveError(false);
                try {
                  await updateNickname(location.id, newNickname);
                  setIsEditing(false);
                } catch {
                  setSaveError(true);
                  setTimeout(() => {
                    setSaveError(false);
                    setIsEditing(false);
                  }, 3000);
                } finally {
                  setIsSaving(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              maxLength={50}
              disabled={isSaving}
              autoFocus
            />
          ) : (
            <div
              className="truncate text-lg font-semibold leading-tight text-white cursor-text"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditValue(location.nickname ?? '');
                setIsEditing(true);
              }}
              title="Double-click to rename"
            >
              {displayName}
            </div>
          )}
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/70">
            {isHome ? (
              <>
                <span>My Location</span>
                <span className="text-white/40">·</span>
                <HomeIcon className="h-3 w-3" />
                <span>Home</span>
              </>
            ) : observed ? (
              <span>{observed}</span>
            ) : (
              <span className="text-white/50">Not refreshed</span>
            )}
          </div>
        </div>
        <div className="text-3xl font-light tabular-nums text-white/90">{temperature}</div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 text-white/80">
          <CloudIcon className="h-4 w-4 text-white/70" />
          <span>{condition}</span>
        </div>
        <div className="text-white/60 tabular-nums">
          H:{high} L:{low}
        </div>
      </div>
    </div>
  );
}
