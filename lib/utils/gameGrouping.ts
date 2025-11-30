import { GameLean } from '@/lib/types';

export const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export type WeekDay = {
  weekNumber: number;
  dayOfWeek: number;
  dayLabel: string;
  games: GameLean[];
};

export const groupGamesByDay = (weeks: GameLean[][]): WeekDay[] => {
  const result: WeekDay[] = [];

  weeks.forEach((weekGames) => {
    if (weekGames.length === 0) return;

    const weekNumber = weekGames[0].week ?? 0;
    const gamesByDay = new Map<number, GameLean[]>();

    weekGames.forEach((game) => {
      const dayOfWeek = new Date(game.date).getDay();
      if (!gamesByDay.has(dayOfWeek)) {
        gamesByDay.set(dayOfWeek, []);
      }
      gamesByDay.get(dayOfWeek)!.push(game);
    });

    Array.from(gamesByDay.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([dayOfWeek, games]) => {
        result.push({
          weekNumber,
          dayOfWeek,
          dayLabel: DAY_LABELS[dayOfWeek] || '',
          games,
        });
      });
  });

  return result.sort((a, b) => {
    if (a.weekNumber !== b.weekNumber) {
      return a.weekNumber - b.weekNumber;
    }
    return a.dayOfWeek - b.dayOfWeek;
  });
};

