import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      'light', // DaisyUI default (light mode base)
      'dark', // DaisyUI default (dark mode base)
      'sec', // Custom SEC theme (Phase 0)
      // Team themes will be added dynamically in Phase 5
    ],
  },
};

export default config;
