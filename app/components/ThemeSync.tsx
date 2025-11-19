'use client';

import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';

const ThemeSync = () => {
  const { theme, mode } = useAppSelector((state) => state.ui);

  useEffect(() => {
    // Sync theme to DOM (localStorage persistence handled by localStorageMiddleware)
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Sync mode to DOM (localStorage persistence handled by localStorageMiddleware)
    document.documentElement.setAttribute('data-mode', mode);
  }, [mode]);

  return null;
};

export default ThemeSync;
