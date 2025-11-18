import { useAppDispatch, useAppSelector } from './hooks';
import { setTheme, setMode, setView, setHideCompletedGames } from './uiSlice';
import { ThemeMode, ViewMode } from '@/types/frontend';

export const useUIState = () => {
  const dispatch = useAppDispatch();
  const { theme, mode, view, hideCompletedGames } = useAppSelector((state) => state.ui);

  const updateTheme = (newTheme: string) => {
    dispatch(setTheme(newTheme));
  };

  const updateMode = (newMode: ThemeMode) => {
    dispatch(setMode(newMode));
  };

  const updateView = (newView: ViewMode) => {
    dispatch(setView(newView));
  };

  const updateHideCompletedGames = (hide: boolean) => {
    dispatch(setHideCompletedGames(hide));
  };

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
