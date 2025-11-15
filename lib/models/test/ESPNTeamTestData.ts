import { Schema, Document } from 'mongoose';
import type { EspnTeamGenerated } from '@/lib/espn/espn-team-generated';

/**
 * ESPN Team Test Data
 *
 * Stores real ESPN team API responses for use in unit tests.
 * Updated daily via cron job to ensure tests use current API format.
 * Uses dedicated test database connection.
 */
export interface IESPNTeamTestData extends Document {
  season: number;
  teamId: string;
  teamAbbrev: string;
  endpoint: string; // Full endpoint URL
  response: EspnTeamGenerated; // Raw ESPN API response
  pulledAt: Date; // When this snapshot was captured
  lastUpdated: Date;
}

const ESPNTeamTestDataSchema = new Schema<IESPNTeamTestData>(
  {
    season: {
      type: Number,
      required: true,
      default: 2025,
    },
    teamId: {
      type: String,
      required: true,
    },
    teamAbbrev: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    response: {
      type: Schema.Types.Mixed,
      required: true,
    },
    pulledAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We manage lastUpdated manually
    collection: 'espn_team_test_data', // Explicit collection name
  }
);

// Unique index: one snapshot per season
ESPNTeamTestDataSchema.index({ season: 1 }, { unique: true });

// Get model using test database connection
export const getESPNTeamTestData = async () => {
  const dbConnectTest = (await import('@/lib/mongodb-test')).default;
  const conn = await dbConnectTest();
  return (
    conn.models.ESPNTeamTestData ||
    conn.model<IESPNTeamTestData>('ESPNTeamTestData', ESPNTeamTestDataSchema)
  );
};

export default getESPNTeamTestData;
