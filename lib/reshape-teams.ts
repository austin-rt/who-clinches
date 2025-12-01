import type { EspnTeamGenerated, Logo } from './espn/espn-team-generated';
import { ReshapedTeam, ReshapedTeamRecord, TeamDataResponse } from './types';

export const reshapeTeamData = (
  espnTeamResponse: EspnTeamGenerated
): ReshapedTeam | null => {
  const team = espnTeamResponse.team;
  if (!team) {
    return null;
  }

  const logo: Logo | undefined = team.logos?.find((l: Logo) => l.width >= 500) || team.logos?.[0];

  let record: ReshapedTeamRecord;
  if (espnTeamResponse.team.record?.items) {
    const recordItem = espnTeamResponse.team.record.items[0];
    if (recordItem) {
      const stats = recordItem.stats || [];
      const getStatValue = (name: string) =>
        stats.find((s: { name: string; value: number }) => s.name === name)?.value;

      record = {
        overall: recordItem.summary || '0-0',
        conference: '0-0',
        home: '0-0',
        away: '0-0',
        stats: {
          wins: getStatValue('wins'),
          losses: getStatValue('losses'),
          winPercent: getStatValue('winPercent'),
          pointsFor: getStatValue('pointsFor'),
          pointsAgainst: getStatValue('pointsAgainst'),
          pointDifferential: getStatValue('pointDifferential'),
          avgPointsFor: getStatValue('avgPointsFor'),
          avgPointsAgainst: getStatValue('avgPointsAgainst'),
        },
      };
    } else {
      record = {
        overall: '0-0',
        conference: '0-0',
        home: '0-0',
        away: '0-0',
        stats: {},
      };
    }
  } else {
    record = {
      overall: '0-0',
      conference: '0-0',
      home: '0-0',
      away: '0-0',
      stats: {},
    };
  }

  const rawRank = espnTeamResponse.team.rank;
  const nationalRanking = rawRank && rawRank !== 99 ? rawRank : null;
  const playoffSeed = null;

  const conferenceStanding = espnTeamResponse.team.standingSummary || '';

  const nextGameId = espnTeamResponse.team.nextEvent?.[0]?.id || null;

  return {
    _id: team.id,
    name: team.location,
    displayName: team.displayName,
    shortDisplayName: team.shortDisplayName,
    abbreviation: team.abbreviation,
    logo: logo?.href || '',
    color: team.color,
    alternateColor: team.alternateColor,
    conferenceId: team.groups?.parent?.id || '',
    record,
    conferenceStanding,
    nationalRanking,
    playoffSeed: playoffSeed || null,
    nextGameId,
    lastUpdated: new Date(),
  };
};

export const reshapeTeamsData = (teamResponses: TeamDataResponse[]): ReshapedTeam[] => {
  const teams: ReshapedTeam[] = [];

  teamResponses.forEach(({ data }) => {
    if (!data) {
      return;
    }

    const team = reshapeTeamData(data);
    if (team) {
      teams.push(team);
    }
  });

  return teams;
};
