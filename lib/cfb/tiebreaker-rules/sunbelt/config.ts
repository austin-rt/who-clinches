import { CFBConferenceTiebreakerConfig } from '../core/types';
import { applyRuleAHeadToHead } from '../common/rule-a-head-to-head';
import { applyRuleDivisionalWinPercentage } from '../common/rule-divisional-win-percentage';
import { applyRuleCHighestPlacedOpponent } from '../common/rule-c-highest-placed-opponent';
import { applyRuleCommonNonDivisionalOpponents } from '../common/rule-common-non-divisional-opponents';
import { applyRuleETeamRatingScore } from '../common/rule-e-team-rating-score';
import { applyRuleFbsWinPercentage } from '../common/rule-fbs-win-percentage';

export const CFB_SUNBELT_TIEBREAKER_CONFIG: CFBConferenceTiebreakerConfig = {
  useCfpRankingsFirst: true,
  rules: [
    {
      name: 'Head-to-Head',
      apply: applyRuleAHeadToHead,
    },
    {
      name: 'Divisional Win Percentage',
      apply: applyRuleDivisionalWinPercentage,
    },
    {
      name: 'Highest Placed Common Opponent',
      apply: applyRuleCHighestPlacedOpponent,
    },
    {
      name: 'Common Non-Divisional Opponents',
      apply: applyRuleCommonNonDivisionalOpponents,
    },
    {
      name: 'Team Rating Score',
      apply: applyRuleETeamRatingScore,
    },
    {
      name: 'FBS Win Percentage',
      apply: applyRuleFbsWinPercentage,
    },
  ],
};

