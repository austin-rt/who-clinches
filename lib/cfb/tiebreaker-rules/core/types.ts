import { GameLean } from '../../../types';
import { RuleResult } from '../common/types';

export interface CFBTiebreakerRuleConfig {
  name: string;
  apply: (tiedTeams: string[], games: GameLean[], allTeams?: string[]) => RuleResult;
}

export interface CFBConferenceTiebreakerConfig {
  rules: CFBTiebreakerRuleConfig[];
}
