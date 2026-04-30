import { CFBConferenceTiebreakerConfig } from './tiebreaker-rules/core/types';

const TEAM_RATING_SCORE_RULE_NAME = 'Team Rating Score';

export interface CfbdRatingRequirements {
  needsRatings: boolean;
  needsCfpRankings: boolean;
  needsSpFpi: boolean;
}

export const conferenceUsesTeamRatingScore = (
  config: CFBConferenceTiebreakerConfig
): boolean => {
  return config.rules.some((r) => r.name === TEAM_RATING_SCORE_RULE_NAME);
};

export const conferenceNeedsCfpRankingsForTeamRating = (
  config: CFBConferenceTiebreakerConfig
): boolean => {
  return (
    conferenceUsesTeamRatingScore(config) &&
    config.useCfpRankingsFirst === true
  );
};

export const describeRequiredCfbdRatingFeeds = (
  config: CFBConferenceTiebreakerConfig
): CfbdRatingRequirements => {
  const needsRatings = conferenceUsesTeamRatingScore(config);
  return {
    needsRatings,
    needsCfpRankings: conferenceNeedsCfpRankingsForTeamRating(config),
    needsSpFpi: needsRatings,
  };
};
