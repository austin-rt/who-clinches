import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  season: number | null;
  isInSeason: boolean | null;
  allowGraphQL: boolean;
}

const initialState: AppState = {
  season: null,
  isInSeason: null,
  allowGraphQL: typeof process !== 'undefined' && process.env.NODE_ENV === 'production',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSeason: (state, action: PayloadAction<number | null>) => {
      state.season = action.payload;
    },
    setIsInSeason: (state, action: PayloadAction<boolean>) => {
      state.isInSeason = action.payload;
    },
  },
});

export const { setSeason, setIsInSeason } = appSlice.actions;
export default appSlice.reducer;
