interface CfbdEndpoint {
  path: string;
  params?: string;
  neverCache?: boolean;
}

interface CfbdEndpointGroup {
  section: string;
  endpoints: CfbdEndpoint[];
}

const CFBD_ENDPOINTS: CfbdEndpointGroup[] = [
  {
    section: 'Teams',
    endpoints: [
      { path: '/teams', params: 'conference?, year?' },
      { path: '/teams/fbs', params: 'year?' },
      { path: '/teams/matchup', params: 'team1*, team2*, minYear?, maxYear?' },
      { path: '/teams/ats', params: 'year*, conference?, team?' },
      { path: '/roster', params: 'team?, year?, classification?' },
      { path: '/talent', params: 'year*' },
      { path: '/info' },
    ],
  },
  {
    section: 'Venues',
    endpoints: [{ path: '/venues' }],
  },
  {
    section: 'Conferences',
    endpoints: [{ path: '/conferences' }],
  },
  {
    section: 'Games',
    endpoints: [
      {
        path: '/games',
        params: 'year?, week?, seasonType?, classification?, team?, home?, away?, conference?, id?',
      },
      {
        path: '/games/teams',
        params: 'year?, week?, team?, conference?, classification?, seasonType?, id?',
      },
      {
        path: '/games/players',
        params: 'year?, week?, team?, conference?, classification?, seasonType?, category?, id?',
      },
      {
        path: '/games/media',
        params: 'year*, seasonType?, week?, team?, conference?, mediaType?, classification?',
      },
      {
        path: '/games/weather',
        params: 'year?, seasonType?, week?, team?, conference?, classification?, gameId?',
      },
      { path: '/records', params: 'year?, team?, conference?' },
      { path: '/calendar', params: 'year*' },
      { path: '/scoreboard', params: 'classification?, conference?', neverCache: true },
      { path: '/game/box/advanced', params: 'id*' },
    ],
  },
  {
    section: 'Stats',
    endpoints: [
      {
        path: '/stats/player/season',
        params: 'year*, conference?, team?, startWeek?, endWeek?, seasonType?, category?',
      },
      { path: '/stats/season', params: 'year?, team?, conference?, startWeek?, endWeek?' },
      { path: '/stats/categories' },
      {
        path: '/stats/season/advanced',
        params: 'year?, team?, excludeGarbageTime?, startWeek?, endWeek?',
      },
      {
        path: '/stats/game/advanced',
        params: 'year?, team?, week?, opponent?, excludeGarbageTime?, seasonType?',
      },
      {
        path: '/stats/game/havoc',
        params: 'year?, team?, week?, opponent?, seasonType?',
      },
    ],
  },
  {
    section: 'Ratings',
    endpoints: [
      { path: '/ratings/sp', params: 'year?, team?' },
      { path: '/ratings/sp/conferences', params: 'year?, conference?' },
      { path: '/ratings/srs', params: 'year?, team?, conference?' },
      { path: '/ratings/elo', params: 'year?, week?, seasonType?, team?, conference?' },
      { path: '/ratings/fpi', params: 'year?, team?, conference?' },
    ],
  },
  {
    section: 'Rankings',
    endpoints: [{ path: '/rankings', params: 'year*, seasonType?, week?' }],
  },
  {
    section: 'Recruiting',
    endpoints: [
      { path: '/recruiting/players', params: 'year?, team?, position?, state?, classification?' },
      { path: '/recruiting/teams', params: 'year?, team?' },
      {
        path: '/recruiting/groups',
        params: 'team?, conference?, recruitType?, startYear?, endYear?',
      },
    ],
  },
  {
    section: 'Players',
    endpoints: [
      { path: '/player/search', params: 'searchTerm*, year?, team?, position?' },
      {
        path: '/player/usage',
        params: 'year*, conference?, position?, team?, playerId?, excludeGarbageTime?',
      },
      { path: '/player/returning', params: 'year?, team?, conference?' },
      { path: '/player/portal', params: 'year*' },
    ],
  },
  {
    section: 'Betting',
    endpoints: [
      {
        path: '/lines',
        params: 'gameId?, year?, seasonType?, week?, team?, home?, away?, conference?, provider?',
        neverCache: true,
      },
    ],
  },
  {
    section: 'AdjustedMetrics',
    endpoints: [
      { path: '/wepa/team/season', params: 'year?, team?, conference?' },
      { path: '/wepa/players/passing', params: 'year?, team?, conference?, position?' },
      { path: '/wepa/players/rushing', params: 'year?, team?, conference?, position?' },
      { path: '/wepa/players/kicking', params: 'year?, team?, conference?' },
    ],
  },
  {
    section: 'Metrics',
    endpoints: [
      { path: '/ppa/predicted', params: 'down*, distance*' },
      { path: '/ppa/teams', params: 'year?, team?, conference?, excludeGarbageTime?' },
      {
        path: '/ppa/games',
        params: 'year*, week?, seasonType?, team?, conference?, excludeGarbageTime?',
      },
      {
        path: '/ppa/players/games',
        params:
          'year*, week?, seasonType?, team?, position?, playerId?, threshold?, excludeGarbageTime?',
      },
      {
        path: '/ppa/players/season',
        params: 'year?, conference?, team?, position?, playerId?, threshold?, excludeGarbageTime?',
      },
      { path: '/metrics/wp', params: 'gameId*' },
      { path: '/metrics/wp/pregame', params: 'year?, week?, seasonType?, team?' },
      { path: '/metrics/fg/ep' },
    ],
  },
  {
    section: 'Drives',
    endpoints: [
      {
        path: '/drives',
        params:
          'year*, seasonType?, week?, team?, offense?, defense?, conference?, offenseConference?, defenseConference?, classification?',
      },
    ],
  },
  {
    section: 'Plays',
    endpoints: [
      {
        path: '/plays',
        params:
          'year*, week*, team?, offense?, defense?, offenseConference?, defenseConference?, conference?, playType?, seasonType?, classification?',
      },
      { path: '/plays/types' },
      { path: '/plays/stats/types' },
      {
        path: '/plays/stats',
        params: 'year?, week?, team?, gameId?, athleteId?, statTypeId?, seasonType?, conference?',
      },
      { path: '/live/plays', params: 'gameId*', neverCache: true },
    ],
  },
  {
    section: 'Draft',
    endpoints: [
      { path: '/draft/picks', params: 'year?, team?, school?, conference?, position?' },
      { path: '/draft/teams' },
      { path: '/draft/positions' },
    ],
  },
  {
    section: 'Coaches',
    endpoints: [
      { path: '/coaches', params: 'firstName?, lastName?, team?, year?, minYear?, maxYear?' },
    ],
  },
];

export const ALLOWED_PATHS = new Set(CFBD_ENDPOINTS.flatMap((g) => g.endpoints.map((e) => e.path)));

export const NEVER_CACHE_PATHS = new Set(
  CFBD_ENDPOINTS.flatMap((g) => g.endpoints.filter((e) => e.neverCache).map((e) => e.path))
);

const catalogLines = CFBD_ENDPOINTS.map((g) => {
  const header = `## ${g.section}`;
  const routes = g.endpoints.map((e) => `GET ${e.path}${e.params ? ` — ${e.params}` : ''}`);
  return [header, ...routes].join('\n');
});

export const CFBD_API_CATALOG = `CFBD API Endpoints (* = required param, ? = optional):

${catalogLines.join('\n\n')}

Notes:
- The "team" param accepts school names (e.g., "Alabama", "Ohio State", "Texas A&M").
- The "conference" param accepts: SEC, ACC, B1G, Big 12, Pac-12, AAC, CUSA, MAC, MWC, SBC, Ind.
- Most endpoints default to the current season if year is omitted.
- seasonType values: "regular", "postseason", "both".
- Be judicious with API calls — only look up data not already in your context.`;
