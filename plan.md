# UI Modernization & Adaptive Design Plan

This document serves as a roadmap and checklist for improving the UI/UX of the Redeemed Transformation Chapel International (RTCI) application.

## 1. Aesthetic & Styling Tweaks (Done ✅)
- [x] **Typography Restraint:** Limit `Cinzel` to H1 and H2 only. Use `Plus Jakarta Sans` for all other headings, body, buttons, and overline text for readability.
- [x] **Soften the Borders:** Remove hard 1px solid/dashed gold and crimson borders. Use soft, diffused drop shadows and subtle background contrasts.
- [x] **Color for Action:** Keep backgrounds clean (Alabaster/Midnight Slate). Use Crimson and Gold exclusively for primary actions, active states, and notifications.
- [x] **Micro-interactions:** Add subtle `framer-motion` scale effects (e.g., `scale: 1.01`) on cards and buttons to make the interface feel alive.

## 2. Adaptive Layouts (To Do ⏳)
Shift from a "one-size-fits-all" responsive layout to device-specific paradigms.

### 📱 Mobile (Phone) - "The On-the-Go Companion"
- [x] **Navigation:** Replace the sidebar/hamburger menu with a fixed **Bottom Navigation Bar** (Dashboard, Directory, Messages, Events, More).
- [x] **Top Bar:** Implement a minimal, scroll-hiding header.
- [x] **Lists to Cards:** Convert data tables to rich, tappable cards.
- [x] **Gestures:** Add swipe actions for list items (e.g., swipe to mark prayer request as read).
- [x] **FAB:** Add a Floating Action Button for primary screen actions.

### 📝 Tablet - "The Kiosk & Hub"
- [x] **Navigation:** Implement a collapsible **Navigation Rail** (icons only, expands on hover/tap) to maximize horizontal space.
- [x] **Split-Pane Layout:** Use Master-Detail views (e.g., list of members on the left 1/3, full profile on the right 2/3).
- [ ] **Modals over Pages:** Use large, centered modals for data entry instead of full-page routing.
- [x] **Dashboard Grid:** Use a 2-column or asymmetrical masonry grid for widgets.

### 💻 Desktop/Laptop - "The Command Center"
- [x] **Navigation:** Keep the persistent left sidebar.
- [x] **Global Command Palette:** Add a `Cmd + K` search bar for global navigation and searching.
- [x] **Data Density:** Use dense data tables with sticky headers and inline editing.
- [x] **Slide-out Panels:** Use right-side slide-out panels for editing records without losing context of the main table.
- [x] **Multi-column Dashboards:** Utilize 3-4 column layouts for comprehensive "Heads Up Displays."

## 3. Technical Implementation
- [x] **Component Refactoring:** Create specific wrapper components (`MobileLayout`, `TabletLayout`, `DesktopLayout`) managed by a layout coordinator using `useMediaQuery`.
