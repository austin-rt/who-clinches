import { CFBConferenceTiebreakerConfig } from '../core/types';
import { applyRuleAHeadToHead } from '../common/rule-a-head-to-head';
import { applyRuleCHighestPlacedOpponent } from '../common/rule-c-highest-placed-opponent';
import { applyRuleBCommonOpponents } from '../common/rule-b-common-opponents';
import { applyRuleDOpponentWinPercentage } from '../common/rule-d-opponent-win-percentage';
import { applyRuleTotalWins } from '../common/rule-total-wins';
import { applyRuleETeamRatingScore } from '../common/rule-e-team-rating-score';

export const CFB_PAC12_TIEBREAKER_CONFIG: CFBConferenceTiebreakerConfig = {
  rules: [
    {
      name: 'Head-to-Head',
      apply: applyRuleAHeadToHead,
    },
    {
      name: 'Highest Placed Common Opponent',
      apply: applyRuleCHighestPlacedOpponent,
    },
    {
      name: 'Record Against Common Opponents',
      apply: applyRuleBCommonOpponents,
    },
    {
      name: 'Opponent Win Percentage',
      apply: applyRuleDOpponentWinPercentage,
    },
    {
      name: 'Total Wins',
      apply: applyRuleTotalWins,
    },
    {
      name: 'Team Rating Score',
      apply: applyRuleETeamRatingScore,
    },
  ],
};
