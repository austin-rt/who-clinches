# ESPN API Testing & Verification

Testing results from actual ESPN API calls to verify our type definitions and usage.

**Test Date**: 2025-11-12  
**Season Tested**: 2025, Week 12

---

## API Inconsistencies Discovered

### Conference ID Inconsistency

ESPN uses **different conference IDs** in different APIs:

| API | Conference ID | Usage |
|-----|---------------|-------|
| **Scoreboard API** | `"8"` | Query parameter: `?groups=8`<br/>Response: `competitor.team.conferenceId = "8"` |
| **Team API** | `"80"` | Response: `team.groups.parent.id = "80"` |
| **Core Records API** | Uses team ID only | No conference ID in request/response |

**Impact on our code:**
- ✅ We use `SEC_CONFERENCE_ID = 8` for scoreboard queries (correct)
- ✅ We DON'T store conferenceId from teams (we use scoreboard's conferenceCompetition flag)
- ⚠️ If we ever query by conferenceId, need to know which API expects which value

---

## 1. Scoreboard API

**Endpoint**: `http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard`

### Test Query
```bash
curl -s --compressed "http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=8&week=12&year=2025"
```

### Key Findings

**Query Parameters:**
- ✅ `groups=8` (SEC conference)
- ✅ `week=12` (week number)
- ✅ `year=2025` (NOT `season`)

**Response Structure:**
```json
{
  "season": {"year": 2025},
  "week": {"number": 12},
  "events": [
    {
      "id": "401752772",
      "competitions": [{
        "conferenceCompetition": true,
        "neutralSite": false,
        "competitors": [
          {
            "homeAway": "home",
            "team": {
              "id": "245",
              "abbreviation": "TA&M",
              "displayName": "Texas A&M Aggies",
              "logo": "https://a.espncdn.com/i/teamlogos/ncaa/500/245.png",
              "color": "500000",
              "conferenceId": "8"  // ← Note: "8" not "80"
            },
            "score": "0",
            "curatedRank": {"current": 3}
          }
        ],
        "odds": [{
          "spread": -18.5,
          "overUnder": 47.5,
          "awayTeamOdds": {"favorite": false},
          "homeTeamOdds": {"favorite": true}
        }],
        "status": {
          "type": {
            "state": "pre",
            "completed": false
          }
        }
      }]
    }
  ]
}
```

**Our Types:** ✅ Correct (`ESPNScoreboardResponse`, `ESPNEvent`, `ESPNCompetition`, `ESPNCompetitor`)

---

## 2. Team API (Site API)

**Endpoint**: `http://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/{teamId}`

### Test Query
```bash
curl -s --compressed "http://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/61"
```

### Key Findings

**Response Structure:**
```json
{
  "team": {
    "id": "61",
    "name": "Bulldogs",
    "displayName": "Georgia Bulldogs",
    "abbreviation": "UGA",
    "color": "ba0c2f",
    "alternateColor": "ffffff",
    "logos": [
      {
        "href": "https://a.espncdn.com/i/teamlogos/ncaa/500/61.png",
        "width": 500,
        "height": 500
      }
    ],
    "groups": {
      "parent": {
        "id": "80"  // ← Note: "80" not "8"
      }
    },
    "rank": 5,
    "standingSummary": "3rd in SEC",
    "record": {
      "items": [
        {
          "summary": "8-1",
          "stats": [
            {
              "name": "gamesPlayed",
              "value": 9.0
            }
          ]
        }
      ]
    }
  }
}
```

**Our Types:** ✅ Correct (`ESPNTeamResponse`, `ESPNTeamRecord`)

---

## 3. Core Records API

**Endpoint**: `http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/{year}/types/2/teams/{teamId}/records`

### Test Query
```bash
curl -s "http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/teams/61/records"
```

### Key Findings

