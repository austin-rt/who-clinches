import { useMemo } from 'react';
import {
  useGetSeasonGameDataQuery,
  useGetLiveGameDataQuery,
  useGetSpreadDataQuery,
} from '@/app/store/apiSlice';
import { useUIState } from '@/app/store/useUI';
import { GameLean } from '@/lib/types';
import { TeamMetadata } from '@/lib/api-types';

interface UseGamesDataParams {
  sport: string;
  conf: string;
  season: number;
}

interface UseGamesDataReturn {
  enrichedGames: GameLean[];
  isLoading: boolean;
  isError: boolean;
  isUninitialized: boolean;
}

export const useGamesData = ({ sport, conf, season }: UseGamesDataParams): UseGamesDataReturn => {
  const { view } = useUIState();
  const seasonQueryArgs = useMemo(
    () => ({
      sport,
      conf,
      season: season.toString(),
      force: true,
    }),
    [sport, conf, season]
  );

  const {
    data: seasonData,
    isLoading,
    isError,
    isUninitialized,
  } = useGetSeasonGameDataQuery(seasonQueryArgs, {
    refetchOnMountOrArgChange: true,
  });

  const liveQueryArgs = useMemo(
    () => ({
      sport,
      conf,
      season: season.toString(),
      force: true,
    }),
    [sport, conf, season]
  );

  const spreadsQueryArgs = useMemo(
    () => ({
      sport,
      conf,
      season: season.toString(),
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
        pollingInterval: 300000,
        useLive: true,
        useSpreads: false,
      };
    }

    const isProdOrPreview =
      typeof window !== 'undefined'
        ? window.location.hostname !== 'localhost' &&
          !window.location.hostname.includes('127.0.0.1') &&
          !window.location.hostname.includes('192.168.')
        : false;

    const hasPreGameGames = seasonData.events.some((game: GameLean) => game.state === 'pre');
    if (hasPreGameGames && view === 'scores' && isProdOrPreview) {
      return {
        pollingInterval: 300000,
        useLive: false,
        useSpreads: true,
      };
    }

    return { pollingInterval: 0, useLive: false, useSpreads: false };
  }, [seasonData, view]);

  const { data: liveData } = useGetLiveGameDataQuery(liveQueryArgs, {
    pollingInterval: initialPollingConfig.useLive ? initialPollingConfig.pollingInterval : 0,
    skip: !initialPollingConfig.useLive || isLoading || isUninitialized,
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
        pollingInterval: 300000,
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
    isLoading,
    isError,
    isUninitialized,
  };
};
