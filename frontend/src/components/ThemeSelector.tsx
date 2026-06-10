import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../state/ThemeProvider';

const THEME_LABELS: Record<string, string> = {
  apple: 'Apple',
  midnight: 'Midnight',
  sunrise: 'Warm Sunrise',
  arctic: 'Arctic',
  forest: 'Forest Depth',
  terminal: 'Retro Terminal',
  pastel: 'Pastel Cloud',
  ocean: 'Ocean Gradient',
};

export function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
          if (e.key === 'Enter' && !isOpen) {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select theme"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-primary)] backdrop-blur-xl transition hover:bg-[var(--sidebar-card-selected-bg)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10a2.5 2.5 0 002.5-2.5c0-.61-.23-1.17-.6-1.6-.04-.04-.06-.1-.06-.15a.5.5 0 01.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9.25-10-9.25zm-5.5 10a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3-4a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3 4a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="Theme options"
          className="absolute right-0 top-full mt-2 min-w-[140px] overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--sidebar-bg)] p-1 shadow-lg backdrop-blur-xl"
        >
          {themes.map((id) => (
            <li
              key={id}
              role="option"
              aria-selected={id === theme}
              tabIndex={0}
              onClick={() => {
                setTheme(id as typeof theme);
                setIsOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setTheme(id as typeof theme);
                  setIsOpen(false);
                }
                if (e.key === 'Escape') setIsOpen(false);
              }}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition ${
                id === theme
                  ? 'bg-[var(--sidebar-card-selected-bg)] text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--card-bg)]'
              }`}
            >
              {THEME_LABELS[id] ?? id}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
