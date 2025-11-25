/**
 * Mock ESPN Client for Integration Tests
 *
 * Returns real ESPN API response snapshots from MongoDB Atlas /test database
 * instead of calling the actual ESPN API. This allows tests to run without
 * external API dependencies while still using real data.
 */

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

/**
 * Mock ESPN Client that returns test data from MongoDB Atlas /test database
 */
export class MockESPNClient {
  private sport: string;
  private league: string;

  constructor(sport: string = 'football', league: string = 'college-football') {
    this.sport = sport;
    this.league = league;
  }

  /**
   * Mock getScoreboard - returns test data from MongoDB Atlas /test database
   * Handles both calendar fetching (no season/week) and game fetching (with season/week)
   */
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

    // If no season/week/dates specified, this is likely a calendar fetch
    // Return the first available scoreboard data (which contains calendar)
    if (!params.season && params.week === undefined && params.dates === undefined) {
      const data = await Model.findOne({ season: SEASON }).sort({ week: 1 });
      if (!data) {
        throw new Error(
          `TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:missing_data | TYPE:scoreboard | SEASON:${SEASON} | EXPECTED:test_data_exists | ACTUAL:not_found | NOTE:Run /api/cron/update-test-data to populate test data`
        );
      }
      return data.response;
    }

    // If week is specified, try to find that specific week
    if (params.week !== undefined) {
      const data = await Model.findOne({ season: SEASON, week: params.week });
      if (data) {
        return data.response;
      }
      // Fallback to first available week if specific week not found
      const fallback = await Model.findOne({ season: SEASON }).sort({ week: 1 });
      if (fallback) {
        return fallback.response;
      }
    }

    // If dates is specified (full season fetch), return full season response (week: 0)
    // Real ESPN API with dates=2025 returns entire season in one response
    if (params.dates !== undefined) {
      const data = await Model.findOne({ season: SEASON, week: 0 });
      if (!data) {
        // Fallback to first week if full season not available
        const fallback = await Model.findOne({ season: SEASON }).sort({ week: 1 });
        if (!fallback) {
          throw new Error(
            `TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:missing_data | TYPE:scoreboard | SEASON:${SEASON} | EXPECTED:test_data_exists | ACTUAL:not_found | NOTE:Run /api/cron/update-test-data to populate test data`
          );
        }
        return fallback.response;
      }
      return data.response;
    }

    // Default: return first available scoreboard data
    const data = await Model.findOne({ season: SEASON }).sort({ week: 1 });
    if (!data) {
      throw new Error(
        `TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:missing_data | TYPE:scoreboard | SEASON:${SEASON} | EXPECTED:test_data_exists | ACTUAL:not_found | NOTE:Run /api/cron/update-test-data to populate test data`
      );
    }
    return data.response;
  }

  /**
   * Mock getTeam - returns test data from MongoDB Atlas /test database
   */
  async getTeam(teamAbbrev: string): Promise<EspnTeamGenerated> {
    void teamAbbrev;
    return await loadTeamTestData();
  }

  /**
   * Mock getTeamRecords - returns test data from MongoDB Atlas /test database
   */
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

  /**
   * Mock getGameSummary - returns test data from MongoDB Atlas /test database
   */

  async getGameSummary(gameId: string): Promise<EspnGameSummaryGenerated> {
    void gameId;
    return await loadGameSummaryTestData();
  }

  /**
   * Mock getConferenceTeams - not used in current tests, but included for completeness
   */
  getConferenceTeams(conferenceId: number): Promise<string[]> {
    throw new Error(
      `getConferenceTeams not implemented for conference ${conferenceId}. Use conference-specific constants from lib/cfb/constants.ts`
    );
  }
}

/**
 * Mock factory function that returns MockESPNClient
 */
export const createMockESPNClient = (sport: string, league: string) => {
  return new MockESPNClient(sport, league);
};
