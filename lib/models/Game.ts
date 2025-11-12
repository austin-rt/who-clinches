import mongoose, { Schema, Document } from "mongoose";

export interface IGame extends Document {
  espnId: string;
  displayName: string; // "{away abbrev} @ {home abbrev}"
  date: string;
  week: number | null;
  season: number;
  sport: string;
  league: string;
  state: "pre" | "in" | "post";
  completed: boolean;
  conferenceGame: boolean;
  neutralSite: boolean;
  home: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;
    logo: string;
    color: string;
    score: number | null;
    rank: number | null;
  };
  away: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;
    logo: string;
    color: string;
    score: number | null;
    rank: number | null;
  };
  odds: {
    favoriteTeamEspnId: string | null;
    spread: number | null;
    overUnder: number | null;
  };
  predictedScore?: {
    home: number;
    away: number;
  };
  lastUpdated: Date;
}

const GameSchema = new Schema<IGame>(
  {
    espnId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    week: {
      type: Number,
      default: null,
    },
    season: {
      type: Number,
      required: true,
    },
    sport: {
      type: String,
      required: true,
      default: "football",
    },
    league: {
      type: String,
      required: true,
      default: "college-football",
    },
    state: {
      type: String,
      enum: ["pre", "in", "post"],
      required: true,
    },
    completed: {
      type: Boolean,
      required: true,
      default: false,
    },
    conferenceGame: {
      type: Boolean,
      required: true,
      index: true,
    },
    neutralSite: {
      type: Boolean,
      default: false,
    },
    home: {
      teamEspnId: {
        type: String,
        required: true,
        index: true,
      },
      abbrev: {
        type: String,
        required: true,
      },
      displayName: {
        type: String,
        required: false,
      },
      logo: {
        type: String,
        required: false,
      },
      color: {
        type: String,
        required: false,
      },
      score: {
        type: Number,
        default: null,
      },
      rank: {
        type: Number,
        default: null,
      },
    },
    away: {
      teamEspnId: {
        type: String,
        required: true,
        index: true,
      },
      abbrev: {
        type: String,
        required: true,
      },
      displayName: {
        type: String,
        required: false,
      },
      logo: {
        type: String,
        required: false,
      },
      color: {
        type: String,
        required: false,
      },
      score: {
        type: Number,
        default: null,
      },
      rank: {
        type: Number,
        default: null,
      },
    },
    odds: {
      favoriteTeamEspnId: {
        type: String,
        default: null,
      },
      spread: {
        type: Number,
        default: null,
      },
      overUnder: {
        type: Number,
        default: null,
      },
    },
    predictedScore: {
      home: {
        type: Number,
      },
      away: {
        type: Number,
      },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes as specified in tech spec
GameSchema.index({
  sport: 1,
  league: 1,
  conferenceGame: 1,
  season: 1,
  week: 1,
});
GameSchema.index({ state: 1, completed: 1 });
GameSchema.index({ sport: 1, league: 1 });
// Note: home.teamEspnId and away.teamEspnId already have index: true in field definitions

// Force delete cached model to pick up schema changes
if (mongoose.models.Game) {
  delete mongoose.models.Game;
}

export default mongoose.model<IGame>("Game", GameSchema);
