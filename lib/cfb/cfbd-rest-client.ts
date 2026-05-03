import {
  client,
  getGames,
  getTeams,
  getLines,
  getCalendar,
  getUserInfo,
  getTeamStats,
  getRankings,
  getSp,
  getFpi,
  type Game,
  type BettingGame,
  type Team,
  type CalendarWeek,
  type UserInfo,
  type TeamStat,
  type PollWeek,
  type TeamSP,
  type TeamFPI,
} from 'cfbd';
import { logError } from '@/lib/errorLogger';
import { JSON_SERVER_URL } from '@/lib/constants';
import { getFixtureYear } from './helpers/fixture-year';
import {
  CFBD_PREPROD_ROTATION_THRESHOLD,
  applyPreprodKeyRotationPolicy,
  parseCfbdApiKeyPool,
  selectActiveApiKey,
  type PreprodKeyUsage,
} from './helpers/cfbd-preprod-key-rotation';

const cfbdApiKeyPool = parseCfbdApiKeyPool(process.env.CFBD_API_KEY);
let activePreprodKeyIndex = 0;
const preprodKeyUsage = new Map<number, PreprodKeyUsage>();

export const getActiveApiKey = (): string =>
  selectActiveApiKey(cfbdApiKeyPool, process.env.VERCEL_ENV, activePreprodKeyIndex);

const rotatePreprodKeyIfNeeded = (remainingCalls: number): void => {
  const prevIndex = activePreprodKeyIndex;
  const result = applyPreprodKeyRotationPolicy({
    vercelEnv: process.env.VERCEL_ENV,
    poolLength: cfbdApiKeyPool.length,
    activeIndex: activePreprodKeyIndex,
    usageByIndex: preprodKeyUsage,
    remainingCallsForActiveKey: remainingCalls,
    threshold: CFBD_PREPROD_ROTATION_THRESHOLD,
    now: Date.now(),
  });

  if (result.kind === 'no_attempt') return;

  preprodKeyUsage.clear();
  for (const [key, usage] of result.nextUsageByIndex.entries()) {
    preprodKeyUsage.set(key, usage);
  }
  activePreprodKeyIndex = result.nextActiveIndex;

  if (result.nextActiveIndex !== prevIndex) {
    const baseUrl = getBaseUrl();
    client.setConfig({
      headers: { Authorization: `Bearer ${cfbdApiKeyPool[result.nextActiveIndex]}` },
      ...(baseUrl && { baseUrl }),
    });
  }

  if (result.logAllKeysExhausted) {
    void logError(new Error('All preprod CFBD API keys below rotation threshold'), {
      action: 'cfbd-key-rotation',
      preprodKeyCount: cfbdApiKeyPool.length,
      usageSnapshot: Object.fromEntries(preprodKeyUsage),
    });
  }
};

const getBaseUrl = (): string | undefined => {
  if (process.env.VERCEL_ENV === 'production') return undefined;
  if (getFixtureYear() !== null || process.env.NODE_ENV === 'test') {
    return JSON_SERVER_URL;
  }
  return undefined;
};

const baseUrl = getBaseUrl();
client.setConfig({
  headers: {
    Authorization: `Bearer ${getActiveApiKey()}`,
  },
  ...(baseUrl && { baseUrl }),
});

let lastUserInfoCheck: { info: UserInfo; timestamp: number } | null = null;
const USER_INFO_CACHE_MS = 60000;

const logRemainingCalls = async (info: UserInfo) => {
  const { patronLevel, remainingCalls } = info;

  const TIER_LIMITS: Record<number, number> = {
    0: 1000, // Free tier
    1: 5000, // Patreon Tier 1 ($1/month)
    2: 30000, // Patreon Tier 2 ($5/month)
    3: 75000, // Patreon Tier 3 ($10/month)
  };
  const TIER_THRESHOLD_PERCENTAGES: Record<number, number> = {
    0: 0.1, // 10% for Free tier
    1: 0.1, // 10% for Tier 1
    2: 0.05, // 5% for Tier 2
    3: 0.025, // 2.5% for Tier 3
  };
  const tierLimit = TIER_LIMITS[patronLevel] ?? TIER_LIMITS[0];
  const percentage = TIER_THRESHOLD_PERCENTAGES[patronLevel] ?? TIER_THRESHOLD_PERCENTAGES[0];
  const threshold = Math.floor(tierLimit * percentage);

  if (remainingCalls < threshold) {
    if (process.env.NODE_ENV === 'production') {
      const { sendLowCallsAlert } = await import('./helpers/email-alerts');
      void sendLowCallsAlert(info).catch((error) => {
        void logError(error, {
          action: 'send-low-calls-alert',
          patronLevel: info.patronLevel,
          remainingCalls: info.remainingCalls,
        });
      });
    }
  }
};

export const getUserInfoFromCfbd = async (forceRefresh = false): Promise<UserInfo | null> => {
  try {
    const now = Date.now();

    if (
      !forceRefresh &&
      lastUserInfoCheck &&
      now - lastUserInfoCheck.timestamp < USER_INFO_CACHE_MS
    ) {
      return lastUserInfoCheck.info;
    }

    const result = await getUserInfo();
    const info = result.data;

    if (info) {
      lastUserInfoCheck = { info, timestamp: now };
      void logRemainingCalls(info);
      rotatePreprodKeyIfNeeded(info.remainingCalls);
      return info;
    }

    return lastUserInfoCheck?.info ?? null;
  } catch (error) {
    await logError(error, {
      action: 'get-user-info',
    });
    return lastUserInfoCheck?.info ?? null;
  }
};

