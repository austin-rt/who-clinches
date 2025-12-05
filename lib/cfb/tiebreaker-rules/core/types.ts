import { GameLean } from '../../../types';
import { RuleResult } from '../common/types';

export interface TiebreakerRuleConfig {
  name: string;
  apply: (
    tiedTeams: string[],
    games: GameLean[],
    allTeams?: string[]
  ) => RuleResult;
}

export interface ConferenceTiebreakerConfig {
  rules: TiebreakerRuleConfig[];
}

