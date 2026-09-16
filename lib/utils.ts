import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: Parameters<typeof clsx>) => {
  return twMerge(clsx(inputs));
};

export const isDarkHexColor = (hex: string): boolean => {
  const clean = hex.replace(/^#/, '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return true;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.55;
};
