# audit-docs

## Objective

Audit and update project documentation to ensure accuracy after code changes. Use the codebase as the single source of truth. Verify documentation matches actual implementation, update outdated information, and ensure all markdown files follow naming conventions.

## Critical Requirements

1. **Codebase is truth** - Documentation must reflect actual code implementation, not vice versa
2. **Git history analysis** - Use git commands to find last documentation commit, understand changes, and verify alignment with current HEAD
3. **Verify accuracy** - Compare documentation claims against actual code patterns and behavior
4. **Update outdated info** - Fix discrepancies between docs and code
5. **Naming conventions** - All markdown files must be kebab-case except `README.md` and `CHANGELOG.md`
6. **Reference accuracy** - Update links and cross-references when files are renamed or moved
7. **Follow structure** - Adhere to documentation structure defined in `docs/navigation-hub.md`

## Source of Truth Hierarchy

1. **Code** - Actual implementation in source files is authoritative
2. **Type definitions** - `lib/api-types.ts`, `lib/types.ts` define interfaces
3. **Schemas** - `lib/models/*.ts` define data structures
4. **Configuration** - `package.json`, `vercel.json`, environment files
5. **Documentation** - Must align with above sources

## Documentation Standards

### File Naming

- **Kebab-case required** - All markdown files use lowercase with hyphens (e.g., `testing-quick-reference.md`)
- **Exceptions** - Only `README.md` and `CHANGELOG.md` use uppercase
- **Rename if needed** - Update any uppercase markdown files to kebab-case and fix all references

### Structure and Organization

Follow structure defined in `docs/navigation-hub.md`:

- **Reference docs** → `/docs/` (e.g., `ai-guide.md`)
- **How-to guides** → `/docs/guides/` (e.g., `api-reference.md`)
- **Testing docs** → `/docs/tests/` (e.g., `comprehensive-api-testing.md`)
- **Planning docs** → `/docs/plans/` (e.g., `tech-spec.md`)
- **Archive** → `/docs/plans/archive/` (completed work records)
- **Project-level** → Root (only `README.md`, `CHANGELOG.md`)

### Content Accuracy

- **API endpoints** - Verify against actual route handlers in `app/api/`
- **Data models** - Verify against schemas in `lib/models/`
- **Type definitions** - Verify against `lib/api-types.ts` and `lib/types.ts`
- **Environment variables** - Verify against actual usage in code
- **Commands and scripts** - Verify against `package.json` scripts and actual script files
- **Configuration** - Verify against actual config files

### Tiebreaker Rules Directory Restrictions

**CRITICAL:** Files in `/docs/tiebreaker-rules/` are READ-ONLY for AI agents. These files contain the official tiebreaker rules extracted from authoritative sources and are the SINGULAR SOURCE OF TRUTH for all tiebreaker procedures.

**NOT allowed:**

- Editing, modifying, or deleting any files in `/docs/tiebreaker-rules/`
- Changing content of tiebreaker rules files
- Updating rules files to match code implementation
- Correcting or "fixing" content in rules files

**Allowed operations:**

- Reading rules files for reference when implementing or debugging tiebreaker logic

**Rationale:** Tiebreaker rules files are extracted from official SEC PDFs and represent the authoritative source for tiebreaker procedures. Code in `lib/tiebreaker-helpers.ts` must enforce these rules exactly as specified. AI agents must never modify these files - they are read-only reference material.

### Plans Directory Restrictions

**CRITICAL:** Files in `/docs/plans/` and `/docs/plans/archive/` are historical planning documents and completed work records. These documents preserve the state of planning and implementation at specific points in time.

**Allowed updates to plans directory:**

- Fix broken links (update file paths when files are renamed or moved)
- Update completion statuses (mark tasks as complete, update status indicators)
- Fix naming convention violations (rename files to kebab-case if needed)

**NOT allowed:**

- Updating content to match current code implementation
- Correcting outdated information about features or APIs
- Modifying historical records to reflect current state
- Changing planning decisions or implementation details

**Rationale:** Planning documents serve as historical records. They document what was planned and when, not what the current implementation is. For current implementation details, refer to active documentation in `/docs/guides/`, `/docs/tests/`, and the codebase itself.

## Execution Protocol

### Step 0: Analyze Documentation Commit History

Use git commands to understand recent documentation changes and ensure alignment with current code:

- Find last commit that updated documentation:

  ```bash
  # Find commits with "doc" in message that touched docs
  git log --all --oneline --grep="doc" -i -- docs/ README.md CHANGELOG.md

  # Or find any commit that modified markdown files
  git log --all --oneline --name-only -- docs/ README.md CHANGELOG.md | grep -E "\.md$"

  # Get most recent commit hash that modified docs
  git log -1 --format="%H" -- docs/ README.md CHANGELOG.md
  ```

- Review the most recent documentation commit to understand what changed:
  ```bash
  git show <commit-hash> --stat
  git show <commit-hash>
  ```
- Identify which documentation files were modified and what changes were made
- Compare documentation changes against current codebase state:
  - Verify documented features still exist in code
  - Check if code has changed since documentation was last updated
  - Identify any code changes that occurred after the last documentation update
- Ensure documentation reflects current HEAD of branch:
  - Check if any code changes since last doc commit need documentation updates
  - Verify all documented functionality matches current implementation
  - Confirm no drift between documented state and actual code state

