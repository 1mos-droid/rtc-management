# V2 Redesign: "Editorial Luxury" 🏛️

The objective is to move away from standard, blocky administrative interfaces ("school project" feel) to an Awwwards-tier, premium digital experience. For a ministry/church context, the aesthetic will be **Editorial Luxury**: warm creams, deep espresso tones, massive typography, fluid motion, and floating "glass" components.

## Core Directives
1. **Macro-Whitespace:** Double all standard padding. Sections must breathe (`py-24` equivalent).
2. **Double-Bezel Architecture:** Components never sit flat. They use nested enclosures (a faint outer shell with a slightly separated inner core) to look like machined physical objects.
3. **Typography Contrast:** Use `Cinzel` for massive, magazine-style headlines. Use `Plus Jakarta Sans` for microscopic, high-legibility UI elements and data.
4. **Fluid Motion:** No linear animations. Everything uses physical, spring-like cubic-bezier transitions (`cubic-bezier(0.32, 0.72, 0, 1)`).
5. **Color Palette:**
   - Backgrounds: Warm Alabaster (`#FDFBF7`) / Deep Obsidian (`#0A0A0B`).
   - Accents: Cardinal Crimson (`#8B1E31`), Pale Gold (`#D4AF37`).
   - Text: Espresso (`#2C2421`) / Soft Pearl (`#F2F0EB`).

## Execution Roadmap

- [x] **Phase 1: Theme & Foundations**
  - Overhaul `theme.tsx` with premium tokens, heavy border radii (`32px` for cards), bespoke shadows, and fluid transitions.
- [x] **Phase 2: Navigation & Shell**
  - Replace the generic app bars with "Floating Glass Pills" for Desktop and Tablet.
  - Redesign Mobile Navigation into a tactile, floating bottom dock.
- [x] **Phase 3: The Dashboard (The Showpiece)**
  - Rebuild `Dashboard.tsx` using the "Asymmetrical Bento" and "Z-Axis Cascade" layout archetypes.
  - Implement the "Button-in-Button" trailing icon architecture for CTAs.
  - Add staggered scroll-reveal animations.
- [x] **Phase 4: Data Views (Members & Financials)**
  - Apply the double-bezel design to all cards.
  - Redesign modals to slide in elegantly or expand from the triggering element.
