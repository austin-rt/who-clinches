import { GameLean } from '@/lib/types';

export const organizeGames = (
  games: GameLean[] | undefined
): {
  completedWeeks: GameLean[][];
  remainingWeeks: GameLean[][];
} => {
  if (!games || !Array.isArray(games)) {
    return { completedWeeks: [], remainingWeeks: [] };
  }
  const gamesByWeek = new Map<number, GameLean[]>();
  games.forEach((game) => {
    const week = game.week ?? 0;
    if (!gamesByWeek.has(week)) {
      gamesByWeek.set(week, []);
    }
    gamesByWeek.get(week)!.push(game);
  });

  const completedWeeks: GameLean[][] = [];
  const remainingWeeks: GameLean[][] = [];

  Array.from(gamesByWeek.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([, weekGames]) => {
      const sortedGames = weekGames.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const allCompleted = sortedGames.every((game) => game.completed);
      if (allCompleted) {
        completedWeeks.push(sortedGames);
      } else {
        remainingWeeks.push(sortedGames);
      }
    });

  return { completedWeeks, remainingWeeks };
};
