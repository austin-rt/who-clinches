import type { EspnScoreboardGenerated } from '@/lib/espn/espn-scoreboard-generated';
import type { EspnTeamGenerated } from '@/lib/espn/espn-team-generated';
import type { EspnTeamRecordsGenerated } from '@/lib/espn/espn-team-records-generated';
import type { EspnGameSummaryGenerated } from '@/lib/espn/espn-game-summary-generated';
import {
  loadTeamTestData,
  loadTeamRecordsTestData,
  loadGameSummaryTestData,
} from '../helpers/test-data-loader';
import dbConnect from '@/lib/mongodb';
import { getESPNScoreboardTestData } from '@/lib/models/test/ESPNScoreboardTestData';

const SEASON = 2025;

export class MockESPNClient {
  private sport: string;
  private league: string;

  constructor(sport: string = 'football', league: string = 'college-football') {
    this.sport = sport;
    this.league = league;
  }

  async getScoreboard(
    params: {
      groups?: number;
      season?: number;
      week?: number;
      dates?: number | string;
    } = {}
  ): Promise<EspnScoreboardGenerated> {
    await dbConnect();
    const Model = await getESPNScoreboardTestData();

    if (!params.season && params.week === undefined && params.dates === undefined) {
      const data = await Model.findOne({ season: SEASON }).sort({ week: 1 });
      if (!data) {
        throw new Error(
          `TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:missing_data | TYPE:scoreboard | SEASON:${SEASON} | EXPECTED:test_data_exists | ACTUAL:not_found | NOTE:Test data must be populated in the test database`
        );
      }
      return data.response;
    }

    if (params.week !== undefined) {
      const data = await Model.findOne({ season: SEASON, week: params.week });
      if (data) {
        return data.response;
      }
      const fallback = await Model.findOne({ season: SEASON }).sort({ week: 1 });
      if (fallback) {
        return fallback.response;
      }
    }

    if (params.dates !== undefined) {
      const data = await Model.findOne({ season: SEASON, week: 0 });
      if (!data) {
        const fallback = await Model.findOne({ season: SEASON }).sort({ week: 1 });
        if (!fallback) {
          throw new Error(
            `TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:missing_data | TYPE:scoreboard | SEASON:${SEASON} | EXPECTED:test_data_exists | ACTUAL:not_found | NOTE:Test data must be populated in the test database`
          );
        }
        return fallback.response;
      }
      return data.response;
    }

    const data = await Model.findOne({ season: SEASON }).sort({ week: 1 });
    if (!data) {
      throw new Error(
        `TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:missing_data | TYPE:scoreboard | SEASON:${SEASON} | EXPECTED:test_data_exists | ACTUAL:not_found | NOTE:Run /api/cron/update-test-data to populate test data`
      );
    }
    return data.response;
  }

  async getTeam(teamAbbrev: string): Promise<EspnTeamGenerated> {
    void teamAbbrev;
    return await loadTeamTestData();
  }

  async getTeamRecords(
    teamId: string,
    season: number = SEASON,
    seasonType: number = 2
  ): Promise<EspnTeamRecordsGenerated> {
    void teamId;
    void season;
    void seasonType;
    return await loadTeamRecordsTestData();
  }

  async getGameSummary(gameId: string): Promise<EspnGameSummaryGenerated> {
    void gameId;
    return await loadGameSummaryTestData();
  }

  getConferenceTeams(conferenceId: number): Promise<string[]> {
    throw new Error(
      `getConferenceTeams not implemented for conference ${conferenceId}. Use conference-specific constants from lib/cfb/constants.ts`
    );
  }
}

export const createMockESPNClient = (sport: string, league: string) => {
  return new MockESPNClient(sport, league);
};
