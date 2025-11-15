'use client';

import { useEffect } from 'react';

export function ThemeInitializer() {
  useEffect(() => {
    // Load saved team theme or default to SEC theme
    const savedTeam = localStorage.getItem('sec-tiebreaker-theme') || 'sec';

    // Load saved mode or default to light
    const savedMode = localStorage.getItem('sec-tiebreaker-mode') || 'light';

    // Apply both: team colors + light/dark mode
    // data-theme controls primary/secondary/accent (team colors)
    // data-mode controls base-100/base-content (backgrounds/text)
    document.documentElement.setAttribute('data-theme', savedTeam);
    document.documentElement.setAttribute('data-mode', savedMode);

    // Initialize localStorage if not set
    if (!localStorage.getItem('sec-tiebreaker-theme')) {
      localStorage.setItem('sec-tiebreaker-theme', 'sec');
    }
    if (!localStorage.getItem('sec-tiebreaker-mode')) {
      localStorage.setItem('sec-tiebreaker-mode', 'light');
    }
  }, []);

  return null;
}
