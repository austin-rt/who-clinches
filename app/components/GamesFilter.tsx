'use client';

import { useMemo, useState } from 'react';
import { GameLean } from '@/lib/types';
import WeekAccordion from './WeekAccordion';

interface GamesFilterProps {
  completedGames: GameLean[];
}

const GamesFilter = ({ completedGames }: GamesFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Group completed games by week
  const gamesByWeek = useMemo(() => {
    const grouped = new Map<number, GameLean[]>();

    completedGames.forEach((game) => {
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
  }, [completedGames]);

  // Sort weeks for display
  const sortedWeeks = useMemo(() => {
    return Array.from(gamesByWeek.keys()).sort((a, b) => {
      // Put week 0 (no week assigned) at the end
      if (a === 0) return 1;
      if (b === 0) return -1;
      return a - b; // Oldest weeks first (chronological order)
    });
  }, [gamesByWeek]);

  if (completedGames.length === 0) {
    return null;
  }

  return (
    <div className="collapse collapse-arrow mb-4 bg-base-200">
      <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
      <div className="collapse-title text-lg font-semibold">
        Completed Games ({completedGames.length} {completedGames.length === 1 ? 'game' : 'games'})
      </div>
      <div className="collapse-content">
        <div className="space-y-4 pt-2">
          {sortedWeeks.map((week) => {
            const weekGames = gamesByWeek.get(week) || [];
            return <WeekAccordion key={week} weekNumber={week || 0} games={weekGames} />;
          })}
        </div>
      </div>
    </div>
  );
};

export default GamesFilter;
