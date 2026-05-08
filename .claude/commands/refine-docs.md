# refine-docs

## Philosophy

Less is more. Every line of documentation is a maintenance liability. If code can tell you, the doc shouldn't.

## Scope

Two doc files exist. That's the target state — not a starting point for expansion:

- `docs/ai-guide.md` — non-derivable project context (~70 lines)
- `docs/guides/external-analytics-by-conference.md` — CFBD data gaps (~50 lines)

Read-only: `docs/tiebreaker-rules/` (NEVER edit).

## Process

### 1. Value audit each line

For every claim in `ai-guide.md`, ask: **"Would an AI agent figure this out by reading the code?"**

- **Yes** → Remove it. File paths, type shapes, component trees, API signatures — all derivable.
- **No** → Keep it. Behavioral rules, external constraints, gotchas invisible from code.

### 2. Check for drift

Verify remaining claims against actual code. Stale docs are worse than no docs — they cause false confidence.

### 3. Keep it tight

- `ai-guide.md` should stay under 80 lines
- `external-analytics-by-conference.md` should stay under 60 lines
- If a file grows past these limits, something derivable crept in — trim it

### 4. Never expand

Do not create new doc files. Do not add implementation details "for convenience." The cost of maintaining accurate docs exceeds the token savings of frontloading them for a project this size.

## Quality check

After refinement, run `node scripts/audit-docs.js` to confirm structural health.
