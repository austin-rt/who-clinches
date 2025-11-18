import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode, ViewMode } from '@/types/frontend';

interface UIState {
  theme: string; // Team theme (e.g., 'sec', 'alabama')
  mode: ThemeMode; // Light/dark mode
  view: ViewMode; // Picks/scores view mode
  hideCompletedGames: boolean; // Whether to hide completed games
  lastUpdated: string | null; // Last time scoreboard was pulled from ESPN
}

const initialState: UIState = {
  theme: 'sec',
  mode: 'light',
  view: 'picks', // Default to picks (compact) view
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
