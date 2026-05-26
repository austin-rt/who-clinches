export const BLOCKED_PATHS = new Set<string>([]);

export const SKIP_CACHE_PATHS = new Set(['/scoreboard']);

export const ESPN_NFL_API_CATALOG = `ESPN NFL API — you may call any endpoint via espn_nfl_lookup.
Base: https://site.api.espn.com/apis/site/v2/sports/football/nfl

Available endpoints:

/scoreboard — season?, week?, seasontype? (1=pre, 2=regular, 3=post)
  Returns all games for a given week with scores, teams, odds, status, venue.
  Example: {"endpoint": "/scoreboard", "params": {"season": "2024", "week": "1"}}

/teams — Returns all 32 teams with IDs, abbreviations, logos, records, links.
  Example: {"endpoint": "/teams", "params": {}}

/teams/{teamId} — Single team detail including record, standings, next event.
  Example: {"endpoint": "/teams/12", "params": {}}

/teams/{teamId}/schedule — season?, seasontype?
  Returns full schedule for a team.
  Example: {"endpoint": "/teams/12/schedule", "params": {"season": "2024"}}

/teams/{teamId}/roster — Returns full roster for a team.
  Example: {"endpoint": "/teams/12/roster", "params": {}}

Core API base: https://sports.core.api.espn.com/v2/sports/football/leagues/nfl

/seasons/{year}/types/2/teams/{teamId}/statistics — Season stats per team (touchdowns, yards, etc.)
  Example: {"endpoint": "/statistics", "params": {"season": "2024", "teamId": "12"}}

Notes:
- Team IDs: Use the /teams endpoint to look up ESPN IDs by abbreviation.
- Team IDs: ARI=22, ATL=1, BAL=33, BUF=2, CAR=29, CHI=3, CIN=4, CLE=5, DAL=6, DEN=7, DET=8, GB=9, HOU=34, IND=11, JAX=30, KC=12, LV=13, LAC=24, LAR=14, MIA=15, MIN=16, NE=17, NO=18, NYG=19, NYJ=20, PHI=21, PIT=23, SF=25, SEA=26, TB=27, TEN=10, WSH=28
- seasontype: 1=preseason, 2=regular season (default), 3=postseason
- NFL regular season: 18 weeks (weeks 1-18), 17 games per team (1 bye)
- Scores, odds (spread/over-under), and game status are all in /scoreboard responses
- Be judicious — only look up data not already in your context.`;
