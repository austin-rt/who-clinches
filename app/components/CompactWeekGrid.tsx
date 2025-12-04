'use client';

import { useMemo } from 'react';
import { GameLean } from '@/lib/types';
import CompactGameButton from './CompactGameButton';
import Divider from './Divider';
import { useUIState } from '@/app/store/useUI';

interface CompactWeekGridProps {
  finalWeeks: GameLean[][];
  remainingWeeks: GameLean[][];
}

const CompactWeekGrid = ({ finalWeeks, remainingWeeks }: CompactWeekGridProps) => {
  const { hideCompletedGames } = useUIState();

  const weeksData = useMemo(() => {
    const allWeeks = hideCompletedGames ? remainingWeeks : [...finalWeeks, ...remainingWeeks];

    return allWeeks.map((weekGames) => {
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
  }, [finalWeeks, remainingWeeks, hideCompletedGames]);

  if (weeksData.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {weeksData.map((week) => (
        <div
          key={week.weekNumber}
          className="flex flex-col gap-3 rounded-lg border border-base-400 p-2 dark:border-accent-50"
        >
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold">
              Week {week.weekNumber} - <span className="font-normal">{week.dateRange}</span>
            </h3>
            <Divider />
          </div>
          <div className="flex flex-wrap gap-2 px-5 py-2">
            {week.games.map((game) => (
              <CompactGameButton key={game._id} game={game} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CompactWeekGrid;
