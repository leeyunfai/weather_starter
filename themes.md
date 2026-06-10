# Weather Starter — Theme Catalog

## Implemented Themes

These themes are live in the app and available in the theme selector.

### 1. Apple (default)

**Description:** Frosted-glass aesthetic over a steel-blue gradient — the original Weather Starter look.

- **Color:** Slate-blue multi-layer gradient background, white/alpha overlays
- **Typography:** System sans-serif, light weight for numbers
- **Cards:** Translucent `bg-white/8` with backdrop blur, thin white/15 borders
- **Layout density:** Comfortable (16px padding, 12px gaps)
- **Text:** White at varying opacities (90%, 70%, 55%)

### 2. Midnight Neon

**Description:** Deep black canvas with electric cyan and magenta accent colors that glow.

- **Color:** Near-black (#0a0a0f) base with subtle cyan radial highlight
- **Typography:** Same system sans, light cyan text
- **Cards:** `bg-white/4` with cyan-tinted borders (cyan-400/20)
- **Layout density:** Same as Apple (spacing unchanged)
- **Text:** Cyan-50 primary, cyan-100/80 secondary, cyan-200/60 muted

### 3. Warm Sunrise

**Description:** Soft oranges and warm yellows evoking a tropical morning.

- **Color:** Peach-to-coral gradient (#ffdab3 → #ff8a65 → #e67350)
- **Typography:** Same system sans, dark brown text for contrast on light background
- **Cards:** Semi-transparent white (85% opacity) with warm terracotta-tinted borders
- **Layout density:** Same spacing
- **Text:** Dark brown/orange tones (rgba 60,30,10 primary)
- **Design note:** Light theme — requires dark text for readability

### 4. Arctic Minimalist

**Description:** Stark white with ice-blue accents for a clean, clinical look.

- **Color:** White/ice-blue gradient (#f0f7ff → #fafcff), solid white cards
- **Typography:** Same system sans, dark slate text
- **Cards:** Solid white (#ffffff) with subtle blue-tinted borders (180,210,240/50%)
- **Layout density:** Same spacing
- **Text:** Near-black slate tones (15,23,42/90% primary)
- **Design note:** Fully opaque cards — no transparency/blur effects needed

### 5. Forest Depth

**Description:** Rich greens and earthy tones inspired by dense woodland.

- **Color:** Dark green gradient (#1a2e1a → #0f200f)
- **Typography:** Same system sans, cream-green text
- **Cards:** Emerald-tinted translucent surfaces (emerald-400/6%) with green borders
- **Layout density:** Same spacing
- **Text:** Cream-green palette (ecfdf5/90% primary, d1fae5/70% secondary)
- **Design note:** Dark theme with green-only accent palette

### 6. Retro Terminal

**Description:** Monochrome green-on-black hacker terminal aesthetic.

- **Color:** Pure black (#000000) background, no gradients
- **Typography:** Same system sans (could swap to monospace for full effect)
- **Cards:** Near-black with phosphor green borders (#33ff33/30%)
- **Layout density:** Same spacing
- **Text:** Single color (#33ff33) at varying opacities (100%, 70%, 45%)
- **Design note:** Monochrome — accent, text, and borders all use the same green

### 7. Pastel Cloud

**Description:** Soft pastels with a playful, friendly feel.

- **Color:** Lavender-to-pink gradient (#f0e6ff → #e8f4fd → #fce4ec → #f3e5f5)
- **Typography:** Same system sans, dark purple text
- **Cards:** Semi-transparent white (75%) with soft purple-tinted borders
- **Layout density:** Same spacing
- **Text:** Dark purple tones (45,25,70/90% primary)
- **Design note:** Light theme with multi-color gradient background

---

## Unimplemented Theme Concepts

These were proposed but not yet built. Ready to implement following the same pattern.

### 8. Ocean Gradient

**Description:** Deep navy fading to teal with wave-like fluidity.

- **Color:** Navy (#0f172a) to teal (#0d9488) gradient, white text
- **Cards:** `bg-teal-900/30` with gradient border (navy→teal), 12px radius
- **Text:** White at standard opacities

### 9. Sand & Stone

**Description:** Desert-inspired neutrals with terracotta accents.

- **Color:** Warm beige (#f5f0e8) background, terracotta (#c2703c) accents, dark brown text
- **Cards:** Off-white with warm shadow, terracotta left-border accent
- **Text:** Dark brown tones

### 10. Brutalist Mono

**Description:** Raw, unpolished aesthetic with bold type and harsh contrast.

- **Color:** Pure white background, pure black elements, red (#ff0000) for alerts
- **Cards:** Thick 3px black border, no radius, no shadow, uppercase titles
- **Text:** Pure black

### 11. Sunset Boulevard

**Description:** Dramatic purple-to-orange gradient mimicking a Los Angeles sunset.

- **Color:** Deep purple (#2d1b69) to burnt orange (#f97316) gradient, white text
- **Cards:** `bg-white/10` with warm-tinted blur, 1px white/10 border
- **Text:** White at standard opacities

### 12. Neumorphic Light

**Description:** Soft extruded surfaces with subtle depth illusion on light gray.

- **Color:** Light gray (#e8ecf0) flat background, same-toned surfaces, dark text
- **Cards:** Same background color with dual shadow (highlight + depth)
- **Design note:** Requires box-shadow CSS variable — may need extending the variable contract

### 13. Tokyo Night

**Description:** Dark indigo inspired by IDE color schemes and city nightlife.

- **Color:** Deep indigo (#1a1b26) base, soft purple (#bb9af7) and sky (#7dcfff) accents
- **Cards:** `bg-indigo-900/50` with indigo/30 border
- **Text:** Light lavender/sky tones

### 14. Paper & Ink

**Description:** Minimal editorial design like a newspaper weather section.

- **Color:** Cream/paper (#faf8f5) background, black ink text, red for alerts
- **Cards:** No background, thin bottom-border separators only
- **Design note:** Minimal card styling — may look sparse without background fills

### 15. Cyberpunk HUD

**Description:** Futuristic heads-up display with angular geometry and data overlays.

- **Color:** Dark gray (#111116) base, electric yellow (#facc15) and hot pink (#ec4899) accents
- **Cards:** Angled clip-path corners, 1px yellow/pink border, scanline texture overlay
- **Design note:** Requires clip-path CSS — not achievable with current variable contract alone

---

## Design Considerations

### What Changes Between Themes

Only **color-related properties** are theme-variable:

- Body background (gradient or solid)
- Card backgrounds and borders
- Sidebar background
- Text colors at each opacity level
- Accent color

### What Stays Fixed

These are **not theme-variable** and remain hardcoded in Tailwind classes:

- Border radius (`rounded-2xl`, `rounded-xl`, etc.)
- Backdrop blur amounts (`backdrop-blur-xl`)
- Spacing and padding (16px, 12px gaps)
- Font family and font sizes
- Layout structure and density
- Animation timings

### Implementation Pattern

Each theme is a `:root[data-theme="name"]` CSS rule set defining 12 custom properties. Components consume them via Tailwind arbitrary values like `bg-[var(--card-bg)]`. This means:

- No component re-renders on theme switch (pure CSS repaint)
- No JS logic per theme — it's all declarative CSS
- Adding a theme is 4 file touches (see [docs/theming.md](docs/theming.md))

### Light vs Dark Theme Considerations

- Light themes (Sunrise, Arctic, Pastel) use dark text and opaque/semi-opaque white cards
- Dark themes (Apple, Midnight, Forest, Terminal) use light text and translucent cards
- The `backdrop-blur-xl` effect works best on dark translucent themes; on opaque light themes it's effectively invisible (harmless but unused)
