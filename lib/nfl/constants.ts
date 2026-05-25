export type NflConference = 'AFC' | 'NFC';
export type NflDivision = 'East' | 'North' | 'South' | 'West';
export type NflDivisionId = `${NflConference} ${NflDivision}`;

export interface NflTeamMeta {
  espnId: string;
  abbrev: string;
  name: string;
  displayName: string;
  conference: NflConference;
  division: NflDivision;
  divisionId: NflDivisionId;
}

export const NFL_TEAMS: NflTeamMeta[] = [
  {
    espnId: '1',
    abbrev: 'ATL',
    name: 'Falcons',
    displayName: 'Atlanta Falcons',
    conference: 'NFC',
    division: 'South',
    divisionId: 'NFC South',
  },
  {
    espnId: '2',
    abbrev: 'BUF',
    name: 'Bills',
    displayName: 'Buffalo Bills',
    conference: 'AFC',
    division: 'East',
    divisionId: 'AFC East',
  },
  {
    espnId: '3',
    abbrev: 'CHI',
    name: 'Bears',
    displayName: 'Chicago Bears',
    conference: 'NFC',
    division: 'North',
    divisionId: 'NFC North',
  },
  {
    espnId: '4',
    abbrev: 'CIN',
    name: 'Bengals',
    displayName: 'Cincinnati Bengals',
    conference: 'AFC',
    division: 'North',
    divisionId: 'AFC North',
  },
  {
    espnId: '5',
    abbrev: 'CLE',
    name: 'Browns',
    displayName: 'Cleveland Browns',
    conference: 'AFC',
    division: 'North',
    divisionId: 'AFC North',
  },
  {
    espnId: '6',
    abbrev: 'DAL',
    name: 'Cowboys',
    displayName: 'Dallas Cowboys',
    conference: 'NFC',
    division: 'East',
    divisionId: 'NFC East',
  },
  {
    espnId: '7',
    abbrev: 'DEN',
    name: 'Broncos',
    displayName: 'Denver Broncos',
    conference: 'AFC',
    division: 'West',
    divisionId: 'AFC West',
  },
  {
    espnId: '8',
    abbrev: 'DET',
    name: 'Lions',
    displayName: 'Detroit Lions',
    conference: 'NFC',
    division: 'North',
    divisionId: 'NFC North',
  },
  {
    espnId: '9',
    abbrev: 'GB',
    name: 'Packers',
    displayName: 'Green Bay Packers',
    conference: 'NFC',
    division: 'North',
    divisionId: 'NFC North',
  },
  {
    espnId: '10',
    abbrev: 'TEN',
    name: 'Titans',
    displayName: 'Tennessee Titans',
    conference: 'AFC',
    division: 'South',
    divisionId: 'AFC South',
  },
  {
    espnId: '11',
    abbrev: 'IND',
    name: 'Colts',
    displayName: 'Indianapolis Colts',
    conference: 'AFC',
    division: 'South',
    divisionId: 'AFC South',
  },
  {
    espnId: '12',
    abbrev: 'KC',
    name: 'Chiefs',
    displayName: 'Kansas City Chiefs',
    conference: 'AFC',
    division: 'West',
    divisionId: 'AFC West',
  },
  {
    espnId: '13',
    abbrev: 'LV',
    name: 'Raiders',
    displayName: 'Las Vegas Raiders',
    conference: 'AFC',
    division: 'West',
    divisionId: 'AFC West',
  },
  {
    espnId: '14',
    abbrev: 'LAR',
    name: 'Rams',
    displayName: 'Los Angeles Rams',
    conference: 'NFC',
    division: 'West',
    divisionId: 'NFC West',
  },
  {
    espnId: '15',
    abbrev: 'MIA',
    name: 'Dolphins',
    displayName: 'Miami Dolphins',
    conference: 'AFC',
    division: 'East',
    divisionId: 'AFC East',
  },
  {
    espnId: '16',
    abbrev: 'MIN',
    name: 'Vikings',
    displayName: 'Minnesota Vikings',
    conference: 'NFC',
    division: 'North',
    divisionId: 'NFC North',
  },
  {
    espnId: '17',
    abbrev: 'NE',
    name: 'Patriots',
    displayName: 'New England Patriots',
    conference: 'AFC',
    division: 'East',
    divisionId: 'AFC East',
  },
  {
    espnId: '18',
    abbrev: 'NO',
    name: 'Saints',
    displayName: 'New Orleans Saints',
    conference: 'NFC',
    division: 'South',
    divisionId: 'NFC South',
  },
  {
    espnId: '19',
    abbrev: 'NYG',
    name: 'Giants',
    displayName: 'New York Giants',
    conference: 'NFC',
    division: 'East',
    divisionId: 'NFC East',
  },
  {
    espnId: '20',
    abbrev: 'NYJ',
    name: 'Jets',
    displayName: 'New York Jets',
    conference: 'AFC',
    division: 'East',
    divisionId: 'AFC East',
  },
  {
    espnId: '21',
    abbrev: 'PHI',
    name: 'Eagles',
    displayName: 'Philadelphia Eagles',
    conference: 'NFC',
    division: 'East',
    divisionId: 'NFC East',
  },
  {
    espnId: '22',
    abbrev: 'ARI',
    name: 'Cardinals',
    displayName: 'Arizona Cardinals',
    conference: 'NFC',
    division: 'West',
    divisionId: 'NFC West',
  },
  {
    espnId: '23',
    abbrev: 'PIT',
    name: 'Steelers',
    displayName: 'Pittsburgh Steelers',
    conference: 'AFC',
    division: 'North',
    divisionId: 'AFC North',
  },
  {
    espnId: '24',
    abbrev: 'LAC',
    name: 'Chargers',
    displayName: 'Los Angeles Chargers',
    conference: 'AFC',
    division: 'West',
    divisionId: 'AFC West',
  },
  {
    espnId: '25',
    abbrev: 'SF',
    name: '49ers',
    displayName: 'San Francisco 49ers',
    conference: 'NFC',
    division: 'West',
    divisionId: 'NFC West',
  },
  {
    espnId: '26',
    abbrev: 'SEA',
    name: 'Seahawks',
    displayName: 'Seattle Seahawks',
    conference: 'NFC',
    division: 'West',
    divisionId: 'NFC West',
  },
  {
    espnId: '27',
    abbrev: 'TB',
    name: 'Buccaneers',
    displayName: 'Tampa Bay Buccaneers',
    conference: 'NFC',
    division: 'South',
    divisionId: 'NFC South',
  },
  {
    espnId: '28',
    abbrev: 'WSH',
    name: 'Commanders',
    displayName: 'Washington Commanders',
    conference: 'NFC',
    division: 'East',
    divisionId: 'NFC East',
  },
  {
    espnId: '29',
    abbrev: 'CAR',
    name: 'Panthers',
    displayName: 'Carolina Panthers',
    conference: 'NFC',
    division: 'South',
    divisionId: 'NFC South',
  },
  {
    espnId: '30',
    abbrev: 'JAX',
    name: 'Jaguars',
    displayName: 'Jacksonville Jaguars',
    conference: 'AFC',
    division: 'South',
    divisionId: 'AFC South',
  },
  {
    espnId: '33',
    abbrev: 'BAL',
    name: 'Ravens',
    displayName: 'Baltimore Ravens',
    conference: 'AFC',
    division: 'North',
    divisionId: 'AFC North',
  },
  {
    espnId: '34',
    abbrev: 'HOU',
    name: 'Texans',
    displayName: 'Houston Texans',
    conference: 'AFC',
    division: 'South',
    divisionId: 'AFC South',
  },
];

