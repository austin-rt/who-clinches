import { GameLean, TeamLean } from '../../../types';
import { RuleResult } from '../common/types';

export interface CFBTiebreakerRuleConfig {
  name: string;
  apply: (
    tiedTeams: string[],
    games: GameLean[],
    allTeams?: string[],
    teams?: TeamLean[],
    useCfpFirst?: boolean
  ) => RuleResult | Promise<RuleResult>;
}

export interface CFBConferenceTiebreakerConfig {
  rules: CFBTiebreakerRuleConfig[];
  useCfpRankingsFirst?: boolean;
}
