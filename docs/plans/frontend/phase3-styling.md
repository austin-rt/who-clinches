# Phase 3: Button Styling Implementation

CSS variables approach for dynamic team colors in override controls.

**Related:** [Phase 3 Main Guide](./phase3.md)

---

## CSS Variables Approach

Uses CSS variables injected per-button combined with DaisyUI classes.

```css
/* app/globals.css */
.btn.selected {
  background-color: var(--team-color, var(--color-primary));
  border-color: var(--team-color, var(--color-primary));
  color: #ffffff;
  font-weight: 600;
}

.btn.unselected {
  background-color: transparent;
  border-color: var(--team-color, var(--color-primary));
  border-width: 2px;
  color: var(--team-color, var(--color-primary));
  font-weight: 500;
}
```

---

## React Implementation

```typescript
<button
  className={`btn ${selectedWinner === 'home' ? 'selected' : 'unselected'}`}
  style={{ '--team-color': `#${game.home.color}` } as React.CSSProperties}
  onClick={() => handleWinnerClick('home')}
>
  {game.home.abbrev}
</button>
```

---

## Color Format Notes

- ESPN API provides colors as hex WITHOUT `#` prefix (e.g., `"ba0c2f"`)
- Always add `#` when applying to CSS: `--team-color: #${team.color}`
- Fallback to DaisyUI's `--color-primary` if color unavailable

---

## Benefits

- No CSS class generation required
- Colors come directly from API (ESPN data)
- Scales to unlimited teams/conferences
- DaisyUI compatible
- Respects user's selected theme (primary color fallback)

