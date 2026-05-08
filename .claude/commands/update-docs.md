# update-docs

## Philosophy

Documentation exists only for information that cannot be derived from code. Implementation details (file paths, type shapes, component trees, API signatures) belong in the code itself — AI agents should read source files on-demand rather than relying on frontloaded docs that drift.

**Only document:** behavioral rules, external constraints, environment URLs, known data gaps, non-obvious gotchas.

## Scope

The entire doc surface is two files:

- `docs/ai-guide.md` — project rules, non-obvious behavior, environments, env vars, CI, constraints
- `docs/guides/external-analytics-by-conference.md` — CFBD data gaps vs official tiebreaker requirements

Plus read-only reference material in `docs/tiebreaker-rules/` (NEVER edit).

## Execution

1. **Diff check**: `git log -1 --format="%H" -- docs/` to find last doc commit, then compare against code changes since
2. **Verify ai-guide.md claims** against actual code:
   - Score normalization behavior → check simulation code
   - CFBD key rotation → check `lib/cfb/cfbd-rest-client.ts`
   - Admin 404 in prod → check `middleware.ts`
   - Redux persistence config → check store setup
   - DaisyUI `.btn` override → check `app/globals.css` and `app/styles/buttons.css`
   - Same-origin check → check `middleware.ts`
   - Env vars table → grep for actual usage
   - CI steps → check `.husky/` and `.github/workflows/`
3. **Fix inaccuracies** — update docs to match code, never the reverse
4. **Remove any implementation details** that crept in — file paths, type definitions, component descriptions belong in code
5. **Verify external-analytics doc** still reflects actual CFBD gaps
6. **Run** `node scripts/audit-docs.js` to confirm no broken links or naming issues

## What NOT to add

- File paths or directory structures (use `find` or `ls`)
- Type definitions or interfaces (read `lib/types.ts`)
- API route signatures (read `app/api/*/route.ts`)
- Component descriptions (read the components)
- State management details (read the store)
- Any information derivable by reading source code
