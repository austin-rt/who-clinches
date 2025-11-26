import { Schema, Document } from 'mongoose';
import type { EspnScoreboardGenerated } from '@/lib/espn/espn-scoreboard-generated';

export interface IESPNScoreboardTestData extends Document {
  season: number;
  week: number;
  endpoint: string;
  response: EspnScoreboardGenerated;
  pulledAt: Date;
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
    timestamps: false,
    collection: 'espn_scoreboard_test_data',
  }
);

ESPNScoreboardTestDataSchema.index({ season: 1, week: 1 }, { unique: true });
export const getESPNScoreboardTestData = async () => {
  const dbConnect = (await import('@/lib/mongodb')).default;
  const conn = await dbConnect();
  return (
    conn.models.ESPNScoreboardTestData ||
    conn.model<IESPNScoreboardTestData>('ESPNScoreboardTestData', ESPNScoreboardTestDataSchema)
  );
};

export default getESPNScoreboardTestData;
