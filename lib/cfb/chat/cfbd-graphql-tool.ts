import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { getActiveApiKey } from '@/lib/cfb/cfbd-rest-client';
import { GRAPHQL_ENDPOINT } from '@/lib/cfb/cfbd-graphql-client';
import { logError } from '@/lib/errorLogger';
import { redis } from '@/lib/redis';
import { validateAiGraphqlQuery } from './cfbd-graphql-validator';

const REQUEST_TIMEOUT_MS = 15000;
const MAX_RESPONSE_CHARS = 8000;
const USAGE_KEY = 'cfbd:gql-ai-usage';
const KILL_KEY = 'cfbd:gql-ai:disabled';
const KILL_MEMO_MS = 10000;

let killMemo: { disabled: boolean; expiresAt: number } | null = null;

export const clearGraphqlAiKillMemo = (): void => {
  killMemo = null;
};

export const graphqlAiEnabled = async (): Promise<boolean> => {
  if (process.env.CFBD_GRAPHQL_AI !== 'true') return false;

  if (killMemo && Date.now() < killMemo.expiresAt) return !killMemo.disabled;

  let disabled = false;
  if (redis) {
    try {
      disabled = Boolean(await redis.get(KILL_KEY));
    } catch {
      disabled = false;
    }
  }
  killMemo = { disabled, expiresAt: Date.now() + KILL_MEMO_MS };
  return !disabled;
};

const trackUsage = (rootFields: string[]) => {
  if (!redis) return;
  rootFields.forEach((field) => {
    void redis.zincrby(USAGE_KEY, 1, field).catch(() => {});
  });
};

const truncate = (value: unknown): string => {
  const serialized = JSON.stringify(value);
  if (serialized.length <= MAX_RESPONSE_CHARS) return serialized;
  return `${serialized.slice(0, MAX_RESPONSE_CHARS)}\n[truncated — narrow your query or lower the limit]`;
};

export const executeCfbdGraphqlQuery = async (query: string): Promise<string> => {
  if (!(await graphqlAiEnabled())) {
    return 'The GraphQL tool is currently unavailable. Use cfbd_lookup instead.';
  }

  const validation = validateAiGraphqlQuery(query);
  if (!validation.ok) {
    return `Query rejected: ${validation.reason}`;
  }

  const apiKey = getActiveApiKey();
  if (!apiKey) {
    return 'Query rejected: no CFBD API key is configured.';
  }

  try {
    const response = await fetchWithTimeout(
      GRAPHQL_ENDPOINT,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      },
      REQUEST_TIMEOUT_MS
    );

    if (!response.ok) {
      return `CFBD GraphQL returned ${response.status}. Try cfbd_lookup instead.`;
    }

    const result = (await response.json()) as {
      data?: unknown;
      errors?: Array<{ message: string }>;
    };

    if (result.errors && result.errors.length > 0) {
      return `GraphQL errors: ${result.errors.map((e) => e.message).join('; ')}`;
    }

    trackUsage(validation.rootFields ?? []);
    return truncate(result.data);
  } catch (error) {
    await logError(error, { action: 'cfbd-graphql-ai-query' });
    return 'CFBD GraphQL request failed. Try cfbd_lookup instead.';
  }
};
