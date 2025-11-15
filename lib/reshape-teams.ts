/**
 * Team data reshaping functions for ESPN team endpoint responses
 * Transform raw ESPN team data into our desired format
 */

import type { EspnTeamGenerated, Logo } from './espn/espn-team-generated';
import type { EspnTeamRecordsGenerated } from './espn/espn-team-records-generated';
import { ReshapedTeam, TeamRecord, TeamDataResponse } from './types';

/**
 * Reshape ESPN team response into our team format
 */
export const reshapeTeamData = (
  espnTeamResponse: EspnTeamGenerated,
  coreRecordResponse?: EspnTeamRecordsGenerated
): ReshapedTeam | null => {
  const team = espnTeamResponse.team;
  if (!team) {
    return null;
  }

  // Find the best logo (prefer larger sizes)
  const logo: Logo | undefined = team.logos?.find((l: Logo) => l.width >= 500) || team.logos?.[0];

  // Parse records from core API if available
  let record: TeamRecord = {};
  if (coreRecordResponse?.items) {
    const items = coreRecordResponse.items;

    // Find each record type
    const overallRecord = items.find((item) => item.type === 'total');
    const homeRecord = items.find((item) => item.type === 'homerecord');
    const awayRecord = items.find((item) => item.type === 'awayrecord');
    const confRecord = items.find((item) => item.type === 'vsconf');

    // Extract stats from overall record
    const stats = overallRecord?.stats || [];
    const getStatValue = (name: string) => stats.find((s) => s.name === name)?.value;

    record = {
      overall: overallRecord?.summary,
      conference: confRecord?.summary || null,
      home: homeRecord?.summary || null,
      away: awayRecord?.summary || null,
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
  } else if (espnTeamResponse.team.record?.items) {
    // Fallback to site API record (overall only)
    const recordItem = espnTeamResponse.team.record.items[0];
    if (recordItem) {
      const stats = recordItem.stats || [];
      const getStatValue = (name: string) =>
        stats.find((s: { name: string; value: number }) => s.name === name)?.value;

      record = {
        overall: recordItem.summary,
        conference: null,
        home: null,
        away: null,
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
    }
  }

  // Parse current ranking and playoff info
  // ESPN uses 99 or null for unranked teams
  const rawRank = espnTeamResponse.team.rank;
  const nationalRanking = rawRank && rawRank !== 99 ? rawRank : null;
  const playoffSeed = null; // Will be populated from separate playoff rankings API if needed

  // Parse conference standing
  const conferenceStanding = espnTeamResponse.team.standingSummary;

  // Parse next game
  const nextGameId = espnTeamResponse.team.nextEvent?.[0]?.id;

  return {
    _id: team.id,
    name: team.name,
    displayName: team.displayName,
    abbreviation: team.abbreviation,
    logo: logo?.href || '',
    color: team.color,
    alternateColor: team.alternateColor,
    conferenceId: team.groups?.parent?.id || '8', // Default to SEC
    record,
    conferenceStanding,
    nationalRanking,
    playoffSeed: playoffSeed || null,
    nextGameId,
    lastUpdated: new Date(),
  };
};

/**
 * Reshape multiple team responses
 */
export const reshapeTeamsData = (teamResponses: TeamDataResponse[]): ReshapedTeam[] => {
  const teams: ReshapedTeam[] = [];

  teamResponses.forEach(({ data, recordData }) => {
    if (!data) {
      return;
    }

    const team = reshapeTeamData(data, recordData || undefined);
    if (team) {
      teams.push(team);
    }
  });

  return teams;
};
