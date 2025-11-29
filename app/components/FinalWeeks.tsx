'use client';

import { useMemo } from 'react';
import { GameLean } from '@/lib/types';
import { useUIState } from '@/app/store/useUI';
import { useAppDispatch } from '@/app/store/hooks';
import { setHideCompletedGames } from '@/app/store/uiSlice';
import { groupGamesByDay } from '@/lib/utils/gameGrouping';
import DaySection from './DaySection';

interface FinalWeeksProps {
  weeks: GameLean[][];
}

const FinalWeeks = ({ weeks }: FinalWeeksProps) => {
  const dispatch = useAppDispatch();
  const { hideCompletedGames } = useUIState();
  const isOpen = !hideCompletedGames;

  const weekDays = useMemo(() => groupGamesByDay(weeks), [weeks]);

  if (weekDays.length === 0) {
    return null;
  }

  const totalGames = weeks.reduce((sum, week) => sum + week.length, 0);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setHideCompletedGames(!e.target.checked));
  };

  return (
    <div className="collapse collapse-arrow bg-base-200">
      <input type="checkbox" checked={isOpen} onChange={handleCheckboxChange} />
      <div className="collapse-title text-lg font-semibold">
        Final ({totalGames} {totalGames === 1 ? 'game' : 'games'})
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

export default FinalWeeks;
