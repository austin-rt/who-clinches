'use client';

import { useState } from 'react';
import { GameLean } from '@/lib/types';
import DaySection from './DaySection';

type WeekDay = { weekNumber: number; dayOfWeek: number; dayLabel: string; games: GameLean[] };

interface FinalWeeksProps {
  weekDays: WeekDay[];
}

const FinalWeeks = ({ weekDays }: FinalWeeksProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (weekDays.length === 0) {
    return null;
  }

  const totalGames = weekDays.reduce((sum, weekDay) => sum + weekDay.games.length, 0);

  return (
    <div className="collapse collapse-arrow mb-4 bg-base-200">
      <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
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
