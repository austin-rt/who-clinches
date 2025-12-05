import { GameLean } from '../../../types';

export interface RuleResult {
  winners: string[];
  detail: string;
}

export type TiebreakerRuleFunction = (
  tiedTeams: string[],
  games: GameLean[],
  allTeams?: string[]
) => RuleResult;

