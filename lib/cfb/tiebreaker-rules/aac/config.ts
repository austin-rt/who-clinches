import { CFBConferenceTiebreakerConfig } from '../core/types';
import { applyRuleAHeadToHead } from '../common/rule-a-head-to-head';
import { applyRuleETeamRatingScore } from '../common/rule-e-team-rating-score';
import { applyRuleBCommonOpponents } from '../common/rule-b-common-opponents';
import { applyRuleOverallWinPercentage } from '../common/rule-overall-win-percentage';

export const CFB_AAC_TIEBREAKER_CONFIG: CFBConferenceTiebreakerConfig = {
  useCfpRankingsFirst: true,
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
      name: 'Common Opponents',
      apply: applyRuleBCommonOpponents,
    },
    {
      name: 'Overall Win Percentage',
      apply: applyRuleOverallWinPercentage,
    },
  ],
};

