# Phase 1: Basic Layout & Navigation

**Scope:** Create root layout shell with header, navigation, and footer using DaisyUI components

**Dependencies:** Phase 0 (DaisyUI installed, themes configured)

**Files to Create/Modify:**
- `app/components/Header.tsx` (new)
- `app/components/Navigation.tsx` (new)
- `app/components/Footer.tsx` (new)
- `app/layout.tsx` (update to use Header/Footer)

**Component Definitions:**
```typescript
// app/components/Header.tsx
// Uses DaisyUI navbar component
// Props: none
// Displays: app title, theme selector placeholder

// app/components/Navigation.tsx
// Uses DaisyUI menu component
// Props: none (single page app for now)
// Displays: placeholder for future navigation

// app/components/Footer.tsx
// Uses DaisyUI footer component
// Props: none
// Displays: copyright, season info
```

**Implementation Checklist:**
- [ ] Create Header with DaisyUI navbar
- [ ] Create Navigation component (placeholder for future)
- [ ] Create Footer with DaisyUI footer
- [ ] Update `app/layout.tsx` to wrap children
- [ ] Apply semantic DaisyUI colors (not hardcoded)
- [ ] Add responsive classes
- [ ] Ensure theme colors apply via `data-theme`

**Manual Testing:**
1. Run `npm run dev`
2. Verify Header at top, Footer at bottom
3. Switch theme - colors should update
4. Test responsive layout
5. Verify no console errors

