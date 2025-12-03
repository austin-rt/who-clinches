import { useMemo, useEffect, useRef } from 'react';
import {
  useGetSeasonGameDataFromCacheQuery,
  useGetSeasonGameDataQuery,
  useLazyGetSeasonGameDataQuery,
  useGetLiveGameDataQuery,
  useGetSpreadDataQuery,
} from '@/app/store/apiSlice';
import { useUIState } from '@/app/store/useUI';
import { useAppSelector } from '@/app/store/hooks';
import { GameLean } from '@/lib/types';
import { TeamMetadata } from '@/lib/api-types';

interface UseGamesDataParams {
  sport: string;
  conf: string;
}

interface UseGamesDataReturn {
  enrichedGames: GameLean[];
  season: number;
  isLoading: boolean;
  isError: boolean;
  isUninitialized: boolean;
}

export const useGamesData = ({ sport, conf }: UseGamesDataParams): UseGamesDataReturn => {
  const { view } = useUIState();
  const season = useAppSelector((state) => state.ui.season) ?? new Date().getFullYear();

  const cacheQueryArgs = useMemo(
    () => ({
      sport,
      conf,
      season: season ?? undefined,
    }),
    [sport, conf, season]
  );

  const refreshQueryArgs = useMemo(
    () => ({
      sport,
      conf,
      season: season!,
      force: true,
    }),
    [sport, conf, season]
  );

  const {
    data: initialData,
    isLoading: isInitialLoading,
    isError: isInitialError,
    isUninitialized: isInitialUninitialized,
    isSuccess: isInitialSuccess,
  } = useGetSeasonGameDataFromCacheQuery(cacheQueryArgs, {
    refetchOnMountOrArgChange: true,
    skip: season === null,
  });

  const hasSeededRef = useRef<string>('');

  const [triggerSeed, { data: seededData, isLoading: isSeeding }] = useLazyGetSeasonGameDataQuery();

  const cacheKey = `${sport}/${conf}/${season ?? 'null'}`;

  useEffect(() => {
    if (hasSeededRef.current !== cacheKey) {
      hasSeededRef.current = '';
    }
  }, [cacheKey]);

  useEffect(() => {
    if (
      isInitialSuccess &&
      initialData?.needsSeeding &&
      hasSeededRef.current !== cacheKey &&
      !isSeeding
    ) {
      hasSeededRef.current = cacheKey;
      void triggerSeed(refreshQueryArgs);
    }
  }, [
    isInitialSuccess,
    initialData?.needsSeeding,
    triggerSeed,
    refreshQueryArgs,
    isSeeding,
    cacheKey,
  ]);

  const shouldRefresh = useMemo(() => {
    return isInitialSuccess && !!initialData && !initialData.needsSeeding;
  }, [isInitialSuccess, initialData]);

  const { data: refreshData, isError: isRefreshError } = useGetSeasonGameDataQuery(
    refreshQueryArgs,
    {
      skip: !shouldRefresh || season === null,
    }
  );

  const seasonData = seededData || refreshData || initialData;
  const isLoading = isInitialLoading || isSeeding;
  const isError = isInitialError || isRefreshError;
  const isUninitialized = isInitialUninitialized && !isSeeding;

  const liveQueryArgs = useMemo(
    () => ({
      sport,
      conf,
      force: true,
    }),
    [sport, conf]
  );

  const spreadsQueryArgs = useMemo(
    () => ({
      sport,
      conf,
      season: season!,
      force: true,
    }),
    [sport, conf, season]
  );

  const initialPollingConfig = useMemo(() => {
    if (!seasonData?.events || seasonData.events.length === 0) {
      return { pollingInterval: 0, useLive: false, useSpreads: false };
    }

    const now = new Date().getTime();
    const fiveMinutesInMs = 5 * 60 * 1000;

    const hasLiveGames = seasonData.events.some((game: GameLean) => game.state === 'in');
    const hasGamesStartingSoon = seasonData.events.some((game: GameLean) => {
      if (game.state !== 'pre') return false;
      const gameDate = new Date(game.date).getTime();
      const timeUntilGame = gameDate - now;
      return timeUntilGame > 0 && timeUntilGame <= fiveMinutesInMs;
    });

    const allCompleted = seasonData.events.every(
      (game: GameLean) => game.state === 'post' && game.completed
    );

    if (allCompleted) {
      return { pollingInterval: 0, useLive: false, useSpreads: false };
    }

    if (hasLiveGames || hasGamesStartingSoon) {
      return {
        pollingInterval: 60000,
        useLive: true,
        useSpreads: false,
      };
    }

    const isDev = process.env.NODE_ENV === 'development';

    const hasPreGameGames = seasonData.events.some((game: GameLean) => game.state === 'pre');
    if (hasPreGameGames && view === 'scores' && !isDev) {
      return {
        pollingInterval: 120000,
        useLive: false,
        useSpreads: true,
      };
    }

    return { pollingInterval: 0, useLive: false, useSpreads: false };
  }, [seasonData, view]);

  const isDev = process.env.NODE_ENV === 'development';
  const { data: liveData } = useGetLiveGameDataQuery(liveQueryArgs, {
    pollingInterval:
      initialPollingConfig.useLive && !isDev ? initialPollingConfig.pollingInterval : 0,
    skip: !initialPollingConfig.useLive || isLoading || isUninitialized || isDev,
  });

  const pollingConfig = useMemo(() => {
    const dataToCheck = liveData || seasonData;

    if (!dataToCheck?.events || dataToCheck.events.length === 0) {
      return initialPollingConfig;
    }

    const now = new Date().getTime();
    const fiveMinutesInMs = 5 * 60 * 1000;

    const hasLiveGames = dataToCheck.events.some((game: GameLean) => game.state === 'in');
    const hasGamesStartingSoon = dataToCheck.events.some((game: GameLean) => {
      if (game.state !== 'pre') return false;
      const gameDate = new Date(game.date).getTime();
      const timeUntilGame = gameDate - now;
      return timeUntilGame > 0 && timeUntilGame <= fiveMinutesInMs;
    });

    const allPost = dataToCheck.events.every((game: GameLean) => game.state === 'post');

    if (allPost) {
      return { pollingInterval: 0, useLive: false, useSpreads: false };
    }

    if (hasLiveGames || hasGamesStartingSoon) {
      return {
        pollingInterval: 60000,
        useLive: true,
        useSpreads: false,
      };
    }

    return initialPollingConfig;
  }, [seasonData, liveData, initialPollingConfig]);

  const { data: spreadsData } = useGetSpreadDataQuery(spreadsQueryArgs, {
    pollingInterval: pollingConfig.useSpreads ? pollingConfig.pollingInterval : 0,
    skip: !pollingConfig.useSpreads || isLoading || isUninitialized,
  });

  const finalData = liveData || spreadsData || seasonData;

  const enrichedGames = useMemo(() => {
    if (!finalData) return [];

    const teamMap = new Map<string, TeamMetadata>(
      finalData.teams.map((team: TeamMetadata) => [team.id, team])
    );

    return finalData.events.map((game: GameLean) => {
      const homeTeam = teamMap.get(game.home.teamEspnId);
      const awayTeam = teamMap.get(game.away.teamEspnId);

      return {
        ...game,
        home: {
          ...game.home,
          displayName: homeTeam?.displayName || game.home.abbrev,
          logo: homeTeam?.logo || game.home.logo || '',
          color: homeTeam?.color || game.home.color || '',
          alternateColor: homeTeam?.alternateColor || game.home.alternateColor || '',
        },
        away: {
          ...game.away,
          displayName: awayTeam?.displayName || game.away.abbrev,
          logo: awayTeam?.logo || game.away.logo || '',
          color: awayTeam?.color || game.away.color || '',
          alternateColor: awayTeam?.alternateColor || game.away.alternateColor || '',
        },
      };
    }) as GameLean[];
  }, [finalData]);

  return {
    enrichedGames,
    season,
    isLoading,
    isError,
    isUninitialized,
  };
};
