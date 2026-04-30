# AI Loading Manifest

**Purpose:** This manifest tells AI agents which documentation files to load for optimal token efficiency. Follow this guide to minimize token overhead while maintaining full navigability.

---

## Essential (Always Load)

**~4.3K tokens** - Load these files for every task:

- `docs/ai-guide.md` - Core AI development guidelines (~1.7K tokens, 87 lines)
- `docs/guides/quick-reference.md` - Domain-specific content locations (~0.9K tokens, 87 lines)
- `docs/guides/api-reference.md` - API reference overview (~0.8K tokens, 71 lines)
- `docs/guides/testing-quick-reference.md` - Testing commands and quick reference (~1.0K tokens, 117 lines)

**Total Essential:** ~4.3K tokens (362 lines)

---

## Task-Specific Loading

Load additional docs based on your specific task:

### Scenario 1: Adding API Endpoint

**Additional Load (~5-8K tokens):**

- `docs/guides/api-reference-data.md` - Data endpoint patterns (if needed)

**Total:** ~9-12K tokens

### Scenario 2: CFBD API Integration Work

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

1. **Always start with Essential docs** (~4.3K tokens)
2. **Add task-specific docs** based on scenario (~5-8K tokens)
3. **Load full detailed guides** only when needed during execution

---

## Token Budget

- **Total for typical task:** ~10-13K tokens (Essential + Task-Specific)
- **Remaining for execution:** ~187-190K tokens (out of 200K context window)
- **Essential docs:** ~4.3K tokens (362 lines)
- **Task-specific docs:** ~5-8K tokens per scenario
- **Savings:** Significant reduction in loaded documentation

---

## Quick Reference

| Task Type           | Essential | Task-Specific                                 | Total   |
| ------------------- | --------- | --------------------------------------------- | ------- |
| General Development | ✅        | None                                          | ~4.3K   |
| API Endpoint        | ✅        | api-reference-data.md                         | ~10-13K |
| CFBD API Work       | ✅        | cfbd-api-monitoring.md, api-reference-data.md | ~10-13K |
| Frontend            | ✅        | frontend/index.md                             | ~10-13K |

---

**Remember:** Load full detailed guides only when you need comprehensive procedures during execution, not during initial context loading.
