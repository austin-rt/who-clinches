import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { HiChevronUp, HiChevronDown } from 'react-icons/hi2';

interface NumberInputProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}

const sizeClasses = {
  xs: 'h-6 text-xs',
  sm: 'h-9 text-xs',
  md: 'h-12 text-sm',
  lg: 'h-16 text-base',
};

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    { size = 'md', label, value, onChange, placeholder, className, disabled, min = 0, max },
    ref
  ) => {
    const numValue = Number(value) || 0;
    const increment = () => {
      const next = numValue + 1;
      if (max !== undefined && next > max) return;
      onChange(String(next));
    };
    const decrement = () => {
      const next = numValue - 1;
      if (next < min) return;
      onChange(String(next));
    };
    const handleChange = (raw: string) => {
      onChange(raw.replace(/\D/g, ''));
    };

    const wrapper = (
      <div
        className={cn(
          'flex items-stretch overflow-hidden rounded-lg border border-base-300',
          sizeClasses[size],
          disabled && 'opacity-50',
          className
        )}
      >
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder ?? '0'}
          disabled={disabled}
          className="w-full bg-base-100 px-3 outline-none"
        />
        <div className="flex flex-col border-l border-base-300">
          <button
            type="button"
            onClick={increment}
            disabled={disabled}
            className="flex flex-1 cursor-pointer items-center justify-center px-1.5 text-base-content transition-colors hover:bg-base-300 disabled:cursor-not-allowed"
          >
            <HiChevronUp className="h-3 w-3" />
          </button>
          <div className="border-t border-base-300" />
          <button
            type="button"
            onClick={decrement}
            disabled={disabled}
            className="flex flex-1 cursor-pointer items-center justify-center px-1.5 text-base-content transition-colors hover:bg-base-300 disabled:cursor-not-allowed"
          >
            <HiChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    );

    if (!label) return wrapper;

    return (
      <label className="form-control w-full">
        <div className="label py-0.5">
          <span className="label-text text-[10px]">{label}</span>
        </div>
        {wrapper}
      </label>
    );
  }
);

NumberInput.displayName = 'NumberInput';

export default NumberInput;
