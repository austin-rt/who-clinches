'use client';

import { forwardRef, type ForwardRefExoticComponent } from 'react';
import { cn } from '@/lib/utils';
import { type BaseButtonProps } from './BaseButtonProps';

const Button: ForwardRefExoticComponent<BaseButtonProps> = forwardRef<
  HTMLButtonElement,
  BaseButtonProps
>(
  (
    {
      size = 'md',
      color = 'primary',
      loading = false,
      disabled = false,
      onClick,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const buttonClasses = cn(
      'btn relative',
      {
        'btn-primary': color === 'primary',
        'btn-secondary': color === 'secondary',
        'btn-accent': color === 'accent',
        'btn-neutral': color === 'neutral',
        'btn-info': color === 'info',
        'btn-success': color === 'success',
        'btn-warning': color === 'warning',
        'btn-error': color === 'error',
        'btn-xs': size === 'xs',
        'btn-sm': size === 'sm',
        'btn-md': size === 'md',
        'btn-lg': size === 'lg',
        'btn-xl': size === 'xl',
      },
      className
    );

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!loading && !disabled && onClick) {
        onClick(e);
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        className={buttonClasses}
        {...props}
      >
        <span
          className={cn({
            'opacity-0': loading && !disabled,
          })}
        >
          {children}
        </span>
        {loading && !disabled && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="loading loading-spinner h-2/3 w-auto text-current"></span>
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
