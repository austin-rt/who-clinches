import { Schema, Document } from 'mongoose';
import type { EspnTeamRecordsGenerated } from '@/lib/espn/espn-team-records-generated';

export interface IESPNTeamRecordsTestData extends Document {
  season: number;
  teamId: string;
  teamAbbrev: string;
  endpoint: string;
  response: EspnTeamRecordsGenerated;
  pulledAt: Date;
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
    timestamps: false,
    collection: 'espn_team_records_test_data',
  }
);

ESPNTeamRecordsTestDataSchema.index({ season: 1 }, { unique: true });
export const getESPNTeamRecordsTestData = async () => {
  const dbConnect = (await import('@/lib/mongodb')).default;
  const conn = await dbConnect();
  return (
    conn.models.ESPNTeamRecordsTestData ||
    conn.model<IESPNTeamRecordsTestData>('ESPNTeamRecordsTestData', ESPNTeamRecordsTestDataSchema)
  );
};

export default getESPNTeamRecordsTestData;
