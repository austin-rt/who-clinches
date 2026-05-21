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
  const year = String(new Date().getFullYear());
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
  return `FBS Teams (${year})\n\n${lines.join('\n\n')}\n`;
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

const currentSeason = () => {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
};

export const fetchRankingsText = async (): Promise<string> => {
  const year = String(currentSeason());
  const rankings = (await cfbdGet('/rankings', { year })) as R[];
  const lines = rankings
    .sort((a, b) => (b.week as number) - (a.week as number))
    .slice(0, 1)
    .flatMap((week) => {
      const polls = week.polls as R[] | undefined;
      if (!polls) return [];
      return polls.flatMap((poll) => {
        const header = `### ${poll.poll} (Week ${week.week}, ${week.season})`;
        const ranks = (poll.ranks as R[])
          .slice(0, 25)
          .map(
            (r) =>
              `${r.rank}. ${r.school} (${r.conference}) — ${r.wins}-${r.losses}${r.firstPlaceVotes ? `, ${r.firstPlaceVotes} 1st` : ''}`
          );
        return [header, ...ranks, ''];
      });
    });
  return `College Football Rankings (${year} Season)\n\n${lines.join('\n')}\n`;
};

export const fetchSpRatingsText = async (): Promise<string> => {
  const year = String(currentSeason());
  const ratings = (await cfbdGet('/ratings/sp', { year })) as R[];
  const lines = ratings
    .sort((a, b) => (a.ranking as number) - (b.ranking as number))
    .slice(0, 50)
    .map(
      (r) =>
        `${r.ranking}. ${r.team} (${r.conference}) — Overall: ${(r.rating as number).toFixed(1)}` +
        `, Off: ${((r.offense as R)?.rating as number)?.toFixed(1) ?? 'N/A'}` +
        `, Def: ${((r.defense as R)?.rating as number)?.toFixed(1) ?? 'N/A'}`
    );
  return `SP+ Ratings — Top 50 (${year} Season)\n\n${lines.join('\n')}\n`;
};

export const fetchSrsRatingsText = async (): Promise<string> => {
  const year = String(currentSeason());
  const ratings = (await cfbdGet('/ratings/srs', { year })) as R[];
  const lines = ratings
    .sort((a, b) => (b.rating as number) - (a.rating as number))
    .slice(0, 50)
    .map(
      (r) =>
        `${r.team} (${r.conference}) — SRS: ${(r.rating as number).toFixed(2)}` +
        `, Ranking: ${r.ranking ?? 'N/A'}`
    );
  return `Simple Rating System (SRS) — Top 50 (${year} Season)\n\n${lines.join('\n')}\n`;
};

export const fetchTalentText = async (): Promise<string> => {
  const year = String(currentSeason());
  const talent = (await cfbdGet('/talent', { year })) as R[];
  const lines = talent
    .slice(0, 50)
    .map((t) => `${t.year} #${t.rank}: ${t.school} — Talent: ${(t.talent as number).toFixed(2)}`);
  return `247 Team Talent Composite — Top 50 (${year})\n\n${lines.join('\n')}\n`;
};

export const fetchRecruitingText = async (): Promise<string> => {
  const year = String(currentSeason());
  const recruiting = (await cfbdGet('/recruiting/teams', { year })) as R[];
  const lines = recruiting
    .slice(0, 50)
    .map(
      (r) =>
        `${r.rank}. ${r.team} — Points: ${(r.points as number).toFixed(2)}` +
        `, Total Commits: ${r.totalCommits ?? 'N/A'}`
    );
  return `Team Recruiting Rankings — Top 50 (${year} Class)\n\n${lines.join('\n')}\n`;
};

export const fetchRecordsText = async (): Promise<string> => {
  const year = String(currentSeason());
  const records = (await cfbdGet('/records', { year })) as R[];
  const lines = records
    .sort((a, b) => {
      const aTotal = a.total as R;
      const bTotal = b.total as R;
      return (
        (bTotal.wins as number) - (aTotal.wins as number) ||
        (aTotal.losses as number) - (bTotal.losses as number)
      );
    })
    .map((r) => {
      const total = r.total as R;
      const conf = r.conferenceGames as R;
      return (
        `${r.team} (${r.conference}) — ${total.wins}-${total.losses}` +
        (conf ? ` (Conf: ${conf.wins}-${conf.losses})` : '')
      );
    });
  return `Team Records (${year} Season)\n\n${lines.join('\n')}\n`;
};

export type StaticSource =
  | 'venues'
  | 'conferences'
  | 'teams'
  | 'coaches'
  | 'rankings'
  | 'sp-ratings'
  | 'srs-ratings'
  | 'talent'
  | 'recruiting'
  | 'records';

export const SOURCE_CONFIG: Record<StaticSource, { sourceFile: string; label: string }> = {
  venues: { sourceFile: 'venues.txt', label: 'Venues' },
  conferences: { sourceFile: 'conferences.txt', label: 'Conferences' },
  teams: { sourceFile: 'teams.txt', label: 'Teams' },
  coaches: { sourceFile: 'coaches.txt', label: 'Coaches' },
  rankings: { sourceFile: 'rankings.txt', label: 'Rankings' },
  'sp-ratings': { sourceFile: 'sp-ratings.txt', label: 'SP+ Ratings' },
  'srs-ratings': { sourceFile: 'srs-ratings.txt', label: 'SRS Ratings' },
  talent: { sourceFile: 'talent.txt', label: 'Talent Composite' },
  recruiting: { sourceFile: 'recruiting.txt', label: 'Recruiting Rankings' },
  records: { sourceFile: 'records.txt', label: 'Team Records' },
};

const FETCHERS: Record<StaticSource, () => Promise<string>> = {
  venues: fetchVenuesText,
  conferences: fetchConferencesText,
  teams: fetchTeamsText,
  coaches: fetchCoachesText,
  rankings: fetchRankingsText,
  'sp-ratings': fetchSpRatingsText,
  'srs-ratings': fetchSrsRatingsText,
  talent: fetchTalentText,
  recruiting: fetchRecruitingText,
  records: fetchRecordsText,
};

export const fetchSourceText = (source: StaticSource): Promise<string> => FETCHERS[source]();
