import {
  NFL_TEAMS,
  NFL_DIVISIONS,
  NFL_CONFERENCES,
  getTeamsInDivision,
  getTeamsInConference,
} from '@/lib/nfl/constants';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

type R = Record<string, unknown>;

const espnGet = async (path: string): Promise<R[]> => {
  const res = await fetch(`${ESPN_BASE}${path}`);
  if (!res.ok) throw new Error(`ESPN ${path}: ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  const sports = data.sports as R[] | undefined;
  const firstSport = sports?.[0] as R | undefined;
  const leagues = firstSport?.leagues as R[] | undefined;
  const firstLeague = leagues?.[0] as R | undefined;
  const teams = (firstLeague?.teams ?? data.teams ?? []) as R[];
  return teams;
};

export const fetchNflTeamsText = (): string => {
  const lines: string[] = [];
  for (const conf of NFL_CONFERENCES) {
    lines.push(`\n${conf}`);
    for (const divId of NFL_DIVISIONS.filter((d) => d.startsWith(conf))) {
      lines.push(`  ${divId}`);
      for (const team of getTeamsInDivision(divId)) {
        lines.push(
          `    ${team.displayName} (${team.abbrev}) — ESPN ID: ${team.espnId}, ${team.divisionId}`
        );
      }
    }
  }
  return `NFL Teams (32 teams, 2 conferences, 8 divisions)\n${lines.join('\n')}\n`;
};

export const fetchNflDivisionsText = (): string => {
  const lines: string[] = [];
  for (const divId of NFL_DIVISIONS) {
    const teams = getTeamsInDivision(divId);
    const teamList = teams.map((t) => t.abbrev).join(', ');
    lines.push(`${divId}: ${teamList}`);
  }
  return `NFL Divisions (8 divisions)\n\n${lines.join('\n')}\n`;
};

export const fetchNflVenuesText = async (): Promise<string> => {
  try {
    const raw = await espnGet('/teams');
    const lines: string[] = [];
    for (const entry of raw) {
      const team = (entry as R).team as R | undefined;
      if (!team) continue;
      const venue = team.venue as R | undefined;
      if (!venue) continue;
      const capacity = venue.capacity as number | undefined;
      const indoor = venue.indoor as boolean | undefined;
      const grass = venue.grass as boolean | undefined;
      lines.push(
        `${venue.fullName} (${team.abbreviation})` +
          `${capacity ? ` — Capacity: ${capacity.toLocaleString()}` : ''}` +
          `${indoor ? ', Dome' : ', Outdoor'}` +
          `${grass ? ', Grass' : ', Turf'}`
      );
    }
    lines.sort();
    return `NFL Venues\n\n${lines.join('\n')}\n`;
  } catch {
    const lines = NFL_TEAMS.map((t) => `${t.displayName} (${t.abbrev}) — ${t.divisionId}`);
    return `NFL Venues (static fallback)\n\n${lines.join('\n')}\n`;
  }
};

export const fetchNflConferencesText = (): string => {
  const lines: string[] = [];
  for (const conf of NFL_CONFERENCES) {
    const teams = getTeamsInConference(conf);
    const divs = NFL_DIVISIONS.filter((d) => d.startsWith(conf));
    lines.push(`${conf} — ${divs.length} divisions, ${teams.length} teams`);
    for (const div of divs) {
      const divTeams = getTeamsInDivision(div);
      lines.push(`  ${div}: ${divTeams.map((t) => t.abbrev).join(', ')}`);
    }
  }
  return `NFL Conferences\n\n${lines.join('\n')}\n`;
};

export const fetchNflScheduleStructureText = (): string => {
  return [
    'NFL Schedule Structure',
    '',
    'Regular Season: 18 weeks, 17 games per team (1 bye week)',
    'Season Types: 1=Preseason, 2=Regular Season, 3=Postseason',
    '',
    'Playoff Format (2020-present):',
    '  14 teams total (7 per conference)',
    '  Seeds 1-4: Division winners (ordered by record, broken by wild card tiebreaker)',
    '  Seeds 5-7: Wild card teams (ordered by record, broken by wild card tiebreaker)',
    '  Seed 1: First-round bye',
    '  Wild Card Round: 2 vs 7, 3 vs 6, 4 vs 5',
    '',
    'Playoff Format (2002-2019):',
    '  12 teams total (6 per conference)',
    '  Seeds 1-4: Division winners',
    '  Seeds 5-6: Wild card teams',
    '  Seeds 1-2: First-round byes',
    '',
    'Division structure has not changed since 2002 realignment.',
    '',
  ].join('\n');
};

export type NflStaticSource =
  | 'nfl-teams'
  | 'nfl-divisions'
  | 'nfl-venues'
  | 'nfl-conferences'
  | 'nfl-schedule-structure';

export const NFL_SOURCE_CONFIG: Record<NflStaticSource, { sourceFile: string; label: string }> = {
  'nfl-teams': { sourceFile: 'nfl-teams.txt', label: 'NFL Teams' },
  'nfl-divisions': { sourceFile: 'nfl-divisions.txt', label: 'NFL Divisions' },
  'nfl-venues': { sourceFile: 'nfl-venues.txt', label: 'NFL Venues' },
  'nfl-conferences': { sourceFile: 'nfl-conferences.txt', label: 'NFL Conferences' },
  'nfl-schedule-structure': {
    sourceFile: 'nfl-schedule-structure.txt',
    label: 'NFL Schedule Structure',
  },
};

const FETCHERS: Record<NflStaticSource, () => Promise<string> | string> = {
  'nfl-teams': fetchNflTeamsText,
  'nfl-divisions': fetchNflDivisionsText,
  'nfl-venues': fetchNflVenuesText,
  'nfl-conferences': fetchNflConferencesText,
  'nfl-schedule-structure': fetchNflScheduleStructureText,
};

export const fetchNflSourceText = (source: NflStaticSource): Promise<string> =>
  Promise.resolve(FETCHERS[source]());
