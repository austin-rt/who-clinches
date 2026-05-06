import { CFBConferenceTiebreakerConfig } from '../core/types';
import { applyRuleAHeadToHead } from '../common/rule-a-head-to-head';
import { applyRuleBCommonOpponents } from '../common/rule-b-common-opponents';
import { applyRuleCHighestPlacedOpponent } from '../common/rule-c-highest-placed-opponent';
import { applyRuleDOpponentWinPercentage } from '../common/rule-d-opponent-win-percentage';
import { applyRuleESecScoringMargin } from './rule-e-sec-scoring-margin';

export const CFB_SEC_TIEBREAKER_CONFIG: CFBConferenceTiebreakerConfig = {
  rules: [
    {
      name: 'Head-to-Head',
      apply: applyRuleAHeadToHead,
    },
    {
      name: 'Record Against Common Opponents',
      apply: applyRuleBCommonOpponents,
    },
    {
      name: 'Highest Placed Common Opponent',
      apply: applyRuleCHighestPlacedOpponent,
    },
    {
      name: 'Opponent Win Percentage',
      apply: applyRuleDOpponentWinPercentage,
    },
    {
      name: 'Scoring Margin',
      apply: applyRuleESecScoringMargin,
    },
  ],
};
