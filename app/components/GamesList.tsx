'use client';

import { useMemo, useState } from 'react';
import { useGetGamesQuery } from '@/app/store/apiSlice';
import { GameLean } from '@/lib/types';
import { TeamMetadata } from '@/lib/api-types';
import GamesFilter from './GamesFilter';
import LoadingSpinner from './LoadingSpinner';
import WeekAccordion from './WeekAccordion';

interface GamesListProps {
  season: number;
  conferenceId: number;
}

const GamesList = ({ season, conferenceId }: GamesListProps) => {
  const [showCompleted, setShowCompleted] = useState(false);

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

  // Filter games based on showCompleted toggle
  const filteredGames = useMemo(() => {
    if (showCompleted) {
      return enrichedGames;
    }
    return enrichedGames.filter((game) => !game.completed);
  }, [enrichedGames, showCompleted]);

  // Group games by week
  const gamesByWeek = useMemo(() => {
    const grouped = new Map<number, GameLean[]>();

    filteredGames.forEach((game) => {
      const week = game.week ?? 0;
      if (!grouped.has(week)) {
        grouped.set(week, []);
      }
      grouped.get(week)!.push(game);
    });

    // Sort games within each week by date
    grouped.forEach((games) => {
      games.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return grouped;
  }, [filteredGames]);

  // Handle loading state
  if (!isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-8">
        <LoadingSpinner size="h-12 w-12" />
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return <div>Error loading games</div>;
  }

  // Handle empty state - only show if query has been initialized and completed
  if (!isUninitialized && !isLoading && filteredGames.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-base-content/70">No games found</p>
        {!showCompleted && (
          <p className="text-base-content/50 mt-2 text-sm">
            Try enabling "Show Completed Games" to see all games
          </p>
        )}
      </div>
    );
  }

  // Sort weeks for display
  const sortedWeeks = Array.from(gamesByWeek.keys()).sort((a, b) => {
    // Put week 0 (no week assigned) at the end
    if (a === 0) return 1;
    if (b === 0) return -1;
    return a - b;
  });

  // Extract lastUpdated before TypeScript narrows data to never
  const lastUpdated =
    data && typeof data === 'object' && 'lastUpdated' in data
      ? (data as { lastUpdated?: string }).lastUpdated
      : undefined;

  return (
    <div>
      <GamesFilter showCompleted={showCompleted} onToggle={setShowCompleted} />

      <div className="space-y-4">
        {sortedWeeks.map((week) => {
          const weekGames = gamesByWeek.get(week) || [];
          return <WeekAccordion key={week} weekNumber={week || 0} games={weekGames} />;
        })}
      </div>

      {lastUpdated && (
        <div className="text-base-content/50 mt-4 text-right text-xs">
          Last updated:{' '}
          {new Date(lastUpdated).toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
};

export default GamesList;
