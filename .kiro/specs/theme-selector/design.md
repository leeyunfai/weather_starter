# Design Document: Theme Selector

## Overview

The theme system enables users to switch between two visual themes ("apple" and "midnight") via a floating UI control. It is implemented entirely client-side using CSS custom properties, a dedicated React Context, and localStorage persistence. The architecture ensures theme switching requires zero component re-renders for style changes — only CSS repaints.

## Architecture

The theme system is built on three layers:

1. **CSS Custom Properties Layer** — Declares color tokens on `:root[data-theme="..."]` selectors, making theme switching a zero-JS-rerender operation (only CSS repaints).
2. **ThemeProvider Context** — A lightweight React Context (separate from StoreProvider) that manages the active theme state, syncs `data-theme` on `<html>`, and persists the choice to localStorage.
3. **ThemeSelector UI** — A floating button + dropdown overlay rendered inside the Hero area for switching themes.

Data flows downward: the CSS variables respond to the `data-theme` attribute, the ThemeProvider controls that attribute, and the ThemeSelector triggers the provider's `setTheme` function.

```
index.html (blocking script sets data-theme before paint)
       │
       ▼
  ThemeProvider (React Context)
       │  ├─ reads localStorage on mount
       │  ├─ sets document.documentElement.dataset.theme
       │  └─ writes localStorage on change
       ▼
  ThemeSelector (UI control)
       │  └─ calls setTheme from context
       ▼
  CSS Custom Properties (:root[data-theme="..."])
       │
       ▼
  Components consume vars via Tailwind arbitrary values
```

## Components and Interfaces

### 1. CSS Theme Definitions (`src/index.css`)

Two rule sets define color tokens:

```css
:root[data-theme="apple"] {
  --body-bg: radial-gradient(120% 80% at 70% 0%, rgba(255,255,255,0.18) 0%, transparent 55%),
             radial-gradient(90% 70% at 10% 100%, rgba(80,110,150,0.55) 0%, transparent 60%),
             linear-gradient(170deg, #6f8aa8 0%, #5a7591 35%, #4a627c 65%, #3c5066 100%);
  --card-bg: rgba(255, 255, 255, 0.08);
  --card-border: rgba(255, 255, 255, 0.15);
  --sidebar-bg: rgba(0, 0, 0, 0.2);
  --sidebar-card-bg: rgba(255, 255, 255, 0.07);
  --sidebar-card-border: rgba(255, 255, 255, 0.1);
  --sidebar-card-selected-bg: rgba(255, 255, 255, 0.2);
  --sidebar-card-selected-border: rgba(255, 255, 255, 0.3);
  --text-primary: rgba(255, 255, 255, 0.9);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.55);
  --accent-color: #0ea5e9;
}

:root[data-theme="midnight"] {
  --body-bg: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 60%),
             #0a0a0f;
  --card-bg: rgba(255, 255, 255, 0.04);
  --card-border: rgba(34, 211, 238, 0.2);
  --sidebar-bg: #0d0d12;
  --sidebar-card-bg: rgba(255, 255, 255, 0.04);
  --sidebar-card-border: rgba(34, 211, 238, 0.15);
  --sidebar-card-selected-bg: rgba(34, 211, 238, 0.1);
  --sidebar-card-selected-border: rgba(34, 211, 238, 0.35);
  --text-primary: #ecfeff;
  --text-secondary: rgba(207, 250, 254, 0.8);
  --text-muted: rgba(165, 243, 252, 0.6);
  --accent-color: #22d3ee;
}
```

The `body` rule changes from a hardcoded `background` to:

```css
body {
  background: var(--body-bg);
  background-attachment: fixed;
  background-repeat: no-repeat;
}
```

### 2. ThemeProvider (`src/state/ThemeProvider.tsx`)

```typescript
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'weather-theme';
const VALID_THEMES = ['apple', 'midnight'] as const;
type Theme = (typeof VALID_THEMES)[number];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: readonly string[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isValidTheme(value: unknown): value is Theme {
  return typeof value === 'string' && VALID_THEMES.includes(value as Theme);
}

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidTheme(stored) ? stored : 'apple';
  } catch {
    return 'apple';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  const setTheme = useCallback((next: Theme) => {
    if (!isValidTheme(next)) return;
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Silently ignore storage write failures
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value: ThemeContextValue = { theme, setTheme, themes: VALID_THEMES };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
```

### 3. Flash-prevention Script (`index.html`)

A synchronous inline script runs before React hydrates:

```html
<script>
  (function() {
    var STORAGE_KEY = 'weather-theme';
    var VALID = ['apple', 'midnight'];
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch(e) {}
    var theme = VALID.indexOf(stored) !== -1 ? stored : 'apple';
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>
```

This ensures the correct theme CSS variables are active before the first paint.

### 4. ThemeSelector (`src/components/ThemeSelector.tsx`)

```typescript
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../state/ThemeProvider';

const THEME_LABELS: Record<string, string> = {
  apple: 'Apple',
  midnight: 'Midnight',
};

export function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setIsOpen(false);
    if (e.key === 'Enter' && !isOpen) setIsOpen(true);
  }

  function handleSelect(id: string) {
    setTheme(id as any);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select theme"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-primary)] backdrop-blur-xl transition hover:bg-[var(--sidebar-card-selected-bg)]"
      >
        {/* Palette icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
          <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10a2.5 2.5 0 002.5-2.5c0-.61-.23-1.17-.6-1.6-.04-.04-.06-.1-.06-.15a.5.5 0 01.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9.25-10-9.25zm-5.5 10a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3-4a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3 4a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
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
              onClick={() => handleSelect(id)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSelect(id); }}
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
```

