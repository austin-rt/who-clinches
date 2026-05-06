# Styling Patterns

Styling approach, theming, and utility patterns.

**Related Documentation:**

- [Frontend Index](./index.md) - Frontend documentation overview
- [Components](./components.md) - Component patterns that use these styles

---

## DaisyUI Components

**TODO**: Document DaisyUI component usage once finalized. Include specific components used (navbar, btn, card, swap, collapse) and any custom overrides.

---

## Custom Button System

- Built on DaisyUI base classes with global `.btn` override in `app/globals.css` that strips DaisyUI's default color behavior
- Color variants defined in `app/styles/buttons.css`: `btn-primary`, `btn-accent`, `btn-error`
- Stroke variant: `.btn.btn-stroke` with color sub-variants (`.btn-stroke.btn-primary`, `.btn-stroke.btn-error`)
- Flat variant: `.btn.btn-flat`
- Components: `Button` (solid), `Button.Stroked` (outlined), `Button.Flat` (text-only) in `app/components/Button.tsx`

---

## Custom Colors

Custom CSS properties defined in `app/globals.css` and mapped in `tailwind.config.mjs`:

| Tailwind Class        | CSS Variable             | Description                                |
| --------------------- | ------------------------ | ------------------------------------------ |
| `text-text-secondary` | `--color-text-secondary` | 60% opacity base-content via `color-mix()` |
| `border-stroke`       | `--color-stroke`         | Card/divider borders                       |
| `border-stroke-alt`   | `--color-stroke-alt`     | Alternate border color                     |
| `bg-base-400`         | `--color-base-400`       | Extended base shade                        |

---

## Tailwind Utilities

**TODO**: Document Tailwind utility patterns once finalized. Include common layout patterns, color usage, and responsive breakpoint strategies.

---

**Last Updated**: May 2026
