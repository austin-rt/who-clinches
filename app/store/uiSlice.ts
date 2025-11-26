import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode, ViewMode } from '@/types/frontend';

interface UIState {
  theme: string;
  mode: ThemeMode;
  view: ViewMode;
  hideCompletedGames: boolean;
  lastUpdated: string | null;
}

const initialState: UIState = {
  theme: 'sec',
  mode: 'light',
  view: 'picks',
  hideCompletedGames: false,
  lastUpdated: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    },
    setMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
    setView: (state, action: PayloadAction<ViewMode>) => {
      state.view = action.payload;
    },
    setHideCompletedGames: (state, action: PayloadAction<boolean>) => {
      state.hideCompletedGames = action.payload;
    },
    setLastUpdated: (state, action: PayloadAction<string>) => {
      state.lastUpdated = action.payload;
    },
  },
});

export const { setTheme, setMode, setView, setHideCompletedGames, setLastUpdated } = uiSlice.actions;
export default uiSlice.reducer;
