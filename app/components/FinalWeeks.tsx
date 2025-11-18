'use client';

import { useState } from 'react';
import { GameLean } from '@/lib/types';
import WeekAccordion from './WeekAccordion';

type Week = [number, GameLean[]];

interface FinalWeeksProps {
  weeks: Week[];
}

const FinalWeeks = ({ weeks }: FinalWeeksProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (weeks.length === 0) {
    return null;
  }

  const totalGames = weeks.reduce((sum, week) => sum + week[1].length, 0);

  return (
    <div className="collapse collapse-arrow mb-4 bg-base-200">
      <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
      <div className="collapse-title text-lg font-semibold">
        Final ({totalGames} {totalGames === 1 ? 'game' : 'games'})
      </div>
      <div className="collapse-content">
        <div className="space-y-4 pt-2">
          {weeks.map((week) => (
            <WeekAccordion key={week[0]} weekNumber={week[0]} games={week[1]} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinalWeeks;
