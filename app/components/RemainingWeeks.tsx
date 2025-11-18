'use client';

import { GameLean } from '@/lib/types';
import WeekAccordion from './WeekAccordion';

type Week = [number, GameLean[]];

interface RemainingWeeksProps {
  weeks: Week[];
}

const RemainingWeeks = ({ weeks }: RemainingWeeksProps) => {
  if (weeks.length === 0) {
    return null;
  }

  const totalGames = weeks.reduce((sum, week) => sum + week[1].length, 0);

  return (
    <div className="collapse collapse-open mb-4 bg-base-200">
      <div className="collapse-title cursor-default text-lg font-semibold">
        Remaining ({totalGames} {totalGames === 1 ? 'game' : 'games'})
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

export default RemainingWeeks;
