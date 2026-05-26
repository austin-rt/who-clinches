'use client';

import { GameLean } from '@/lib/types';
import { useUIState } from '@/app/store/useUI';
import { useAppDispatch } from '@/app/store/hooks';
import { setHideCompletedGames } from '@/app/store/uiSlice';
import ExpandedWeekGroup from './ExpandedWeekGroup';

interface CompletedWeeksProps {
  weeks: GameLean[][];
  onReset?: () => void;
}

const CompletedWeeks = ({ weeks, onReset }: CompletedWeeksProps) => {
  const dispatch = useAppDispatch();
  const { hideCompletedGames } = useUIState();
  const isOpen = !hideCompletedGames;

  if (weeks.length === 0) {
    return null;
  }

  const totalGames = weeks.reduce((sum, week) => sum + week.length, 0);

  return (
    <div className="collapse collapse-arrow rounded-lg bg-base-200">
      <input
        type="checkbox"
        checked={isOpen}
        onChange={(e) => dispatch(setHideCompletedGames(!e.target.checked))}
      />
      <div className="collapse-title text-lg font-semibold">
        Completed Games ({totalGames} {totalGames === 1 ? 'game' : 'games'})
      </div>
      <div className="collapse-content">
        <div className="flex flex-col gap-4 pt-2">
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

export default CompletedWeeks;
