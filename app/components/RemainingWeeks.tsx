'use client';

import { GameLean } from '@/lib/types';
import DaySection from './DaySection';

type WeekDay = { weekNumber: number; dayOfWeek: number; dayLabel: string; games: GameLean[] };

interface RemainingWeeksProps {
  weekDays: WeekDay[];
}

const RemainingWeeks = ({ weekDays }: RemainingWeeksProps) => {
  if (weekDays.length === 0) {
    return null;
  }

  const totalGames = weekDays.reduce((sum, weekDay) => sum + weekDay.games.length, 0);

  return (
    <div className="collapse collapse-open bg-base-200">
      <div className="collapse-title cursor-default text-lg font-semibold">
        Remaining ({totalGames} {totalGames === 1 ? 'game' : 'games'})
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

export default RemainingWeeks;