**Response Structure:**
```json
{
  "count": 10,
  "items": [
    {
      "id": "0",
      "name": "overall",
      "type": "total",
      "summary": "11-2",
      "stats": [
        {
          "name": "avgPointsAgainst",
          "value": 20.384615
        },
        {
          "name": "avgPointsFor",
          "value": 33.153847
        },
        {
          "name": "gamesPlayed",
          "value": 13.0
        },
        {
          "name": "wins",
          "value": 11.0
        },
        {
          "name": "losses",
          "value": 2.0
        },
        {
          "name": "differential",
          "value": 166.0
        }
      ]
    },
    {
      "id": "2",
      "name": "Home",
      "type": "homerecord",
      "summary": "6-0"
    },
    {
      "id": "3",
      "name": "Away",
      "type": "awayrecord",
      "summary": "2-2"
    },
    {
      "id": "4",
      "name": "vs. Conf.",
      "type": "vsconf",
      "summary": "6-2"
    }
  ]
}
```

**Important Notes:**
- Stats are a **flat array**, not nested objects
- Different record types: `"overall"`, `"homerecord"`, `"awayrecord"`, `"vsconf"`
- Find record by `name` or `type` field
- Extract stats by searching array for stat name

**Our Types:** ✅ Correct (`ESPNCoreRecordResponse`, `ESPNRecordItem`)

---

## Constants to Define

Based on testing, here are the constants we should define:

```typescript
// Conference IDs (ESPN is inconsistent!)
export const SEC_CONFERENCE_ID = 8;           // For scoreboard queries (groups=8)
export const SEC_CONFERENCE_ID_ALT = 80;      // For team API (groups.parent.id)

// Record types from Core API
export const RECORD_TYPE_OVERALL = "overall";
export const RECORD_TYPE_HOME = "homerecord";
export const RECORD_TYPE_AWAY = "awayrecord";
export const RECORD_TYPE_CONFERENCE = "vsconf";

// Stat names from Core API
export const STAT_AVG_POINTS_FOR = "avgPointsFor";
export const STAT_AVG_POINTS_AGAINST = "avgPointsAgainst";
export const STAT_WINS = "wins";
export const STAT_LOSSES = "losses";
export const STAT_GAMES_PLAYED = "gamesPlayed";
export const STAT_DIFFERENTIAL = "differential";
```

---

## Type Verification Summary

All our ESPN API types are **CORRECT** ✅:

- `ESPNScoreboardResponse` - Matches actual scoreboard response
- `ESPNEvent` - Matches event structure  
- `ESPNCompetition` - Matches competition structure
- `ESPNCompetitor` - Matches competitor structure
- `ESPNTeamResponse` - Matches team API response
- `ESPNTeamRecord` - Matches team record structure
- `ESPNCoreRecordResponse` - Matches Core API response
- `ESPNRecordItem` - Matches record item structure

**The TypeScript errors were caused by incorrect USAGE of the types, not incorrect type definitions.**

---

## Testing Recommendations

### Before Each Season
1. Test scoreboard API with current week: `?groups=8&week=1&year=YYYY`
2. Test team API with known team: `/teams/61` (Georgia)
3. Test Core Records API: `/seasons/YYYY/types/2/teams/61/records`
4. Verify conference IDs haven't changed
5. Verify stat names in Core API response

### During Season
1. Monitor for API structure changes
2. Check if new stat fields are added
3. Verify odds data availability
4. Test with both pre-game and live games

---

## Known Issues & Workarounds

### Issue 1: Future Season Returns Null
**Problem**: Core API returns null stats for 2025 season (future season)  
**Workaround**: Fall back to Site API stats from team.record.items[0].stats  
**Code**: Implemented in `update-rankings` and `update-team-averages` cron jobs

### Issue 2: Conference ID Mismatch
**Problem**: Scoreboard uses "8", Team API uses "80"  
**Workaround**: Use `conferenceCompetition` boolean flag from scoreboard instead of comparing IDs  
**Code**: We check `conferenceGame` field (set from `conferenceCompetition`)

### Issue 3: No Conference Record in 2025
**Problem**: Core API type "vsconf" may not exist for current/future seasons  
**Workaround**: Allow null for conference record, don't fail if missing  
**Code**: `conferenceRecord?.summary || null`

---

## API Rate Limiting

Based on testing:
- **No explicit rate limits** observed
- **Best practice**: 500ms delay between requests
- **Implemented in**: `update-rankings` and `update-team-averages` (see `setTimeout` calls)

---

## Compression

ESPN APIs return **gzip compressed** responses by default.

**Requirements:**
- Use `--compressed` flag with curl
- Fetch API handles automatically in Node.js
- Add `Accept-Encoding: gzip` header if needed

