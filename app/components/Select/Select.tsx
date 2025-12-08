'use client';

import { forwardRef, type ForwardRefExoticComponent } from 'react';
import { cn } from '@/lib/utils';
import { type BaseSelectProps } from './BaseSelectProps';

const Select: ForwardRefExoticComponent<BaseSelectProps> = forwardRef<
  HTMLSelectElement,
  BaseSelectProps
>(
  (
    {
      size = 'md',
      color = 'primary',
      disabled = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const selectClasses = cn(
      'select',
      {
        'select-primary': color === 'primary',
        'select-secondary': color === 'secondary',
        'select-accent': color === 'accent',
        'select-neutral': color === 'neutral',
        'select-info': color === 'info',
        'select-success': color === 'success',
        'select-warning': color === 'warning',
        'select-error': color === 'error',
        'select-xs': size === 'xs',
        'select-sm': size === 'sm',
        'select-md': size === 'md',
        'select-lg': size === 'lg',
        'select-xl': size === 'xl',
      },
      className
    );

    return (
      <select ref={ref} disabled={disabled} className={selectClasses} {...props}>
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export default Select;

