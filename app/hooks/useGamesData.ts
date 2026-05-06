import { useMemo, useEffect, useRef, useState } from 'react';
import { useGetSeasonGameDataQuery, GameLean, GamesResponse, TeamMetadata } from '@/app/store/api';
import { useAppSelector } from '@/app/store/hooks';
import { type SportSlug } from '@/lib/constants';

interface UseGamesDataParams {
  sport: SportSlug;
  conf: string;
}

interface UseGamesDataReturn {
  games: GameLean[];
  teams: TeamMetadata[];
  season: number | null;
  isLoading: boolean;
  isError: boolean;
  isUninitialized: boolean;
}

export const useGamesData = ({ sport, conf }: UseGamesDataParams): UseGamesDataReturn => {
  const season = useAppSelector((state) => state.app.season);

  const queryArgs = useMemo(
    () => ({
      sport,
      conf,
      season: season!,
    }),
    [sport, conf, season]
  );

  const {
    data: seasonData,
    isLoading,
    isError,
    isUninitialized,
  } = useGetSeasonGameDataQuery(queryArgs, {
    skip: season === null,
    refetchOnMountOrArgChange: true,
  });

  const [subscriptionData, setSubscriptionData] = useState<GamesResponse | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const hasLiveGames = useMemo(() => {
    const dataToCheck = subscriptionData || seasonData;
    if (!dataToCheck?.events || dataToCheck.events.length === 0) {
      return false;
    }
    return dataToCheck.events.some((game: GameLean) => game.state === 'in');
  }, [subscriptionData, seasonData]);

  const hasGamesStartingSoon = useMemo(() => {
    const dataToCheck = subscriptionData || seasonData;
    if (!dataToCheck?.events || dataToCheck.events.length === 0) {
      return false;
    }
    const now = new Date().getTime();
    const fiveMinutesInMs = 5 * 60 * 1000;
    return dataToCheck.events.some((game: GameLean) => {
      if (game.state !== 'pre') return false;
      const gameDate = new Date(game.date).getTime();
      const timeUntilGame = gameDate - now;
      return timeUntilGame > 0 && timeUntilGame <= fiveMinutesInMs;
    });
  }, [subscriptionData, seasonData]);

  const shouldSubscribe = hasLiveGames || hasGamesStartingSoon;

  useEffect(() => {
    if (!shouldSubscribe || isLoading || isUninitialized || season === null) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const eventSource = new EventSource(`/api/games/${sport}/${conf}/subscribe?season=${season}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          return;
        }
        setSubscriptionData(data as GamesResponse);
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
    };

    eventSourceRef.current = eventSource;

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [shouldSubscribe, isLoading, isUninitialized, sport, conf, season]);

  const finalData = subscriptionData || seasonData;

  const games = useMemo(() => {
    if (!finalData || !finalData.events) return [];
    return finalData.events;
  }, [finalData]);

  const teams = useMemo(() => {
    if (!seasonData || !seasonData.teams) return [];
    return seasonData.teams;
  }, [seasonData]);

  return {
    games,
    teams,
    season,
    isLoading,
    isError,
    isUninitialized,
  };
};
