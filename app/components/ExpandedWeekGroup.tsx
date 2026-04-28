'use client';

import { useMemo } from 'react';
import { GameLean } from '@/lib/types';
import { groupGamesByDay } from '@/lib/utils/gameGrouping';
import DaySection from './DaySection';
import WeekResetButton from './WeekResetButton';

interface ExpandedWeekGroupProps {
  weekGames: GameLean[];
  onReset?: () => void;
}

const ExpandedWeekGroup = ({ weekGames, onReset }: ExpandedWeekGroupProps) => {
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 px-2">
        <h3 className="text-base font-semibold">
          Week {weekNumber} - <span className="font-normal">{dateRange}</span>
        </h3>
        <WeekResetButton weekGames={weekGames} onReset={onReset} />
      </div>
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
  );
};

export default ExpandedWeekGroup;
