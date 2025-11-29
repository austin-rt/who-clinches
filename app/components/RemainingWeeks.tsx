'use client';

import { useMemo } from 'react';
import { GameLean } from '@/lib/types';
import { groupGamesByDay } from '@/lib/utils/gameGrouping';
import DaySection from './DaySection';

interface RemainingWeeksProps {
  weeks: GameLean[][];
}

const RemainingWeeks = ({ weeks }: RemainingWeeksProps) => {
  const weekDays = useMemo(() => groupGamesByDay(weeks), [weeks]);

  if (weekDays.length === 0) {
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
          {weekDays.map((weekDay) => (
            <DaySection
              key={`${weekDay.weekNumber}-${weekDay.dayOfWeek}`}
              weekNumber={weekDay.weekNumber}
              games={weekDay.games}
              dayLabel={weekDay.dayLabel}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RemainingWeeks;
