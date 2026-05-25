export interface EspnTeamStatisticsGenerated {
  $ref: string;
  season: Season;
  team: Season;
  splits: Splits;
  seasonType: Season;
}

export interface Season {
  $ref: string;
}

export interface Splits {
  id: string;
  name: string;
  abbreviation: string;
  categories: Category[];
}

export interface Category {
  name: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  summary: string;
  stats: Stat[];
}

export interface Stat {
  name: string;
  displayName: string;
  shortDisplayName: string;
  description: string;
  abbreviation: string;
  value: number;
  displayValue: string;
  perGameValue?: number;
  perGameDisplayValue?: string;
  rank?: number;
  rankDisplayValue?: string;
}
