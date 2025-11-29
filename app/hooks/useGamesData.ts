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

export const useGamesData = ({
  sport,
  conf,
  season,
}: UseGamesDataParams): UseGamesDataReturn => {
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
    // Always fetch on mount, don't skip initial query
    refetchOnMountOrArgChange: true,
  });

  const pollingConfig = useMemo(() => {
    if (!seasonData?.events || seasonData.events.length === 0) {
      return { pollingInterval: 0, useLive: false, useSpreads: false };
    }

    const hasLiveGames = seasonData.events.some((game) => game.state === 'in');

    const allCompleted = seasonData.events.every(
      (game) => game.state === 'post' && game.completed
    );

    if (allCompleted) {
      return { pollingInterval: 0, useLive: false, useSpreads: false };
    }

    const hasPreGameGames = seasonData.events.some((game) => game.state === 'pre');

    // Use live polling if there are live games
    if (hasLiveGames) {
      return {
        pollingInterval: 300000, // 5 min for live
        useLive: true,
        useSpreads: false,
      };
    }

    // Use spreads polling if there are pre-game games AND we're in scores mode AND in prod/preview
    // Only run spreads polling in production/preview (not in development)
    const isProdOrPreview = typeof window !== 'undefined' 
      ? window.location.hostname !== 'localhost' && 
        !window.location.hostname.includes('127.0.0.1') &&
        !window.location.hostname.includes('192.168.')
      : false;
    
    if (hasPreGameGames && view === 'scores' && isProdOrPreview) {
      return {
        pollingInterval: 300000, // 5 min for spreads
        useLive: false,
        useSpreads: true,
      };
    }

    // No polling if no active games
    return { pollingInterval: 0, useLive: false, useSpreads: false };
  }, [seasonData, view]);

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

  const { data: liveData } = useGetLiveGameDataQuery(liveQueryArgs, {
    pollingInterval: pollingConfig.useLive ? pollingConfig.pollingInterval : 0,
    skip: !pollingConfig.useLive || isLoading || isUninitialized,
  });

  const { data: spreadsData } = useGetSpreadDataQuery(spreadsQueryArgs, {
    pollingInterval: pollingConfig.useSpreads ? pollingConfig.pollingInterval : 0,
    skip: !pollingConfig.useSpreads || isLoading || isUninitialized,
  });

  const finalData = liveData || spreadsData || seasonData;

  const enrichedGames = useMemo(() => {
    if (!finalData) return [];

    const teamMap = new Map<string, TeamMetadata>(
      finalData.teams.map((team) => [team.id, team])
    );

    return finalData.events.map((game) => {
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

