import {
  GRAPHQL_ALLOWED_ROOTS,
  MAX_ROOT_FIELDS,
  MAX_ROOT_LIMIT,
  MAX_DEPTH,
} from './cfbd-graphql-validator';

export const CFBD_GRAPHQL_CATALOG = `
## CFBD GraphQL (cfbd_graphql_query) — PREFER THIS OVER cfbd_lookup

A Hasura GraphQL API over the same College Football Data. It is faster than the REST tool,
returns exactly the fields you ask for, and does not consume the REST call quota. Reach for
it first. Fall back to cfbd_lookup only for data with no GraphQL equivalent (play-by-play,
drives, advanced/box-score stats, records, win probability).

### Argument shape
Every root field takes: where, orderBy, limit, offset, distinctOn.
Comparison operators: _eq _neq _gt _gte _lt _lte _in _nin _like _ilike _isNull _and _or _not

### Rules you must follow
- query operations only, one per call
- no variables — inline literal values
- every root field needs a literal limit (max ${MAX_ROOT_LIMIT})
- at most ${MAX_ROOT_FIELDS} root fields per query
- max nesting depth ${MAX_DEPTH}
- no __schema / __type introspection — the field reference below is the schema

### Available root fields
${Array.from(GRAPHQL_ALLOWED_ROOTS).sort().join(', ')}

### Key fields
game: id, season, week, seasonType, startDate, startTimeTbd, status, homeTeamId, homeTeam,
  homePoints, homeConference, homeClassification, awayTeamId, awayTeam, awayPoints,
  awayConference, awayClassification, venueId, neutralSite, conferenceGame, notes,
  excitement, homeStartElo, homeEndElo, lines { spread overUnder provider { name } }
  NOTE: season not year. homeTeamId not homeId. status not completed.
  There is no single conference field — filter with
  _or: [{homeConference: {_eq: "SEC"}}, {awayConference: {_eq: "SEC"}}]

scoreboard: id, status, currentClock, currentPeriod, currentPossession, lastPlay,
  homeTeam, homePoints, awayTeam, awayPoints, spread, overUnder, venue, city, tv
  NOTE: its "state" field is the venue's US state, not the game state. Use status.

historicalTeam: id, school, mascot, abbreviation, conference, division, classification,
  color, altColor, images, startYear, endYear, active
  NOTE: one row per conference stint. Bound it by season:
  startYear: {_lte: 2025}, _or: [{endYear: {_isNull: true}}, {endYear: {_gte: 2025}}]

ratings: teamId, team, year, conference, spOverall, spOffense, spDefense, fpi, elo, srs
  NOTE: filters on year, not season. SP+, FPI, Elo and SRS all live here.

poll: season, week, seasonType, pollType { name }, rankings { rank points team { school } }
  NOTE: the CFP poll is named "Playoff Committee Rankings".

calendar: year, week, seasonType, startDate, endDate
conference: id, name, abbreviation, shortName
gameLines: gameId, provider { name }, spread, overUnder, moneylineHome, moneylineAway

### Example
{ game(where: {season: {_eq: 2025}, _or: [{homeConference: {_eq: "SEC"}}, {awayConference: {_eq: "SEC"}}]}, limit: 25) { id week homeTeam homePoints awayTeam awayPoints status } }
`.trim();
