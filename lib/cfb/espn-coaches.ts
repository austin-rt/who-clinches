const ESPN_CORE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/college-football';
const FBS_GROUP = '80';
const CONCURRENCY = 8;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;
const MAX_MISSING_RATIO = 0.1;

interface EspnRef {
  $ref?: string;
}

interface EspnRefList {
  items?: EspnRef[];
}

interface EspnCoach {
  firstName?: string;
  lastName?: string;
}

interface EspnTeam {
  location?: string;
  displayName?: string;
  isActive?: boolean;
  isAllStar?: boolean;
  groups?: EspnRef;
  venue?: unknown;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getJson = async <T>(url: string): Promise<T> => {
  let lastError: Error = new Error(`ESPN ${url}: no attempt made`);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url.replace(/^http:/, 'https:'), {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) return (await res.json()) as T;
      lastError = new Error(`ESPN ${url}: ${res.status}`);
      if (res.status < 500 && res.status !== 429) throw lastError;
    } catch (error) {
      lastError = error as Error;
    }
    if (attempt < MAX_ATTEMPTS) await delay(RETRY_DELAY_MS * attempt);
  }
  throw lastError;
};

const teamIdFromRef = (ref: string | undefined): string | null => {
  if (!ref) return null;
  const match = ref.match(/\/teams\/(\d+)/);
  return match ? match[1] : null;
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
};

const fetchFbsTeamIds = async (season: number): Promise<string[]> => {
  const list = await getJson<EspnRefList>(
    `${ESPN_CORE}/seasons/${season}/types/2/groups/${FBS_GROUP}/teams?limit=200`
  );
  return (list.items ?? [])
    .map((item) => teamIdFromRef(item.$ref))
    .filter((id): id is string => id !== null);
};

const fetchCoachForTeam = async (season: number, teamId: string): Promise<string | null> => {
  const list = await getJson<EspnRefList>(
    `${ESPN_CORE}/seasons/${season}/teams/${teamId}/coaches?limit=5`
  );
  const ref = list.items?.[0]?.$ref;
  if (!ref) return null;
  const coach = await getJson<EspnCoach>(ref);
  const name = [coach.firstName, coach.lastName].filter(Boolean).join(' ').trim();
  return name || null;
};

export interface CoachAssignment {
  name: string;
  school: string;
}

export interface CoachRoster {
  assignments: CoachAssignment[];
  unknown: string[];
}

export const fetchEspnCoaches = async (season: number): Promise<CoachRoster> => {
  const teamIds = await fetchFbsTeamIds(season);

  const resolved = await mapWithConcurrency(teamIds, CONCURRENCY, async (teamId) => {
    const [team, coach] = await Promise.all([
      getJson<EspnTeam>(`${ESPN_CORE}/seasons/${season}/teams/${teamId}`),
      fetchCoachForTeam(season, teamId),
    ]);
    return { teamId, team, coach };
  });

  const programs = resolved.filter(
    ({ team }) => !team.isAllStar && team.isActive !== false && Boolean(team.groups)
  );

  const assignments: CoachAssignment[] = [];
  const missing: string[] = [];
  for (const { teamId, team, coach } of programs) {
    const school = team.location ?? team.displayName;
    if (!coach || !school) {
      missing.push(school ?? teamId);
      continue;
    }
    assignments.push({ name: coach, school });
  }

  if (missing.length > programs.length * MAX_MISSING_RATIO) {
    throw new Error(
      `ESPN coaches incomplete for ${season}: ${missing.length}/${programs.length} programs unresolved (${missing.slice(0, 10).join(', ')})`
    );
  }

  return {
    assignments: assignments.sort((a, b) => a.school.localeCompare(b.school)),
    unknown: missing.sort(),
  };
};
