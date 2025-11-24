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
import dbConnectTest from '@/lib/mongodb-test';
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
  async getScoreboard(params: {
    groups?: number;
    season?: number;
    week?: number;
  } = {}): Promise<EspnScoreboardGenerated> {
    await dbConnectTest();
    const Model = await getESPNScoreboardTestData();

    // If no season/week specified, this is likely a calendar fetch
    // Return the first available scoreboard data (which contains calendar)
    if (!params.season && params.week === undefined) {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getTeam(teamAbbrev: string): Promise<EspnTeamGenerated> {
    // Test data loader doesn't take teamAbbrev, it just returns the stored team data
    // This is fine for tests - we're testing route logic, not team-specific data
    return await loadTeamTestData();
  }

  /**
   * Mock getTeamRecords - returns test data from MongoDB Atlas /test database
   */
  async getTeamRecords(
    teamId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    season: number = SEASON,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    seasonType: number = 2
  ): Promise<EspnTeamRecordsGenerated> {
    // Test data loader doesn't take teamId, it just returns the stored team records
    // This is fine for tests - we're testing route logic, not team-specific data
    return await loadTeamRecordsTestData();
  }

  /**
   * Mock getGameSummary - returns test data from MongoDB Atlas /test database
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getGameSummary(gameId: string): Promise<EspnGameSummaryGenerated> {
    // Test data loader doesn't take gameId, it just returns the stored game summary
    // This is fine for tests - we're testing route logic, not game-specific data
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

