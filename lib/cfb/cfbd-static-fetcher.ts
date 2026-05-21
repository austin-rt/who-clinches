import { getCalendarFromCfbd } from '@/lib/cfb/cfbd-rest-client';

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

const currentSeason = () => {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
};

const getCompletedSeasons = async (count: number): Promise<number[]> => {
  const current = currentSeason();
  const seasons: number[] = [];
  for (let y = current; y >= current - count + 1; y--) {
    const calendar = await getCalendarFromCfbd(y);
    if (calendar.length === 0) {
      if (y < new Date().getFullYear()) seasons.push(y);
      continue;
    }
    const seasonEnd = new Date(calendar[calendar.length - 1].endDate).getTime();
    if (Date.now() > seasonEnd) seasons.push(y);
  }
  return seasons;
};

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
      `Rd ${p.round} Pick ${p.pick}: ${p.name} (${p.collegeName}) — ${p.nflTeam}, ${p.position}`
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
  const lines = teams.map((t) => `${t.location} ${t.nickname} (${t.conference} ${t.division})`);
  return `NFL Teams\n\n${lines.join('\n')}\n`;
};

export const fetchCalendarHistoricalText = async (): Promise<string> => {
  const seasons = await getCompletedSeasons(2);
  if (seasons.length === 0) return 'No completed seasons available.\n';
  const allLines: string[] = [];
  for (const year of seasons) {
    const weeks = await getCalendarFromCfbd(year);
    const lines = weeks.map(
      (w) =>
        `  Week ${w.week} (${w.seasonType}): ${w.startDate.slice(0, 10)} — ${w.endDate.slice(0, 10)}`
    );
    allLines.push(`${year} Season Calendar:\n${lines.join('\n')}`);
  }
  return `Historical Season Calendars\n\n${allLines.join('\n\n')}\n`;
};

export const fetchRecordsHistoricalText = async (): Promise<string> => {
  const seasons = await getCompletedSeasons(2);
  if (seasons.length === 0) return 'No completed seasons available.\n';
  const allLines: string[] = [];
  for (const year of seasons) {
    const records = (await cfbdGet('/records', { year: String(year) })) as R[];
    const lines = records
      .sort((a, b) => {
        const aw = ((a.total as R)?.wins as number) ?? 0;
        const bw = ((b.total as R)?.wins as number) ?? 0;
        return bw - aw;
      })
      .slice(0, 60)
      .map((r) => {
        const t = r.total as R;
        return `${r.team} (${r.conference ?? 'Ind'}): ${t?.wins ?? 0}-${t?.losses ?? 0}`;
      });
    allLines.push(`${year} Records (Top 60 by wins):\n${lines.join('\n')}`);
  }
  return `Historical Team Records\n\n${allLines.join('\n\n')}\n`;
};

export const fetchTalentHistoricalText = async (): Promise<string> => {
  const seasons = await getCompletedSeasons(2);
  if (seasons.length === 0) return 'No completed seasons available.\n';
  const allLines: string[] = [];
  for (const year of seasons) {
    const talent = (await cfbdGet('/talent', { year: String(year) })) as R[];
    const lines = talent
      .slice(0, 50)
      .map((t) => `#${t.rank}: ${t.school} — Talent: ${(t.talent as number).toFixed(2)}`);
    allLines.push(`${year} 247 Team Talent Composite (Top 50):\n${lines.join('\n')}`);
  }
  return `Historical Team Talent Composite\n\n${allLines.join('\n\n')}\n`;
};

export const fetchRecruitingHistoricalText = async (): Promise<string> => {
  const seasons = await getCompletedSeasons(2);
  if (seasons.length === 0) return 'No completed seasons available.\n';
  const allLines: string[] = [];
  for (const year of seasons) {
    const recruiting = (await cfbdGet('/recruiting/teams', { year: String(year) })) as R[];
    const lines = recruiting
      .slice(0, 50)
      .map(
        (r) =>
          `${r.rank}. ${r.team} — Points: ${(r.points as number).toFixed(2)}, Commits: ${r.totalCommits ?? 'N/A'}`
      );
    allLines.push(`${year} Recruiting Rankings (Top 50):\n${lines.join('\n')}`);
  }
  return `Historical Team Recruiting Rankings\n\n${allLines.join('\n\n')}\n`;
};

export type StaticSource =
  | 'venues'
  | 'conferences'
  | 'teams'
  | 'teams-fbs'
  | 'coaches'
  | 'draft-picks'
  | 'draft-positions'
  | 'draft-teams'
  | 'calendar'
  | 'records'
  | 'talent'
  | 'recruiting';

export const SOURCE_CONFIG: Record<
  StaticSource,
  { sourceFile: string; label: string; historicalOnly: boolean }
> = {
  venues: { sourceFile: 'venues.txt', label: 'Venues', historicalOnly: false },
  conferences: { sourceFile: 'conferences.txt', label: 'Conferences', historicalOnly: false },
  teams: { sourceFile: 'teams.txt', label: 'Teams (All)', historicalOnly: false },
  'teams-fbs': { sourceFile: 'teams-fbs.txt', label: 'FBS Teams', historicalOnly: false },
  coaches: { sourceFile: 'coaches.txt', label: 'Coaches', historicalOnly: false },
  'draft-picks': { sourceFile: 'draft-picks.txt', label: 'Draft Picks', historicalOnly: false },
  'draft-positions': {
    sourceFile: 'draft-positions.txt',
    label: 'Draft Positions',
    historicalOnly: false,
  },
  'draft-teams': { sourceFile: 'draft-teams.txt', label: 'NFL Teams', historicalOnly: false },
  calendar: { sourceFile: 'calendar.txt', label: 'Season Calendar', historicalOnly: true },
  records: { sourceFile: 'records.txt', label: 'Team Records', historicalOnly: true },
  talent: { sourceFile: 'talent.txt', label: 'Talent Composite', historicalOnly: true },
  recruiting: { sourceFile: 'recruiting.txt', label: 'Recruiting', historicalOnly: true },
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
  calendar: fetchCalendarHistoricalText,
  records: fetchRecordsHistoricalText,
  talent: fetchTalentHistoricalText,
  recruiting: fetchRecruitingHistoricalText,
};

export const fetchSourceText = (source: StaticSource): Promise<string> => FETCHERS[source]();
