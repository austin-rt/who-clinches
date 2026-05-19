import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { type BaseInputProps } from './BaseInputProps';

const Input = forwardRef<HTMLInputElement, BaseInputProps>(
  ({ size = 'md', label, className, ...props }, ref) => {
    const inputClasses = cn(
      'input input-bordered w-full',
      {
        'input-xs text-xs px-2': size === 'xs',
        'input-sm text-xs px-3': size === 'sm',
        'input-md': size === 'md',
        'input-lg': size === 'lg',
      },
      className
    );

    if (!label) {
      return <input ref={ref} className={inputClasses} {...props} />;
    }

    return (
      <label className="form-control w-full">
        <div className="label py-0.5">
          <span className="label-text text-[10px]">{label}</span>
        </div>
        <input ref={ref} className={inputClasses} {...props} />
      </label>
    );
  }
);

Input.displayName = 'Input';

export default Input;
