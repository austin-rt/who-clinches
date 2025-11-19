# AI Loading Manifest

**Purpose:** This manifest tells AI agents which documentation files to load for optimal token efficiency. Follow this guide to minimize token overhead while maintaining full navigability.

---

## Essential (Always Load)

**~15K tokens** - Load these files for every task:

- `docs/ai-guide.md` - Core AI development guidelines
- `docs/guides/quick-reference.md` - Domain-specific content locations
- `docs/guides/api-reference.md` - API reference overview
- `docs/guides/testing-quick-reference.md` - Testing commands and quick reference

**Total Essential:** ~15K tokens

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
- `docs/guides/frontend-patterns.md` - Frontend architecture patterns
- `docs/plans/frontend/phase3.md` (or current phase) - Current phase details

**Total:** ~25-28K tokens

---

## Never Load for AI

**Explicitly excluded from AI doc loading:**

- `docs/plans/HISTORICAL/` - All historical planning documents
  - `docs/plans/HISTORICAL/archive/` - Historical archive files
  - `docs/plans/HISTORICAL/archived-phases/` - Completed phase documents
- `docs/plans/archive/` - Old archive path (should not exist after reorganization)

**Why exclude:** 
- HISTORICAL docs are historical reference only. They reflect outdated designs and should not be consulted for current implementation.

---

## Loading Strategy

1. **Always start with Essential docs** (~15K tokens)
2. **Add task-specific docs** based on scenario (~5-8K tokens)
3. **Load full detailed guides** only when needed during execution (e.g., `comprehensive-api-testing.md` when writing tests)
4. **Never load HISTORICAL/** directory files

---

## Token Budget

- **Total for typical task:** 20-23K tokens (Essential + Task-Specific)
- **Remaining for execution:** 177-180K tokens (out of 200K context window)
- **Before optimization:** ~55K tokens loaded
- **After optimization:** ~20-23K tokens loaded
- **Savings:** ~60% reduction in loaded documentation

---

## Quick Reference

| Task Type | Essential | Task-Specific | Total |
|-----------|-----------|---------------|-------|
| General Development | ✅ | None | ~15K |
| API Endpoint | ✅ | api-foundation.md, api-testing-quick-ref.md | ~20-23K |
| Testing | ✅ | api-testing-quick-ref.md, testing-strategy-summary.md | ~20-23K |
| ESPN Work | ✅ | espn-testing-quick-ref.md | ~20-23K |
| Frontend | ✅ | frontend.md, frontend-patterns.md | ~20-23K |

---

**Remember:** Load full detailed guides (e.g., `comprehensive-api-testing.md`, `espn-api-testing.md`) only when you need comprehensive procedures during execution, not during initial context loading.

