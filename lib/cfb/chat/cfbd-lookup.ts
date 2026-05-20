import { getActiveApiKey } from '@/lib/cfb/cfbd-rest-client';
import { fetch as redisFetch, persistRedisKey } from '@/lib/redis';
import { getSeasonAwareTtl } from '@/lib/cfb/helpers/season-phase';
import { ALLOWED_PATHS, NEVER_CACHE_PATHS } from './cfbd-api-catalog';
import { createHash } from 'crypto';

const CFBD_BASE_URL = 'https://apinext.collegefootballdata.com';
const MAX_RESPONSE_CHARS = 8000;
const MAX_ARRAY_ITEMS = 50;
const CACHE_PREFIX = 'cfbd:chat';

const isHistorical = (params: Record<string, string>): boolean => {
  const year = params.year || params.season;
  if (!year) return false;
  const requested = parseInt(year, 10);
  return !isNaN(requested) && requested < new Date().getFullYear();
};

const truncateResponse = (data: unknown): string => {
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

export const executeCfbdLookup = async (
  endpoint: string,
  params: Record<string, string>
): Promise<string> => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!ALLOWED_PATHS.has(path)) {
    return `Unknown endpoint "${path}". Use one of the endpoints from your API reference.`;
  }

  const url = new URL(`${CFBD_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  const paramHash = createHash('sha256')
    .update(url.searchParams.toString())
    .digest('hex')
    .slice(0, 12);
  const cacheKey = `${CACHE_PREFIX}:${path.slice(1).replace(/\//g, ':')}:${paramHash}`;

  const historical = isHistorical(params);
  const neverCache = NEVER_CACHE_PATHS.has(path);

  const fetchFromCfbd = async () => {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${getActiveApiKey()}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 400) {
        const text = await response.text();
        throw new Error(`CFBD API error (400): ${text.slice(0, 500)}`);
      }
      throw new Error(`CFBD API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  try {
    let data: unknown;

    if (neverCache) {
      data = await fetchFromCfbd();
    } else {
      const ttl = await getSeasonAwareTtl();
      data = await redisFetch<unknown>(cacheKey, fetchFromCfbd, ttl);

      if (historical) {
        await persistRedisKey(cacheKey);
      }
    }

    return truncateResponse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.startsWith('CFBD API error') ? message : `CFBD lookup failed: ${message}`;
  }
};
