import type { NflTiebreakerConfig } from './types';
import { applyH2H } from './rules/h2h';
import { applyDivisionRecord } from './rules/division-record';
import { applyCommonGamesDivision } from './rules/common-games';
import { applyConferenceRecord } from './rules/conference-record';
import { applySOV } from './rules/sov';
import { applySOS } from './rules/sos';
import { applyCombinedRankingConference, applyCombinedRankingAll } from './rules/combined-ranking';
import { applyNetPointsCommon, applyNetPointsAll } from './rules/net-points';
import { applyNetTDs } from './rules/net-tds';

export const DIVISION_TIEBREAKER_CONFIG: NflTiebreakerConfig = {
  rules: [
    { name: 'Head-to-Head', apply: applyH2H },
    { name: 'Division Record', apply: applyDivisionRecord },
    { name: 'Common Games', apply: applyCommonGamesDivision },
    { name: 'Conference Record', apply: applyConferenceRecord },
    { name: 'Strength of Victory', apply: applySOV },
    { name: 'Strength of Schedule', apply: applySOS },
    { name: 'Combined Ranking (Conference)', apply: applyCombinedRankingConference },
    { name: 'Combined Ranking (All)', apply: applyCombinedRankingAll },
    { name: 'Net Points (Common Games)', apply: applyNetPointsCommon },
    { name: 'Net Points (All Games)', apply: applyNetPointsAll },
    { name: 'Net Touchdowns', apply: applyNetTDs },
  ],
};
