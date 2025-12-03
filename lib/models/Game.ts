import mongoose, { Schema, Document } from 'mongoose';

export type GameState = 'pre' | 'in' | 'post';

export interface GameTeam {
  teamEspnId: string;
  abbrev: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color?: string;
  alternateColor?: string;
  score: number | null;
  rank: number | null;
}

export interface GameVenue {
  fullName: string;
  city: string;
  state: string;
  timezone: string;
}

export interface GameOdds {
  favoriteTeamEspnId: string | null;
  spread: number | null;
  overUnder: number | null;
}

export interface GameType {
  name: string;
  abbreviation: string;
}

export interface PredictedScore {
  home: number;
  away: number;
}

export interface IGame extends Document {
  espnId: string;
  displayName: string;
  date: string;
  week: number | null;
  season: number;
  sport: string;
  league: string;
  state: GameState;
  completed: boolean;
  conferenceGame: boolean;
  neutralSite: boolean;
  venue: GameVenue;
  home: GameTeam;
  away: GameTeam;
  odds: GameOdds;
  predictedScore: PredictedScore;
  gameType?: GameType;
}

const teamSchemaDefinition = {
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
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  color: {
    type: String,
  },
  shortDisplayName: {
    type: String,
    required: true,
  },
  alternateColor: {
    type: String,
  },
  score: {
    type: Number,
    default: null,
  },
  rank: {
    type: Number,
    default: null,
  },
};

const venueSchemaDefinition = {
  fullName: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  timezone: {
    type: String,
    required: true,
  },
};

const oddsSchemaDefinition = {
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
};

const predictedScoreSchemaDefinition = {
  home: {
    type: Number,
    required: true,
  },
  away: {
    type: Number,
    required: true,
  },
};

const gameTypeSchemaDefinition = {
  type: {
    name: {
      type: String,
      required: true,
    },
    abbreviation: {
      type: String,
      required: true,
    },
  },
  _id: false,
};

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
      default: 'football',
    },
    league: {
      type: String,
      required: true,
      default: 'college-football',
    },
    state: {
      type: String,
      enum: ['pre', 'in', 'post'],
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
    venue: venueSchemaDefinition,
    home: teamSchemaDefinition,
    away: teamSchemaDefinition,
    odds: oddsSchemaDefinition,
    predictedScore: predictedScoreSchemaDefinition,
    gameType: gameTypeSchemaDefinition,
  },
  {
    timestamps: true,
  }
);

GameSchema.index({
  sport: 1,
  league: 1,
  conferenceGame: 1,
  season: 1,
  week: 1,
});
GameSchema.index({ state: 1, completed: 1 });
GameSchema.index({ sport: 1, league: 1 });

if (mongoose.models.Game) {
  delete mongoose.models.Game;
}

export default mongoose.model<IGame>('Game', GameSchema);
