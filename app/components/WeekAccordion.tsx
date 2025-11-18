'use client';

import { useState } from 'react';
import { GameLean } from '@/lib/types';
import GameCard from './GameCard';

interface WeekAccordionProps {
  weekNumber: number;
  games: GameLean[];
}

const WeekAccordion = ({ weekNumber, games }: WeekAccordionProps) => {
  const [isOpen, setIsOpen] = useState(true); // Default to open

  return (
    <div className="collapse collapse-arrow bg-base-200">
      <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
      <div className="collapse-title text-lg font-semibold">
        Week {weekNumber} ({games.length} {games.length === 1 ? 'game' : 'games'})
      </div>
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
