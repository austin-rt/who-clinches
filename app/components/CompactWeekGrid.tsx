'use client';

import { useMemo } from 'react';
import { GameLean } from '@/lib/types';
import CompactGameButton from './CompactGameButton';
import { useUIState } from '@/app/store/useUI';

type WeekDay = { weekNumber: number; dayOfWeek: number; dayLabel: string; games: GameLean[] };

interface CompactWeekGridProps {
  finalWeekDays: WeekDay[];
  remainingWeekDays: WeekDay[];
}

const CompactWeekGrid = ({ finalWeekDays, remainingWeekDays }: CompactWeekGridProps) => {
  const { hideCompletedGames } = useUIState();

  const weeksData = useMemo(() => {
    const weeksMap = new Map<
      number,
      { weekNumber: number; dateRange: string;       games: GameLean[] }
    >();

    remainingWeekDays.forEach((weekDay) => {
      const week = weekDay.weekNumber;
      if (!weeksMap.has(week)) {
        weeksMap.set(week, {
          weekNumber: week,
          dateRange: '',
          games: [],
        });
      }
      weeksMap.get(week)!.games.push(...weekDay.games);
    });

    if (!hideCompletedGames) {
      finalWeekDays.forEach((weekDay) => {
        const week = weekDay.weekNumber;
        if (!weeksMap.has(week)) {
          weeksMap.set(week, {
            weekNumber: week,
            dateRange: '',
            games: [],
          });
        }
        weeksMap.get(week)!.games.push(...weekDay.games);
      });
    }

    weeksMap.forEach((weekData) => {
      if (weekData.games.length === 0) return;

      const dates = weekData.games
        .map((game) => new Date(game.date))
        .sort((a, b) => a.getTime() - b.getTime());

      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];

      const firstFormatted = firstDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const lastFormatted = lastDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (firstFormatted === lastFormatted) {
        weekData.dateRange = firstFormatted;
      } else {
        weekData.dateRange = `${firstFormatted} - ${lastFormatted}`;
      }
    });

    return Array.from(weeksMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
  }, [finalWeekDays, remainingWeekDays, hideCompletedGames]);

  if (weeksData.length === 0) {
    return null;
  }

  return (
    <div
      className="grid gap-6"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, max-content))' }}
    >
      {weeksData.map((week) => (
        <div key={week.weekNumber} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold">Week {week.weekNumber}</h3>
            <p className="text-base-content/60 text-sm">{week.dateRange}</p>
          </div>
          <div className="flex flex-col gap-2">
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
