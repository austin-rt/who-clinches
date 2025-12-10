import { CFBConferenceTiebreakerConfig } from '../core/types';
import { applyRuleAHeadToHead } from '../common/rule-a-head-to-head';
import { applyRuleETeamRatingScore } from '../common/rule-e-team-rating-score';
import { applyRuleOverallWinPercentage } from '../common/rule-overall-win-percentage';
import { applyRuleCHighestPlacedOpponent } from '../common/rule-c-highest-placed-opponent';
import { applyRuleBCommonOpponents } from '../common/rule-b-common-opponents';

export const CFB_MWC_TIEBREAKER_CONFIG: CFBConferenceTiebreakerConfig = {
  rules: [
    {
      name: 'Head-to-Head',
      apply: applyRuleAHeadToHead,
    },
    {
      name: 'Team Rating Score',
      apply: applyRuleETeamRatingScore,
    },
    {
      name: 'Overall Win Percentage',
      apply: applyRuleOverallWinPercentage,
    },
    {
      name: 'Highest Placed Common Opponent',
      apply: applyRuleCHighestPlacedOpponent,
    },
    {
      name: 'Common Opponents',
      apply: applyRuleBCommonOpponents,
    },
  ],
};

