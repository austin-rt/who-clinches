import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '@/types/frontend';

interface UIState {
  theme: string; // Team theme (e.g., 'sec', 'alabama')
  mode: ThemeMode; // Light/dark mode
}

const initialState: UIState = {
  theme: 'sec',
  mode: 'light',
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
  },
});

export const { setTheme, setMode } = uiSlice.actions;
export default uiSlice.reducer;
