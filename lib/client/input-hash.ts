import stringify from 'fast-json-stable-stringify';

export const buildSimulateInputKey = (
  games: unknown[],
  overrides: Record<string, unknown>,
  season: number
): string => {
  return stringify({ games, overrides, season });
};
