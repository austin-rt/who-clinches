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
        'h-8 w-10 flex-shrink-0 text-center text-2xl leading-none',
        'bg-transparent focus:border-primary focus:outline-none',
        {
          'font-extrabold': isHigher && !isTie,
          'font-normal': !isHigher || isTie,
        }
      )}
    />
  );
};

export default ScoreInput;
