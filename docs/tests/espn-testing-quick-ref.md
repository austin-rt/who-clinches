# ESPN Testing Quick Reference

**Note:** Full guide in [espn-api-testing.md](./espn-api-testing.md)

---

## Critical ESPN API Quirks

### 1. Conference ID Inconsistency
- **Scoreboard API:** Uses `"8"` (query: `?groups=8`)
- **Team API:** Returns `"80"` in `team.groups.parent.id`
- **Impact:** Use `SEC_CONFERENCE_ID = 8` for scoreboard queries

### 2. Ranking Values
- **99 or null** = Unranked
- **1-25** = Ranked (AP/Coaches poll)
- **Check:** `rankings[0].current` or `rankings[0].value`

---

## Quick Field Verification Checklist

| Field | Location | Notes |
|-------|----------|-------|
| `conferenceId` | Scoreboard: `competitor.team.conferenceId` | Conference ID (e.g., `"8"` for SEC) |
| `displayName` | Scoreboard: `name` | Format: "{away} @ {home}" |
| `teamId` | Scoreboard: `competitor.team.id` | ESPN team ID (string) |
| `record` | Calculated from games | Conference records calculated from completed conference games |
| `ranking` | Team API: `rankings[0].current` | 99 or null = unranked |

---

## Testing Commands

```bash
# Test ESPN data pipeline
npm run test:reshape

# Check test database (ESPN snapshots)
npm run test:db:check
```

---

**For comprehensive ESPN testing procedures, see [espn-api-testing.md](./espn-api-testing.md).**

