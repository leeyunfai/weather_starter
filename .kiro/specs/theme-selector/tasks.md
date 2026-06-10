# Implementation Plan: Theme Selector

## Overview

Implement a client-side theme system using CSS custom properties, a React Context provider, and a floating theme picker UI. The approach introduces zero component re-renders for style changes — only CSS repaints. Tasks proceed from CSS foundation → persistence script → context provider → UI component → component refactoring → integration.

## Tasks

- [ ] 1. Define CSS custom properties and refactor body background
  - [ ] 1.1 Add theme variable rule sets to `frontend/src/index.css`
    - Add `:root[data-theme="apple"]` rule set with all CSS custom properties (--body-bg, --card-bg, --card-border, --sidebar-bg, --sidebar-card-bg, --sidebar-card-border, --sidebar-card-selected-bg, --sidebar-card-selected-border, --text-primary, --text-secondary, --text-muted, --accent-color)
    - Add `:root[data-theme="midnight"]` rule set with midnight theme values (deep black canvas, cyan/magenta accents)
    - Replace the hardcoded `background:` declaration on `body` with `background: var(--body-bg)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

- [ ] 2. Add flash-prevention script to `frontend/index.html`
  - [ ] 2.1 Add inline blocking script before the app module script
    - Add a synchronous `<script>` in the `<head>` that reads `localStorage.getItem('weather-theme')`, validates against known themes, and sets `document.documentElement.setAttribute('data-theme', theme)` before first paint
    - Default to "apple" if stored value is invalid or missing
    - Wrap localStorage access in try/catch for private browsing compatibility
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 3. Create ThemeProvider context
  - [ ] 3.1 Create `frontend/src/state/ThemeProvider.tsx`
    - Define `VALID_THEMES` constant array and `Theme` type
    - Implement `ThemeProvider` component with `useState` initialized from localStorage
    - Implement `setTheme` callback that validates the theme, updates state, sets `document.documentElement.dataset.theme`, and writes to localStorage
    - Implement `useTheme` hook that reads from ThemeContext with error boundary
    - Export `ThemeProvider` and `useTheme`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]\* 3.2 Write property test for theme persistence round-trip
    - **Property 1: Theme persistence round-trip**
    - **Validates: Requirements 1.2, 1.4, 1.5, 6.4**

  - [ ]\* 3.3 Write property test for invalid stored theme defaults
    - **Property 2: Invalid stored theme defaults to apple**
    - **Validates: Requirements 1.3, 6.3**

- [ ] 4. Create ThemeSelector UI component
  - [ ] 4.1 Create `frontend/src/components/ThemeSelector.tsx`
    - Implement floating button with palette icon using CSS variable-based styling
    - Implement dropdown listbox that appears on click with theme options
    - Add outside-click detection to close dropdown
    - Add keyboard support (Enter to open/select, Escape to close)
    - Add `aria-haspopup`, `aria-expanded`, `aria-selected`, `role="listbox"`, and `role="option"` attributes
    - Visually indicate active theme in the dropdown
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]\* 4.2 Write property test for theme selection
    - **Property 3: Theme selection applies correct identifier**
    - **Validates: Requirements 5.3, 6.4**

- [ ] 5. Integrate ThemeProvider and ThemeSelector into app
  - [ ] 5.1 Update `frontend/src/App.tsx` to wrap with ThemeProvider
    - Import `ThemeProvider` from `./state/ThemeProvider`
    - Wrap `<StoreProvider>` with `<ThemeProvider>` so theme context is available to all children
    - ThemeProvider must be the outermost provider (outside StoreProvider)
    - _Requirements: 1.1, 7.1_

  - [ ] 5.2 Add ThemeSelector to `frontend/src/components/Layout.tsx`
    - Import `ThemeSelector` from `./ThemeSelector`
    - Position ThemeSelector in the top-right of the main content area (floating, overlaid on Hero)
    - Ensure it does not alter layout flow or sizing of existing elements
    - _Requirements: 5.1, 7.2_

- [ ] 6. Checkpoint - Verify theme switching works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Refactor components to use CSS custom properties
  - [ ] 7.1 Refactor `frontend/src/components/Tiles.tsx`
    - In `TileShell`: replace `bg-white/[0.08]` with `bg-[var(--card-bg)]` and `border-white/15` with `border-[var(--card-border)]`
    - _Requirements: 2.1, 3.2_

  - [ ] 7.2 Refactor `frontend/src/components/SidebarCard.tsx`
    - Replace default state: `bg-white/[0.07]` → `bg-[var(--sidebar-card-bg)]`, `border-white/10` → `border-[var(--sidebar-card-border)]`
    - Replace selected state: `bg-white/20` → `bg-[var(--sidebar-card-selected-bg)]`, `border-white/30` → `border-[var(--sidebar-card-selected-border)]`
    - _Requirements: 2.1, 3.2, 4.2_

  - [ ] 7.3 Refactor `frontend/src/components/Sidebar.tsx`
    - Replace `bg-black/20` → `bg-[var(--sidebar-bg)]`
    - Replace card-like backgrounds in empty/loading states with CSS variable equivalents
    - _Requirements: 2.1, 3.4, 4.4_

  - [ ] 7.4 Refactor `frontend/src/components/Hero.tsx`
    - Replace `text-white/85`, `text-white/90` → `text-[var(--text-primary)]`
    - Replace `text-white/70` → `text-[var(--text-secondary)]`
    - Replace `text-white/55`, `text-white/60` → `text-[var(--text-muted)]`
    - Replace card-like button styles (refresh button) with CSS variable equivalents
    - _Requirements: 2.1, 3.3, 4.3_

  - [ ] 7.5 Refactor `frontend/src/components/MapCard.tsx`
    - Replace `bg-white/[0.08]` → `bg-[var(--card-bg)]`, `border-white/15` → `border-[var(--card-border)]`
    - _Requirements: 2.1, 3.2_

  - [ ] 7.6 Refactor `frontend/src/components/AddLocationForm.tsx`
    - Replace card `border-white/15` → `border-[var(--card-border)]`, `bg-white/[0.07]` → `bg-[var(--sidebar-card-bg)]`
    - Replace form container `bg-white/[0.1]` → `bg-[var(--card-bg)]`
    - _Requirements: 2.1, 3.2_

- [ ] 8. Final checkpoint - Build verification and test pass
  - Run `npm run build` in the frontend directory to verify no TypeScript or build errors
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation language is TypeScript (React) as used throughout the existing codebase
- Non-color properties (border-radius, backdrop-blur, spacing, font-size) are intentionally NOT refactored — they remain unchanged per requirement 2.5

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1", "5.2"] },
    { "id": 4, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6"] }
  ]
}
```
