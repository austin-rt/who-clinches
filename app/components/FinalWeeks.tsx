'use client';

import { GameLean } from '@/lib/types';
import { useUIState } from '@/app/store/useUI';
import { useAppDispatch } from '@/app/store/hooks';
import { setHideCompletedGames } from '@/app/store/uiSlice';
import DaySection from './DaySection';

type WeekDay = { weekNumber: number; dayOfWeek: number; dayLabel: string; games: GameLean[] };

interface FinalWeeksProps {
  weekDays: WeekDay[];
}

const FinalWeeks = ({ weekDays }: FinalWeeksProps) => {
  const dispatch = useAppDispatch();
  const { hideCompletedGames } = useUIState();
  const isOpen = !hideCompletedGames;

  if (weekDays.length === 0) {
    return null;
  }

  const totalGames = weekDays.reduce((sum, weekDay) => sum + weekDay.games.length, 0);

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
          {weekDays
            .filter((weekDay) => weekDay.games.length > 0)
            .map((weekDay, index) => (
              <DaySection
                key={`${weekDay.weekNumber}-${weekDay.dayOfWeek}-${index}`}
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
