import { Schema, Document } from 'mongoose';
import type { EspnScoreboardGenerated } from '@/lib/espn/espn-scoreboard-generated';

/**
 * ESPN Scoreboard Test Data
 *
 * Stores real ESPN scoreboard API responses for use in unit tests.
 * Updated daily via cron job to ensure tests use current API format.
 * Uses dedicated test database connection.
 */
export interface IESPNScoreboardTestData extends Document {
  season: number;
  week: number;
  endpoint: string; // Full endpoint URL
  response: EspnScoreboardGenerated; // Raw ESPN API response
  pulledAt: Date; // When this snapshot was captured
  lastUpdated: Date;
}

const ESPNScoreboardTestDataSchema = new Schema<IESPNScoreboardTestData>(
  {
    season: {
      type: Number,
      required: true,
      default: 2025,
    },
    week: {
      type: Number,
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
    collection: 'espn_scoreboard_test_data', // Explicit collection name
  }
);

// Unique index: one snapshot per season/week combination
ESPNScoreboardTestDataSchema.index({ season: 1, week: 1 }, { unique: true });

// Get model using test database connection
export const getESPNScoreboardTestData = async () => {
  const dbConnectTest = (await import('@/lib/mongodb-test')).default;
  const conn = await dbConnectTest();
  return (
    conn.models.ESPNScoreboardTestData ||
    conn.model<IESPNScoreboardTestData>('ESPNScoreboardTestData', ESPNScoreboardTestDataSchema)
  );
};

export default getESPNScoreboardTestData;
