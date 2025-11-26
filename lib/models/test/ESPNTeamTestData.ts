import { Schema, Document } from 'mongoose';
import type { EspnTeamGenerated } from '@/lib/espn/espn-team-generated';

export interface IESPNTeamTestData extends Document {
  season: number;
  teamId: string;
  teamAbbrev: string;
  endpoint: string;
  response: EspnTeamGenerated;
  pulledAt: Date;
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
    timestamps: false,
    collection: 'espn_team_test_data',
  }
);

ESPNTeamTestDataSchema.index({ season: 1 }, { unique: true });
export const getESPNTeamTestData = async () => {
  const dbConnect = (await import('@/lib/mongodb')).default;
  const conn = await dbConnect();
  return (
    conn.models.ESPNTeamTestData ||
    conn.model<IESPNTeamTestData>('ESPNTeamTestData', ESPNTeamTestDataSchema)
  );
};

export default getESPNTeamTestData;
