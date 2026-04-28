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
    <div className="collapse collapse-open bg-base-200">
      <div className="collapse-title cursor-default text-lg font-semibold">
        Remaining ({totalGames} {totalGames === 1 ? 'game' : 'games'})
      </div>
      <div className="collapse-content">
        <div className="space-y-6 pt-2">
          {weeks.map((weekGames) => (
            <ExpandedWeekGroup
              key={weekGames[0]?.id ?? weekGames[0]?.week}
              weekGames={weekGames}
              onReset={onReset}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RemainingWeeks;
