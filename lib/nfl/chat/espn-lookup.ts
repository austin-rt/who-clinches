import { fetch as redisFetch, persistRedisKey, redis } from '@/lib/redis';
import { BLOCKED_PATHS, SKIP_CACHE_PATHS } from './espn-api-catalog';
import { createHash } from 'crypto';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const ESPN_CORE_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

const USAGE_KEY = 'espn:nfl:ai-usage';
const MAX_RESPONSE_CHARS = 8000;
const MAX_ARRAY_ITEMS = 50;
const CACHE_PREFIX = 'espn:nfl:chat';
const TTL_LIVE = 300;
const TTL_COMPLETED = undefined;

const trackUsage = (path: string) => {
  if (redis) void redis.zincrby(USAGE_KEY, 1, path).catch(() => {});
};

const isHistoricalSeason = (params: Record<string, string>): boolean => {
  const year = params.season || params.year;
  if (!year) return false;
  const requested = parseInt(year, 10);
  if (isNaN(requested)) return false;
  return requested < new Date().getFullYear();
};

interface EspnRosterAthlete {
  displayName?: string;
  jersey?: string;
  age?: number;
  experience?: { years?: number };
  position?: { abbreviation?: string };
}

interface EspnRosterGroup {
  position?: string;
  items?: EspnRosterAthlete[];
}

interface EspnRosterResponse {
  athletes?: EspnRosterGroup[];
  coach?: Array<{ firstName?: string; lastName?: string; experience?: number }>;
  team?: { displayName?: string };
}

const slimRoster = (data: EspnRosterResponse): unknown => {
  const players = (data.athletes ?? []).flatMap((group) =>
    (group.items ?? []).map((p) => ({
      name: p.displayName ?? '?',
      pos: p.position?.abbreviation ?? '?',
      jersey: p.jersey ?? '?',
      age: p.age ?? null,
      exp: p.experience?.years ?? 0,
    }))
  );
  const coach = data.coach?.[0];
  return {
    team: data.team?.displayName ?? '?',
    headCoach: coach ? `${coach.firstName} ${coach.lastName}` : null,
    players,
  };
};

const isRosterResponse = (data: unknown, path: string): data is EspnRosterResponse =>
  path.includes('/roster') && typeof data === 'object' && data !== null && 'athletes' in data;

const truncateResponse = (data: unknown, path = ''): string => {
  if (isRosterResponse(data, path)) {
    return JSON.stringify(slimRoster(data), null, 2);
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    const sliced = data.slice(0, MAX_ARRAY_ITEMS);
    const json = JSON.stringify(sliced, null, 2);
    if (json.length > MAX_RESPONSE_CHARS) {
      const tighter = JSON.stringify(sliced);
      if (tighter.length > MAX_RESPONSE_CHARS) {
        const fewer = data.slice(0, 10);
        return `${JSON.stringify(fewer, null, 2)}\n\n[Showing 10 of ${data.length} results — narrow your query with more specific params]`;
      }
      return `${tighter}\n\n[${data.length} total results, showing ${sliced.length}]`;
    }
    const suffix =
      data.length > sliced.length ? `\n\n[Showing ${sliced.length} of ${data.length} results]` : '';
    return json + suffix;
  }

  const json = JSON.stringify(data, null, 2);
  if (json.length <= MAX_RESPONSE_CHARS) return json;
  return `${json.slice(0, MAX_RESPONSE_CHARS)}\n\n[Truncated — response too large]`;
};

const buildUrl = (
  endpoint: string,
  params: Record<string, string>
): { url: string; path: string } => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (path === '/statistics') {
    const season = params.season || String(new Date().getFullYear());
    const teamId = params.teamId || params.team_id || '';
    const coreUrl = `${ESPN_CORE_BASE}/seasons/${season}/types/2/teams/${teamId}/statistics`;
    return { url: coreUrl, path };
  }

  const url = new URL(`${ESPN_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      key !== 'teamId' &&
      key !== 'team_id'
    ) {
      url.searchParams.set(key, value);
    }
  }
  return { url: url.toString(), path };
};

export const executeEspnNflLookup = async (
  endpoint: string,
  params: Record<string, string>
): Promise<string> => {
  const { url, path } = buildUrl(endpoint, params);

  if (BLOCKED_PATHS.has(path)) {
    return `Endpoint "${path}" is not available.`;
  }

  const paramHash = createHash('sha256').update(url).digest('hex').slice(0, 12);
  const cacheKey = `${CACHE_PREFIX}:${path.slice(1).replace(/\//g, ':')}:${paramHash}`;

  const historical = isHistoricalSeason(params);

  const fetchFromEspn = async () => {
    const response = await globalThis.fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  };

  try {
    const skipCache = !historical && SKIP_CACHE_PATHS.has(path);
    let data: unknown;

    if (skipCache) {
      data = await fetchFromEspn();
    } else {
      const ttl = historical ? TTL_COMPLETED : TTL_LIVE;
      data = await redisFetch<unknown>(cacheKey, fetchFromEspn, ttl);
      if (historical) {
        await persistRedisKey(cacheKey);
      }
    }

    trackUsage(path);
    return truncateResponse(data, path);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.startsWith('ESPN API error') ? message : `ESPN lookup failed: ${message}`;
  }
};
