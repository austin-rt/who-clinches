'use client';

import { useMemo, useState } from 'react';
import { GameLean } from '@/lib/types';
import GameCard from './GameCard';

interface WeekAccordionProps {
  weekNumber: number;
  games: GameLean[];
  dayLabel?: string;
}

const WeekAccordion = ({ weekNumber, games, dayLabel }: WeekAccordionProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const dateRange = useMemo(() => {
    if (games.length === 0) return '';

    const dates = games
      .map((game) => new Date(game.date))
      .sort((a, b) => a.getTime() - b.getTime());

    const uniqueDateStrings = Array.from(
      new Set(dates.map((d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })))
    );

    if (uniqueDateStrings.length === 1) {
      return uniqueDateStrings[0];
    }

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    const firstFormatted = firstDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const lastFormatted = lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `${firstFormatted} - ${lastFormatted}`;
  }, [games]);

  const headerText = dayLabel
    ? `Week ${weekNumber} - ${dayLabel}, ${dateRange}`
    : `Week ${weekNumber} (${games.length} ${games.length === 1 ? 'game' : 'games'})`;

  return (
    <div className="collapse collapse-arrow bg-base-100">
      <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
      <div className="collapse-title text-lg font-semibold">{headerText}</div>
      <div className="collapse-content">
        <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2 lg:grid-cols-3">
          {games.length === 0 ? (
            <p className="text-base-content/60 text-sm">No games this week</p>
          ) : (
            games.map((game) => <GameCard key={game._id} game={game} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default WeekAccordion;
