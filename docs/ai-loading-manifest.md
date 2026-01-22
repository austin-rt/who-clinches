# AI Loading Manifest

**Purpose:** This manifest tells AI agents which documentation files to load for optimal token efficiency. Follow this guide to minimize token overhead while maintaining full navigability.

---

## Essential (Always Load)

**~4.5K tokens** - Load these files for every task:

- `docs/ai-guide.md` - Core AI development guidelines (~2.0K tokens, 90 lines)
- `docs/guides/quick-reference.md` - Domain-specific content locations (~1.0K tokens, 93 lines)
- `docs/guides/api-reference.md` - API reference overview (~0.6K tokens, 63 lines)
- `docs/guides/testing-quick-reference.md` - Testing commands and quick reference (~0.9K tokens, 80 lines)

**Total Essential:** ~4.5K tokens (326 lines)

---

## Task-Specific Loading

Load additional docs based on your specific task:

### Scenario 1: Adding API Endpoint
**Additional Load (~5-8K tokens):**
- `docs/tests/api-testing-quick-ref.md` - Quick API testing patterns
- `docs/guides/api-reference-data.md` - Data endpoint patterns (if needed)

**Total:** ~20-23K tokens

### Scenario 2: Testing Changes
**Additional Load (~5-8K tokens):**
- `docs/tests/api-testing-quick-ref.md` - Quick API testing patterns
- `docs/tests/comprehensive-api-testing.md` - Complete API testing guide (if detailed work needed)

**Total:** ~20-23K tokens

### Scenario 3: CFBD API Integration Work
**Additional Load (~5-8K tokens):**
- `docs/guides/cfbd-api-monitoring.md` - CFBD API monitoring and alerting
- `docs/guides/api-reference-data.md` - Data endpoint patterns

**Total:** ~20-23K tokens

### Scenario 4: Frontend Work
**Additional Load (~5-8K tokens):**
- `docs/guides/frontend/index.md` - Frontend documentation overview
- `docs/guides/frontend/[domain].md` - Specific frontend domain (state-management, components, etc.) as needed

**Total:** ~20-23K tokens

---

## Loading Strategy

1. **Always start with Essential docs** (~4.5K tokens)
2. **Add task-specific docs** based on scenario (~5-8K tokens)
3. **Load full detailed guides** only when needed during execution (e.g., `comprehensive-api-testing.md` when writing tests)

---

## Token Budget

- **Total for typical task:** ~9-12K tokens (Essential + Task-Specific)
- **Remaining for execution:** ~188-191K tokens (out of 200K context window)
- **Essential docs:** ~4.5K tokens (326 lines)
- **Task-specific docs:** ~5-8K tokens per scenario
- **Savings:** Significant reduction in loaded documentation

---

## Quick Reference

| Task Type | Essential | Task-Specific | Total |
|-----------|-----------|---------------|-------|
| General Development | ✅ | None | ~4.5K |
| API Endpoint | ✅ | api-testing-quick-ref.md | ~9-12K |
| Testing | ✅ | api-testing-quick-ref.md | ~9-12K |
| CFBD API Work | ✅ | cfbd-api-monitoring.md, api-reference-data.md | ~9-12K |
| Frontend | ✅ | frontend/index.md | ~9-12K |

---

**Remember:** Load full detailed guides (e.g., `comprehensive-api-testing.md`) only when you need comprehensive procedures during execution, not during initial context loading.

