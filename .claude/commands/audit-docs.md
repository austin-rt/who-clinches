# Documentation Maintenance Check

Run a thorough audit of the documentation structure to catch drift, broken links, and orphaned docs.

## Tasks

1. **Check for broken links** in active docs (navigation-hub, ai-guide, all guides, quick-ref tests)
2. **Find orphaned docs** not referenced in navigation or manifests
3. **Report total Tier 1 doc load** (line count and estimated tokens)
4. **Ensure all filenames are lowercase and kebab-case**, except README and CHANGELOG.

## Read-Only Directories

**CRITICAL:** The following directories are READ-ONLY for AI agents and must NEVER be modified:

- **`/docs/tiebreaker-rules/`** - Contains official SEC tiebreaker rules extracted from authoritative sources. These files are the SINGULAR SOURCE OF TRUTH for tiebreaker procedures. AI agents must NEVER edit, modify, or delete files in this directory. Only `scripts/extract-sec-rules.py` should update these files by fetching the latest official PDF from the SEC website.

## Execution

- Use Grep to search for broken markdown links `\[.*\]\(\.\/.*\)`
- Use Glob to find all markdown files in docs/
- Identify opportunity to reduce the amout of tokens used while maintaining the important information
- Execute your own recommendations

## Expected Output

- All link checks (broken, orphaned, unintended references)
- Any warnings or suggestions for cleanup
- Do not create any files, just execute your own recommendations.
- Summary of files changes and what changes were made in each.