export const getGamesFromCfbd = async (params: {
  year?: number;
  week?: number;
  seasonType?: string;
  team?: string;
  conference?: string;
  id?: number;
}): Promise<Game[]> => {
  try {
    const result = await getGames({
      query: {
        year: params.year,
        week: params.week,
        seasonType: params.seasonType as Game['seasonType'] | undefined,
        home: params.team,
        away: params.team,
        conference: params.conference,
        gameId: params.id,
      },
    });

    void getUserInfoFromCfbd();
    return result.data ?? [];
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error(`Failed to fetch games: ${String(error)}`);
    await logError(errorObj, {
      action: 'get-games-from-cfbd',
      params,
    });
    throw errorObj;
  }
};

export const getTeamsFromCfbd = async (params?: {
  conference?: string;
  classification?: string;
}): Promise<Team[]> => {
  try {
    const result = await getTeams({
      query: {
        conference: params?.conference,
        classification: params?.classification,
      },
    });

    void getUserInfoFromCfbd();
    return result.data ?? [];
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error(`Failed to fetch teams: ${String(error)}`);
    await logError(errorObj, {
      action: 'get-teams-from-cfbd',
      params,
    });
    throw errorObj;
  }
};

export const getLinesFromCfbd = async (params: {
  year?: number;
  week?: number;
  seasonType?: string;
  team?: string;
  conference?: string;
}): Promise<BettingGame[]> => {
  const result = await getLines({
    query: {
      year: params.year,
      week: params.week,
      seasonType: params.seasonType as BettingGame['seasonType'] | undefined,
      home: params.team,
      away: params.team,
      conference: params.conference,
    },
  });

  void getUserInfoFromCfbd();
  return result.data ?? [];
};

export const getCalendarFromCfbd = async (year: number): Promise<CalendarWeek[]> => {
  const result = await getCalendar({
    query: {
      year,
    },
  });
  return result.data ?? [];
};

export const getTeamStatsFromCfbd = async (params: {
  year: number;
  conference?: string;
  team?: string;
  startWeek?: number;
  endWeek?: number;
}): Promise<TeamStat[]> => {
  const result = await getTeamStats({
    query: {
      year: params.year,
      ...(params.conference && { conference: params.conference }),
      ...(params.team && { team: params.team }),
      ...(params.startWeek !== undefined && { startWeek: params.startWeek }),
      ...(params.endWeek !== undefined && { endWeek: params.endWeek }),
    },
  });
  void getUserInfoFromCfbd();
  return result.data ?? [];
};

export const getRankingsFromCfbd = async (params: {
  year: number;
  week?: number;
  seasonType?: string;
}): Promise<PollWeek[]> => {
  const result = await getRankings({
    query: {
      year: params.year,
      ...(params.week !== undefined && { week: params.week }),
      ...(params.seasonType && { seasonType: params.seasonType as 'regular' | 'postseason' }),
    },
  });
  void getUserInfoFromCfbd();
  return result.data ?? [];
};

export const getSpFromCfbd = async (params: { year: number; team?: string }): Promise<TeamSP[]> => {
  try {
    const result = await getSp({
      query: {
        year: params.year,
        ...(params.team && { team: params.team }),
      },
    });

    void getUserInfoFromCfbd();

    interface ErrorResponse {
      error: unknown;
      response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
      };
    }

    interface SuccessResponse {
      data: TeamSP[];
    }

    if (result && typeof result === 'object' && 'error' in result && result.error) {
      const errorResult = result as ErrorResponse;
      const errorMessage = String(errorResult.error);
      const status = errorResult.response?.status;
      const statusText = errorResult.response?.statusText;
      const responseData = errorResult.response?.data;

      await logError(new Error(`SP+ API error: ${errorMessage}`), {
        action: 'get-sp-from-cfbd',
        params,
        error: errorResult.error,
        status,
        statusText,
        responseData,
      });
      return [];
    }

    if (result && typeof result === 'object' && 'data' in result) {
      const successResult = result as SuccessResponse;
      if (Array.isArray(successResult.data)) {
        return successResult.data;
      }
    }

    if (Array.isArray(result)) {
      return result;
    }

    return [];
  } catch (error) {
    await logError(error instanceof Error ? error : new Error(String(error)), {
      action: 'get-sp-from-cfbd',
      params,
    });
    return [];
  }
};

export const getFpiFromCfbd = async (params: {
  year: number;
  team?: string;
}): Promise<TeamFPI[]> => {
  try {
    const result = await getFpi({
      query: {
        year: params.year,
        ...(params.team && { team: params.team }),
      },
    });

    void getUserInfoFromCfbd();

    interface ErrorResponse {
      error: unknown;
      response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
      };
    }

    interface SuccessResponse {
      data: TeamFPI[];
    }

    if (result && typeof result === 'object' && 'error' in result && result.error) {
      const errorResult = result as ErrorResponse;
      const errorMessage = String(errorResult.error);
      const status = errorResult.response?.status;
      const statusText = errorResult.response?.statusText;
      const responseData = errorResult.response?.data;

      await logError(new Error(`FPI API error: ${errorMessage}`), {
        action: 'get-fpi-from-cfbd',
        params,
        error: errorResult.error,
        status,
        statusText,
        responseData,
      });
      return [];
    }

    if (result && typeof result === 'object' && 'data' in result) {
      const successResult = result as SuccessResponse;
      if (Array.isArray(successResult.data)) {
        return successResult.data;
      }
    }

    if (Array.isArray(result)) {
      return result;
    }

    return [];
  } catch (error) {
    await logError(error instanceof Error ? error : new Error(String(error)), {
      action: 'get-fpi-from-cfbd',
      params,
    });
    return [];
  }
};
