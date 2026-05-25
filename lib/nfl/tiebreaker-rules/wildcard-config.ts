import type { NflTiebreakerConfig } from './types';
import { applyH2HSweep } from './rules/h2h-sweep';
import { applyConferenceRecord } from './rules/conference-record';
import { applyCommonGamesWildCard } from './rules/common-games';
import { applySOV } from './rules/sov';
import { applySOS } from './rules/sos';
import { applyCombinedRankingConference, applyCombinedRankingAll } from './rules/combined-ranking';
import { applyNetPointsConference, applyNetPointsAll } from './rules/net-points';
import { applyNetTDs } from './rules/net-tds';

export const WILDCARD_TIEBREAKER_CONFIG: NflTiebreakerConfig = {
  rules: [
    { name: 'Head-to-Head Sweep', apply: applyH2HSweep },
    { name: 'Conference Record', apply: applyConferenceRecord },
    { name: 'Common Games', apply: applyCommonGamesWildCard },
    { name: 'Strength of Victory', apply: applySOV },
    { name: 'Strength of Schedule', apply: applySOS },
    { name: 'Combined Ranking (Conference)', apply: applyCombinedRankingConference },
    { name: 'Combined Ranking (All)', apply: applyCombinedRankingAll },
    { name: 'Net Points (Conference)', apply: applyNetPointsConference },
    { name: 'Net Points (All Games)', apply: applyNetPointsAll },
    { name: 'Net Touchdowns', apply: applyNetTDs },
  ],
};
