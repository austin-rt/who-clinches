'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useGetGamesQuery } from '@/app/store/apiSlice';
import { GameLean } from '@/lib/types';
import { TeamMetadata } from '@/lib/api-types';
import { useUIState } from '@/app/store/useUI';
import FinalWeeks from './FinalWeeks';
import RemainingWeeks from './RemainingWeeks';
import CompactWeekGrid from './CompactWeekGrid';
import LoadingSpinner from './LoadingSpinner';

type WeekDay = { weekNumber: number; dayOfWeek: number; dayLabel: string; games: GameLean[] };

interface GamesListProps {
  season: number;
}

const GamesList = ({ season }: GamesListProps) => {
  const params = useParams();
  const sport = params.sport as string;
  const conf = params.conf as string;
  const { view } = useUIState();
  const { data, isLoading, isError, isUninitialized } = useGetGamesQuery({
    sport,
    conf,
    season: season.toString(),
  });

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

  const getDayLabel = (dayOfWeek: number): string => {
    const dayLabels = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return dayLabels[dayOfWeek] || '';
  };

  const weekDays = useMemo(() => {
    const finalWeekDays: WeekDay[] = [];
    const finalGamesByWeek = new Map<number, GameLean[]>();

    finalGames.forEach((game) => {
      const week = game.week ?? 0;
      if (!finalGamesByWeek.has(week)) {
        finalGamesByWeek.set(week, []);
      }
      finalGamesByWeek.get(week)!.push(game);
    });

    finalGamesByWeek.forEach((games, weekNumber) => {
      const gamesByDay = new Map<number, GameLean[]>();

      games.forEach((game) => {
        const gameDate = new Date(game.date);
        const dayOfWeek = gameDate.getDay();

        if ([0, 4, 5, 6].includes(dayOfWeek)) {
          if (!gamesByDay.has(dayOfWeek)) {
            gamesByDay.set(dayOfWeek, []);
          }
          gamesByDay.get(dayOfWeek)!.push(game);
        }
      });

      const dayOrder = [4, 5, 6, 0];
      dayOrder.forEach((dayOfWeek) => {
        const dayGames = gamesByDay.get(dayOfWeek);
        if (dayGames && dayGames.length > 0) {
          dayGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          finalWeekDays.push({
            weekNumber,
            dayOfWeek,
            dayLabel: getDayLabel(dayOfWeek),
            games: dayGames,
          });
        }
      });
    });

    finalWeekDays.sort((a, b) => {
      if (a.weekNumber !== b.weekNumber) {
        return a.weekNumber - b.weekNumber;
      }
      const dayOrder = [4, 5, 6, 0];
      return dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
    });

    const remainingWeekDays: WeekDay[] = [];
    const remainingGamesByWeek = new Map<number, GameLean[]>();

    remainingGames.forEach((game) => {
      const week = game.week ?? 0;
      if (!remainingGamesByWeek.has(week)) {
        remainingGamesByWeek.set(week, []);
      }
      remainingGamesByWeek.get(week)!.push(game);
    });

    remainingGamesByWeek.forEach((games, weekNumber) => {
      const gamesByDay = new Map<number, GameLean[]>();

      games.forEach((game) => {
        const gameDate = new Date(game.date);
        const dayOfWeek = gameDate.getDay();

        if ([0, 4, 5, 6].includes(dayOfWeek)) {
          if (!gamesByDay.has(dayOfWeek)) {
            gamesByDay.set(dayOfWeek, []);
          }
          gamesByDay.get(dayOfWeek)!.push(game);
        }
      });

      const dayOrder = [4, 5, 6, 0];
      dayOrder.forEach((dayOfWeek) => {
        const dayGames = gamesByDay.get(dayOfWeek);
        if (dayGames && dayGames.length > 0) {
          dayGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          remainingWeekDays.push({
            weekNumber,
            dayOfWeek,
            dayLabel: getDayLabel(dayOfWeek),
            games: dayGames,
          });
        }
      });
    });

    remainingWeekDays.sort((a, b) => {
      if (a.weekNumber !== b.weekNumber) {
        return a.weekNumber - b.weekNumber;
      }
      const dayOrder = [4, 5, 6, 0];
      return dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
    });

    return { final: finalWeekDays, remaining: remainingWeekDays };
  }, [finalGames, remainingGames]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <LoadingSpinner size="h-12 w-12" />
      </div>
    );
  }

  if (isError) {
    return <div>Error loading games</div>;
  }

  if (!isUninitialized && !isLoading && remainingGames.length === 0 && finalGames.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-base-content/70">No games found</p>
      </div>
    );
  }

  if (view === 'picks') {
    return (
      <CompactWeekGrid finalWeekDays={weekDays.final} remainingWeekDays={weekDays.remaining} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FinalWeeks weekDays={weekDays.final} />
      <RemainingWeeks weekDays={weekDays.remaining} />
    </div>
  );
};

export default GamesList;
