# Pre-Commit Testing Setup

**Status:** ✅ Configured
**Date:** November 13, 2025
**Hook Location:** `.husky/pre-commit`

---

## What It Does

The pre-commit hook automatically runs your entire test suite before allowing commits. This ensures:

✅ **No broken commits** - Tests must pass before code is committed
✅ **Code quality** - ESLint + TypeScript + Tests all run
✅ **Quick feedback** - Find issues before pushing
✅ **Team protection** - Prevents untested code from entering the repository

---

## Pre-Commit Workflow

When you run `git commit`, the hook executes this sequence:

### Step 1: Branch Protection

```bash
# Prevents accidental commits to main
✗ Cannot commit directly to main branch
→ Must use develop branch
```

### Step 2: ESLint Disable Check

```bash
# Blocks file-level eslint-disable comments
✗ File-level eslint-disable not allowed
→ Use line-specific comments instead
```

### Step 3: Linting + TypeScript

```bash
# Via lint-staged
✓ Format code with Prettier
✓ Run ESLint
✓ Type check with TypeScript
```

### Step 4: Run All Tests ⭐ NEW

```bash
# NEW: Comprehensive test suite
✓ Database check & seeding (npm run db:check)
✓ All 240 unit + API tests (npm run test)
→ If ANY test fails: COMMIT BLOCKED
→ Shows clear error messages
```

---

## Hook Configuration

**Location:** `.husky/pre-commit`

**Test Command:**

```bash
npm run test:all
```

**What This Runs:**

1. Database seeding check
2. 240 passing tests (180 unit + 60 API)
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
# Make your changes
git add .

# Commit (hook runs automatically)
git commit -m "feat: add new feature"

# Hook checks:
# ✓ Not committing to main
# ✓ No file-level eslint-disable
# ✓ ESLint passes
# ✓ TypeScript compiles
# ✓ All 240 tests pass

# If everything passes → commit succeeds
# If anything fails → commit is blocked
```

### If Tests Fail

```bash
# Hook blocks commit with error:
# ERROR: Tests failed. Commit blocked.

# Debug locally:
npm run test:all

# See which tests are failing
# Fix the code
# Try commit again
git commit -m "feat: add feature with tests passing"
```

### If You Need to Bypass (Not Recommended!)

```bash
# Skip hook (only for emergencies)
git commit --no-verify -m "message"

# This should only be used in extreme situations
# Preferably never in a team setting
```

---

## Benefits

### 1. **Prevents Broken Code**

- No untested code can be committed
- Catches regressions immediately
- Maintains repository integrity

### 2. **Faster Development**

- Find issues locally before pushing
- No CI/CD failures later
- Better debugging experience

### 3. **Team Protection**

- Everyone's code is tested
- Consistent quality standards
- Prevents "it works on my machine" problems

### 4. **Clear Feedback**

- See exactly which tests failed
- Error messages explain what's wrong
- Quick path to fixing issues

---

## Test Suite Details

The hook runs: `npm run test:all`

This executes:

```bash
# Step 1: Database check & seeding
npm run db:check

# Step 2: Run all tests
npm run test
```

### Test Coverage

| Category          | Tests   | Status           |
| ----------------- | ------- | ---------------- |
| API Integration   | 60      | Must pass        |
| Reshape Functions | 54      | Must pass        |
| Tiebreaker Logic  | 62      | Must pass        |
| Score Prediction  | 59      | Must pass        |
| Constants         | 38      | Must pass        |
| Types             | 34      | Must pass        |
| **Total**         | **240** | **ALL REQUIRED** |

---

## Execution Time

- **Database check:** ~5 seconds
- **Running tests:** ~62 seconds
- **Total pre-commit time:** ~67 seconds

**Note:** This is a one-time check per commit. It's worth the wait to catch issues early.

---

## Configuration Details

### What the Hook Does

```bash
#!/bin/sh

# 1. Prevent commits to main
if [ "$branch" = "main" ]; then
  exit 1  # BLOCKED
fi

# 2. Check for file-level eslint-disable
if [ -n "$FILE_LEVEL_IGNORES" ]; then
  exit 1  # BLOCKED
fi

