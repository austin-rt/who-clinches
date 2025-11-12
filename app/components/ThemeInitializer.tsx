'use client';

import { useEffect } from 'react';

export function ThemeInitializer() {
  useEffect(() => {
    // Load saved team theme or default to light DaisyUI theme
    const savedTheme = localStorage.getItem('sec-tiebreaker-theme') || 'light';

    // Apply theme to html element for DaisyUI
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return null;
}
