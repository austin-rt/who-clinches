'use client';

import { useMemo, useState } from 'react';
import { GameLean } from '@/lib/types';
import { groupGamesByDay } from '@/lib/utils/gameGrouping';
import DaySection from './DaySection';
import WeekResetButton from './WeekResetButton';

interface ExpandedWeekGroupProps {
  weekGames: GameLean[];
  onReset?: () => void;
}

const ExpandedWeekGroup = ({ weekGames, onReset }: ExpandedWeekGroupProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const weekNumber = weekGames[0]?.week ?? 0;

  const dateRange = useMemo(() => {
    if (weekGames.length === 0) return '';
    const sortedDates = [...weekGames]
      .map((game) => new Date(game.date))
      .sort((a, b) => a.getTime() - b.getTime());

    const firstFormatted = sortedDates[0].toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const lastFormatted = sortedDates[sortedDates.length - 1].toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return firstFormatted === lastFormatted
      ? firstFormatted
      : `${firstFormatted} - ${lastFormatted}`;
  }, [weekGames]);

  const weekDays = useMemo(() => groupGamesByDay([weekGames]), [weekGames]);

  if (weekGames.length === 0 || weekDays.length === 0) {
    return null;
  }

  return (
    <div className="collapse collapse-arrow bg-base-100">
      <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
      <div className="collapse-title flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">
          Week {weekNumber} - <span className="font-normal">{dateRange}</span>
        </h3>
      </div>
      <div className="collapse-content">
        <WeekResetButton weekGames={weekGames} onReset={onReset} className="px-2 pb-2" />
        <div className="flex flex-col gap-4">
          {weekDays.map((weekDay) => (
            <DaySection
              key={`${weekDay.weekNumber}-${weekDay.dayOfWeek}`}
              games={weekDay.games}
              dayLabel={weekDay.dayLabel}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpandedWeekGroup;
