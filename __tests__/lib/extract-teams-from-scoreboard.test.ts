/**
 * Unit Tests: Extract Teams From Scoreboard
 *
 * Tests for extracting teams from ESPN scoreboard responses.
 * Pure function test - no database or server required.
 */

import { extractTeamsFromScoreboard } from '@/lib/reshape-teams-from-scoreboard';
import { sports } from '@/lib/constants';
import type { EspnScoreboardGenerated } from '@/lib/espn/espn-scoreboard-generated';
import {
  loadScoreboardTestData,
  checkTestDataAvailable,
} from '../helpers/test-data-loader';
import { dbDisconnectTest } from '@/lib/mongodb-test';

describe('extractTeamsFromScoreboard', () => {
  let scoreboardResponse: EspnScoreboardGenerated;

  beforeAll(async () => {
    try {
      const available = await checkTestDataAvailable();
      if (!available.available) {
        throw new Error(
          `TEST_DATA_ERROR | ENTITY:TestData | ISSUE:missing_data | MISSING_TYPES:${available.missing.join(',')} | EXPECTED:all_test_data_available | ACTUAL:missing_types | NOTE:Run /api/cron/update-test-data to populate test data`
        );
      }

      scoreboardResponse = await loadScoreboardTestData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `TEST_DATA_ERROR | ENTITY:TestData | ISSUE:load_failed | EXPECTED:test_data_loaded | ACTUAL:${errorMessage} | NOTE:Ensure test database is populated by running /api/cron/update-test-data`
      );
    }
  });

  afterAll(async () => {
    await dbDisconnectTest();
  });

  it('extracts SEC teams from scoreboard response', () => {
    const conferenceMeta = sports.cfb.conferences.sec;
    
    const teams = extractTeamsFromScoreboard(scoreboardResponse, conferenceMeta);
    
    expect(teams.length).toBe(16);
    teams.forEach(team => {
      expect(team.conferenceId).toBe(conferenceMeta.espnId);
    });
  });
});

