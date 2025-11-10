import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
  _id: string; // ESPN team ID used as primary key
  name: string;
  displayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  alternateColor: string;
  conferenceId: string;
  // Rich data from ESPN team endpoint
  record?: {
    overall?: string; // "8-1"
    conference?: string; // "6-1"
    home?: string; // "4-1"
    away?: string; // "3-0"
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
  standingSummary?: string; // "3rd in SEC"
  currentRank?: number; // Current AP/Coaches poll ranking
  playoffSeed?: number; // CFP ranking if available
  nextGameId?: string; // ESPN ID of next game
  lastUpdated: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    _id: {
      type: String,
      required: true, // ESPN team ID as primary key
    },
    name: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
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
    // Rich data from ESPN team endpoint
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
    standingSummary: { type: String },
    currentRank: { type: Number },
    playoffSeed: { type: Number },
    nextGameId: { type: String },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false, // We're using custom _id
    timestamps: true,
  }
);

export default mongoose.models.Team ||
  mongoose.model<ITeam>("Team", TeamSchema);
