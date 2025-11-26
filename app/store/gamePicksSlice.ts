import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GamePick {
  homeScore: number;
  awayScore: number;
}

interface GamePicksState {
  picks: {
    [gameId: string]: GamePick;
  };
}

const initialState: GamePicksState = {
  picks: {},
};

const gamePicksSlice = createSlice({
  name: 'gamePicks',
  initialState,
  reducers: {
    setGamePick: (state, action: PayloadAction<{ gameId: string; pick: GamePick }>) => {
      state.picks[action.payload.gameId] = action.payload.pick;
    },
    clearGamePick: (state, action: PayloadAction<string>) => {
      delete state.picks[action.payload];
    },
    clearAllPicks: (state) => {
      state.picks = {};
    },
    setPicks: (state, action: PayloadAction<{ [gameId: string]: GamePick }>) => {
      state.picks = action.payload;
    },
  },
});

export const { setGamePick, clearGamePick, clearAllPicks, setPicks } = gamePicksSlice.actions;
export default gamePicksSlice.reducer;

