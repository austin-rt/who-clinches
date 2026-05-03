# Git hooks and checks

**Hooks:** `.husky/pre-commit`, `.husky/pre-push`

---

## Pre-commit (every commit)

Runs:

- Branch guards (no direct commits to `main`, block stray `temp/` files except `temp/README.md`)
- Block file-level `eslint-disable` without a rule name
- **lint-staged** (`package.json`): Prettier + ESLint (`--max-warnings 0`) + `jest --findRelatedTests` on **staged** `*.{ts,tsx,js,jsx}` only

Commits do **not** run full-project `eslint`, full `tsc`, or the full Jest suite.

---

## Pre-push (every push)

Runs:

- `npx tsc --noEmit` (full project)
- `npm run test:all` (full Jest suite)

Push is blocked if either fails.

---

## How to use

**Commit:** `git commit -m "message"` — hooks run automatically.

**Push:** `git push` — full typecheck and tests run automatically.

**Bypass** (emergencies only): `git commit --no-verify` or `git push --no-verify` — not recommended; skips protections.

---

## Troubleshooting

**Pre-commit fails:** Fix lint/format/Jest related-test output from lint-staged, then commit again.

**Pre-push fails:** Run `npx tsc --noEmit` and `npm run test:all` locally, fix issues, push again.

**Hook not running:** `npm run prepare` or `npx husky`

## Quick reference

| Task           | Command              |
| -------------- | -------------------- |
| Commit         | `git commit -m "…"`  |
| Full typecheck | `npx tsc --noEmit`   |
| Full tests     | `npm run test:all`   |
| Watch tests    | `npm run test:watch` |
