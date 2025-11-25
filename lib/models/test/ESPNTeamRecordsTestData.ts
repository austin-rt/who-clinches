import { Schema, Document } from 'mongoose';
import type { EspnTeamRecordsGenerated } from '@/lib/espn/espn-team-records-generated';

/**
 * ESPN Team Records Test Data
 *
 * Stores real ESPN team records API responses for use in unit tests.
 * Updated daily via cron job to ensure tests use current API format.
 * Uses dedicated test database connection.
 */
export interface IESPNTeamRecordsTestData extends Document {
  season: number;
  teamId: string;
  teamAbbrev: string;
  endpoint: string; // Full endpoint URL
  response: EspnTeamRecordsGenerated; // Raw ESPN API response
  pulledAt: Date; // When this snapshot was captured
  lastUpdated: Date;
}

const ESPNTeamRecordsTestDataSchema = new Schema<IESPNTeamRecordsTestData>(
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
    collection: 'espn_team_records_test_data', // Explicit collection name
  }
);

// Unique index: one snapshot per season
ESPNTeamRecordsTestDataSchema.index({ season: 1 }, { unique: true });

// Get model using main database connection (memory server in test mode)
export const getESPNTeamRecordsTestData = async () => {
  const dbConnect = (await import('@/lib/mongodb')).default;
  const conn = await dbConnect();
  return (
    conn.models.ESPNTeamRecordsTestData ||
    conn.model<IESPNTeamRecordsTestData>('ESPNTeamRecordsTestData', ESPNTeamRecordsTestDataSchema)
  );
};

export default getESPNTeamRecordsTestData;
