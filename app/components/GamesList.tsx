'use client';

import { useMemo, useState } from 'react';
import { useGetGamesQuery } from '@/app/store/apiSlice';
import { GameLean } from '@/lib/types';
import { TeamMetadata } from '@/lib/api-types';
import GameCard from './GameCard';
import GamesFilter from './GamesFilter';

interface GamesListProps {
  season: number;
  conferenceId: number;
}

const GamesList = ({ season, conferenceId }: GamesListProps) => {
  const [showCompleted, setShowCompleted] = useState(false);

  const { data, isLoading, isError, error } = useGetGamesQuery({
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
        },
        away: {
          ...game.away,
          displayName: awayTeam?.displayName || game.away.abbrev,
          logo: awayTeam?.logo || game.away.logo || '',
          color: awayTeam?.color || game.away.color || '',
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
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="alert alert-error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          Error loading games:{' '}
          {error ? ('message' in error ? error.message : String(error)) : 'Unknown error'}
        </span>
      </div>
    );
  }

  // Handle empty state
  if (filteredGames.length === 0) {
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

  return (
    <div>
      <GamesFilter showCompleted={showCompleted} onToggle={setShowCompleted} />

      <div className="space-y-6">
        {sortedWeeks.map((week) => {
          const weekGames = gamesByWeek.get(week) || [];
          return (
            <div key={week}>
              <h2 className="mb-3 text-xl font-semibold">
                Week {week || 0} ({weekGames.length} {weekGames.length === 1 ? 'game' : 'games'})
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {weekGames.map((game) => (
                  <GameCard key={game._id} game={game} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {data?.lastUpdated && (
        <div className="text-base-content/50 mt-4 text-right text-xs">
          Last updated:{' '}
          {new Date(data.lastUpdated).toLocaleString('en-US', {
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
