'use client';

import { forwardRef, type ForwardRefExoticComponent } from 'react';
import { cn } from '@/lib/utils';
import { type BaseButtonProps } from '../BaseButtonProps';
import LoadingSpinner from '../../LoadingSpinner';

interface FlatButtonProps extends BaseButtonProps {
  noPadding?: boolean;
  noHover?: boolean;
}

const FlatButton: ForwardRefExoticComponent<FlatButtonProps> = forwardRef<
  HTMLButtonElement,
  FlatButtonProps
>(
  (
    {
      size = 'md',
      color = 'primary',
      loading = false,
      disabled = false,
      noPadding = false,
      noHover = false,
      onClick,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const buttonClasses = cn(
      'btn',
      'btn-flat',
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
        'p-0': noPadding,
        'hover:bg-transparent': noHover,
      },
      className
    );

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!loading && !disabled && onClick) {
        onClick(e);
      }
    };

    const spinner =
      loading && !disabled ? (
        <LoadingSpinner className="inline-flex py-0" size="loading-sm" />
      ) : null;

    return (
      <button
        type="button"
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        className={buttonClasses}
        {...props}
      >
        {spinner}
        <span
          className={cn({
            'opacity-0': loading && !disabled,
          })}
        >
          {children}
        </span>
      </button>
    );
  }
);

FlatButton.displayName = 'FlatButton';

export default FlatButton;
