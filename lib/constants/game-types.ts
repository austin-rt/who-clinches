export interface GameTypeInfo {
  name: string;
  abbreviation: string;
}

export const GAME_TYPE_MAP: Record<number, GameTypeInfo> = {
  2: { name: 'Regular Season', abbreviation: 'reg' },
  3: { name: 'Postseason', abbreviation: 'post' },
  4: { name: 'Off Season', abbreviation: 'off' },
} as const;

export type GameTypeValue = typeof GAME_TYPE_MAP[keyof typeof GAME_TYPE_MAP];

