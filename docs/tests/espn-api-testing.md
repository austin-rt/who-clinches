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

## Core Records API

**Endpoint**: `http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/{year}/types/2/teams/{teamId}/records`

**Record Types**: Overall (`name: "overall"`), Home (`type: "homerecord"`), Away (`type: "awayrecord"`), Conference (`type: "vsconf"`)

**Stats**: Flat array, search by stat name (`avgPointsFor`, `avgPointsAgainst`, `wins`, `losses`, `gamesPlayed`, `differential`)

**Types**: ✅ Correct (`ESPNCoreRecordResponse`, `ESPNRecordItem`)

---

## Constants

**Conference IDs**: `SEC_CONFERENCE_ID = 8` (scoreboard), `SEC_CONFERENCE_ID_ALT = 80` (team API)

**Record Types**: `RECORD_TYPE_OVERALL = 'overall'`, `RECORD_TYPE_HOME = 'homerecord'`, `RECORD_TYPE_AWAY = 'awayrecord'`, `RECORD_TYPE_CONFERENCE = 'vsconf'`

**Stat Names**: `STAT_AVG_POINTS_FOR`, `STAT_AVG_POINTS_AGAINST`, `STAT_WINS`, `STAT_LOSSES`, `STAT_GAMES_PLAYED`, `STAT_DIFFERENTIAL`

---

## Type Verification

All ESPN API types are **CORRECT** ✅: `ESPNScoreboardResponse`, `ESPNEvent`, `ESPNCompetition`, `ESPNCompetitor`, `ESPNTeamResponse`, `ESPNTeamRecord`, `ESPNCoreRecordResponse`, `ESPNRecordItem`

**Note**: TypeScript errors were caused by incorrect USAGE, not incorrect type definitions.

---

## Testing Recommendations

**Before Each Season**: Test scoreboard (`?groups=8&week=1&year=YYYY`), team API (`/teams/61`), Core Records API (`/seasons/YYYY/types/2/teams/61/records`), verify conference IDs and stat names unchanged

**During Season**: Monitor for API structure changes, new stat fields, odds data availability, test with pre-game and live games

---

## Known Issues & Workarounds

**Future Season Returns Null**: Core API returns null stats for future seasons → Fall back to Site API stats from `team.record.items[0].stats` (implemented in cron jobs)

**Conference ID Mismatch**: Scoreboard uses "8", Team API uses "80" → Use `conferenceCompetition` boolean flag instead of comparing IDs (we check `conferenceGame` field)

**No Conference Record**: Core API type "vsconf" may not exist for current/future seasons → Allow null, don't fail if missing (`conferenceRecord?.summary || null`)

---

## API Rate Limiting & Compression

**Rate Limiting**: No explicit limits observed, best practice: 500ms delay between requests (implemented in cron jobs)

**Compression**: ESPN APIs return gzip compressed responses. Use `--compressed` flag with curl, Fetch API handles automatically in Node.js
