# SEC Football Standings Simulator - Technical Specification

**Last Updated:** 2024-11-05  
**Status:** ESPN API R&D Phase

---

## 1. Objective

Automate schedule and standings ingestion for SEC football using ESPN public JSON API. Persist normalized data in MongoDB via Mongoose (lean mode). Serve data through Next.js App Router Route Handlers for a Tailwind-based React UI. Allow user "what-if" overrides and deterministic tiebreaker calculations.

---

## 2. Scope & Phases

### Phase 1: SEC Football Regular Season

- SEC conference games only (hide non-conference from UI)
- Tiebreaker rules A-D (head-to-head through opponent win%)
- Basic simulation with user overrides
- Week 0-16 regular season (weeks with no games auto-skip, only active weeks in UI)

### Phase 2: Enhanced Tiebreakers

- Implement Tiebreaker E (scoring margin)
- Richer explanations for standings

### Phase 3: Multi-Conference

- Abstract tiebreaker rules per conference
- Add conference metadata storage

### Phase 4: Live Score Streaming

- Client-side polling every 30 seconds during active games
- No SSE/WebSocket needed for Phase 1-3

### Phase 5: Basketball Support

- Apply same architecture to basketball

---

## 3. Stack

- **Framework:** Next.js 14+ App Router
- **Language:** TypeScript (strict mode)
- **Database:** MongoDB Atlas
- **ORM:** Mongoose (lean mode, no hydration)
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (serverless)
- **Client Cache:** RTK Query (optional)

---

## 4. ESPN API Integration

### 4.1 Confirmed Working Endpoints

#### Scoreboard (Primary Data Source)

```
GET http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=8
```

**Query Parameters:**

- `groups=8` - Filters to SEC conference (ID 8)
- `season=YYYY` - Optional, defaults to current season
- `seasontype=2` - Optional, regular season (default)
- `week=N` - Optional, specific week (1-16)

**Response Structure:**

- Returns current week by default
- Includes both conference and non-conference games
- `conferenceCompetition: true` identifies SEC vs SEC games
- All team metadata embedded (names, logos, colors, conferenceId)

#### Individual Game (For Live Polling)

```
GET http://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event={gameId}
```

**Use Case:** Poll only active games during live game windows

#### Team Metadata

```
GET http://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/{teamAbbrev}
```

**Use Case:** One-time manual seed of teams collection

### 4.2 Polling Strategy

#### Schedule Poller (Weekly)

- **Runs:** Sundays at 3 AM (low traffic)
- **Period:** July 1 - December 1 (every season)
- **Action:** Poll weeks 0-16, upsert new/updated games to MongoDB
- **Optimization:** Only fetch weeks from (current_week) onwards to avoid re-polling completed weeks
  - Week 1 initial pull: fetch weeks 0-16
  - Week 3 pull: fetch weeks 3-16 (skip weeks 1-2, already in DB and completed)
  - Week 14 pull: fetch weeks 14-16 (skip weeks 0-13)
- **Week Range:** 0-16 includes entire regular season; empty weeks contribute 0 games
- **Endpoint:** Individual week queries `?groups=8&week={0..16}` in loop

#### Live Score Poller (During Games)

- **Runs:** Every 30 seconds
- **Condition:** Only when games have `status.type.state === "in"`
- **Action:** Query MongoDB for active games, poll those game IDs individually
- **Endpoint:** Individual game summary per gameId

#### Smart Activation

- Schedule poller detects upcoming games (within 2 hours of kickoff)
- Activates live poller when first game goes live
- Deactivates when all games reach `status.type.completed === true`

### 4.3 Data We Extract from ESPN

