# Pre-Commit Testing Setup

**Status:** ✅ Configured | **Hook Location:** `.husky/pre-commit`

---

## What It Does

Pre-commit hook automatically runs entire test suite before allowing commits: No broken commits, code quality (ESLint + TypeScript + Tests), quick feedback, team protection

---

## Pre-Commit Workflow

When you run `git commit`, hook executes: Branch Protection (prevents commits to main), ESLint Disable Check (blocks file-level eslint-disable), Linting + TypeScript (format, ESLint, type check), Run All Tests (database check + 240 tests). If ANY step fails: Commit blocked with clear error messages

---

## Hook Configuration

**Location:** `.husky/pre-commit`

**Test Command:** `npm run test:all`

**What This Runs**: Database seeding check (`npm run db:check`), 240 passing tests (`npm run test`), ~67 second execution time

**If Tests Fail**: `ERROR: Tests failed. Commit blocked. Fix test failures and try again. Run 'npm run test:all' locally to debug.`

---

## How to Use

**Normal Commit**: `git add . && git commit -m "feat: add new feature"` (hook runs automatically)

**If Tests Fail**: Debug with `npm run test:all`, fix code, try commit again

**Bypass** (Not Recommended): `git commit --no-verify -m "message"` (emergencies only)

---

## Test Suite Details

**Test Coverage**: API Integration (60), Reshape Functions (54), Tiebreaker Logic (62), Score Prediction (59), Constants (38), Types (34) - **Total: 240 (ALL REQUIRED)**

**Execution Time**: Database check (~5s), Running tests (~62s), Total (~67s)

---

## Troubleshooting

**"Tests failed. Commit blocked."**: Run `npm run test:all` locally, fix code, try again

**"npm command not found"**: Run `npm install`

**"Database connection failed"**: Ensure dev server running (`npm run dev`)

**"Hook is not running at all"**: Reinstall hooks (`npx husky install`)

**"Slow commit (67 seconds)"**: Normal - test suite ensures quality, run `npm run test:watch` while developing

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
