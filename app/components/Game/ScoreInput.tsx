'use client';

import { cn } from '@/lib/utils';

interface ScoreInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  isHigher: boolean;
  isTie: boolean;
}

const ScoreInput = ({ value, onChange, onBlur, isHigher, isTie }: ScoreInputProps) => {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={cn(
        'w-[4ch] rounded-md border border-stroke bg-transparent py-0.5 text-center text-[clamp(1rem,7cqw,2rem)] leading-none outline-none',
        {
          'font-extrabold': isHigher && !isTie,
          'font-normal': !isHigher || isTie,
        }
      )}
    />
  );
};

export default ScoreInput;
