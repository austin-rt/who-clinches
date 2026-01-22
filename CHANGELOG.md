# Changelog

All notable changes to the Who Clinches project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **⚠️ HISTORICAL NOTE**: This changelog contains historical entries from earlier versions of the application. Many entries reference features that no longer exist (MongoDB, ESPN API, cron jobs, database models). The current implementation uses only the CFBD API with no database persistence. See [README.md](./README.md) and [docs/ai-guide.md](./docs/ai-guide.md) for current architecture.

## [Unreleased]

### Added

#### New Features

- **Game Display Name**: Added `displayName` field to Game model with format `"{away abbrev} @ {home abbrev}"` (e.g., "UGA @ TEX") (historical - no database models exist)
- **Predicted Score Logic**: Implemented `predictedScore` field for all conference games
  - Completed games: Uses real scores
  - Incomplete games: Calculates from spread + team season averages
  - In-progress 0-0 games: Uses spread until someone scores
- **Dual Cron System**: Created separate configurations for Vercel Hobby and Pro plans
  - `vercel.json`: Hobby plan (2 cron jobs, daily frequency)
  - `vercel.pro.json`: Pro plan (6 cron jobs, sub-hourly frequency for live games)

#### API Endpoints

- **POST /api/simulate**: Tiebreaker simulation endpoint
  - Accepts optional game outcome overrides
  - Returns full standings with explanations
  - Implements SEC Rules A-E
- **Cron Jobs**: 4 endpoints for automated data updates (historical - these endpoints no longer exist, all data is fetched on-demand from CFBD API)
  - `/api/cron/update-games`: Updates scores and states for games (supports allGames parameter)
  - `/api/cron/update-spreads`: Updates betting odds (Pro mode)
  - `/api/cron/update-rankings`: Updates team rankings and statistics
  - `/api/cron/update-team-averages`: Updates season averages (Pro mode)

#### Helper Functions

- `calculatePredictedScore()`: Determines predicted scores based on game state
- `reshapeScoreboardData()`: Transforms ESPN API responses
- Tiebreaker helpers: `ruleA_HeadToHead`, `ruleB_CommonOpponents`, `ruleC_DivisionalRecord`, `ruleD_ConfWinPct`, `ruleE_ScoringMargin`

#### Documentation

- **API Reference** (`docs/api-reference.md`): Complete endpoint documentation
- **Testing Guides**: Updated all test documents with new field verification
  - `docs/tests/espn-data-pipeline.md`
  - `docs/tests/cron-jobs-testing.md`
  - `docs/tests/tiebreaker-and-simulate.md`

### Fixed

#### Critical Fixes

- **MSST Abbreviation**: Corrected `SEC_TEAMS` constant from "MSU" (Michigan State) to "MSST" (Mississippi State)
- **Duplicate Index Warning**: Removed duplicate Mongoose index definitions for `home.teamEspnId` and `away.teamEspnId`
- **Core API Fallback**: Added fallback to Site API when Core API returns null for team stats
- **Type Safety**: Fixed TypeScript errors in cron jobs related to team and game types

#### Logic Improvements

- **Score Detection**: Changed from null checks to state-based checks for determining real vs predicted scores
- **Spread Application**: Incomplete games now use spread + averages until game starts scoring
- **Dynamic Week Fetching**: `/api/pull-games` now uses ESPN calendar API to determine season weeks (no hardcoded week numbers) (historical - endpoint no longer exists)
- **Override Validation**: Added input validation for negative and non-integer scores in simulate endpoint
- **Missing Overrides**: Simulate endpoint now defaults to empty object if `overrides` field is omitted

#### Data Integrity

- **PredictedScore Consistency**: Cron jobs now always recalculate `predictedScore` and only update DB if values changed
- **Team Display Fields**: Made `displayName`, `logo`, `color` optional in Game model to allow graceful updates (historical - no database models exist)

### Changed

#### Breaking Changes

- Game model schema updated - requires database drop and re-seed for existing installations (historical - no database exists)
- `calculatePredictedScore` function signature changed to accept minimal team interface instead of `ITeam`

#### Configuration

- Vercel cron schedules updated to Eastern Time (ET) based
- Hobby plan: 2 cron jobs (daily live games, weekly rankings)
- Pro plan: 6 cron jobs (5-minute live games, hourly spreads, weekly rankings/averages)

#### API Responses

- All cron endpoints now return consistent response format with `updated`, `gamesChecked`, `espnCalls`, `lastUpdated` fields
- Simulate endpoint now returns `explainPosition` strings for each team in standings

### Technical Details

#### Database Schema Changes (Historical - No Database Exists)

**Game Model:**

- Added: `displayName` (string, required)
- Added: `predictedScore` (object with home/away numbers, optional)
- Modified: Team fields `displayName`, `logo`, `color` (changed from required to optional)

**Team Model:**

- Existing fields: `record.stats.avgPointsFor`, `record.stats.avgPointsAgainst` now actively used by prefill logic

> **Note**: These schema changes are historical. The current implementation uses CFBD API data directly with no database persistence.

#### Dependencies

- No new dependencies added
- All existing dependencies remain unchanged

#### Testing

- Comprehensive end-to-end testing completed
- All cron jobs verified functional
- Input validation tested for all endpoints
- Authentication tested (cron secrets)
- Error handling verified

---

## Development Notes

### Migration Instructions (From Previous Version)

> **⚠️ NO LONGER APPLICABLE**: The application no longer uses MongoDB or database persistence. All data is fetched directly from the CFBD API on each request. No migration is needed - simply ensure your `CFBD_API_KEY` environment variable is set. See [README.md](./README.md) for current setup instructions.

### Vercel Deployment

> **⚠️ HISTORICAL**: The application no longer uses cron jobs. All data is fetched on-demand from the CFBD API. For current deployment instructions, see [README.md](./README.md).

---

## Future Enhancements

### Planned Features

- [ ] Frontend UI for standings visualization
- [ ] User authentication for personalized simulations
- [ ] Historical standings tracking
- [ ] Real-time score updates via WebSocket
- [ ] Additional conferences (Big 10, Big 12, ACC)

### Optimization Opportunities

- [ ] Add unit tests for helper functions
- [ ] Add integration tests for API endpoints
- [ ] Implement caching for simulate endpoint
- [ ] Implement request rate limiting

---

## Contributors

- Austin (Project Lead)

---

## License

[To be determined]
