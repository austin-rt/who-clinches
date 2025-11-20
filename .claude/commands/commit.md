# commit

## Objective

Execute `git add` and `git commit` commands for all unstaged changes. Analyze changes with `git status` and `git diff`, determine optimal commit structure, then run commands using `run_terminal_cmd` with `required_permissions: ["all"]`.

**Note:** Git hooks in this repository trigger npm, which requires full permissions. Always use `required_permissions: ["all"]` instead of `["git_write"]`.

## Critical Requirements

1. **Run validation upfront** - Execute `npm run lint`, `npx tsc --noEmit`, and `npm run test:all` BEFORE any commits
2. **Tests cannot be skipped** - NEVER skip tests on the first validation run, even if you think they are not needed or are failing due to environment issues. All tests must be executed and pass before proceeding.
3. **Server management** - If tests require a running server and it's not running, start the development server before running tests. **After all commits are complete, ALWAYS kill the server process using `npm run kill:next`** (see Step 6: Cleanup).
4. **Use --no-verify flag** - Always use `--no-verify` on all git commits to skip husky pre-commit hooks (validation already done)
5. **Execute commits** - Use `run_terminal_cmd` tool to run git commands, DO NOT generate code blocks
6. **Sequential execution** - Run one commit at a time, verify success before proceeding
7. **Stop on failure** - If any commit fails, halt execution and report the error
8. **Minimal commits** - Each commit must be the smallest logical unit that doesn't break the build
9. **File deletions are last** - NEVER delete files until the very end, after ALL changes are complete, tested, and validated. File deletions must be the absolute final step, only after: (1) all code changes are implemented, (2) `npm run lint` passes, (3) `npx tsc --noEmit` passes, (4) all tests pass (`npm run test:all`), and (5) all functionality is verified working. Only then may files be deleted.

## Commit Grouping Rules

### Single File (Default)

- Commit all changes from one file together
- Exception: Only split if combining would break the build

### Multiple Files (When Required)

- Dependencies: If File B imports from File A, commit A first, then B
- Breaking changes: If files are interdependent, commit together
- Related functionality: Group files that implement a single feature

### Never Commit Separately

- Import statements alone
- Whitespace/formatting changes (group with related changes)
- Partial implementations that break the build

## Commit Message Format

**Structure:** `<action> <what> [context]`

**Rules:**

- lowercase first letter
- imperative mood ("add" not "added")
- specific and concise
- describe the change, not the file

**Examples:**

- ✅ `add user authentication middleware`
- ✅ `fix null pointer in cart calculation`
- ✅ `update API endpoint to handle pagination`
- ❌ `Updated files` (too vague)
- ❌ `Add feature` (capitalize)

## Execution Protocol

### Step 1: Pre-Commit Validation (Run Once Upfront)

**Check if server is needed:** If tests require a running server (e.g., API integration tests), check if the server is running. If not, start it in the background:

```
run_terminal_cmd(
  command: "npm run dev",
  required_permissions: ["all"],
  is_background: true
)
```

Wait a few seconds for the server to start, then run all validation checks:

```
run_terminal_cmd(
  command: "npm run lint",
  required_permissions: ["all"]
)

run_terminal_cmd(
  command: "npx tsc --noEmit",
  required_permissions: ["all"]
)

run_terminal_cmd(
  command: "npm run test:all",
  required_permissions: ["all"]
)
```

**CRITICAL: If any validation fails, you MUST fix all errors before proceeding to git commit.**

- If linting fails: Use `read_lints` tool to identify specific issues, fix all linting errors, then re-run `npm run lint` until it passes
- If TypeScript fails: Fix all type errors, then re-run `npx tsc --noEmit` until it passes
- If tests fail: Fix all failing tests, then re-run `npm run test:all` until all tests pass
- **DO NOT proceed to Step 2 (Analyze) or Step 4 (Execute) until ALL validation checks pass**
- **DO NOT use `--no-verify` flag if validation checks have not passed**

**Important:** Once all checks pass, use `--no-verify` flag on all commits to skip husky pre-commit hooks (since we've already validated everything).

### Step 2: Analyze

Run `git diff` to see all unstaged changes

### Step 3: Plan

Determine commit structure:

- Group by file (default)
- Identify dependencies
- Order commits to prevent breaking changes

### Step 4: Execute

For each planned commit, use `--no-verify` to skip pre-commit hooks:

```
run_terminal_cmd(
  command: "git add <files> && git commit --no-verify -m '<message>'",
  required_permissions: ["all"]
)
```

**Note:** The `--no-verify` flag is required because we've already run all validation checks upfront. This speeds up the commit process significantly.

### Step 5: Verify

Check exit code. If failure:

- Stop execution
- Report error
- Do not proceed to next commit

### Step 6: Cleanup

**CRITICAL: Always kill the development server after commits are complete.**

If a development server was started in Step 1 (or was already running), kill it now:

```
run_terminal_cmd(
  command: "npm run kill:next",
  required_permissions: ["all"]
)
```

**Note:** This cleanup step is mandatory. The dev server should not be left running after commit operations complete.

### Step 7: Report

Summarize executed commits:

- List each commit with message
- Report total number of commits
- Confirm all succeeded

## Example Execution

**Scenario:** Changes in `Button.js`, `constants.js`, `api.js` (api.js imports from constants.js)

**Execution:**

1. Run all validation checks upfront:
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run test:all`

2. Once all checks pass, commit with `--no-verify`:
   - `git add src/utils/constants.js && git commit --no-verify -m "add API_BASE_URL constant"`
   - `git add src/services/api.js && git commit --no-verify -m "implement API_BASE_URL in service"`
   - `git add src/components/Button.js && git commit --no-verify -m "add disabled styles to Button component"`

**Report:**

```
✅ 3 commits executed successfully:
- add API_BASE_URL constant
- implement API_BASE_URL in service
- add disabled styles to Button component
```
