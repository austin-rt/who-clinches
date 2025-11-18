'use client';

import { useMemo } from 'react';
import { useGetGamesQuery } from '@/app/store/apiSlice';
import { GameLean } from '@/lib/types';
import { TeamMetadata } from '@/lib/api-types';
import FinalWeeks from './FinalWeeks';
import RemainingWeeks from './RemainingWeeks';
import LoadingSpinner from './LoadingSpinner';

type Week = [number, GameLean[]];

interface GamesListProps {
  season: number;
  conferenceId: number;
}

const GamesList = ({ season, conferenceId }: GamesListProps) => {
  const { data, isLoading, isError, isUninitialized } = useGetGamesQuery({
    season: season.toString(),
    conferenceId: conferenceId.toString(),
  });

  // Enrich games with team metadata from teams array
  const enrichedGames = useMemo(() => {
    if (!data) return [];

    const teamMap = new Map<string, TeamMetadata>(data.teams.map((team) => [team.id, team]));

    return data.events.map((game) => {
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
  }, [data]);

  // Separate final and remaining games
  const { finalGames, remainingGames } = useMemo(() => {
    const final: GameLean[] = [];
    const remaining: GameLean[] = [];

    enrichedGames.forEach((game) => {
      if (game.completed) {
        final.push(game);
      } else {
        remaining.push(game);
      }
    });

    return { finalGames: final, remainingGames: remaining };
  }, [enrichedGames]);

  // Group and sort games by week for both final and remaining
  const weeks = useMemo(() => {
    // Group final games by week
    const finalGamesByWeek = new Map<number, GameLean[]>();
    finalGames.forEach((game) => {
      const week = game.week ?? 0;
      if (!finalGamesByWeek.has(week)) {
        finalGamesByWeek.set(week, []);
      }
      finalGamesByWeek.get(week)!.push(game);
    });

    // Sort games within each final week by date
    finalGamesByWeek.forEach((games) => {
      games.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    // Sort final weeks and convert to Week[] tuples
    const finalWeeks: Week[] = Array.from(finalGamesByWeek.entries()).sort((a, b) => a[0] - b[0]);

    // Group remaining games by week
    const remainingGamesByWeek = new Map<number, GameLean[]>();
    remainingGames.forEach((game) => {
      const week = game.week ?? 0;
      if (!remainingGamesByWeek.has(week)) {
        remainingGamesByWeek.set(week, []);
      }
      remainingGamesByWeek.get(week)!.push(game);
    });

    // Sort games within each remaining week by date
    remainingGamesByWeek.forEach((games) => {
      games.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    // Sort remaining weeks and convert to Week[] tuples
    const remainingWeeks: Week[] = Array.from(remainingGamesByWeek.entries()).sort(
      (a, b) => a[0] - b[0]
    );

    return { final: finalWeeks, remaining: remainingWeeks };
  }, [finalGames, remainingGames]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <LoadingSpinner size="h-12 w-12" />
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return <div>Error loading games</div>;
  }

  // Handle empty state - only show if query has been initialized and completed
  if (!isUninitialized && !isLoading && remainingGames.length === 0 && finalGames.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-base-content/70">No games found</p>
      </div>
    );
  }

  return (
    <div>
      <FinalWeeks weeks={weeks.final} />
      <RemainingWeeks weeks={weeks.remaining} />
    </div>
  );
};

export default GamesList;