**Always Rely on ESPN (Don't Calculate):**

- ✅ Game scores (home/away)
- ✅ Game status (`"pre"`, `"in"`, `"post"`)
- ✅ Completed flag (`status.type.completed`)
- ✅ Game date/time (ISO format)
- ✅ Week number
- ✅ Conference game flag (`conferenceCompetition`)
- ✅ Team IDs, names, abbreviations
- ✅ Team logos and colors
- ✅ Rankings (`curatedRank.current`, 99 = unranked)
- ✅ Betting odds and favorite (`odds[0].awayTeamOdds.favorite`)
- ✅ Conference records (`records` array, `type: "vsconf"`)
- ✅ Neutral site indicator

**Calculate Ourselves:**

- Conference standings (W-L from games)
- Tiebreaker results
- Opponent win percentages
- Scoring averages (for Tiebreaker E)

### 4.4 Field Path Reference

```typescript
// Game Status
event.status.type.state; // "pre" | "in" | "post"
event.status.type.completed; // boolean
event.status.clock; // number
event.status.period; // 0-4 (quarter)

// Conference Check
event.competitions[0].conferenceCompetition; // boolean
event.competitions[0].groups.id; // "8" for SEC

// Teams
event.competitions[0].competitors[0].team.id; // "333"
event.competitions[0].competitors[0].team.abbreviation; // "ALA"
event.competitions[0].competitors[0].team.displayName; // "Alabama Crimson Tide"
event.competitions[0].competitors[0].team.logo; // URL
event.competitions[0].competitors[0].team.color; // hex
event.competitions[0].competitors[0].team.conferenceId; // "8"

// Scores
event.competitions[0].competitors[0].score; // "0" (string!)

// Rankings
event.competitions[0].competitors[0].curatedRank.current; // 5 or 99

// Records
event.competitions[0].competitors[0].records.find((r) => r.type === 'vsconf').summary; // "5-1"

// Odds
event.competitions[0].odds[0].awayTeamOdds.favorite; // boolean
event.competitions[0].odds[0].details; // "UGA -8.5"
event.competitions[0].odds[0].overUnder; // 56.5
```

---

## 5. Data Models

### 5.1 MongoDB Collections

#### `games` Collection

```typescript
{
  _id: ObjectId,                    // MongoDB generated
  espnId: string,                   // "401752762" (ESPN game ID)
  date: string,                     // ISO: "2025-11-08T17:00Z"
  week: number | null,              // 1-16, null for bowls
  season: number,                   // 2025
  state: "pre" | "in" | "post",     // Game status
  completed: boolean,               // Final or not
  conferenceGame: boolean,          // conferenceCompetition value
  neutralSite: boolean,
  home: {
    teamId: string,                 // "344"
    abbrev: string,                 // "MSST"
    score: number | null,           // Parsed to number, null if no score
    rank: number | null             // 1-99, null if unranked
  },
  away: {
    teamId: string,
    abbrev: string,
    score: number | null,
    rank: number | null
  },
  odds: {
    favoriteTeamId: string | null,  // Determined from odds.awayTeamOdds.favorite
    spread: number | null,          // 8.5
    overUnder: number | null        // 56.5
  },
  lastUpdated: Date                 // Timestamp of last ESPN poll
}
```

**Indexes:**

```javascript
{ espnId: 1 }                       // Unique
{ conferenceGame: 1, season: 1, week: 1 }
{ state: 1, completed: 1 }
{ "home.teamId": 1 }
{ "away.teamId": 1 }
```

#### `teams` Collection

```typescript
{
  _id: string,                      // "333" (ESPN team ID)
  espnId: string,                   // "333" (redundant for fallback)
  name: string,                     // "Alabama"
  displayName: string,              // "Alabama Crimson Tide"
  abbreviation: string,             // "ALA"
  logo: string,                     // Full URL
  color: string,                    // Hex: "9e1632"
  alternateColor: string,           // Hex: "ffffff"
  conferenceId: string              // "8"
}
```

**Indexes:**

```javascript
{
  _id: 1;
} // Primary
{
  conferenceId: 1;
}
```

**Population:** Manual seed from ESPN API after testing

#### `errors` Collection (For Debugging)

```typescript
{
  _id: ObjectId,
  timestamp: Date,
  endpoint: string,                 // "/api/pull"
  payload: object,                  // Request body
  error: string,                    // Error message
  stackTrace: string
}
```

### 5.2 Mongoose Configuration

- **Connection:** Singleton pattern, reuse across serverless invocations
- **Schema:** Strict mode, typed
- **Reads:** Always use `.lean()` (no hydration, plain objects)
- **Writes:** Mongoose methods (no raw MongoDB calls)
- **Disabled:** pre/post hooks, virtuals, plugins, populate (unless explicitly needed), autoIndex in production

---

## 6. API Routes (Next.js App Router)

All routes:

```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

### 6.1 POST /api/pull

**Purpose:** Poll ESPN, normalize, upsert games into MongoDB

**Body:**

```typescript
{
  season: number,        // 2025
  conferenceId: number   // 8
}
```

**Response:**

```typescript
{
  upserted: number,      // Count of games upserted
  lastUpdated: string    // ISO timestamp
}
```

**Headers:**

```
Cache-Control: no-store
```

**Triggered by:** Vercel Cron or manual

### 6.2 GET /api/games

**Purpose:** Query games with filters

**Query Params:**

```
?conferenceId=8
&season=2025
&week=11
&state=in            // Optional: "pre" | "in" | "post"
&from=2025-11-01     // Optional date range
&to=2025-11-30
```

**Response:**

```typescript
{
  events: GameDoc[],
  teams: { id: string, abbrev: string, displayName: string, logo: string }[],
  lastUpdated: string
}
```

**Headers:**

```
Cache-Control: public, s-maxage=60
// During live games: s-maxage=10
```

### 6.3 POST /api/simulate

**Purpose:** Run tiebreaker engine with user overrides

**Body:**

```typescript
{
  season: number,
  conferenceId: number,
  overrides: Array<{
    gameId: string,      // espnId
    winnerTeamId: string // Override winner
  }>
}
```

**Response:**

```typescript
{
  standings: Array<{
    rank: number,
    teamId: string,
    name: string,
    record: { w: number, l: number },
    confRecord: { w: number, l: number },
    explainPosition: string[]  // ["Best conference record (8-0)", "Beat Georgia head-to-head"]
  }>,
  championship: [string, string],  // Top 2 team IDs
  tieLogs: Array<{
    teams: string[],
    steps: Array<{
      rule: string,      // "Head-to-Head"
      detail: string,    // "UGA: 2-0, ALA: 1-1"
      survivors: string[]
    }>
  }>
}
```

**Headers:**

```
Cache-Control: no-store
```

### 6.4 Error Response Format

All endpoints return errors as:

```typescript
{
  error: string,
  code: "VALIDATION_ERROR" | "DB_ERROR" | "ESPN_ERROR" | "UNKNOWN_ERROR"
}
```

---

## 7. Tiebreaker Engine (SEC Rules)

**Official Source:** https://www.secsports.com/news/2024/08/sec-announces-football-tie-breaking-process

### 7.1 Rules (In Order)

**A. Head-to-Head**

- Compare records among tied teams only
- If unequal, highest wins

**B. Record vs Common Conference Opponents**

- Identify opponents all tied teams played
- Compare records against those common opponents

**C. Record vs Highest-Placed Common Opponent**

- Calculate preliminary standings (by W-L only)
- Find highest-ranked team all tied teams played
- Compare records against that team
- If tied, repeat with next-highest common opponent

**D. Cumulative Conference Win% of All Opponents**

- For each tied team, sum conference W-L of all their opponents
- Calculate win percentage
- Highest wins

**E. Capped Relative Scoring Margin** (Phase 2)

- Per SEC Appendix A: 42-point offensive cap, 48-point defensive cap
- Compare how teams performed relative to opponent averages
- Complex formula - defer to Phase 2

**F. Random Draw** (Commissioner-overseen)

- Display "Tie unresolved by rules A-E" in UI
- Optional: User can click button to randomly draw winner (fun feature)

### 7.2 Algorithm Flow

```
1. Calculate base standings (by conference W-L record)
2. Identify tie groups at each position
3. For each tie group:
   a. Apply Rule A
   b. If still tied (multi-way), apply Rule B
   c. If still tied, apply Rule C (requires preliminary standings)
   d. If still tied, apply Rule D
   e. If still tied, mark as "Random Draw"
   f. If one team eliminated, RESTART from Rule A with remaining teams
4. Return full standings 1-16 with explanations
```

### 7.3 Implementation Details

- **Pure TypeScript function:** No I/O, testable
- **Inputs:** `teamIds[]`, `GameDoc[]`, `overrides[]`
- **Deterministic:** Same inputs always produce same outputs
- **Cascading:** When tie broken partially, restart tiebreakers for remaining teams
- **Explanations:** Return step-by-step reasoning for each team's position

---

## 8. UI Behavior

### 8.1 Game Display

- Render each game as **two side-by-side buttons** (home vs away)
- One button must be "selected" (winner)
- Prefill logic (priority order):
  1. **Past results** (if game completed)
  2. **Real-time scores** (if game in progress, current leader)
  3. **Favored team** (from ESPN odds data)
  4. **Higher-ranked team** (fallback if no odds)
  5. **Home team** (final fallback)

### 8.2 User Overrides

**Form Input Design:**

- User enters custom scores for each game (home and away)
- Inputs prefilled with `predictedScore` (guaranteed valid defaults)
- Validation on submit: no ties, non-negative, whole numbers only
- Only valid overrides stored in `localStorage`

**Storage:**

- Key: `sec-tiebreaker-overrides-{season}`
- Value: `{ [gameEspnId]: { homeScore: number, awayScore: number } }` map
- **Critical:** Uses `game.espnId` (ESPN game ID) as key, not MongoDB `_id`
- Only valid scores persisted (invalid state never stored)
- "Reset to Live" button:
  1. Fetches fresh data from cron job
  2. Calls `/api/games` to get updated predicted scores
  3. Clears all overrides from localStorage
  4. Refills form inputs with new predicted scores

### 8.3 Simulation Flow

1. User changes game outcomes
2. Click "Simulate Standings"
3. POST to `/api/simulate` with override map
4. Display returned standings with explanations
5. Highlight top 2 teams (championship participants)

### 8.4 Visibility Toggle

- Default: Show only future/in-progress games
- Toggle: "Show completed games"
- Separate section for completed games during season

---

## 9. Caching Strategy

### Server-Side

- `/api/pull` → No cache (always fresh write)
- `/api/games` → `s-maxage=60` (1 min CDN cache), `s-maxage=10` during live games
- `/api/simulate` → No cache (depends on user overrides)

### Client-Side (RTK Query)

- GET `/api/games` → Cache 60s, refetch on window focus
- Polling: Every 30s during game day (9 AM - 11 PM Saturdays)
- POST `/api/simulate` → Never cached

---

## 10. Performance Targets

- P95 GET `/api/games` ≤ 120 ms
- P95 POST `/api/simulate` ≤ 150 ms
- Schedule poller full season upsert ≤ 2 sec
- Cold start (Next.js + Mongoose) ≤ 1.5 sec

---

## 11. Testing Strategy

### Unit Tests

- Tiebreaker rules A-D with known scenarios
- Override application logic
- Conference record calculation

### Integration Tests

- Mock ESPN API responses
- Full flow: `/api/pull` → `/api/games` → `/api/simulate`
- Test with 2024 actual SEC season data

### Fixtures

- Store past season JSON responses for regression testing

---

## 12. Deployment

- **Platform:** Vercel
- **Environment:** Serverless functions (Node.js runtime)
- **Database:** MongoDB Atlas (free tier sufficient for Phase 1)
- **Cron:** Vercel Cron for weekly schedule polls
- **Logs:** Descriptive errors to console, consider Datadog/LogRocket (free tier)

---

## QUESTIONS FOR NOW (All Resolved ✅)

### ESPN API - Resolved

1. ✅ **Historical Data:** Can fetch past weeks with completed scores using `?year=YYYY&week=N`
   - Returns final scores, status "post", and completed flag
   - Use `year` parameter (not `season`)

2. ✅ **Per-Game Polling:** Individual endpoint returns same data, different structure
   - Path: `.header.competitions[0]` instead of `.competitions[0]`
   - Safe for live polling, requires adjusted parsing

3. ✅ **Conference Record Source:** Trust ESPN's `type: "vsconf"` records
   - More reliable than calculating from games
   - Available in every competitor object

4. ✅ **Odds Data Availability:** Non-conference games lack odds
   - Check `odds.length > 0` before accessing
   - Fallback order: favorite (if odds) → ranking → home team

5. ✅ **Week 0 and Bowl Games:** Both return empty with null week/season
   - Safely filtered by week 1-16 queries
   - Phase 1 can ignore special weeks

---

## QUESTIONS FOR LATER (Non-Blocking)

### Phase 2+

- Tiebreaker E scoring margin formula - need SEC Appendix A full text
- Multi-conference tiebreaker rule abstraction design
- Basketball season structure differences

### Optimization

- Should we cache tiebreaker calculations for common scenarios?
- Compound MongoDB indexes - which query patterns are most common?
- Should we precompute standings nightly and cache?

### Features

- Shareable scenario URLs (encode overrides in URL params)
- Historical season replays
- "What if" simulator with undo/redo
- Export standings to image/PDF

### Scaling

- If >10k users, move live polling to separate service?
- CDN strategy for game data during peak traffic?

---

## CURRENT STATUS

**Phase:** ESPN API R&D Complete ✅

**Completed Tests:**

1. ✅ Scoreboard endpoint with `?groups=8` works
2. ✅ Returns current week by default
3. ✅ Includes non-conference games (filterable via `conferenceCompetition`)
4. ✅ All needed metadata present (teams, scores, status, odds, rankings)
5. ✅ Historical weeks retrievable with `?year=YYYY&week=N`
6. ✅ Individual game endpoint has usable structure at `.header.competitions[0]`
7. ✅ Conference records available via `type: "vsconf"` in records array
8. ✅ Odds data present for conference games, missing for non-conf
9. ✅ Week 0 and bowl games safely filtered by standard week queries

**Blocking Questions Resolved:** ALL 5

**Next Phase:** Implementation ready

- Database models finalized
- API routes spec complete
- Tiebreaker rules researched
- ESPN integration fully validated

---

## ESPN API Test Log

### Test 1: Current Week (✅ Success)

**Endpoint:** `http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=8`

**Findings:**

- Returns week 11 (current week) automatically
- 6 games returned (5 conference, 1 non-conference)
- All required fields present and structured as expected
- `conferenceCompetition: true` correctly identifies conference games
- Scores stored as strings, need parsing
- Rankings: `curatedRank.current` (1-25, 99 = unranked)

### Test 2: Explicit Groups Param (✅ Success)

**Endpoint:** Same as Test 1

**Findings:**

- Confirmed `?groups=8` filters to SEC teams (not just SEC vs SEC)
- Non-SEC opponents included (The Citadel with `conferenceId: "29"`)
- This is correct behavior - we filter by `conferenceCompetition` flag

### Test 3: Historical Week (✅ Success)

**Endpoint:** `http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=8&week=1&year=2025`

**Findings:**

- Use `year` parameter instead of `season` (parameter name is confusing)
- Week parameter works with year filter
- Returns 16 games for requested week
- All completed games show `status.type.state === "post"` and `status.type.completed === true`
- Final scores are available in string format like "61" and "6"
- ✅ CONFIRMED: We can fetch historical weeks with completed final scores

### Test 4: Individual Game Endpoint (✅ Success)

**Endpoint:** `http://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event={gameId}`

**Findings:**

- Different structure than scoreboard endpoint
- Game data located in `.header.competitions[0]` instead of `.competitions[0]`
- Returns full standings in `.standings` object with conference groupings
- Has additional data: boxscore, predictions, win probability, etc.
- ✅ CONFIRMED: Same basic structure as scoreboard but nested differently. Can use for live polling but requires path adjustments

### Test 5: Conference Records Source (✅ Success)

**Endpoint:** Scoreboard with `?groups=8`

**Findings:**

- Scoreboard competitors have `.records` array with multiple types:
  - `type: "total"` → Overall record (e.g., "5-4")
  - `type: "homerecord"` → Home games (e.g., "3-2")
  - `type: "awayrecord"` → Away games (e.g., "2-2")
  - `type: "vsconf"` → Conference record (e.g., "1-4")
- ✅ DECISION: Trust ESPN's `type: "vsconf"` summary for accuracy. No need to calculate ourselves

### Test 6: Odds Data Availability (✅ Success)

**Findings:**

- Odds ARE available in scoreboard as `.competitions[0].odds` array
- Non-conference games (like MISS vs Citadel) have NO odds data
- Conference games always have odds with:
  - `.details` → spread string (e.g., "UGA -8.5")
  - `.awayTeamOdds.favorite` → boolean indicating favorite team
- ✅ DECISION: Check if `odds.length > 0` before accessing. Fallback to ranking, then home team

### Test 7: Week 0 and Bowl Games (✅ Complete)

**Findings:**

- Week 0 (`?week=0`) returns empty events array with null week/season
- Bowl games (`?week=18`) also return null week/season with empty events
- 2025 regular season has games in weeks 1-14, weeks 15-16 empty
- ✅ DECISION: Poll weeks 0-16 every week. Empty weeks contribute 0 games to DB. Smart polling skips already-completed weeks (Week 3 poll: fetch weeks 3-16 only)

---

## Handoff Notes

- All poller logic decisions finalized (weekly schedule + live game polling)
- Data models ready for implementation
- Tiebreaker rules A-D researched and understood
- Need to complete ESPN API R&D before building
- Consider MongoDB connection pooling strategy for serverless
- localStorage override pattern is simple and sufficient for Phase 1
