'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setTheme, setMode } from '../store/uiSlice';
import { ThemeMode } from '@/types/frontend';

const ThemeInitializer = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Load saved theme or default to SEC theme
    const savedTheme = localStorage.getItem('sec-tiebreaker-theme') || 'sec';
    // Load saved mode or default to light
    const savedMode = (localStorage.getItem('sec-tiebreaker-mode') || 'light') as ThemeMode;

    // Initialize Redux state from localStorage
    dispatch(setTheme(savedTheme));
    dispatch(setMode(savedMode));

    // Initialize localStorage if not set
    if (!localStorage.getItem('sec-tiebreaker-theme')) {
      localStorage.setItem('sec-tiebreaker-theme', 'sec');
    }
    if (!localStorage.getItem('sec-tiebreaker-mode')) {
      localStorage.setItem('sec-tiebreaker-mode', 'light');
    }
  }, [dispatch]);

  return null;
};

export default ThemeInitializer;