export const NFL_TEAM_BY_ESPN_ID = new Map(NFL_TEAMS.map((t) => [t.espnId, t]));
export const NFL_TEAM_BY_ABBREV = new Map(NFL_TEAMS.map((t) => [t.abbrev, t]));

export const NFL_DIVISIONS: NflDivisionId[] = [
  'AFC East',
  'AFC North',
  'AFC South',
  'AFC West',
  'NFC East',
  'NFC North',
  'NFC South',
  'NFC West',
];

export const NFL_CONFERENCES: NflConference[] = ['AFC', 'NFC'];

export const NFL_ABBREV_ALIASES: Record<string, string> = {
  OAK: 'LV',
  SD: 'LAC',
  STL: 'LAR',
};

export const resolveNflAbbrev = (abbrev: string): string => NFL_ABBREV_ALIASES[abbrev] ?? abbrev;

export const getTeamsInDivision = (divisionId: NflDivisionId): NflTeamMeta[] =>
  NFL_TEAMS.filter((t) => t.divisionId === divisionId);

export const getTeamsInConference = (conference: NflConference): NflTeamMeta[] =>
  NFL_TEAMS.filter((t) => t.conference === conference);

export const getWeekCount = (season: number): number => (season >= 2021 ? 18 : 17);

export const getWildCardCount = (season: number): number => (season >= 2020 ? 3 : 2);

export const getPlayoffSize = (season: number): number => (season >= 2020 ? 7 : 6);

export const NFL = {
  name: 'NFL',
  slug: 'nfl' as const,
  conferences: NFL_CONFERENCES,
  divisions: NFL_DIVISIONS,
  teams: NFL_TEAMS,
} as const;
