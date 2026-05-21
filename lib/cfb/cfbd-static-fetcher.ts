const CFBD_BASE = 'https://apinext.collegefootballdata.com';

const getApiKey = (): string => {
  const key = process.env.CFBD_API_KEY?.split(',')[0];
  if (!key) throw new Error('CFBD_API_KEY not configured');
  return key;
};

const cfbdGet = async (path: string, params?: Record<string, string>) => {
  const url = new URL(`${CFBD_BASE}${path}`);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getApiKey()}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`CFBD ${path}: ${res.status}`);
  return res.json();
};

type R = Record<string, unknown>;

export const fetchVenuesText = async (): Promise<string> => {
  const venues = (await cfbdGet('/venues')) as R[];
  const lines = venues
    .filter((v) => v.capacity && (v.capacity as number) > 10000)
    .sort((a, b) => (b.capacity as number) - (a.capacity as number))
    .map(
      (v) =>
        `${v.name} (${v.city}, ${v.state}) — Capacity: ${(v.capacity as number).toLocaleString()}` +
        `${v.grass ? ', Grass' : ', Turf'}${v.dome ? ', Dome' : ', Outdoor'}` +
        `\n  Teams: ${Array.isArray(v.teams) ? (v.teams as string[]).join(', ') : 'N/A'}`
    );
  return `College Football Venues (FBS stadiums with 10,000+ capacity)\n\n${lines.join('\n\n')}\n`;
};

export const fetchConferencesText = async (): Promise<string> => {
  const conferences = (await cfbdGet('/conferences')) as R[];
  const lines = conferences.map(
    (c) => `${c.name} (${c.abbreviation}) — Classification: ${c.classification}`
  );
  return `College Football Conferences\n\n${lines.join('\n')}\n`;
};

export const fetchTeamsText = async (): Promise<string> => {
  const teams = (await cfbdGet('/teams')) as R[];
  const lines = teams
    .sort((a, b) => String(a.conference ?? '').localeCompare(String(b.conference ?? '')))
    .map((t) => {
      const loc = t.location as R | undefined;
      return (
        `${t.school} (${t.abbreviation}) — ${t.conference ?? 'Independent'}` +
        `\n  Mascot: ${t.mascot ?? 'N/A'} | Color: ${t.color ?? '?'}` +
        `\n  Location: ${loc?.city ?? '?'}, ${loc?.state ?? '?'}`
      );
    });
  return `College Football Teams (All)\n\n${lines.join('\n\n')}\n`;
};

export const fetchTeamsFbsText = async (): Promise<string> => {
  const teams = (await cfbdGet('/teams/fbs')) as R[];
  const lines = teams
    .sort((a, b) => String(a.conference ?? '').localeCompare(String(b.conference ?? '')))
    .map((t) => {
      const loc = t.location as R | undefined;
      return (
        `${t.school} (${t.abbreviation}) — ${t.conference ?? 'Independent'}` +
        `\n  Mascot: ${t.mascot ?? 'N/A'} | Location: ${loc?.city ?? '?'}, ${loc?.state ?? '?'}` +
        `\n  Venue: ${loc?.name ?? 'N/A'}${loc?.capacity ? ` (${(loc.capacity as number).toLocaleString()})` : ''}`
      );
    });
  return `FBS Teams (${new Date().getFullYear()})\n\n${lines.join('\n\n')}\n`;
};

export const fetchCoachesText = async (): Promise<string> => {
  const coachYear = String(new Date().getFullYear() - 1);
  const coaches = (await cfbdGet('/coaches', {
    year: coachYear,
    minYear: coachYear,
    maxYear: coachYear,
  })) as R[];
  const lines = coaches
    .map((c) => {
      const seasons = c.seasons as R[] | undefined;
      const season = seasons?.[0];
      if (!season) return null;
      const record = `${season.wins ?? 0}-${season.losses ?? 0}`;
      return `${c.first_name} ${c.last_name} — ${season.school} (${record} in ${coachYear})`;
    })
    .filter(Boolean)
    .sort() as string[];
  return `FBS Head Coaches (as of ${coachYear} season)\n\n${lines.join('\n')}\n`;
};

export const fetchDraftPicksText = async (): Promise<string> => {
  const year = String(new Date().getFullYear());
  const picks = (await cfbdGet('/draft/picks', { year })) as R[];
  const lines = picks.map(
    (p) =>
      `Rd ${p.round} Pick ${p.pick}: ${p.name} (${p.collegeTeam}) — ${p.nflTeam}, ${p.position}`
  );
  return `NFL Draft Picks (${year})\n\n${lines.join('\n')}\n`;
};

export const fetchDraftPositionsText = async (): Promise<string> => {
  const positions = (await cfbdGet('/draft/positions')) as R[];
  const lines = positions.map((p) => `${p.name} (${p.abbreviation})`);
  return `NFL Draft Position Categories\n\n${lines.join('\n')}\n`;
};

export const fetchDraftTeamsText = async (): Promise<string> => {
  const teams = (await cfbdGet('/draft/teams')) as R[];
  const lines = teams.map((t) => `${t.location} ${t.nickname}`);
  return `NFL Teams\n\n${lines.join('\n')}\n`;
};

export type StaticSource =
  | 'venues'
  | 'conferences'
  | 'teams'
  | 'teams-fbs'
  | 'coaches'
  | 'draft-picks'
  | 'draft-positions'
  | 'draft-teams';

export const SOURCE_CONFIG: Record<StaticSource, { sourceFile: string; label: string }> = {
  venues: { sourceFile: 'venues.txt', label: 'Venues' },
  conferences: { sourceFile: 'conferences.txt', label: 'Conferences' },
  teams: { sourceFile: 'teams.txt', label: 'Teams (All)' },
  'teams-fbs': { sourceFile: 'teams-fbs.txt', label: 'FBS Teams' },
  coaches: { sourceFile: 'coaches.txt', label: 'Coaches' },
  'draft-picks': { sourceFile: 'draft-picks.txt', label: 'Draft Picks' },
  'draft-positions': { sourceFile: 'draft-positions.txt', label: 'Draft Positions' },
  'draft-teams': { sourceFile: 'draft-teams.txt', label: 'NFL Teams' },
};

const FETCHERS: Record<StaticSource, () => Promise<string>> = {
  venues: fetchVenuesText,
  conferences: fetchConferencesText,
  teams: fetchTeamsText,
  'teams-fbs': fetchTeamsFbsText,
  coaches: fetchCoachesText,
  'draft-picks': fetchDraftPicksText,
  'draft-positions': fetchDraftPositionsText,
  'draft-teams': fetchDraftTeamsText,
};

export const fetchSourceText = (source: StaticSource): Promise<string> => FETCHERS[source]();
