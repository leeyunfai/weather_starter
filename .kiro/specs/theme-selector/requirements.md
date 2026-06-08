# Requirements Document

## Introduction

The Theme Selector feature adds a floating theme picker to the weather application, enabling users to switch between two visual themes: "apple" (the current default appearance) and "midnight" (a dark neon aesthetic with cyan/magenta accents). Theming is implemented via CSS custom properties toggled by a `data-theme` attribute on the root HTML element. The user's selection persists in localStorage across sessions. All existing functionality (data fetching, map, refresh, state management) remains unchanged.

## Glossary

- **Theme_Selector**: The floating UI control (button + dropdown) that allows users to choose a theme
- **Theme_Provider**: The React Context provider that manages the active theme state and exposes theme-switching functions to the component tree
- **Root_Element**: The `<html>` element on which the `data-theme` attribute is set to control active theme
- **Apple_Theme**: The default theme that preserves the current application appearance exactly (blue-grey gradients, white/opacity text, frosted glass cards)
- **Midnight_Theme**: An alternate theme featuring a deep black canvas with cyan and magenta neon accents
- **Theme_Persistence**: The mechanism that reads and writes the selected theme identifier to localStorage
- **CSS_Custom_Properties**: CSS variables (custom properties) declared on the Root_Element that define theme-varying color values

## Requirements

### Requirement 1: Theme Context and State Management

**User Story:** As a developer, I want a centralized theme state via React Context, so that any component can read the current theme and trigger theme changes.

#### Acceptance Criteria

1. THE Theme_Provider SHALL expose the current theme identifier and a function to set the theme to consuming components via React Context
2. WHEN the Theme_Provider mounts, THE Theme_Provider SHALL read the stored theme identifier from localStorage and apply that theme as the initial active theme
3. IF no stored theme identifier exists in localStorage, THEN THE Theme_Provider SHALL default to the Apple_Theme
4. WHEN the theme is changed via the set-theme function, THE Theme_Provider SHALL set the `data-theme` attribute on the Root_Element to the new theme identifier
5. WHEN the theme is changed via the set-theme function, THE Theme_Provider SHALL persist the new theme identifier to localStorage under a consistent key

### Requirement 2: CSS Custom Properties Architecture

**User Story:** As a developer, I want theme-varying colors expressed as CSS custom properties, so that switching themes requires only toggling a single attribute with no component re-renders for style changes.

#### Acceptance Criteria

1. THE Root_Element SHALL define CSS_Custom_Properties for all color values that differ between the Apple_Theme and the Midnight_Theme
2. WHEN the `data-theme` attribute on the Root_Element is set to "apple", THE Root_Element SHALL assign CSS_Custom_Properties values that reproduce the current application appearance with no visual differences
3. WHEN the `data-theme` attribute on the Root_Element is set to "midnight", THE Root_Element SHALL assign CSS_Custom_Properties values that implement a deep black canvas with cyan and magenta neon accents
4. THE CSS_Custom_Properties SHALL cover body background gradients, card background colors, card border colors, text colors at each opacity level, and shadow colors
5. THE CSS_Custom_Properties SHALL NOT include spacing, layout dimensions, border-radius values, or backdrop-blur amounts

### Requirement 3: Apple Theme Visual Fidelity

**User Story:** As a user, I want the default "apple" theme to look identical to the current app, so that the theming system introduces no visual regression.

#### Acceptance Criteria

1. WHEN the Apple_Theme is active, THE Root_Element SHALL produce a body background matching the existing multi-layer radial and linear gradient (blue-grey palette)
2. WHEN the Apple_Theme is active, THE Root_Element SHALL produce card backgrounds using `white` at 7-8% opacity with `white` borders at 10-15% opacity
3. WHEN the Apple_Theme is active, THE Root_Element SHALL produce primary text in white at 90% opacity, secondary text in white at 70% opacity, and muted text in white at 55% opacity
4. WHEN the Apple_Theme is active, THE Root_Element SHALL produce sidebar background using black at 20% opacity

### Requirement 4: Midnight Theme Visual Identity

**User Story:** As a user, I want a "midnight" theme with a dramatic neon aesthetic, so that I can personalize the app appearance.

#### Acceptance Criteria

1. WHEN the Midnight_Theme is active, THE Root_Element SHALL produce a body background using deep black tones (near #0a0a0f)
2. WHEN the Midnight_Theme is active, THE Root_Element SHALL produce card backgrounds using dark surfaces with subtle cyan or magenta tinted borders
3. WHEN the Midnight_Theme is active, THE Root_Element SHALL produce primary text in a light cyan tone, secondary text in a muted cyan-white, and accent highlights in magenta
4. WHEN the Midnight_Theme is active, THE Root_Element SHALL produce a sidebar background using a near-black surface distinct from the main content area

### Requirement 5: Theme Selector UI Control

**User Story:** As a user, I want a visible button to switch themes, so that I can easily change the app's appearance at any time.

#### Acceptance Criteria

1. THE Theme_Selector SHALL render as a floating button positioned in the top-right corner of the main content area, overlaid on the Hero section
2. WHEN the user activates the Theme_Selector button, THE Theme_Selector SHALL display a dropdown picker listing all available themes by name
3. WHEN the user selects a theme from the dropdown picker, THE Theme_Selector SHALL invoke the set-theme function from the Theme_Provider with the chosen theme identifier
4. WHEN the user selects a theme from the dropdown picker, THE Theme_Selector SHALL close the dropdown
5. WHEN the user clicks outside the open dropdown, THE Theme_Selector SHALL close the dropdown
6. THE Theme_Selector SHALL visually indicate which theme is currently active in the dropdown list
7. THE Theme_Selector SHALL be keyboard accessible, supporting Enter and Escape keys for opening, selecting, and dismissing the dropdown

### Requirement 6: Theme Persistence Across Sessions

**User Story:** As a user, I want my theme choice remembered, so that the app loads in my preferred theme on every visit.

#### Acceptance Criteria

1. WHEN the application loads, THE Theme_Persistence SHALL read the stored theme identifier from localStorage
2. IF the stored theme identifier is valid (matches a known theme), THEN THE Theme_Persistence SHALL apply the stored theme before the first paint completes
3. IF the stored theme identifier is invalid or missing, THEN THE Theme_Persistence SHALL apply the Apple_Theme as the default
4. WHEN the user selects a new theme, THE Theme_Persistence SHALL write the theme identifier to localStorage immediately

### Requirement 7: Non-Regression of Existing Behavior

**User Story:** As a user, I want the theme feature to leave all existing weather data, map, sidebar, and refresh functionality intact, so that theming is purely cosmetic.

#### Acceptance Criteria

1. THE Theme_Provider SHALL NOT modify, wrap, or interfere with the existing StoreProvider or its state management
2. THE Theme_Selector SHALL NOT alter the layout flow, sizing, or scroll behavior of the Hero section or Sidebar
3. WHEN themes are switched, THE Theme_Provider SHALL NOT trigger re-fetching of weather data or re-rendering of the map component beyond CSS repaints
