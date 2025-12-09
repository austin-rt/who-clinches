import { useAppDispatch, useAppSelector } from './hooks';
import { setTheme, setMode, setView, setHideCompletedGames } from './uiSlice';
import { ThemeMode, ViewMode } from '@/types/frontend';
import { useCallback } from 'react';

export const useUIState = () => {
  const dispatch = useAppDispatch();
  const { theme, mode, view, hideCompletedGames } = useAppSelector((state) => state.ui);

  const updateTheme = useCallback(
    (newTheme: string) => {
      dispatch(setTheme(newTheme));
    },
    [dispatch]
  );

  const updateMode = useCallback(
    (newMode: ThemeMode) => {
      dispatch(setMode(newMode));
    },
    [dispatch]
  );

  const updateView = useCallback(
    (newView: ViewMode) => {
      dispatch(setView(newView));
    },
    [dispatch]
  );

  const updateHideCompletedGames = useCallback(
    (hide: boolean) => {
      dispatch(setHideCompletedGames(hide));
    },
    [dispatch]
  );

  return {
    theme,
    mode,
    view,
    hideCompletedGames,
    setTheme: updateTheme,
    setMode: updateMode,
    setView: updateView,
    setHideCompletedGames: updateHideCompletedGames,
  };
};
