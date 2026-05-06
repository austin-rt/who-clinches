import daisyui from 'daisyui';

const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['selector', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        'base-400': 'var(--color-base-400)',
        stroke: 'var(--color-stroke)',
        'stroke-alt': 'var(--color-stroke-alt)',
        'text-secondary': 'var(--color-text-secondary)',
      },
      fontSize: {
        xxs: '10px',
        xxxs: '8px',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ['light', 'dark', 'sec'],
  },
};

export default config;
