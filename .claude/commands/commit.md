# generate-and-run-commits

## Objective

Execute `git add` and `git commit` commands for all unstaged changes. Analyze changes with `git status` and `git diff`, determine optimal commit structure, then run commands using `run_terminal_cmd` with `required_permissions: ["all"]`.

**Note:** Git hooks in this repository trigger npm, which requires full permissions. Always use `required_permissions: ["all"]` instead of `["git_write"]`.

## Critical Requirements

1. **Run validation upfront** - Execute `npm run lint`, `npx tsc --noEmit`, and `npm run test:all` BEFORE any commits
2. **Use --no-verify flag** - Always use `--no-verify` on all git commits to skip husky pre-commit hooks (validation already done)
3. **Execute commits** - Use `run_terminal_cmd` tool to run git commands, DO NOT generate code blocks
4. **Sequential execution** - Run one commit at a time, verify success before proceeding
5. **Stop on failure** - If any commit fails, halt execution and report the error
6. **Minimal commits** - Each commit must be the smallest logical unit that doesn't break the build

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

Run all validation checks before attempting any commits:

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

If any validation fails:

- Fix all errors before proceeding
- Use `read_lints` tool to identify specific issues
- Do not attempt to commit until all checks pass

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

### Step 6: Report

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
