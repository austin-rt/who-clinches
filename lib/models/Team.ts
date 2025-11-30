import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  _id: string;
  name: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  alternateColor: string;
  conferenceId: string;
  record?: {
    overall?: string;
    conference?: string;
    home?: string;
    away?: string;
    stats?: {
      wins?: number;
      losses?: number;
      winPercent?: number;
      pointsFor?: number;
      pointsAgainst?: number;
      pointDifferential?: number;
      avgPointsFor?: number;
      avgPointsAgainst?: number;
    };
  };
  conferenceStanding?: string;
  nationalRanking?: number;
  playoffSeed?: number;
  nextGameId?: string;
  lastUpdated: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    shortDisplayName: {
      type: String,
      required: false,
      default: function(this: ITeam) {
        return this.displayName || this.abbreviation || '';
      },
    },
    abbreviation: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    alternateColor: {
      type: String,
      required: true,
    },
    conferenceId: {
      type: String,
      required: true,
      index: true,
    },
    record: {
      overall: { type: String },
      conference: { type: String },
      home: { type: String },
      away: { type: String },
      stats: {
        wins: { type: Number },
        losses: { type: Number },
        winPercent: { type: Number },
        pointsFor: { type: Number },
        pointsAgainst: { type: Number },
        pointDifferential: { type: Number },
        avgPointsFor: { type: Number },
        avgPointsAgainst: { type: Number },
      },
    },
    conferenceStanding: { type: String },
    nationalRanking: { type: Number },
    playoffSeed: { type: Number },
    nextGameId: { type: String },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