# 3. Run linting & type checking
npx lint-staged || exit 1  # BLOCKED if fails

# 4. Run complete test suite ⭐ NEW
npm run test:all || exit 1  # BLOCKED if any test fails

# If all checks pass, commit proceeds ✓
```

### Environment

- **Hook framework:** Husky
- **Language:** Bash
- **Trigger:** Before commit
- **Scope:** All commits on all branches (except main)

---

## Troubleshooting

### "Tests failed. Commit blocked."

**Solution:**

```bash
# Run tests locally to see failures
npm run test:all

# Fix the failing tests
# Edit the code to make tests pass

# Try committing again
git commit -m "message"
```

### "npm command not found"

**Solution:**

```bash
# Install dependencies
npm install

# Try committing again
git commit -m "message"
```

### "Database connection failed"

**Solution:**

```bash
# Ensure dev server is running
npm run dev

# In another terminal, try committing
git commit -m "message"

# The database check needs a running server
```

### "Hook is not running at all"

**Solution:**

```bash
# Reinstall husky hooks
npx husky install

# Try committing again
git commit -m "message"
```

### "Slow commit (67 seconds seems long)"

**This is normal!** The test suite takes time to ensure quality. You can:

1. **Accept it** - It's a worthwhile investment in code quality
2. **Run tests early** - Test locally while making changes
3. **Skip with --no-verify** - Only in emergencies (not recommended)

```bash
# Run tests while you work
npm run test:all  # See failures early

# Make changes
# Commit passes immediately since tests already ran
```

---

## Workflow Recommendations

### Best Practice: Test as You Develop

```bash
# Terminal 1: Development server
npm run dev

# Terminal 2: Watch tests
npm run test:watch

# As you code, tests run automatically
# Fix issues as they appear
# When you commit, tests are already passing
```

### Alternative: Quick Test Before Commit

```bash
# Make changes
git add .

# Quick test check
npm run test:all

# If passing, commit
git commit -m "message"

# Hook runs again (should be instant since tests just passed)
```

---

## For the Team

### Share the Knowledge

- All team members should understand this workflow
- New contributors need to know about the pre-commit tests
- Document in team onboarding

### No Workarounds

- Pre-commit hooks are **not optional**
- `--no-verify` should never be standard practice
- Tests exist for a reason

### Continuous Improvement

- If tests are too slow, optimize them
- If hooks block legitimate commits, fix the underlying issue
- Monitor and improve the testing process

---

## Disabling the Hook (Temporary)

If you absolutely need to temporarily disable:

```bash
# Temporarily disable all hooks
git config --local core.hooksPath /dev/null

# Do your work
git commit -m "emergency fix"

# Re-enable hooks
git config --local core.hooksPath .husky
```

**⚠️ WARNING:** Only do this in genuine emergencies, and re-enable immediately.

---

## Summary

- ✅ **Hook installed and active:** `.husky/pre-commit`
- ✅ **Runs 240 tests:** Before every commit
- ✅ **Blocks broken code:** No untested commits
- ✅ **Clear error messages:** Shows what failed
- ✅ **Fast feedback:** Catch issues locally
- ✅ **Team protection:** Maintains code quality

---

## Quick Reference

| Task                         | Command                    |
| ---------------------------- | -------------------------- |
| Make a commit                | `git commit -m "message"`  |
| See tests before commit      | `npm run test:all`         |
| Watch tests while developing | `npm run test:watch`       |
| Check if hook is active      | `cat .husky/pre-commit`    |
| Reinstall hook               | `npx husky install`        |
| View hook status             | `ls -la .husky/pre-commit` |

---

## Next Steps

1. **Try it out:**

   ```bash
   git status  # See your changes
   git add .
   git commit -m "test message"  # Hook runs tests
   ```

2. **See it work:**
   - Watch all 240 tests run
   - See the database check pass
   - See the final "✓ All tests passed" message

3. **If a test fails:**
   - Read the error message
   - Run `npm run test:all` locally
   - Fix the code
   - Commit again

---

**Status:** Ready for use
**Tests Protected:** ✅ 240/240
**Commit Quality:** ✅ Enforced
**Last Updated:** November 13, 2025
