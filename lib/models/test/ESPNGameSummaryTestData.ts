import { Schema, Document } from 'mongoose';
import { ESPNGameSummaryResponse } from '@/lib/espn-client';

/**
 * ESPN Game Summary Test Data
 *
 * Stores real ESPN game summary API responses for use in unit tests.
 * Updated daily via cron job to ensure tests use current API format.
 * Uses dedicated test database connection.
 */
export interface IESPNGameSummaryTestData extends Document {
  season: number;
  gameId: string;
  endpoint: string; // Full endpoint URL
  response: ESPNGameSummaryResponse; // Raw ESPN API response
  pulledAt: Date; // When this snapshot was captured
  lastUpdated: Date;
}

const ESPNGameSummaryTestDataSchema = new Schema<IESPNGameSummaryTestData>(
  {
    season: {
      type: Number,
      required: true,
      default: 2025,
    },
    gameId: {
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
    collection: 'espn_game_summary_test_data', // Explicit collection name
  }
);

// Unique index: one snapshot per season
ESPNGameSummaryTestDataSchema.index({ season: 1 }, { unique: true });

// Get model using test database connection
export const getESPNGameSummaryTestData = async () => {
  const dbConnectTest = (await import('@/lib/mongodb-test')).default;
  const conn = await dbConnectTest();
  return (
    conn.models.ESPNGameSummaryTestData ||
    conn.model<IESPNGameSummaryTestData>('ESPNGameSummaryTestData', ESPNGameSummaryTestDataSchema)
  );
};

export default getESPNGameSummaryTestData;
