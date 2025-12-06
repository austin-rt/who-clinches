# Pre-Commit Testing Setup

**Status:** ✅ Configured | **Hook Location:** `.husky/pre-commit`

---

## What It Does

Pre-commit hook automatically runs entire test suite before allowing commits: No broken commits, code quality (ESLint + TypeScript + Tests), quick feedback, team protection

---

## Pre-Commit Workflow

When you run `git commit`, hook executes: Branch Protection (prevents commits to main), ESLint Disable Check (blocks file-level eslint-disable), Linting + TypeScript (format, ESLint, type check), Run All Tests. If ANY step fails: Commit blocked with clear error messages

---

## Hook Configuration

**Location:** `.husky/pre-commit`

**Test Command:** `npm run test:all`

**What This Runs**: All tests via `npm run test:all` (which runs `npm run test`)

**If Tests Fail**: `ERROR: Tests failed. Commit blocked. Fix test failures and try again. Run 'npm run test:all' locally to debug.`

---

## How to Use

**Normal Commit**: `git add . && git commit -m "feat: add new feature"` (hook runs automatically)

**If Tests Fail**: Debug with `npm run test:all`, fix code, try commit again

**Bypass** (Not Recommended): `git commit --no-verify -m "message"` (emergencies only)

---

## Test Suite Details

**Test Coverage**: All tests must pass. Test suite includes API integration, reshape functions, tiebreaker logic, and other core functionality.

**Execution Time**: Varies based on test suite size

---

## Troubleshooting

**"Tests failed. Commit blocked."**: Run `npm run test:all` locally, fix code, try again

**"npm command not found"**: Run `npm install`

**"Tests failed"**: Run `npm run test:all` locally to see detailed error messages

**"Hook is not running at all"**: Reinstall hooks (`npx husky install`)

**"Slow commit"**: Normal - test suite ensures quality, run `npm run test:watch` while developing

---

## Workflow Recommendations

**Best Practice**: Test as you develop - Terminal 1: `npm run dev`, Terminal 2: `npm run test:watch` (tests run automatically, commit when passing)

**Quick Test Before Commit**: `git add . && npm run test:all && git commit -m "message"`

## Quick Reference

| Task | Command |
|------|---------|
| Make a commit | `git commit -m "message"` |
| See tests before commit | `npm run test:all` |
| Watch tests while developing | `npm run test:watch` |
| Reinstall hook | `npx husky install` |

**Status**: Ready for use | **Tests Protected**: ✅ 240/240 | **Commit Quality**: ✅ Enforced