### 5. Updated App Structure (`src/App.tsx`)

```typescript
import { StoreProvider } from './state/store';
import { ThemeProvider } from './state/ThemeProvider';
import { Layout } from './components/Layout';

export function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <Layout />
      </StoreProvider>
    </ThemeProvider>
  );
}
```

ThemeProvider wraps StoreProvider so that theme context is available everywhere, but the two contexts are fully independent — ThemeProvider does not read from or write to StoreProvider.

## Interfaces

### ThemeContextValue

```typescript
interface ThemeContextValue {
  theme: 'apple' | 'midnight';
  setTheme: (theme: 'apple' | 'midnight') => void;
  themes: readonly string[];
}
```

### CSS Custom Properties Contract

| Variable | Purpose |
|----------|---------|
| `--body-bg` | Body background (gradient or solid) |
| `--card-bg` | Main content card background |
| `--card-border` | Main content card border |
| `--sidebar-bg` | Sidebar panel background |
| `--sidebar-card-bg` | Sidebar card default background |
| `--sidebar-card-border` | Sidebar card default border |
| `--sidebar-card-selected-bg` | Sidebar card selected background |
| `--sidebar-card-selected-border` | Sidebar card selected border |
| `--text-primary` | Primary readable text |
| `--text-secondary` | Secondary/supporting text |
| `--text-muted` | De-emphasized/hint text |
| `--accent-color` | Interactive accent highlights |

### localStorage API

| Key | Value | Default |
|-----|-------|---------|
| `weather-theme` | `"apple"` \| `"midnight"` | `"apple"` |

## Data Models

No backend data models are affected. Theme state is purely client-side:

```typescript
const VALID_THEMES = ['apple', 'midnight'] as const;
type Theme = (typeof VALID_THEMES)[number];
```

The theme list is a compile-time constant. Adding a future theme requires only:
1. Adding its identifier to `VALID_THEMES`
2. Adding a `:root[data-theme="newtheme"]` rule in `index.css`
3. Updating the blocking script's `VALID` array
4. Adding a label in `THEME_LABELS`

## Error Handling

| Scenario | Handling |
|----------|----------|
| localStorage unavailable (private browsing) | Catch silently; default to "apple"; changes apply for session only |
| Invalid/corrupted value in localStorage | `isValidTheme()` returns false; falls back to "apple" |
| User calls `setTheme` with invalid identifier | Guard clause exits early; no state change |
| DOM manipulation fails (SSR edge case) | `useEffect` only runs client-side; blocking script uses `try/catch` |

## Component Refactoring Strategy

Existing components reference hardcoded Tailwind opacity classes (`text-white/90`, `bg-white/[0.08]`, etc.). These will be refactored to use CSS variable references via Tailwind arbitrary value syntax:

| Current | Refactored |
|---------|-----------|
| `bg-white/[0.08]` (cards) | `bg-[var(--card-bg)]` |
| `border-white/15` (cards) | `border-[var(--card-border)]` |
| `bg-black/20` (sidebar) | `bg-[var(--sidebar-bg)]` |
| `text-white/90` | `text-[var(--text-primary)]` |
| `text-white/70` | `text-[var(--text-secondary)]` |
| `text-white/55`, `text-white/60` | `text-[var(--text-muted)]` |
| `bg-white/[0.07]` (sidebar cards) | `bg-[var(--sidebar-card-bg)]` |
| `border-white/10` (sidebar cards) | `border-[var(--sidebar-card-border)]` |

The body background in `index.css` switches from a hardcoded `background:` declaration to `background: var(--body-bg)`.

Non-color properties (border-radius, backdrop-blur, spacing, font-size) remain unchanged.

## Testing Strategy

- **Unit tests**: Verify specific examples (ThemeProvider mounts with correct default, ThemeSelector opens/closes, keyboard interactions, apple theme variable values, midnight theme variable values).
- **Property tests**: Validate universal behaviors across all valid and invalid theme identifiers using `fast-check` (already in devDependencies).
- **Manual/visual**: Confirm no visual regression in "apple" theme and validate "midnight" aesthetic. WCAG contrast compliance for both themes requires manual verification with assistive tools.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme persistence round-trip

*For any* valid theme identifier, storing it via `setTheme`, then reloading (constructing a new ThemeProvider instance), should result in the active theme equaling the originally stored identifier, and `document.documentElement.dataset.theme` reflecting that same value.

**Validates: Requirements 1.2, 1.4, 1.5, 6.4**

### Property 2: Invalid stored theme defaults to apple

*For any* string value stored in localStorage under the theme key that is NOT a member of the valid themes list, the ThemeProvider should initialize with "apple" as the active theme and set `data-theme="apple"` on the root element.

**Validates: Requirements 1.3, 6.3**

### Property 3: Theme selection applies correct identifier

*For any* theme in the available themes list, when that theme is selected through the ThemeSelector UI, the `setTheme` function should be invoked with exactly that theme's identifier, causing the root element's `data-theme` attribute and localStorage to both reflect the selected identifier.

**Validates: Requirements 5.3, 6.4**
