# ESPN API Testing & Verification

Testing results from ESPN API calls to verify type definitions and usage.

**Test Date**: 2025-11-12 | **Season**: 2025, Week 12

**Related:** [ESPN Data Pipeline Testing](./espn-data-pipeline.md) | [Generated Types Workflow Testing](./generated-types-workflow-testing.md)

---

## API Inconsistencies

**Conference ID Mismatch**: Scoreboard API uses `"8"`, Team API uses `"80"`. We use `SEC_CONFERENCE_ID = 8` for scoreboard (correct), don't store conferenceId from teams (use `conferenceCompetition` flag).

---

## Scoreboard API

**Endpoint**: `http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard`

**Query**: `?groups=8&week=12&year=2025` (note: `year` not `season`)

**Key Fields**: `conferenceCompetition: true`, `competitor.team.conferenceId: "8"`, `odds.spread`, `odds.overUnder`, `status.type.state`

**Types**: ✅ Correct (`ESPNScoreboardResponse`, `ESPNEvent`, `ESPNCompetition`, `ESPNCompetitor`)

---

## Team API (Site API)

**Endpoint**: `http://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/{teamId}`

**Key Fields**: `team.groups.parent.id: "80"` (note: "80" not "8"), `team.color`, `team.alternateColor`, `team.record.items[0].summary`

**Types**: ✅ Correct (`ESPNTeamResponse`, `ESPNTeamRecord`)

---

## Conference Records

**Implementation**: Conference records are **calculated locally** from completed conference games stored in the database, not fetched from ESPN API.

**Calculation**: When games are fetched/updated via `POST /api/games/[sport]/[conf]`, the system:
1. Queries all completed conference games for the season (`conferenceGame: true`, `completed: true`, scores not null)
2. Calculates wins/losses for each team based on game results
3. Updates team records in the database with format `"W-L"` (e.g., "7-1")


**Note**: This replaces the previous ESPN Core Records API integration for improved reliability and consistency.

---

## Constants

**Conference IDs**: `SEC_CONFERENCE_ID = 8` (scoreboard), `SEC_CONFERENCE_ID_ALT = 80` (team API)

---

## Type Verification

All ESPN API types are **CORRECT** ✅: `ESPNScoreboardResponse`, `ESPNEvent`, `ESPNCompetition`, `ESPNCompetitor`, `ESPNTeamResponse`, `ESPNTeamRecord`

**Note**: TypeScript errors were caused by incorrect USAGE, not incorrect type definitions.

---

## Testing Recommendations

**Before Each Season**: Test scoreboard (`?groups=8&week=1&year=YYYY`), team API (`/teams/61`), verify conference IDs unchanged, verify conference record calculation from games

**During Season**: Monitor for API structure changes, new stat fields, odds data availability, test with pre-game and live games

---

## Known Issues & Workarounds

**Conference ID Mismatch**: Scoreboard uses "8", Team API uses "80" → Use `conferenceCompetition` boolean flag instead of comparing IDs (we check `conferenceGame` field)

**Conference Records**: Calculated from completed games in database, not from ESPN API → Records update automatically when games are completed and fetched

**ESPN API Quirks:**
- Conference ID: Scoreboard API uses "8", Team API may return "80"
- Record Types: Use `name` for overall ("overall"), `type` for others ("homerecord", "awayrecord", "vsconf")
- Ranking Values: 99 or null means unranked

---

## API Rate Limiting & Compression

**Rate Limiting**: No explicit limits observed, best practice: 500ms delay between requests (implemented in cron jobs)

**Compression**: ESPN APIs return gzip compressed responses. Use `--compressed` flag with curl, Fetch API handles automatically in Node.js
