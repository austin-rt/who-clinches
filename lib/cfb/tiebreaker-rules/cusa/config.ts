import { CFBConferenceTiebreakerConfig } from '../core/types';
import { applyRuleAHeadToHead } from '../common/rule-a-head-to-head';
import { applyRuleBCommonOpponents } from '../common/rule-b-common-opponents';
import { applyRuleCHighestPlacedOpponent } from '../common/rule-c-highest-placed-opponent';
import { applyRuleETeamRatingScore } from '../common/rule-e-team-rating-score';
import { applyRuleDOpponentWinPercentage } from '../common/rule-d-opponent-win-percentage';

export const CFB_CUSA_TIEBREAKER_CONFIG: CFBConferenceTiebreakerConfig = {
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
      name: 'Team Rating Score',
      apply: applyRuleETeamRatingScore,
    },
    {
      name: 'Opponent Win Percentage',
      apply: applyRuleDOpponentWinPercentage,
    },
  ],
};
