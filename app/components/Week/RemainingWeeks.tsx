'use client';

import { GameLean } from '@/lib/types';
import ExpandedWeekGroup from './ExpandedWeekGroup';

interface RemainingWeeksProps {
  weeks: GameLean[][];
  onReset?: () => void;
}

const RemainingWeeks = ({ weeks, onReset }: RemainingWeeksProps) => {
  if (weeks.length === 0) {
    return null;
  }

  const totalGames = weeks.reduce((sum, week) => sum + week.length, 0);

  return (
    <div className="rounded-lg bg-base-200 p-4">
      <h2 className="mb-4 px-2 text-lg font-semibold">
        Remaining Games ({totalGames} {totalGames === 1 ? 'game' : 'games'})
      </h2>
      <div className="flex flex-col gap-4">
        {weeks.map((weekGames) => (
          <ExpandedWeekGroup
            key={weekGames[0]?.id ?? weekGames[0]?.week}
            weekGames={weekGames}
            onReset={onReset}
          />
        ))}
      </div>
    </div>
  );
};

export default RemainingWeeks;
