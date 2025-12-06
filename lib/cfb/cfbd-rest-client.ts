import {
  client,
  getGames,
  getTeams,
  getLines,
  getCalendar,
  getRecords,
  getScoreboard,
  getUserInfo,
  type Game,
  type BettingGame,
  type Team,
  type CalendarWeek,
  type TeamRecords,
  type ScoreboardGame,
  type DivisionClassification,
  type UserInfo,
} from 'cfbd';

client.setConfig({
  headers: {
    Authorization: `Bearer ${process.env.CFBD_API_KEY}`,
  },
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
    // eslint-disable-next-line no-console
    console.warn(
      `[CFBD API] Low remaining calls: ${remainingCalls} (Patron Level: ${patronLevel}) - Sending alert...`
    );
    if (process.env.NODE_ENV === 'production') {
      const { sendLowCallsAlert } = await import('./helpers/email-alerts');
      void sendLowCallsAlert(info).catch((error) => {
        // eslint-disable-next-line no-console
        console.error('[CFBD API] Alert sending failed:', error);
      });
    }
  } else if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[CFBD API] Remaining calls: ${remainingCalls} (Patron Level: ${patronLevel})`);
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
      return info;
    }

    return lastUserInfoCheck?.info ?? null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[CFBD API] Failed to fetch user info:', error);
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
};

export const getTeamsFromCfbd = async (params?: { conference?: string }): Promise<Team[]> => {
  const result = await getTeams({
    query: {
      conference: params?.conference,
    },
  });

  void getUserInfoFromCfbd();
  return result.data ?? [];
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

export const getScoreboardFromCfbd = async (params?: {
  classification?: string;
  conference?: string;
}): Promise<ScoreboardGame[]> => {
  const result = await getScoreboard({
    query: {
      classification: params?.classification as DivisionClassification | undefined,
      conference: params?.conference,
    },
  });
  return result.data ?? [];
};

export const getRecordsFromCfbd = async (params: {
  year?: number;
  team?: string;
  conference?: string;
}): Promise<TeamRecords[]> => {
  const result = await getRecords({
    query: {
      year: params.year,
      team: params.team,
      conference: params.conference,
    },
  });
  return result.data ?? [];
};
