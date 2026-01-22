# Pre-Commit Testing Setup

**Status:** ✅ Configured | **Hook Location:** `.husky/pre-commit`

---

## What It Does

Pre-commit hook runs test suite before allowing commits. Executes: Branch protection, ESLint disable check, linting + TypeScript, tests. Commit blocked if any step fails.

---

## Hook Configuration

**Location:** `.husky/pre-commit`

**Test Command:** `npm run test:all`

**What This Runs**: All tests via `npm run test:all` (which runs `npm run test`)

**If Tests Fail**: `ERROR: Tests failed. Commit blocked. Fix test failures and try again. Run 'npm run test:all' locally to debug.`

---

## How to Use

**Normal Commit**: `git commit -m "message"` (hook runs automatically)

**If Tests Fail**: Run `npm run test:all` locally, fix code, try commit again

**Bypass** (Not Recommended): `git commit --no-verify` (emergencies only)

---

## Troubleshooting

**"Tests failed. Commit blocked."**: Run `npm run test:all` locally, fix code, try again

**"Hook is not running at all"**: Reinstall hooks (`npx husky install`)

## Quick Reference

| Task | Command |
|------|---------|
| Make a commit | `git commit -m "message"` |
| See tests before commit | `npm run test:all` |
| Watch tests while developing | `npm run test:watch` |
| Reinstall hook | `npx husky install` |

**Status**: Ready for use | **Tests Protected**: ✅ 240/240 | **Commit Quality**: ✅ Enforced
