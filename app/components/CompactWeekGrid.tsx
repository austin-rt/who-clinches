'use client';

import { useMemo, useState } from 'react';
import { GameLean } from '@/lib/types';
import CompactGameButton from './CompactGameButton';
import Divider from './Divider';
import WeekResetButton from './WeekResetButton';
import { useUIState } from '@/app/store/useUI';
import { useAppDispatch } from '@/app/store/hooks';
import { setHideCompletedGames } from '@/app/store/uiSlice';

interface CompactWeekGridProps {
  completedWeeks: GameLean[][];
  remainingWeeks: GameLean[][];
  onReset?: () => void;
}

interface WeekData {
  weekNumber: number;
  dateRange: string;
  games: GameLean[];
}

const buildWeekData = (weeks: GameLean[][]): WeekData[] =>
  weeks.map((weekGames) => {
    const weekNumber = weekGames[0].week ?? 0;
    const firstDate = new Date(weekGames[0].date);
    const lastDate = new Date(weekGames[weekGames.length - 1].date);

    const firstFormatted = firstDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const lastFormatted = lastDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const dateRange =
      firstFormatted === lastFormatted ? firstFormatted : `${firstFormatted} - ${lastFormatted}`;

    return { weekNumber, dateRange, games: weekGames };
  });

const CompactWeekSection = ({ week, onReset }: { week: WeekData; onReset?: () => void }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="collapse collapse-arrow rounded-lg border border-stroke">
      <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
      <div className="collapse-title min-h-0 py-2 text-base font-semibold">
        Week {week.weekNumber} - <span className="font-normal">{week.dateRange}</span>
      </div>
      <div className="collapse-content !p-0">
        <Divider className="m-2" />
        <WeekResetButton weekGames={week.games} onReset={onReset} className="px-4 pb-1" />
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {week.games.map((game) => (
            <CompactGameButton key={game._id} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
};

const CompactWeekGrid = ({ completedWeeks, remainingWeeks, onReset }: CompactWeekGridProps) => {
  const dispatch = useAppDispatch();
  const { hideCompletedGames } = useUIState();
  const isCompletedOpen = !hideCompletedGames;

  const completedData = useMemo(() => buildWeekData(completedWeeks), [completedWeeks]);
  const remainingData = useMemo(() => buildWeekData(remainingWeeks), [remainingWeeks]);

  const totalCompletedGames = completedWeeks.reduce((sum, week) => sum + week.length, 0);
  const totalRemainingGames = remainingWeeks.reduce((sum, week) => sum + week.length, 0);

  if (totalCompletedGames + totalRemainingGames === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {completedData.length > 0 && (
        <div className="collapse collapse-arrow rounded-lg bg-base-200">
          <input
            type="checkbox"
            checked={isCompletedOpen}
            onChange={(e) => dispatch(setHideCompletedGames(!e.target.checked))}
          />
          <div className="collapse-title text-lg font-semibold">
            Completed Games ({totalCompletedGames} {totalCompletedGames === 1 ? 'game' : 'games'})
          </div>
          <div className="collapse-content">
            <div className="flex flex-col gap-4 pt-2">
              {completedData.map((week) => (
                <CompactWeekSection key={week.weekNumber} week={week} onReset={onReset} />
              ))}
            </div>
          </div>
        </div>
      )}
      {remainingData.length > 0 && (
        <div className="rounded-lg bg-base-200 p-4">
          <h2 className="mb-4 px-2 text-lg font-semibold">
            Remaining Games ({totalRemainingGames} {totalRemainingGames === 1 ? 'game' : 'games'})
          </h2>
          <div className="flex flex-col gap-4">
            {remainingData.map((week) => (
              <CompactWeekSection key={week.weekNumber} week={week} onReset={onReset} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactWeekGrid;
