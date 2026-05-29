# V3 Redesign: "The Obsidian Vanguard" 🌌

We are abandoning "standard" UI elements. If it looks like a typical website, we failed. The new objective is a **High-End Command Center** aesthetic: OLED blacks, glowing mesh gradients, ultra-thin hairlines, and floating 3D-depth layers.

## Core Directives (No Exceptions)
1. **OLED Depth:** Use `#050505` (Deepest Black) as the foundation. No more light grays.
2. **Glassmorphism Hairlines:** Borders must be `0.5px` or `1px` with ultra-low opacity (`white/10`).
3. **Mesh Gradients:** Every major surface must have a subtle, animated background glow (Crimson/Gold orbs).
4. **Detached Layout (HUD):** Navigation and content areas are detached "plates" floating in space. No edge-to-edge containers.
5. **Precision Typography:** Use `Cinzel` strictly for large, tracked-out display text. Use `Plus Jakarta Sans` for high-density data, with very wide letter spacing on buttons and tags.
6. **Hardware Micro-Aesthetics:** Components should look like machined aluminum and glass.

## Execution Roadmap

- [x] **Phase 1: The Obsidian Core (Theme)**
  - Overhaul `theme.tsx` for a "Dark Mode Native" experience. High-contrast blacks, glowing accents, and fluid motion.
- [x] **Phase 2: The Floating HUD (Layout)**
  - Rebuild `DesktopLayout` and `MobileLayout` as detached, floating glass elements.
  - Implement a "Glass Rail" navigation.
- [x] **Phase 3: The Command Center (Dashboard)**
  - Radical redesign using an "Orbital" or "Masonry Glass" grid.
  - Add blurred glow effects behind primary widgets.
- [x] **Phase 4: Visual Polish**
  - Add a "Grain/Noise" overlay to the entire app for a tactile, physical texture feel.
  - Implement complex Framer Motion transitions (staggered entrance, scale-up).
