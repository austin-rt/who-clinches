# audit-docs

## Objective

Analyze all documentation files in the `docs/` directory and optimize them for AI consumption. Maximize information density while minimizing token usage to reserve maximum context window for actual tasks. Ensure documentation provides clear domain-specific content locations and quick navigation.

## Critical Requirements

1. **Token efficiency** - Remove redundancy, consolidate similar content, eliminate verbose explanations
2. **Scannability** - Use clear headings, bullet points, and tables for quick information retrieval
3. **Quick navigation** - Ensure domain-specific content locations are easily findable ("if you need to test, go here")
4. **Context preservation** - Retain all essential information while removing unnecessary verbosity
5. **Structure optimization** - Reorganize content for maximum information density
6. **Reference consolidation** - Consolidate repeated references and cross-links
7. **AI consumption focus** - Format content for efficient AI parsing and understanding

## Optimization Strategies

### Token Reduction

- Remove redundant explanations that repeat information
- Consolidate similar sections into single comprehensive entries
- Eliminate verbose language and unnecessary examples
- Replace long paragraphs with concise bullet points
- Use tables for structured data instead of prose

### Information Density

- Combine related information into single sections
- Use abbreviations and shorthand where context is clear
- Remove unnecessary examples (keep only essential ones)
- Consolidate troubleshooting into concise lists
- Merge similar procedures into unified workflows

### Navigation Enhancement

- Create or update quick reference guides for domain-specific content
- Ensure "if you need X, go here" patterns are prominent
- Add file location tables for common tasks
- Consolidate cross-references to reduce link sprawl
- Update navigation hub with optimized structure

### Structure Improvements

- Reorganize sections for logical flow
- Group related information together
- Use consistent formatting patterns
- Create summary sections for quick scanning
- Optimize table of contents for AI parsing

## Execution Protocol

### Step 1: Analyze Documentation Structure

Review all files in `docs/` directory:

- Identify verbose sections with redundant information
- Find repeated explanations across multiple files
- Locate domain-specific content that needs quick reference
- Identify sections that can be consolidated
- Note formatting inconsistencies

### Step 2: Create/Update Quick Reference

Ensure domain-specific quick reference exists:

- Create `docs/guides/quick-reference.md` if missing
- Organize by domain: Testing, API Development, ESPN Integration, etc.
- Include common commands and file locations
- Add "if you need X, go here" patterns
- Update navigation hub to reference quick reference prominently

### Step 3: Optimize Key Documentation Files

For each documentation file:

- Remove redundant explanations
- Consolidate similar sections
- Convert verbose prose to concise bullet points
- Eliminate unnecessary examples
- Optimize tables and structured data
- Update cross-references to use quick reference

### Step 4: Update Navigation Hub

Ensure navigation hub reflects optimizations:

- Add quick reference to prominent location
- Update file location reference table
- Consolidate search guide sections
- Optimize "Documentation by Use Case" section

### Step 5: Verify Information Preservation

Confirm all essential information retained:

- Verify no critical details removed
- Check that examples are still accurate
- Ensure cross-references still work
- Validate that quick navigation works
- Confirm token reduction achieved without information loss

## Key Files to Optimize

### Priority Files

- `docs/ai-guide.md` - Entry point for AI assistants
- `docs/navigation-hub.md` - Documentation index
- `docs/guides/testing-quick-reference.md` - Frequently accessed
- `docs/guides/api-reference.md` - Core API documentation
- `docs/guides/quick-reference.md` - Domain-specific locations (create if missing)

### Secondary Files

- `docs/tests/*.md` - Testing documentation
- `docs/guides/*.md` - How-to guides
- Other reference documentation as needed

## Optimization Metrics

Target improvements:

- **Token reduction**: 30-50% reduction in verbose files
- **Scannability**: Clear headings and bullet points throughout
- **Navigation**: Quick reference guide with domain-specific locations
- **Information density**: Maximum information per token
- **Context preservation**: All essential information retained

## Example Optimizations

### Before (Verbose)

```
## Environment Files

The project uses environment-specific configuration files for testing different databases:

- **`.env.local`** - Local development (default)
  - Used by: Next.js dev server, API endpoints, Jest tests
  - Contains: `MONGODB_DB=dev`, `CRON_SECRET`, `MONGODB_USER`, `MONGODB_PASSWORD`, `MONGODB_HOST`, `MONGODB_APP_NAME`
  - Also contains: `VERCEL_AUTOMATION_BYPASS_SECRET` (required for preview/production testing), `MONGODB_USER_READONLY`, `MONGODB_PASSWORD_READONLY`
```

### After (Optimized)

```
## Environment Files

- **`.env.local`** - Local dev (default): `MONGODB_DB=dev`, `CRON_SECRET`, credentials, `VERCEL_AUTOMATION_BYPASS_SECRET`, read-only credentials
- **`.env.preview`** - Preview/staging: `MONGODB_DB=preview`
- **`.env.production`** - Production: `MONGODB_DB=production`
```

## Verification Checklist

After optimization, verify:

- [ ] Quick reference guide exists and is comprehensive
- [ ] Navigation hub references quick reference prominently
- [ ] Token usage reduced by 30-50% in verbose files
- [ ] All essential information preserved
- [ ] Domain-specific content easily findable
- [ ] Cross-references updated and working
- [ ] Structure optimized for AI consumption
- [ ] No critical details removed
- [ ] Examples remain accurate
- [ ] Formatting consistent throughout

