# AI Loading Manifest

**Purpose:** This manifest tells AI agents which documentation files to load for optimal token efficiency. Follow this guide to minimize token overhead while maintaining full navigability.

---

## Essential (Always Load)

**~5.5K tokens** - Load these files for every task:

- `docs/ai-guide.md` - Core AI development guidelines (~2.8K tokens, 123 lines)
- `docs/guides/quick-reference.md` - Domain-specific content locations (~1.1K tokens, 103 lines)
- `docs/guides/api-reference.md` - API reference overview (~0.7K tokens, 87 lines)
- `docs/guides/testing-quick-reference.md` - Testing commands and quick reference (~1.0K tokens, 107 lines)

**Total Essential:** ~5.5K tokens (420 lines)

---

## Task-Specific Loading

Load additional docs based on your specific task:

### Scenario 1: Adding API Endpoint
**Additional Load (~5-8K tokens):**
- `docs/plans/api-foundation.md` - API architecture decisions
- `docs/tests/api-testing-quick-ref.md` - Quick API testing patterns
- `docs/guides/api-reference-data.md` - Data endpoint patterns (if needed)

**Total:** ~25-28K tokens

### Scenario 2: Testing Changes
**Additional Load (~5-8K tokens):**
- `docs/tests/api-testing-quick-ref.md` - Quick API testing patterns
- `docs/tests/espn-testing-quick-ref.md` - ESPN API quirks (if ESPN-related)
- `docs/plans/testing-strategy-summary.md` - Testing strategy overview

**Total:** ~25-28K tokens

### Scenario 3: ESPN Integration Work
**Additional Load (~5-8K tokens):**
- `docs/tests/espn-testing-quick-ref.md` - Critical ESPN API quirks
- `docs/tests/espn-api-testing.md` - Full ESPN testing guide (load only if detailed work needed)
- `docs/plans/api-foundation.md` - API architecture (if adding endpoints)

**Total:** ~25-28K tokens

### Scenario 4: Frontend Work
**Additional Load (~5-8K tokens):**
- `docs/plans/frontend.md` - Frontend summary and phase status
- `docs/guides/frontend/index.md` - Frontend documentation overview
- `docs/guides/frontend/[domain].md` - Specific frontend domain (state-management, components, etc.) as needed
- `docs/plans/frontend/phase3.md` (or current phase) - Current phase details

**Total:** ~25-28K tokens

---

## Loading Strategy

1. **Always start with Essential docs** (~5.5K tokens)
2. **Add task-specific docs** based on scenario (~5-8K tokens)
3. **Load full detailed guides** only when needed during execution (e.g., `comprehensive-api-testing.md` when writing tests)

---

## Token Budget

- **Total for typical task:** ~10-13K tokens (Essential + Task-Specific)
- **Remaining for execution:** ~187-190K tokens (out of 200K context window)
- **Essential docs:** ~5.5K tokens (420 lines)
- **Task-specific docs:** ~5-8K tokens per scenario
- **Savings:** Significant reduction in loaded documentation

---

## Quick Reference

| Task Type | Essential | Task-Specific | Total |
|-----------|-----------|---------------|-------|
| General Development | ✅ | None | ~5.5K |
| API Endpoint | ✅ | api-foundation.md, api-testing-quick-ref.md | ~10-13K |
| Testing | ✅ | api-testing-quick-ref.md, testing-strategy-summary.md | ~10-13K |
| ESPN Work | ✅ | espn-testing-quick-ref.md | ~10-13K |
| Frontend | ✅ | frontend.md, frontend/index.md | ~10-13K |

---

**Remember:** Load full detailed guides (e.g., `comprehensive-api-testing.md`, `espn-api-testing.md`) only when you need comprehensive procedures during execution, not during initial context loading.

