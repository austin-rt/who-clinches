import { Schema, Document } from 'mongoose';
import type { EspnGameSummaryGenerated } from '@/lib/espn/espn-game-summary-generated';

export interface IESPNGameSummaryTestData extends Document {
  season: number;
  gameId: string;
  endpoint: string;
  response: EspnGameSummaryGenerated;
  pulledAt: Date;
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
    timestamps: false,
    collection: 'espn_game_summary_test_data',
  }
);

ESPNGameSummaryTestDataSchema.index({ season: 1 }, { unique: true });
export const getESPNGameSummaryTestData = async () => {
  const dbConnect = (await import('@/lib/mongodb')).default;
  const conn = await dbConnect();
  return (
    conn.models.ESPNGameSummaryTestData ||
    conn.model<IESPNGameSummaryTestData>('ESPNGameSummaryTestData', ESPNGameSummaryTestDataSchema)
  );
};

export default getESPNGameSummaryTestData;
