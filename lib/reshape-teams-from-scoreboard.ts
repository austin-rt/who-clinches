import type { EspnScoreboardGenerated } from './espn/espn-scoreboard-generated';
import type { ReshapedTeam } from './types';
import type { ConferenceMetadata } from './constants';

export const extractTeamsFromScoreboard = (
  scoreboardResponse: EspnScoreboardGenerated,
  conferenceMeta: ConferenceMetadata
): ReshapedTeam[] => {
  const teamsMap = new Map<string, ReshapedTeam>();

  const expectedEspnId = String(conferenceMeta.espnId);
  const events = scoreboardResponse.events || [];

  for (const event of events) {
    for (const competition of event.competitions || []) {
      const isConferenceGame = competition.conferenceCompetition === true;

      for (const competitor of competition.competitors || []) {
        const team = competitor.team;
        if (!team || !team.id) {
          continue;
        }

        const teamConferenceId = team.conferenceId ? String(team.conferenceId) : null;
        const matchesConferenceId = teamConferenceId && teamConferenceId === expectedEspnId;

        if (!isConferenceGame && !matchesConferenceId) {
          continue;
        }

        if (teamsMap.has(team.id)) {
          continue;
        }

        teamsMap.set(team.id, {
          _id: team.id,
          name: team.location,
          displayName: team.displayName,
          abbreviation: team.abbreviation,
          logo: team.logo,
          color: team.color || '000000',
          alternateColor: team.alternateColor || '000000',
          conferenceId: conferenceMeta.espnId,
          record: undefined,
          conferenceStanding: undefined,
          nationalRanking: undefined,
          playoffSeed: undefined,
          nextGameId: undefined,
          lastUpdated: new Date(),
        });
      }
    }
  }

  return Array.from(teamsMap.values());
};
