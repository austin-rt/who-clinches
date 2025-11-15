'use client';

import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';

const ThemeSync = () => {
  const { theme, mode } = useAppSelector((state) => state.ui);

  useEffect(() => {
    // Sync theme to DOM
    document.documentElement.setAttribute('data-theme', theme);
    // Sync theme to localStorage
    localStorage.setItem('sec-tiebreaker-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Sync mode to DOM
    document.documentElement.setAttribute('data-mode', mode);
    // Sync mode to localStorage
    localStorage.setItem('sec-tiebreaker-mode', mode);
  }, [mode]);

  return null;
};

export default ThemeSync;
