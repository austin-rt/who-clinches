# Pre-Commit Testing Setup

**Status:** ✅ Configured | **Hook Location:** `.husky/pre-commit`

---

## What It Does

The pre-commit hook automatically runs your entire test suite before allowing commits:

- ✅ **No broken commits** - Tests must pass before code is committed
- ✅ **Code quality** - ESLint + TypeScript + Tests all run
- ✅ **Quick feedback** - Find issues before pushing
- ✅ **Team protection** - Prevents untested code from entering the repository

---

## Pre-Commit Workflow

When you run `git commit`, the hook executes:

1. **Branch Protection** - Prevents accidental commits to main
2. **ESLint Disable Check** - Blocks file-level eslint-disable comments
3. **Linting + TypeScript** - Format code, run ESLint, type check
4. **Run All Tests** - Database check & seeding + 240 unit + API tests

**If ANY step fails:** Commit is blocked with clear error messages

---

## Hook Configuration

**Location:** `.husky/pre-commit`

**Test Command:** `npm run test:all`

**What This Runs:**
1. Database seeding check (`npm run db:check`)
2. 240 passing tests (`npm run test`)
3. ~67 second execution time

**If Tests Fail:**
```
ERROR: Tests failed. Commit blocked.
Fix test failures and try again.
Run 'npm run test:all' locally to debug.
```

---

## How to Use

### Normal Commit Flow

```bash
git add .
git commit -m "feat: add new feature"
# Hook runs automatically - if all pass, commit succeeds
```

### If Tests Fail

```bash
# Debug locally:
npm run test:all

# Fix the code
# Try commit again
git commit -m "feat: add feature with tests passing"
```

### Bypass (Not Recommended!)

```bash
# Only for emergencies
git commit --no-verify -m "message"
```

---

## Test Suite Details

**Test Coverage:**

| Category          | Tests | Status    |
| ----------------- | ----- | --------- |
| API Integration   | 60    | Must pass |
| Reshape Functions | 54    | Must pass |
| Tiebreaker Logic  | 62    | Must pass |
| Score Prediction  | 59    | Must pass |
| Constants         | 38    | Must pass |
| Types             | 34    | Must pass |
| **Total**         | **240** | **ALL REQUIRED** |

**Execution Time:**
- Database check: ~5 seconds
- Running tests: ~62 seconds
- Total: ~67 seconds

---

## Troubleshooting

**"Tests failed. Commit blocked."**
- Run `npm run test:all` locally to see failures
- Fix the code, try committing again

**"npm command not found"**
- Run `npm install`

**"Database connection failed"**
- Ensure dev server is running: `npm run dev`

**"Hook is not running at all"**
- Reinstall hooks: `npx husky install`

**"Slow commit (67 seconds)"**
- This is normal - test suite ensures quality
- Run tests early while developing: `npm run test:watch`

---

## Workflow Recommendations

**Best Practice: Test as You Develop**

```bash
# Terminal 1: Development server
npm run dev

# Terminal 2: Watch tests
npm run test:watch

# As you code, tests run automatically
# When you commit, tests are already passing
```

**Quick Test Before Commit:**

```bash
git add .
npm run test:all  # Quick check
git commit -m "message"  # Should pass quickly
```

---

## Quick Reference

| Task                         | Command                    |
| ---------------------------- | -------------------------- |
| Make a commit                | `git commit -m "message"`  |
| See tests before commit      | `npm run test:all`         |
| Watch tests while developing | `npm run test:watch`       |
| Reinstall hook               | `npx husky install`        |

---

**Status:** Ready for use | **Tests Protected:** ✅ 240/240 | **Commit Quality:** ✅ Enforced
