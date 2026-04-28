'use client';

import { GameLean } from '@/lib/types';
import { useUIState } from '@/app/store/useUI';
import { useAppDispatch } from '@/app/store/hooks';
import { setHideCompletedGames } from '@/app/store/uiSlice';
import ExpandedWeekGroup from './ExpandedWeekGroup';

interface FinalWeeksProps {
  weeks: GameLean[][];
  onReset?: () => void;
}

const FinalWeeks = ({ weeks, onReset }: FinalWeeksProps) => {
  const dispatch = useAppDispatch();
  const { hideCompletedGames } = useUIState();
  const isOpen = !hideCompletedGames;

  if (weeks.length === 0) {
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

export default FinalWeeks;
