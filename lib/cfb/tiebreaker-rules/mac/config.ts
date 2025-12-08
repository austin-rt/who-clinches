import { ConferenceTiebreakerConfig } from '../core/types';
import { applyRuleAHeadToHead } from '../common/rule-a-head-to-head';
import { applyRuleBCommonOpponents } from '../common/rule-b-common-opponents';
import { applyRuleETeamRatingScore } from '../common/rule-e-team-rating-score';
import { applyRuleCHighestPlacedOpponent } from '../common/rule-c-highest-placed-opponent';
import { applyRuleDOpponentWinPercentage } from '../common/rule-d-opponent-win-percentage';

export const MAC_TIEBREAKER_CONFIG: ConferenceTiebreakerConfig = {
  rules: [
    {
      name: 'Head-to-Head',
      apply: applyRuleAHeadToHead,
    },
    {
      name: 'Common Opponents',
      apply: applyRuleBCommonOpponents,
    },
    {
      name: 'Team Rating Score',
      apply: applyRuleETeamRatingScore,
    },
    {
      name: 'Highest Placed Common Opponent',
      apply: applyRuleCHighestPlacedOpponent,
    },
    {
      name: 'Opponent Win Percentage',
      apply: applyRuleDOpponentWinPercentage,
    },
  ],
};

