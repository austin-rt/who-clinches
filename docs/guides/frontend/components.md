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
- `error` - Destructive actions (bg-red-700, defined in `app/styles/buttons.css`)

**Button Styles:**

Defined in `app/styles/buttons.css`. Global `.btn` override in `app/globals.css` strips DaisyUI's default color behavior — custom color classes must be explicitly defined in buttons.css for each variant.

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

## IconButton Component

Reusable icon button supporting both link (`<a>`) and action (`<button>`) variants.

```typescript
import IconButton from '@/app/components/IconButton';

// Link variant
<IconButton href="https://..." title="Share on X" showLabel={false}>
  <FaXTwitter size={20} />
</IconButton>

// Action variant
<IconButton onClick={handleCopy} title="Copy URL" showLabel={false}>
  <IoCopyOutline size={20} />
</IconButton>
```

**Props:**

- `title` (string, required) — Used for label text, `aria-label`, and hover tooltip
- `showLabel` (boolean, default `true`) — Renders label below icon when true
- `href` (string) — Renders as `<a>` with `target="_blank"`
- `onClick` (function) — Renders as `<button>`

**Styling:** `h-10 w-10 rounded-full` with `hover:bg-base-400` background circle. Uses `text-base-content` for automatic dark/light adaptation.

---

## Share Flow Components

**ShareButton** (`app/components/ShareButton.tsx`): Pre-fetches share URL via `useEffect` immediately after simulation completes. Renders inline share actions (copy URL, social share icons) without a modal. Props: `simulateResponse`, `games`.

**Share URL Pre-fetch Pattern:** ShareButton fires the POST to `/api/share/[sport]/[conf]` in a `useEffect` when `simulateResponse` changes. Uses `fetchedHashRef` to prevent duplicate calls and `AbortController` for cleanup.

---

## Shared Components (Main App + Results Page)

These components are used by both the conference page and the shareable results page:

- **ChampionshipMatchup** — Championship game participants display
- **StandingsExplanations** — Two-column layout on `sm+`, with extracted `StandingRow` component (24px logos, compact explanation text)
- **TiebreakerGraphVertical** — Vertical React Flow tiebreaker decision tree (mobile, `lg:hidden`)
- **TiebreakerGraphHorizontal** — Horizontal React Flow tiebreaker decision tree (desktop, `hidden lg:block`)

Custom flow node components in `app/components/flow-nodes/`: `RootNode`, `RuleNode`, `ResultNode`, `TeamEdge` (with horizontal variants `RootNodeH`, `RuleNodeH`, `ResultNodeH`).

---

## LinkButton Component System

**LinkButton Variants** (`app/components/LinkButton/`):

- `LinkButton` — Solid link-styled button with background color
- `LinkButton.Stroked` — Outlined link button with border, transparent background
- `LinkButton.Flat` — Flat link button with no border or background

Follows the same variant pattern as `Button`. Renders as `<a>` elements for navigation.

---

**Last Updated**: May 2026
