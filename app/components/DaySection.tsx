'use client';

import { useMemo } from 'react';
import { GameLean } from '@/lib/types';
import GameCard from './GameCard';

interface DaySectionProps {
  weekNumber: number;
  games: GameLean[];
  dayLabel: string;
}

const DaySection = ({ weekNumber, games, dayLabel }: DaySectionProps) => {
  // Format date range for the header
  const dateRange = useMemo(() => {
    if (games.length === 0) return '';
    const dates = games
      .map((game) => new Date(game.date))
      .sort((a, b) => a.getTime() - b.getTime());

    // Get unique date strings
    const uniqueDateStrings = Array.from(
      new Set(dates.map((d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })))
    );

    if (uniqueDateStrings.length === 1) {
      return uniqueDateStrings[0];
    }

    // Get first and last dates
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    const firstFormatted = firstDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const lastFormatted = lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `${firstFormatted} - ${lastFormatted}`;
  }, [games]);

  // Don't render if there are no games
  if (games.length === 0) {
    return null;
  }

  const headerText = `Week ${weekNumber} - ${dayLabel}, ${dateRange}`;

  return (
    <div className="space-y-3 rounded-lg bg-base-100 p-6">
      <h3 className="text-lg font-semibold">{headerText}</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game._id} game={game} />
        ))}
      </div>
    </div>
  );
};

export default DaySection;
