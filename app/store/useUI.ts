import { useAppDispatch, useAppSelector } from './hooks';
import { setTheme, setMode } from './uiSlice';
import { ThemeMode } from '@/types/frontend';

export const useUI = () => {
  const dispatch = useAppDispatch();
  const { theme, mode } = useAppSelector((state) => state.ui);

  const updateTheme = (newTheme: string) => {
    dispatch(setTheme(newTheme));
  };

  const updateMode = (newMode: ThemeMode) => {
    dispatch(setMode(newMode));
  };

  return {
    theme,
    mode,
    setTheme: updateTheme,
    setMode: updateMode,
  };
};
