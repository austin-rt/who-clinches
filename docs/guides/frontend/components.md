# Component Patterns

Reusable component patterns and systems used throughout the application.

**Related Documentation:**
- [Frontend Index](./index.md) - Frontend documentation overview
- [Styling](./styling.md) - Styling patterns for components

---

## Button Component System

**Button Variants:**
- `Button` - Solid button with background color
- `Button.Stroked` - Outlined button with border, transparent background
- `Button.Flat` - Flat button with no border or background

**Usage:**
```typescript
import { Button } from '@/app/components/Button';

<Button color="primary" onClick={handleClick}>Click me</Button>
<Button.Stroked color="accent" onClick={handleClick}>Outlined</Button.Stroked>
<Button.Flat color="primary" onClick={handleClick}>Flat</Button.Flat>
```

**Color Options:**
- `primary` - Primary conference color (e.g., #002d74 - SEC Blue)
- `secondary` - Secondary conference color (e.g., #004a9e - Lighter SEC Blue)
- `accent` - Accent color (e.g., #ffd040 - SEC Gold)
- `neutral` - Neutral gray

**Button Styles:**

**TODO**: Document button styles implementation once finalized. Include CSS file location, DaisyUI integration, dark mode variants, and hover states.

---

## Theme-Aware Components

- Use DaisyUI semantic colors (`text-primary`, `bg-base-200`)
- Theme applied via `data-theme` attribute
- CSS variables for theme colors
- Color scheme: Primary, Secondary, and Accent colors are configurable per conference

---

## Conditional Rendering Based on View Mode

```typescript
const isEditable = view === 'scores' && !game.completed;
if (isEditable) {
  return <input type="text" value={score} onChange={...} />;
}
return <span>{score}</span>;
```

---

## Score Calculation Pattern

- Completed games: Use actual scores
- Incomplete games: Calculate to ensure picked team wins
- Uses `predictedScore` as base, adjusts to favor picked team

---

**Last Updated**: November 2025