### Step 1: Identify Changed Code

Analyze recent code changes to determine what documentation may be affected:

- Review git diff or changed files
- Identify modified endpoints, models, types, or configurations
- Note any new features or removed functionality
- Cross-reference with documentation commit history from Step 0

### Step 2: Locate Relevant Documentation

Use `docs/navigation-hub.md` to find documentation that references changed code:

- Search for endpoint names, function names, or feature names
- Check API reference, testing guides, and planning documents
- Review `docs/ai-guide.md` for patterns that may need updates

### Step 3: Verify Accuracy

For each relevant documentation file:

- Compare documented behavior against actual code implementation
- Verify type definitions match `lib/api-types.ts` and `lib/types.ts`
- Check that examples use correct patterns from codebase
- Confirm environment variable documentation matches actual usage
- Validate command examples against `package.json` scripts

### Step 4: Update Documentation

Fix any discrepancies found:

- Update outdated information to match code
- Correct type definitions and interfaces
- Fix broken examples or incorrect patterns
- Update environment variable lists
- Correct command syntax and options

**IMPORTANT - Directory Exceptions:**

- **Tiebreaker Rules Directory (`/docs/tiebreaker-rules/`)**: READ-ONLY - NEVER edit these files. They are the singular source of truth for tiebreaker procedures.
- **Plans Directory (`/docs/plans/` and `/docs/plans/archive/`)**: ONLY fix broken links and update completion statuses. Do NOT update content to match current code implementation. Planning documents are historical records and should preserve their original state.

### Step 5: Check Naming Conventions

Verify all markdown files follow kebab-case naming:

- Scan for uppercase markdown filenames (except README/CHANGELOG)
- Rename files to kebab-case if needed
- Update all references to renamed files
- Verify links in `docs/navigation-hub.md` are correct

### Step 6: Update Cross-References

Ensure all documentation links are accurate:

- Fix broken internal links
- Update references to renamed files
- Verify navigation hub links point to correct files
- Check that examples reference correct file paths

**Plans Directory:** Fix broken links in planning documents, but preserve historical content even if it references outdated implementations.

### Step 7: Verify Structure Compliance

Confirm documentation follows structure in `docs/navigation-hub.md`:

- Files are in correct directories
- Naming matches conventions
- Links follow relative path patterns
- Structure matches documented organization

## Key Files to Review

### Always Check

- `docs/ai-guide.md` - Core AI development patterns and principles
- `docs/navigation-hub.md` - Documentation structure and organization
- `docs/guides/api-reference.md` - API endpoint documentation
- `lib/api-types.ts` - Type definitions for API requests/responses
- `lib/types.ts` - Internal application types

### When Code Changes

- **API routes** → Update `docs/guides/api-reference.md`
- **Data models** → Update relevant guides and test docs
- **Type definitions** → Update API reference and test documentation
- **Environment variables** → Update `docs/guides/testing-quick-reference.md` and test docs
- **Scripts/commands** → Update testing guides and quick reference

## Common Issues to Fix

### Outdated Information

- API endpoints that no longer exist or have changed signatures
- Type definitions that don't match actual interfaces
- Environment variables that are no longer used
- Commands that have changed syntax or options
- Examples that use deprecated patterns

### Naming Violations

- Markdown files with uppercase letters (except README/CHANGELOG)
- Inconsistent kebab-case usage
- Files in wrong directories

### Broken References

- Links to renamed or moved files
- Incorrect relative paths
- References to non-existent files
- Outdated navigation hub entries

**Note:** In plans directory, fix broken links but preserve historical content. Do not update links to reflect current implementation if the original reference was to a historical state.

## Verification Checklist

After updates, verify:

- [ ] Documentation commit history analyzed and understood
- [ ] All documentation matches current HEAD of branch
- [ ] All documentation matches actual code implementation
- [ ] Type definitions are accurate and complete
- [ ] Examples use correct patterns from codebase
- [ ] Environment variables are correctly documented
- [ ] Commands and scripts match `package.json`
- [ ] All markdown files are kebab-case (except README/CHANGELOG)
- [ ] All internal links work correctly
- [ ] Navigation hub reflects current structure
- [ ] AI guide patterns are followed
- [ ] No broken references or outdated information
- [ ] No drift between documented state and actual code state

## Example Execution

**Scenario:** API endpoint `/api/simulate` was updated to accept new optional parameter

**Execution:**

0. Analyze documentation history:
   - Run `git log --oneline -- "*.md"` to find last doc commit
   - Review `git show <last-doc-commit>` to see what was documented
   - Compare against current code: `app/api/simulate/route.ts` has new parameter not in docs
   - Identify gap: Documentation doesn't reflect new parameter added in recent code commit
1. Identify changed code: `app/api/simulate/route.ts` modified
2. Locate relevant docs: `docs/guides/api-reference.md`, `docs/tests/comprehensive-api-testing.md`
3. Verify accuracy: Check documented request body against `lib/api-types.ts`
4. Update documentation: Add new parameter to API reference and test examples
5. Check naming: Verify all referenced files are kebab-case
6. Update cross-references: Ensure links still work
7. Verify structure: Confirm files are in correct directories

**Result:** Documentation accurately reflects new optional parameter in simulate endpoint and is synchronized with current HEAD
