import type { Game, ScoreboardGame } from 'cfbd';
import type { GqlGameNode, GqlScoreboardNode } from '../graphql/map-to-cfbd';

type EnrichedGame = Game & { spread?: number; overUnder?: number; favoriteId?: number };

export const mergeScoreboardIntoGameNodes = (
  nodes: GqlGameNode[],
  scoreboard: Map<number, GqlScoreboardNode>
): GqlGameNode[] =>
  nodes.map((node) => {
    const live = scoreboard.get(node.id);
    if (!live) return node;
    return {
      ...node,
      homePoints: live.homePoints ?? node.homePoints,
      awayPoints: live.awayPoints ?? node.awayPoints,
      status: live.status ?? node.status,
    };
  });

export const overlayScoreboardOntoGames = (
  games: EnrichedGame[],
  scoreboard: ScoreboardGame[]
): EnrichedGame[] => {
  const byId = new Map(scoreboard.map((entry) => [entry.id, entry]));
  return games.map((game) => {
    const live = byId.get(game.id);
    if (!live) return game;
    return {
      ...game,
      homePoints: live.homeTeam.points ?? game.homePoints,
      awayPoints: live.awayTeam.points ?? game.awayPoints,
      completed: live.status === 'completed' ? true : game.completed,
    };
  });
};
