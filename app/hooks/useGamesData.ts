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

  const isInSeason = useAppSelector((state) => state.app.isInSeason);

  const shouldSubscribe = isInSeason === true;

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
      if (eventSource.readyState === EventSource.CLOSED) {
        eventSource.close();
        eventSourceRef.current = null;
      }
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
