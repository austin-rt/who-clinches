# Documentation Maintenance Check

Run a thorough audit of the documentation structure to catch drift, broken links, and orphaned docs.

## Quick Start

**Run the audit script:**
```bash
node scripts/audit-docs.js
```

The script automatically checks:
- Broken markdown links
- Filename conventions (kebab-case)
- Orphaned documentation files
- Tier 1 documentation token load
- Duplicate headings

## Tasks

1. **Check for broken links** in all markdown files within `docs/` directory
   - Verify all markdown links `[text](./path/to/file.md)` resolve to existing files
   - Check relative paths resolve correctly from source file location
   - Report any broken links with source file and target path

2. **Find orphaned docs** not referenced by any other documentation files
   - A file is orphaned if it's not linked from any other markdown file in `docs/`
   - Exclude index files (e.g., `guides/frontend/index.md`) from orphaned status
   - Report orphaned files with recommendation (keep, archive, or remove)

3. **Report total Tier 1 doc load** (line count and estimated tokens)
   - Tier 1 files are defined in `scripts/audit-docs.js` as: `ai-guide.md`, `guides/quick-reference.md`, `guides/api-reference.md`, `guides/testing-quick-reference.md`
   - Calculate: total lines, total characters, estimated tokens (chars / 4)
   - Compare against estimate in `docs/ai-loading-manifest.md` (~5.5K tokens, 420 lines)
   - Report if within or exceeds expected range

4. **Ensure all filenames are lowercase and kebab-case**, except README and CHANGELOG
   - All markdown files must use lowercase with hyphens (e.g., `api-reference.md`)
   - Only `README.md` and `CHANGELOG.md` may use uppercase
   - Report any violations with file paths

5. **Check for duplicate headings** within each markdown file
   - Scan all heading levels (##, ###, etc.) within each file
   - Ignore headings inside code blocks
   - Report files with duplicate heading text

6. **Identify missing referenced files**
   - Check if files referenced in user rules or command files actually exist
   - Report any missing files (e.g., `docs/navigation-hub.md` if referenced but missing)

## Read-Only Directories

**CRITICAL:** The following directories are READ-ONLY for AI agents and must NEVER be modified:

- **`/docs/tiebreaker-rules/`** - Contains official SEC tiebreaker rules extracted from authoritative sources. These files are the SINGULAR SOURCE OF TRUTH for tiebreaker procedures. AI agents must NEVER edit, modify, or delete files in this directory. Only `scripts/extract-sec-rules.py` should update these files by fetching the latest official PDF from the SEC website.

## Execution

**Primary Method:** Run `node scripts/audit-docs.js` for automated checks.

**Manual Verification (if needed):**
- Use `grep` to search for markdown link patterns: `\[.*\]\([^)]+\.md[^)]*\)`
- Use `glob_file_search` to find all markdown files in `docs/`
- Manually verify orphaned files by checking if they're referenced anywhere
- Check for missing files referenced in `.claude/commands/*.md` or user rules

**DO NOT:**
- Generate new report files (user will handle output format)
- Modify documentation files during audit (audit is read-only)
- Delete or rename files (report findings only)

## Expected Output Format

Provide a clear summary in your response with:

1. **Broken Links Section:**
   - List each broken link with: source file → target path → resolution error
   - Or confirm "✅ No broken links found"

2. **Filename Conventions Section:**
   - List any violations with file paths
   - Or confirm "✅ All filenames follow kebab-case convention"

3. **Orphaned Files Section:**
   - List each orphaned file with path
   - Provide recommendation: keep (if historical), archive, or remove
   - Or confirm "✅ No orphaned files found"

4. **Tier 1 Documentation Load Section:**
   - Show breakdown: file name, lines, tokens (estimated)
   - Show total: lines, tokens
   - Compare to estimate: within range or exceeds
   - Status indicator: ✅ or ⚠️

5. **Duplicate Headings Section:**
   - List files with duplicate headings and the duplicate heading text
   - Or confirm "✅ No duplicate headings found"

6. **Missing Files Section:**
   - List any files referenced but not found (e.g., `docs/navigation-hub.md`)
   - Provide recommendation: create file or remove references

7. **Summary Section:**
   - Total markdown files found
   - Count of issues by category
   - Overall status (healthy, needs attention, etc.)

**Output should be in your response text, NOT in a generated file.**
