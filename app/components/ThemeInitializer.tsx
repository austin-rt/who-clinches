'use client';

import { useLocalStorage } from '../hooks/useLocalStorage';
import { setTheme, setMode, setView, setHideCompletedGames } from '../store/uiSlice';
import { setPicks, GamePick } from '../store/gamePicksSlice';
import { ViewMode } from '@/types/frontend';

const ThemeInitializer = () => {
  // Use useLocalStorage hook for theme - handles hydration and persistence
  useLocalStorage('sec-tiebreaker-theme', 'sec', setTheme, (state) => state.ui.theme);

  // Use useLocalStorage hook for mode - handles hydration and persistence
  useLocalStorage('sec-tiebreaker-mode', 'light', setMode, (state) => state.ui.mode);

  // Use useLocalStorage hook for view - handles hydration and persistence
  useLocalStorage<ViewMode>('sec-tiebreaker-view', 'picks', setView, (state) => state.ui.view);

  // Use useLocalStorage hook for hideCompletedGames - handles hydration and persistence
  useLocalStorage('sec-tiebreaker-hide-completed', false, setHideCompletedGames, (state) => state.ui.hideCompletedGames);

  // Use useLocalStorage hook for game picks - handles hydration and persistence
  useLocalStorage<{ [gameId: string]: GamePick }>(
    'sec-tiebreaker-game-picks',
    {},
    setPicks,
    (state) => state.gamePicks.picks
  );

  return null;
};

export default ThemeInitializer;
