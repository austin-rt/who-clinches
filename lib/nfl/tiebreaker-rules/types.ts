import type { Game } from '../../types';
import type { NflTieStep } from '../types';

export interface NflRuleResult {
  winners: string[];
  detail: string;
}

export type NflTiebreakerRuleFunction = (
  tiedTeams: string[],
  games: Game[],
  allGames: Game[]
) => NflRuleResult;

export interface NflTiebreakerRuleConfig {
  name: string;
  apply: NflTiebreakerRuleFunction;
}

export interface NflTiebreakerConfig {
  rules: NflTiebreakerRuleConfig[];
}

export interface NflBreakTieResult {
  ranked: string[];
  steps: NflTieStep[];
}
